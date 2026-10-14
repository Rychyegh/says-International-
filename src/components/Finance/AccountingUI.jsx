import { isSessionVerificationError } from '../../lib/sessionVerification.js';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { accountingList, accountingReport, accountingWrite } from '../../services/accounting';
import { csvExport, money } from '../../lib/accountingRules';

export const today = () => new Date().toISOString().slice(0, 10);
export const title = value => String(value || '').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
export const accountOptions = rows => rows.filter(a => a.status === 'active').map(a => ({ value: a.id, label: `${a.code} · ${a.name}` }));
export function Field({ name, label, type = 'text', options, optional = false, children, ...props }) {
  const id = React.useId();
  return <div className="accounting-field"><label htmlFor={id}>{label || title(name)}</label>{options ? <select id={id} name={name} required={!optional} {...props}><option value="">{optional ? 'All / none' : 'Choose…'}</option>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? title(o)}</option>)}</select> : <input id={id} name={name} type={type} required={!optional} {...props} />}{children}</div>;
}
export function Card({ title: heading, hint, children, className = '' }) {
  return <section className={`accounting-card ${className}`}>{heading && <h2>{heading}</h2>}{hint && <p className="accounting-muted">{hint}</p>}{children}</section>;
}
export function Tabs({ options, value, onChange }) {
  return <div className="accounting-tabs" role="tablist">{options.map(o => <button key={o} role="tab" aria-selected={value === o} onClick={() => onChange(o)}>{o}</button>)}</div>;
}
export function Metrics({ items }) {
  return <div className="accounting-metrics">{items.map(([label, value, hint]) => <div key={label}><span>{label}</span><strong>{value ?? '—'}</strong>{hint && <small>{hint}</small>}</div>)}</div>;
}
export function Status({ value }) { return <span className={`accounting-status status-${value || 'unknown'}`}>{title(value || 'Not supplied')}</span>; }
export function Table({ columns, rows, empty = 'No records match this view.', onSelect, selectedId, selectLabel = 'View record' }) {
  return <div className="accounting-table-scroll"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label || title(c.key)}</th>)}{onSelect && <th>Open</th>}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id ?? i} className={selectedId != null && selectedId === row.id ? 'is-selected' : ''}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : c.key === 'status' ? <Status value={row[c.key]} /> : String(row[c.key] ?? '—')}</td>)}{onSelect && <td><button onClick={() => onSelect(row)}>{selectLabel}</button></td>}</tr>)}</tbody></table>{!rows.length && <p className="accounting-empty">{empty}</p>}</div>;
}
export function LoadState({ state, label = 'Records' }) {
  const verificationRequired = isSessionVerificationError({ status: state.errorStatus, message: state.error, payload: state.errorPayload });
  return <>{state.loading && <p role="status" className="accounting-muted">Loading {label.toLowerCase()}…</p>}{state.error && <div className="accounting-error" role="alert"><strong>{verificationRequired ? 'Session verification required.' : `${label} could not be loaded.`}</strong> {state.error}<p>{verificationRequired ? 'Complete your account verification before loading or saving financial records.' : 'Your tools remain available below. Saved records will appear after the connection is restored.'}</p><button onClick={verificationRequired ? () => window.dispatchEvent(new Event('says_reauthenticate')) : state.reload}>{verificationRequired ? 'Complete session verification' : `Retry ${label.toLowerCase()}`}</button></div>}</>;
}
export function useList(resource, filters = {}, enabled = true) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState(''), [loaded, setLoaded] = useState(false), [revision, setRevision] = useState(0);
  const [errorStatus, setErrorStatus] = useState(null), [errorPayload, setErrorPayload] = useState(null);
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    let live = true; setRows([]); setError(''); setErrorStatus(null); setErrorPayload(null); setLoaded(false);
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    accountingList(resource, JSON.parse(filterKey)).then(data => { if (live) { setRows(data); setLoaded(true); } }).catch(e => { if (live) { setError(e.message); setErrorStatus(e.status); setErrorPayload(e.payload); } }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [resource, filterKey, enabled, revision]);
  return { rows, setRows, loading, error, errorStatus, errorPayload, loaded, reload: () => setRevision(n => n + 1) };
}
export function useMutation(onSaved) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const locked = useRef(false), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const save = async (path, payload) => {
    if (locked.current) return null;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const record = await accountingWrite(path, payload);
      if (live.current) { onSaved?.(record); setNotice('Saved and confirmed by the database.'); }
      return record;
    } catch (e) { if (live.current) setError(`Operation not confirmed. ${e.message}`); return null; }
    finally { locked.current = false; if (live.current) setBusy(false); }
  };
  return { busy, error, notice, save, setError };
}
export function MutationNotice({ mutation }) {
  return <>{mutation.error && <p role="alert" className="accounting-error">{mutation.error}</p>}{mutation.notice && <p role="status" className="accounting-notice">{mutation.notice}</p>}</>;
}
export function useBook(resource) {
  const list = useList(resource);
  const [selected, select] = useState(null);
  const mutation = useMutation(record => { list.setRows(rows => [record, ...rows.filter(r => r.id !== record.id)]); select(record); });
  return { ...list, selected, select, mutation, reload: () => { select(null); list.reload(); } };
}
export function useReport() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const serial = useRef(0);
  useEffect(() => () => { serial.current++; }, []);
  const clear = () => { serial.current++; setData(null); setError(''); setBusy(false); };
  const load = async (path, params = {}) => {
    const id = ++serial.current; setData(null); setError(''); setBusy(true);
    try { const report = await accountingReport(path, params); if (serial.current === id) setData(report); }
    catch (e) { if (serial.current === id) setError(e.message); }
    finally { if (serial.current === id) setBusy(false); }
  };
  return { data, error, busy, load, clear };
}
export function WorkflowActions({ resource, record, mutation, role, valid = true }) {
  if (!record || role === 'auditor') return null;
  const head = role === 'head_admin';
  const act = (action, reason = '') => mutation.save(`${resource}/${encodeURIComponent(record.id)}/actions`, { action, reason, expected_version: record.version });
  return <div className="accounting-workflow"><div className="accounting-toolbar">
    {['draft', 'returned'].includes(record.status) && <button className="primary" disabled={mutation.busy || !valid} onClick={() => act('submit')}>Submit for approval</button>}
    {head && record.status === 'submitted' && <button className="primary" disabled={mutation.busy || !valid} onClick={() => act('approve')}>{resource === 'journals' ? 'Approve and post' : 'Approve'}</button>}
    <Status value={record.status} />
  </div>{head && (record.status === 'submitted' || resource === 'journals' && record.status === 'posted') && <form onSubmit={e => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); act(values.action, values.reason); }}><div className="accounting-grid"><Field name="action" options={record.status === 'posted' ? ['reverse'] : ['return', 'reject']} /><Field name="reason" label="Decision reason" minLength={5} /><button disabled={mutation.busy}>Apply decision</button></div></form>}</div>;
}
export function PrintDocument({ children }) {
  useEffect(() => () => document.body.classList.remove('accounting-printing'), []);
  return createPortal(<div className="accounting-print">{children}</div>, document.body);
}
export function printDocument() {
  document.body.classList.add('accounting-printing');
  const cleanup = () => document.body.classList.remove('accounting-printing');
  window.addEventListener('afterprint', cleanup, { once: true });
  try { window.print(); } finally { cleanup(); }
}
export function downloadText(filename, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExportButton({ filename, columns, rows, disabled }) {
  return <button disabled={disabled || !rows.length} onClick={() => downloadText(filename, csvExport(columns.map(c => ({...c, label:c.label || title(c.key)})), rows))}>Export CSV</button>;
}
export const amountColumn = key => ({ key, render: r => r[key] == null ? '—' : money(r[key]) });
