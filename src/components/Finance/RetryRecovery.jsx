import React, { useEffect, useState } from 'react';
import { api, getAuthUser } from '../../services/api';
import { listRetryOperations, recoveryPayload } from '../../lib/identityRetry';
import { retryPresentation } from '../../lib/retryPresentation';
import './RetryRecovery.css';

export default function RetryRecovery({ onRecovered }) {
  const [records, setRecords] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const actor = getAuthUser()?.id;
      if (!actor) return;
      const lists = await Promise.all(['/finance/service-providers', '/finance/vouchers'].map(endpoint => listRetryOperations(endpoint, actor)));
      setRecords(await Promise.all(lists.flat().map(async record => {
        try { await recoveryPayload(record); return { ...record, hasInputs: true }; }
        catch { return { ...record, hasInputs: false }; }
      })));
    } catch (error) { setNotice(error.message); }
  };
  useEffect(() => {
    load(); window.addEventListener('says_retry_changed', load);
    return () => window.removeEventListener('says_retry_changed', load);
  }, []);
  const retry = async record => {
    setBusy(true); setNotice('');
    try {
      const saved = await api.retryFinanceCreation(record);
      await onRecovered?.(record.endpoint, saved);
      setNotice('The original request is confirmed saved. The same retry key was used.');
      await load();
    } catch (error) { setNotice(`Recovery failed: ${error.message}`); }
    finally { setBusy(false); }
  };
  const reconcile = record => {
    const text = `FINANCE REQUEST RECONCILIATION\nEndpoint: ${record.endpoint}\nSubmitting account UUID: ${getAuthUser()?.id}\nIdempotency-Key: ${record.key}\nPayload SHA-256: ${record.fingerprint}\nOriginal failure: ${record.firstFailure?.message || 'Unknown outcome from earlier client'}\nLast failure: ${record.lastFailure?.message || 'Unavailable'}\nUncertain: ${record.state === 'pending'}\n\nBackend developer: inspect durable idempotency records for this actor, endpoint and key. Confirm the committed resource UUID and original saved response, or positively establish non-commit after any in-flight transaction finishes. An empty provider list or 404 is not proof of non-commit. Do not recreate, clear the key or merge records by name. Recover the original request/response if available. No automated reset has been performed.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a'); link.href = url; link.download = `reconcile-${record.key}.txt`; link.click(); URL.revokeObjectURL(url);
    setNotice('Reconciliation report prepared for the backend developer. This operation stays protected until its database outcome is confirmed.');
  };
  if (!records.length && !notice) return null;
  return <section aria-label="Retry recovery" className="retry-recovery">
    <h2>Submission updates</h2>
    <p className="retry-recovery-intro">Review requests that need your attention.</p>
    {notice && <p className="retry-recovery-notice" role="status">{notice}</p>}
    {records.map(record => {
      const presentation = retryPresentation(record);
      return <article key={record.key} className="retry-recovery-card">
      <p className="retry-recovery-label">{record.endpoint.endsWith('vouchers') ? 'Voucher request' : 'Provider creation'}</p>
      <h3>{presentation.title}</h3>
      <p>{presentation.message}</p>
      {presentation.kind === 'validation' && <p>Correct the values in the form below, then submit again.</p>}
      {presentation.kind !== 'validation' && !record.hasInputs && <p>Original inputs are unavailable in this tab. Restore the exact original form values or send a reconciliation report to the backend developer.</p>}
      {presentation.kind !== 'validation' && <div className="retry-recovery-actions">
        <button className="btn btn-outline-green" type="button" disabled={busy} onClick={() => window.dispatchEvent(new Event('says_reauthenticate'))}>Verify sign-in / PIN</button>
        <button className="btn btn-green" type="button" disabled={busy || !record.hasInputs} onClick={() => retry(record)}>Retry original request with same key</button>
        <button className="btn btn-outline-green" type="button" disabled={busy} onClick={() => reconcile(record)}>Prepare reconciliation report</button>
      </div>}
      <details className="retry-recovery-details">
      <summary>Technical details</summary>
      <p>Original failure: {record.firstFailure?.message || 'Unknown outcome saved by an earlier client.'}</p>
      {record.lastFailure && <p>Latest failure: {record.lastFailure.status ? `HTTP ${record.lastFailure.status}: ` : ''}{record.lastFailure.message}</p>}
      <small>Request reference: {record.key}</small>
      </details>
    </article>;
    })}
  </section>;
}
