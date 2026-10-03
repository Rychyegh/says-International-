const PREFIX = 'says-identity-retry-v1:';
const INPUT_PREFIX = 'says-finance-retry-input:';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
const slotFor = async (endpoint, actor) => PREFIX + await hash(JSON.stringify([endpoint, actor]));
const finance = endpoint => ['/finance/service-providers', '/finance/vouchers', '/finance/receive-payment'].includes(endpoint) || /^\/finance\/vouchers\/[^/]+\/items\/[^/]+\/(disburse|authorize)$/.test(endpoint);
const announce = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('says_retry_changed')); };
const description = error => ({ status: error?.status || null, message: String(error?.message || 'Response was lost; database outcome unknown.').slice(0, 500), at: new Date().toISOString() });

export async function listRetryOperations(endpoint, actor, storage = localStorage) {
  const slot = await slotFor(endpoint, actor);
  const records = JSON.parse(storage.getItem(slot) || '{}');
  return Object.values(records).filter(record => record.state !== 'complete').map(record => ({ ...record, endpoint }));
}

export async function recoveryPayload(record) {
  const text = sessionStorage.getItem(INPUT_PREFIX + record.key);
  if (!text) throw new Error('Original inputs are unavailable in this tab. Request reconciliation before creating another record.');
  const payload = JSON.parse(text);
  if (await hash(JSON.stringify(canonical(payload))) !== record.fingerprint) throw new Error('The saved inputs do not match this request. Reconciliation is required.');
  return payload;
}

// Durable storage holds keys, hashes and failure metadata. Finance inputs are kept
// only in this tab's sessionStorage so reauthentication/refresh can recover them.
export async function identityRetry(endpoint, actor, payload, storage = localStorage, { replayCompleted = true } = {}) {
  const slot = await slotFor(endpoint, actor);
  const fingerprint = await hash(JSON.stringify(canonical(payload)));
  let records;
  try { records = JSON.parse(storage.getItem(slot) || '{}'); }
  catch { throw new Error('The saved retry information could not be read. Restore browser storage before submitting again.'); }
  const unresolved = Object.values(records).find(record => record.state === 'pending' && record.fingerprint !== fingerprint);
  if (unresolved) {
    throw new Error(`An earlier submission is unresolved. Original failure: ${unresolved.firstFailure?.message || 'Unknown outcome (saved by an earlier version)'}. Use Retry recovery to restore its inputs or request reconciliation. Reference: ${unresolved.key}`);
  }
  let record = records[fingerprint];
  if (!record || (!replayCompleted && record.state === 'complete')) {
    record = { key: crypto.randomUUID(), fingerprint, state: 'pending', uncertain: false };
  }
  // Missing uncertainty metadata comes from the old implementation. Fail closed.
  if (record.state === 'pending' && record.uncertain === undefined) record.uncertain = true;
  record = { ...record, state: 'pending' };
  records[fingerprint] = record;
  try {
    storage.setItem(slot, JSON.stringify(records));
    if (finance(endpoint) && typeof sessionStorage !== 'undefined') sessionStorage.setItem(INPUT_PREFIX + record.key, JSON.stringify(payload));
  } catch { throw new Error('Browser storage is unavailable. The retry key could not be preserved, so no submission was sent.'); }
  const update = next => {
    const latest = JSON.parse(storage.getItem(slot) || '{}');
    latest[fingerprint] = next; storage.setItem(slot, JSON.stringify(latest)); record = next; announce();
  };
  return {
    key: record.key,
    dispatched() {
      // A crash after dispatch has an unknown outcome even without a caught error.
      const latest = JSON.parse(storage.getItem(slot) || '{}');
      latest[fingerprint] = { ...record, uncertain: true };
      storage.setItem(slot, JSON.stringify(latest));
    },
    rejected(error) {
      const confirmedNonWrite = [401, 403, 422].includes(error?.status);
      const failure = description(error);
      const uncertain = record.uncertain || !confirmedNonWrite;
      update({ ...record, state: uncertain ? 'pending' : 'rejected', uncertain, firstFailure: record.firstFailure || failure, lastFailure: failure });
    },
    complete() {
      update({ ...record, state: 'complete', uncertain: false });
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(INPUT_PREFIX + record.key);
    },
  };
}
