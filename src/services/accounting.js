import { request, getAuthUser } from './api.js';

export const FINANCE_SECTIONS = ['Student Billing & Printing', 'Account Records', 'Bank Reconciliation', 'Balance Sheet', 'Tax & SSNIT Settings', 'PV Receipts', 'Audit Trail', 'Account Setup', 'Period Closing'];
const root = '/finance/accounting';
export async function accountingList(resource, filters = {}) {
  let cursor = '', rows = [], seen = new Set();
  do {
    const query = new URLSearchParams(Object.entries({ ...filters, ...(cursor ? { cursor } : {}) }).filter(([, value]) => value !== '' && value != null));
    const result = await request(`${root}/${resource}${query.size ? `?${query}` : ''}`);
    if (!Array.isArray(result.items)) throw new Error('The accounting service returned an invalid list. Expected items and next_cursor.');
    rows.push(...result.items);
    cursor = result.next_cursor || '';
    if (cursor && seen.has(cursor)) throw new Error('The accounting service repeated a page cursor.');
    seen.add(cursor);
  } while (cursor);
  return rows;
}
export async function accountingWrite(resource, payload) {
  // Keep the key across timeout/reload; a retry of the same operation must not duplicate a posting.
  const bytes = new TextEncoder().encode(JSON.stringify([getAuthUser()?.id, resource, payload]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const key = `accounting-${Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')}`;
  const result = await request(`${root}/${resource}`, { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(payload) });
  if (!result.record?.id) throw new Error('The server did not return a saved record. Refresh before retrying.');
  return result.record;
}

export async function accountingReport(resource, filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
  const result = await request(`${root}/${resource}${query.size ? `?${query}` : ''}`);
  if (!result.report || typeof result.report !== 'object' || Array.isArray(result.report)) throw new Error('The accounting service did not return a report.');
  return result.report;
}
