const PREFIX = 'says-identity-retry-v1:';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');

// Persist only random keys and hashes, never student data, tokens or passwords.
export async function identityRetry(endpoint, actor, payload, storage = localStorage, { replayCompleted = true } = {}) {
  const slot = PREFIX + await hash(JSON.stringify([endpoint, actor]));
  const fingerprint = await hash(JSON.stringify(canonical(payload)));
  let records;
  try { records = JSON.parse(storage.getItem(slot) || '{}'); }
  catch { throw new Error('The saved retry information could not be read. Restore browser storage before submitting again.'); }
  if (Object.values(records).some(record => record.state === 'pending' && record.fingerprint !== fingerprint)) {
    throw new Error('An earlier submission at this endpoint is unresolved. Restore its original inputs and retry, or have the saved database record checked before starting another submission.');
  }
  let record = records[fingerprint];
  if (!record || (!replayCompleted && record.state === 'complete')) {
    record = { key: crypto.randomUUID(), fingerprint, state: 'pending' };
    records[fingerprint] = record;
  }
  if (record.state === 'rejected') { record = { ...record, state: 'pending' }; records[fingerprint] = record; }
  try { storage.setItem(slot, JSON.stringify(records)); }
  catch { throw new Error('Browser storage is unavailable. The retry key could not be preserved, so no submission was sent.'); }
  return {
    key: record.key,
    rejected(error) {
      // A validation rejection is a confirmed non-write; allow corrected input.
      // Conflict and transport errors remain pending and never rotate the key.
      if (error?.status !== 422) return;
      const latest = JSON.parse(storage.getItem(slot) || '{}');
      latest[fingerprint] = { ...record, state: 'rejected' };
      storage.setItem(slot, JSON.stringify(latest));
    },
    complete() {
      // Preserve completed keys for replay after refresh; no response body is stored.
      const latest = JSON.parse(storage.getItem(slot) || '{}');
      latest[fingerprint] = { ...record, state: 'complete' };
      storage.setItem(slot, JSON.stringify(latest));
    },
  };
}
