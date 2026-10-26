import React, { useRef, useState } from 'react';
import { api } from '../../services/api';

export default function FeeTemplateSync({ academicYear, academicTerm, feeSchedule, stationerySchedule, onLoaded }) {
  const [version,setVersion] = useState(null);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('Template edits below are browser-local drafts until saved to the shared database. Posted invoices are separate records.');
  const lock = useRef(false);
  const run = async save => {
    if (lock.current || !academicYear || !academicTerm) return;
    if (!save && !window.confirm('Replace current fee and stationery template drafts with the saved school templates?')) return;
    if (save && version === null) return;
    lock.current=true;setBusy(true);
    try {
      const saved = save
        ? await api.saveFeeTemplates({academicYear,academicTerm,feeSchedule,stationerySchedule,expectedVersion:version})
        : await api.getFeeTemplates({academicYear,academicTerm});
      if (saved.academicYear !== academicYear || saved.academicTerm !== academicTerm) throw new Error('The backend returned templates for a different academic period. No drafts were replaced.');
      setVersion(saved.version);
      if (!save) onLoaded(saved);
      setNotice(save ? 'Shared templates saved to the backend. Other devices can load them. Existing invoices were not changed.' : 'Shared templates loaded. Make your changes, then save them to the database.');
    } catch(error) {
      if ([409,412].includes(error.status)) setVersion(null);
      setNotice([404,405].includes(error.status) ? 'Shared fee-template storage is not available on the backend yet. These remain local drafts; nothing was saved to the shared database.' : `Templates not synchronized: ${error.message}`);
    } finally {lock.current=false;setBusy(false);}
  };
  return <section aria-label="Shared fee templates" style={{padding:16,marginBottom:20,background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10}}>
    <h3>Shared school fee templates</h3><p>{academicYear || 'Year not configured'} · {academicTerm || 'Term not configured'}{version !== null ? ` · Version ${version}` : ''}</p>
    <p role="status">{notice}</p>
    <button type="button" disabled={busy || !academicYear || !academicTerm} onClick={()=>run(false)}>Load saved templates</button>{' '}
    <button type="button" disabled={busy || version === null} onClick={()=>run(true)}>{busy?'Synchronizing…':'Save templates to database'}</button>
    {version === null && <p>Load the latest shared templates before saving to avoid overwriting another administrator’s changes.</p>}
  </section>;
}
