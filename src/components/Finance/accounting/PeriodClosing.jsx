import React, { useState } from 'react';
import { Card, Field, Metrics, Table, LoadState, MutationNotice, useBook, useReport, Status } from '../AccountingUI';

const checkTemplates=[['student_balances','Student balances reviewed','Student Billing & Printing'],['reconciliations','Payment accounts reconciled','Bank Reconciliation'],['journals','Draft journals resolved','Account Records'],['receipts','Supporting receipts complete','PV Receipts'],['taxes','Tax and contribution balances reviewed','Tax & SSNIT Settings'],['statements','Financial statements approved','Balance Sheet']];
export default function PeriodClosing({role,onNavigate}) {
  const book=useBook('periods'),checks=useReport(),head=role==='head_admin';
  const [dateError,setDateError]=useState('');
  const period=book.selected;
  const report=checks.data;
  const validReport=period&&report?.period_id===period.id&&report?.period_version===period.version&&report?.check_token&&Array.isArray(report?.checks);
  const ready=Boolean(validReport&&report.ready_to_close===true&&report.checks.length>=checkTemplates.length&&checkTemplates.every(([key])=>report.checks.some(c=>c.key===key&&c.status==='passed'))&&report.checks.every(c=>c.status==='passed'));
  const choose=r=>{book.select(r);checks.clear();};
  const act=(action,reason='')=>book.mutation.save(`periods/${encodeURIComponent(period.id)}/actions`,{action,reason,expected_version:period.version,...(action==='reopen'?{}:{check_token:report.check_token})}).then(record=>{if(record)checks.clear();});
  return <>
    <Metrics items={[["Open periods",book.loaded?book.rows.filter(r=>r.status==='open').length:null],["Awaiting closure approval",book.loaded?book.rows.filter(r=>r.status==='pending_close').length:null],["Locked periods",book.loaded?book.rows.filter(r=>r.status==='closed').length:null]]}/>
    <MutationNotice mutation={book.mutation}/>
    <Card title="Select a term or financial period"><LoadState state={book} label="Financial periods"/>{book.loaded&&<Table columns={[{key:'name'},{key:'start_date'},{key:'end_date'},{key:'status'},{key:'closed_at'}]} rows={book.rows} onSelect={choose} selectedId={period?.id}/>}<p className="accounting-muted">A closed period blocks backdated postings and adjustments. Reopening requires a Head Admin reason.</p></Card>
    <Card title={period?`Closing checklist · ${period.name}`:'Period-end closing checklist'} hint="Run checks against the current ledger before requesting closure. Each failed check identifies the work that remains.">
      <div className="accounting-toolbar"><button className="primary" disabled={!period||checks.busy||period.status==='closed'} onClick={()=>checks.load(`periods/${encodeURIComponent(period.id)}/checks`)}>{checks.busy?'Checking period…':'Run closing checks'}</button>{period&&<Status value={period.status}/>}</div>
      {checks.error&&<p role="alert" className="accounting-error">{checks.error}</p>}
      <div className="accounting-closing-checks">{checkTemplates.map(([key,label,section])=>{const check=validReport?report.checks.find(c=>c.key===key):null;return <div key={key}><span className={`accounting-check-dot ${check?.status||''}`}>{check?.status==='passed'?'✓':check?.status==='failed'?'!':'○'}</span><div><strong>{label}</strong><p>{check?.message||'Not checked against the current ledger.'}</p></div><Status value={check?.status||'not_checked'}/><button onClick={()=>onNavigate(section)}>Open section</button></div>;})}</div>
      {validReport&&report.checks.filter(c=>!checkTemplates.some(([key])=>key===c.key)).map(c=><p key={c.key}><Status value={c.status}/> {c.label||c.key}: {c.message}</p>)}
      {validReport&&<p className={ready?'accounting-notice':'accounting-error'}>{ready?'All checks passed. This period is ready for the next approval step.':'Resolve the outstanding checks before closing.'}</p>}
      {role!=='auditor'&&period?.status==='open'&&<button disabled={!ready||book.mutation.busy} onClick={()=>act('request_close')}>Submit closing checks</button>}
      {head&&period?.status==='pending_close'&&<button className="primary" disabled={!ready||book.mutation.busy} onClick={()=>act('close')}>Approve and lock period</button>}
      {head&&period?.status==='closed'&&<form onSubmit={e=>{e.preventDefault();act('reopen',new FormData(e.currentTarget).get('reason'));}}><div className="accounting-grid"><Field name="reason" label="Reason for reopening" minLength={5}/><button disabled={book.mutation.busy}>Reopen period</button></div></form>}
    </Card>
    {period?.status==='closed'&&<Card title="Closure record"><dl className="accounting-detail-grid">{[['Closed by',period.closed_by],['Closed at',period.closed_at],['Carry-forward journal',period.carry_forward_reference],['Closing statement',period.statement_reference]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not supplied'}</dd></div>)}</dl></Card>}
    <Card title="Financial period setup" hint={head?'Create a non-overlapping year or term with explicit posting dates.':'Head Admin creates the financial periods used for posting and closing.'}><form onSubmit={e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget));setDateError('');if(p.end_date<p.start_date){setDateError('End date must follow the start date.');return;}book.mutation.save('periods',p);}}><fieldset disabled={!head||book.mutation.busy}><div className="accounting-grid"><Field name="name" label="Year / term name"/><Field name="start_date" type="date"/><Field name="end_date" type="date"/><button className="primary">Create financial period</button></div></fieldset>{dateError&&<p role="alert" className="accounting-error">{dateError}</p>}</form></Card>
  </>;
}
