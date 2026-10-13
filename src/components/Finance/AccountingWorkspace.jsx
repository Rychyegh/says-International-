import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortalData } from '../../data/PortalStore';
import { accountingList, accountingWrite, FINANCE_SECTIONS } from '../../services/accounting';
import { filterBills, money, statementTotals, validateJournal } from '../../lib/accountingRules';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import './AccountingWorkspace.css';

const today = () => new Date().toISOString().slice(0, 10);
const resources = { 'Account Records':'journals', 'Bank Reconciliation':'reconciliations', 'Balance Sheet':'statements', 'Tax & SSNIT Settings':'tax-settings', 'PV Receipts':'receipts', 'Audit Trail':'audit-events', 'Account Setup':'accounts', 'Period Closing':'periods' };
const columns = {
 reconciliations:['reference','account_code','as_of','statement_balance','ledger_balance','difference','status'], journals:['reference','date','description','status'], statements:['reference','as_of','status'],
 'tax-settings':['name','category','rate','effective_from','effective_to','account_code','status'],
 receipts:['receipt_number','voucher_reference','payee','payment_date','amount','payment_method'],
 'audit-events':['occurred_at','actor_name','action','resource','reference','reason'],
 accounts:['code','name','type','status'], periods:['name','start_date','end_date','status'],
};
const title = key => key.replaceAll('_',' ').replace(/^./, c => c.toUpperCase());
function Field({name,label,type='text',options,optional=false,...props}) {
 const id=React.useId();
 return <div className="accounting-field"><label htmlFor={id}>{label || title(name)}</label>{options ? <select id={id} name={name} required={!optional} {...props}><option value="">Choose…</option>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select> : <input id={id} name={name} type={type} required={!optional} {...props}/>}</div>;
}
function PrintDocument({children}) {
 useEffect(() => () => document.body.classList.remove('accounting-printing'), []);
 return createPortal(<div className="accounting-print">{children}</div>, document.body);
}
function printDocument() {
 document.body.classList.add('accounting-printing');
 const cleanup = () => document.body.classList.remove('accounting-printing');
 window.addEventListener('afterprint',cleanup,{once:true});
 try { window.print(); } finally { cleanup(); }
}
function BillPrinting({onPrepareBill}) {
 const { studentFees = [], onboardedStudents = [], syncErrors = {}, resourceStatus = {}, isLoadingBackend } = usePortalData();
 const [filters,setFilters] = useState({ search:'',classLevel:'',term:'',year:'',status:'',min:'',max:'',sort:'name' });
 const [selected,setSelected] = useState([]);
 const [mode,setMode] = useState('individual');
 const rows = studentFees.map(f => {
  const student = onboardedStudents.find(s => String(s.studentId) === String(f.studentId) || String(s.id) === String(f.studentId));
  return {...f,classLevel:f.classLevel || student?.level || '',academicYear:f.academicYear || ''};
 });
 const visible = filterBills(rows, filters);
 const printable = visible.filter(row => selected.includes(row.id));
 const blocked = Boolean(syncErrors.feesRes || syncErrors.connection || isLoadingBackend || resourceStatus.feesRes === 'loading');
 const choose = (key,value) => {setFilters(f => ({...f,[key]:value}));setSelected([]);};
 const opts = key => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
 const summary = <table><thead><tr>{['Student','Class','Year / term','Billed','Paid','Balance'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{printable.map(r => <tr key={r.id}><td>{r.studentName} ({r.studentId})</td><td>{r.classLevel}</td><td>{r.academicYear} / {r.term}</td><td>{money(r.billedAmount)}</td><td>{money(r.paidAmount)}</td><td>{money(r.balance)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total</th>{['billedAmount','paidAmount','balance'].map(k => <th key={k}>{money(printable.reduce((sum,r)=>sum+Number(r[k]||0),0))}</th>)}</tr></tfoot></table>;
 return <>
  <p>Prepare bills, filter the saved ledger, then print individual bills or a class summary. Select a year and term to limit the reporting period.</p>
  {onPrepareBill && <button className="primary" onClick={onPrepareBill}>Prepare student / class bill</button>}
  <div className="accounting-toolbar">
   <Field name="search" label="Student / admission / bill number" optional value={filters.search} onChange={e=>choose('search',e.target.value)}/>
   {[['classLevel','Class'],['year','Academic year'],['term','Term']].map(([key,label])=><label key={key}>{label}<select aria-label={label} value={filters[key]} onChange={e=>choose(key,e.target.value)}><option value="">All {label.toLowerCase()}s</option>{opts(key==='year'?'academicYear':key).map(v=><option key={v}>{v}</option>)}</select></label>)}
   <label>Payment status<select aria-label="Payment status" value={filters.status} onChange={e=>choose('status',e.target.value)}>{['','Paid','Partially paid','Unpaid'].map(v=><option key={v} value={v}>{v||'All statuses'}</option>)}</select></label>
   <Field name="min" label="Minimum balance" type="number" step="0.01" optional value={filters.min} onChange={e=>choose('min',e.target.value)}/>
   <Field name="max" label="Maximum balance" type="number" step="0.01" optional value={filters.max} onChange={e=>choose('max',e.target.value)}/>
   <label>Sort by<select aria-label="Sort by" value={filters.sort} onChange={e=>choose('sort',e.target.value)}><option value="name">Student name</option><option value="balance">Highest balance</option></select></label>
  </div>
  {blocked && <p className="accounting-error" role="alert">Printing is unavailable while account records are loading or could not be verified. Refresh accounts to continue.</p>}
  <div className="accounting-toolbar"><button disabled={blocked || !visible.length} onClick={()=>setSelected(visible.map(r=>r.id))}>Select filtered bills ({visible.length})</button><button onClick={()=>setSelected([])}>Clear selection</button><label>Print format<select aria-label="Print format" value={mode} onChange={e=>setMode(e.target.value)}><option value="individual">Individual bills</option><option value="summary">Class / term summary</option></select></label><button className="primary" disabled={blocked || !printable.length} onClick={printDocument}>Print selected ({printable.length})</button></div>
  <div className="accounting-card"><table><thead><tr>{['Select','Student','Class','Academic year','Term','Billed','Paid','Balance'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><input type="checkbox" aria-label={`Select bill ${r.billId || r.id} for ${r.studentName}`} checked={selected.includes(r.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,r.id]:s.filter(id=>id!==r.id))}/></td><td>{r.studentName}<br/><small>{r.studentId}</small></td><td>{r.classLevel||'Not supplied'}</td><td>{r.academicYear||'Not supplied'}</td><td>{r.term}</td><td>{money(r.billedAmount)}</td><td>{money(r.paidAmount)}</td><td>{money(r.balance)}</td></tr>)}</tbody></table>{!visible.length && <p>No bills match these filters.</p>}</div>
  <PrintDocument>{mode==='summary'?<article><SchoolPrintHeader/><h2>Student billing summary</h2><p>{filters.classLevel||'All classes'} · {filters.year||'All years'} · {filters.term||'All terms'} · {filters.status||'All payment statuses'}</p>{summary}</article>:printable.map(r=><article key={r.id}><SchoolPrintHeader/><h2>Student bill · {r.billId||r.id}</h2><p>{r.studentName} · {r.studentId}<br/>{r.classLevel} · {r.academicYear} · {r.term}<br/>Due: {r.dueDate||'Not supplied'}</p><table><thead><tr><th>Fee item</th><th>Amount</th></tr></thead><tbody>{(r.itemsBreakdown||[]).map((item,i)=><tr key={i}><td>{item.details||item.description||item.name}</td><td>{money(item.amount??item.fee)}</td></tr>)}</tbody></table><p>Previous balance: {money(r.arrearsBroughtForward)} · Discount: {money(r.scholarshipDiscount)}</p><p>Total billed: {money(r.billedAmount)}<br/>Payments received: {money(r.paidAmount)}</p><h3>Amount due: {money(r.balance)}</h3><p>Please quote the student and bill reference when paying through the school’s approved payment channels.</p></article>)}</PrintDocument>
 </>;
}
function JournalForm({accounts,onSave,busy,initial}) {
 const [lines,setLines]=useState(initial?.lines || [{account_id:'',debit:'',credit:''},{account_id:'',debit:'',credit:''}]);
 const [error,setError]=useState('');
 const edit=(i,k,v)=>setLines(xs=>xs.map((x,j)=>i===j?{...x,[k]:v}:x));
 return <form onSubmit={e=>{e.preventDefault();setError('');try{validateJournal(lines);const data=Object.fromEntries(new FormData(e.currentTarget));onSave('journals',{...data,lines:lines.map(l=>({...l,debit:Number(l.debit),credit:Number(l.credit)}))});}catch(err){setError(err.message);}}}><h2>Prepare journal / opening balances</h2><p>Save a balanced draft, then submit it for Head Admin approval and posting.</p><div className="accounting-grid"><Field name="date" type="date" defaultValue={initial?.date || today()}/><Field name="description" defaultValue={initial?.description}/><Field name="kind" defaultValue={initial?.kind} options={['adjustment','opening_balance','income','expense']}/><Field name="supporting_reference" label="Supporting document reference" defaultValue={initial?.supporting_reference}/></div>{lines.map((l,i)=><div className="accounting-grid" key={i}><Field name={`account-${i}`} label={`Account ${i+1}`} options={accounts.map(a=>({value:a.id,label:`${a.code} · ${a.name}`}))} value={l.account_id} onChange={e=>edit(i,'account_id',e.target.value)}/><Field name={`debit-${i}`} label="Debit" type="number" min="0" step="0.01" optional value={l.debit} onChange={e=>edit(i,'debit',e.target.value)}/><Field name={`credit-${i}`} label="Credit" type="number" min="0" step="0.01" optional value={l.credit} onChange={e=>edit(i,'credit',e.target.value)}/><button type="button" disabled={lines.length<=2} onClick={()=>setLines(xs=>xs.filter((_,j)=>j!==i))}>Remove line</button></div>)}{error&&<p role="alert" className="accounting-error">{error}</p>}<div className="accounting-toolbar"><button type="button" onClick={()=>setLines(xs=>[...xs,{account_id:'',debit:'',credit:''}])}>Add journal line</button><button className="primary" disabled={busy}>Save journal draft</button></div></form>;
}
function Statement({record}) {
 const totals=statementTotals(record.lines);
 return <><h2>Balance sheet · {record.as_of}</h2><p>{record.reference} · {record.status} · GHS</p>{!totals?<p className="accounting-error">Statement lines were not supplied. This statement cannot be submitted.</p>:<><table><thead><tr><th>Account</th><th>Type</th><th>Balance</th></tr></thead><tbody>{record.lines.map((l,i)=><tr key={i}><td>{l.account_code} · {l.account_name}</td><td>{title(l.type)}</td><td>{money(l.amount)}</td></tr>)}</tbody></table><p>Assets: <strong>{money(totals.asset)}</strong> · Liabilities: <strong>{money(totals.liability)}</strong> · Equity: <strong>{money(totals.equity)}</strong></p><p className={totals.balanced?'accounting-notice':'accounting-error'}>{totals.balanced?'Balanced: assets equal liabilities plus equity.':'Unbalanced: resolve the ledger before submission.'}</p></>}</>;
}
export default function AccountingWorkspace({section,role='accountant',onPrepareBill}) {
 const [adminSection,setAdminSection]=useState('Account Records');
 const current=section||adminSection, resource=resources[current];
 const [rows,setRows]=useState([]),[accounts,setAccounts]=useState([]),[loading,setLoading]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState(null),[search,setSearch]=useState('');
 const [revision,setRevision]=useState(0);
 const [fromDate,setFromDate]=useState(''),[toDate,setToDate]=useState('');
 const saving=useRef(false);
 const head=role==='head_admin', writable=head||role==='accountant';
 useEffect(()=>{
  let live=true;setLoaded(false);setRows([]);setAccounts([]);setSelected(null);setError('');setNotice('');setSearch('');
  if(!resource)return;
  setLoading(true);
  Promise.all([accountingList(resource),['journals','tax-settings','reconciliations'].includes(resource)?accountingList('accounts'):Promise.resolve([])]).then(([items,accts])=>{if(live){setLoaded(true);setRows(items);setAccounts(accts.filter(a=>a.status==='active'));}}).catch(e=>{if(live)setError(`Records could not be loaded. ${e.message}`);}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[resource,revision]);
 const save=async(path,payload)=>{
  if(saving.current)return; saving.current=true;setBusy(true);setError('');setNotice('');
  try{const record=await accountingWrite(path,payload);setRows(xs=>[record,...xs.filter(x=>x.id!==record.id)]);setSelected(record);setNotice('Saved and confirmed by the database.');}
  catch(e){setError(`Operation not confirmed. ${e.message}`);}finally{saving.current=false;setBusy(false);}
 };
 const submitForm=(e,path,transform=x=>x)=>{e.preventDefault();save(path,transform(Object.fromEntries(new FormData(e.currentTarget))));};
 const action=(record,actionName,reason='')=>save(`${resource}/${encodeURIComponent(record.id)}/actions`,{action:actionName,reason,expected_version:record.version});
 const editableTax=resource==='tax-settings'&&['draft','returned'].includes(selected?.status)?selected:{};
 const available=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) && (resource!=='audit-events'||((!fromDate||String(r.occurred_at).slice(0,10)>=fromDate)&&(!toDate||String(r.occurred_at).slice(0,10)<=toDate))));
 if(!writable && role!=='auditor')return <p role="alert">You do not have access to accounting management.</p>;
 return <section className="accounting-workspace">
  {!section&&<div className="accounting-toolbar">{FINANCE_SECTIONS.filter(s=>s!=='Student Billing & Printing').map(s=><button key={s} className={current===s?'primary':''} disabled={busy} onClick={()=>setAdminSection(s)}>{s}</button>)}</div>}
  <h1>{current}</h1>
  {current==='Student Billing & Printing'?<BillPrinting onPrepareBill={onPrepareBill}/>:<>
   <p>{current==='PV Receipts'?'Receipts released after voucher approval and confirmed payment. Preparation and approval remain with Sub Admin and Head Admin.':current==='Audit Trail'?'Read-only history of financial changes, approvals, reversals, and settings.':'Manage the school’s financial records with recorded review and approval.'}</p>
   <div className="accounting-toolbar"><button disabled={loading||busy} onClick={()=>setRevision(n=>n+1)}>{loading?'Loading…':'Refresh records'}</button><Field name="filter" label="Search records" optional value={search} onChange={e=>setSearch(e.target.value)}/>{resource==='audit-events'&&<><Field name="from" label="From date" type="date" optional value={fromDate} onChange={e=>setFromDate(e.target.value)}/><Field name="to" label="To date" type="date" optional value={toDate} onChange={e=>setToDate(e.target.value)}/></>}</div>
   {error&&<p role="alert" className="accounting-error">{error}</p>}{notice&&<p role="status" className="accounting-notice">{notice}</p>}
   {!loading&&loaded&&<div className="accounting-card"><table><thead><tr>{columns[resource]?.map(k=><th key={k}>{title(k)}</th>)}<th>Details</th></tr></thead><tbody>{available.map(r=><tr key={r.id}>{columns[resource]?.map(k=><td key={k}>{k==='amount'?money(r[k]):String(r[k]??'—')}</td>)}<td><button onClick={()=>setSelected(r)}>View record</button></td></tr>)}</tbody></table>{!available.length&&<p>No records match this view.</p>}</div>}
   {selected&&<div className="accounting-card"><div className="accounting-toolbar"><h2>Record details</h2><button onClick={()=>setSelected(null)}>Close details</button>{['statements','receipts'].includes(resource)&&<button onClick={printDocument}>Print {resource==='statements'?'statement':'receipt'}</button>}</div>
    {resource==='statements'?<Statement record={selected}/>:<dl>{Object.entries(selected).filter(([k])=>resource==='receipts'?[...columns.receipts,'items','supporting_reference'].includes(k):!['version','id'].includes(k)).map(([k,v])=><div key={k}><dt><strong>{title(k)}</strong></dt><dd>{typeof v==='object'?<pre>{JSON.stringify(v,null,2)}</pre>:String(v??'—')}</dd></div>)}</dl>}
    {writable&&['journals','statements','tax-settings','periods','reconciliations'].includes(resource)&&<div className="accounting-toolbar">
     {['draft','returned'].includes(selected.status)&&resource!=='periods'&&<button disabled={busy||(resource==='statements'&&!statementTotals(selected.lines)?.balanced)} onClick={()=>action(selected,'submit')}>Submit for approval</button>}
     {head&&selected.status==='submitted'&&<button disabled={busy||(resource==='statements'&&!statementTotals(selected.lines)?.balanced)} onClick={()=>action(selected,'approve')}>Approve {resource==='journals'?'and post':''}</button>}
     {resource==='periods'&&selected.status==='open'&&<button disabled={busy} onClick={()=>action(selected,'request_close')}>Submit closing checks</button>}
     {head&&resource==='periods'&&selected.status==='pending_close'&&<button disabled={busy} onClick={()=>action(selected,'close')}>Approve and lock period</button>}
    </div>}
    {head&&(['submitted'].includes(selected.status)||resource==='periods'&&selected.status==='closed'||resource==='journals'&&selected.status==='posted')&&<form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(selected,data.action,data.reason);}}><div className="accounting-grid"><Field name="action" options={resource==='periods'?['reopen']:selected.status==='posted'?['reverse']:['return','reject']}/><Field name="reason" minLength={5}/><button disabled={busy}>Apply decision</button></div></form>}
   </div>}
   {selected&&['statements','receipts'].includes(resource)&&<PrintDocument><article><SchoolPrintHeader/>{resource==='statements'?<Statement record={selected}/>:<><h2>Payment receipt · {selected.receipt_number}</h2>{columns.receipts.map(k=><p key={k}><strong>{title(k)}: </strong>{k==='amount'?money(selected[k]):String(selected[k]??'—')}</p>)}</>}</article></PrintDocument>}
   {writable&&!loading&&loaded&&<div className="accounting-card">
    {resource==='journals'&&<JournalForm key={`${selected?.id || 'new'}-${selected?.version || 0}`} initial={['draft','returned'].includes(selected?.status)?selected:null} accounts={accounts} onSave={(path,p)=>save(['draft','returned'].includes(selected?.status)?`${path}/${encodeURIComponent(selected.id)}/revisions`:path,{date:p.date,description:p.description,kind:p.kind,supporting_reference:p.supporting_reference,lines:p.lines,...(['draft','returned'].includes(selected?.status)?{expected_version:selected.version}:{})})} busy={busy}/>}
    {resource==='reconciliations'&&<form onSubmit={e=>submitForm(e,resource,p=>({...p,statement_balance:Number(p.statement_balance),outstanding_deposits:Number(p.outstanding_deposits),outstanding_payments:Number(p.outstanding_payments)}))}><h2>Reconcile a payment account</h2><p>Compare the bank, mobile money, or cash statement with the posted ledger. Attach the statement reference and explain outstanding transactions. Approval requires a zero difference.</p><div className="accounting-grid"><Field name="account_id" label="Payment account" options={accounts.filter(a=>['bank','mobile_money','cash'].includes(a.channel)).map(a=>({value:a.id,label:`${a.code} · ${a.name}`}))}/><Field name="as_of" type="date" defaultValue={today()}/><Field name="statement_balance" type="number" step="0.01"/><Field name="outstanding_deposits" type="number" min="0" step="0.01" defaultValue="0"/><Field name="outstanding_payments" type="number" min="0" step="0.01" defaultValue="0"/><Field name="supporting_reference" label="Statement reference"/><Field name="notes"/><button className="primary" disabled={busy}>Prepare reconciliation</button></div></form>}
    {resource==='statements'&&<form onSubmit={e=>submitForm(e,resource)}><h2>Prepare balance sheet</h2><p>The service snapshots posted account balances, including retained earnings, for the selected date. Review the generated draft before submitting.</p><div className="accounting-grid"><Field name="as_of" label="As of date" type="date" defaultValue={today()}/><Field name="notes" optional/><button className="primary" disabled={busy}>Generate draft from ledger</button></div></form>}
    {resource==='tax-settings'&&<form key={`${selected?.id || 'new'}-${selected?.version || 0}`} onSubmit={e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget));if(p.effective_to&&p.effective_to<p.effective_from){setError('End date must follow the effective start date.');return;}const editing=['draft','returned'].includes(selected?.status);save(editing?`${resource}/${encodeURIComponent(selected.id)}/revisions`:resource,{...p,rate:Number(p.rate),effective_to:p.effective_to||null,...(editing?{expected_version:selected.version}:{})});}}><h2>Propose a tax / SSNIT rate</h2><p>Rates take effect after Head Admin approval. Earlier versions remain available for historical transactions.</p><div className="accounting-grid"><Field name="name" defaultValue={editableTax.name}/><Field name="category" defaultValue={editableTax.category} options={['VAT','SSNIT_EMPLOYEE','SSNIT_EMPLOYER','OTHER']}/><Field name="rate" label="Rate (%)" defaultValue={editableTax.rate} type="number" min="0" max="100" step="0.0001"/><Field name="applies_to" defaultValue={editableTax.applies_to} options={['payroll','taxable_purchases','taxable_sales']}/><Field name="effective_from" type="date" defaultValue={editableTax.effective_from}/><Field name="effective_to" type="date" optional defaultValue={editableTax.effective_to || ''}/><Field name="account_id" label="Posting account" defaultValue={editableTax.account_id} options={accounts.map(a=>({value:a.id,label:`${a.code} · ${a.name}`}))}/><Field name="reason"/><button className="primary" disabled={busy}>Save rate proposal</button></div></form>}
    {resource==='accounts'&&(head?<form onSubmit={e=>submitForm(e,resource)}><h2>Create account</h2><div className="accounting-grid"><Field name="code"/><Field name="name"/><Field name="type" options={['asset','liability','equity','income','expense']}/><Field name="channel" optional options={['bank','mobile_money','cash','other']}/><button className="primary" disabled={busy}>Create account</button></div></form>:<p>Head Admin manages the chart of accounts and bank, mobile money, and cash accounts. Prepare opening balances in Account Records.</p>)}
    {resource==='periods'&&<><h2>Period closing</h2><p>Resolve student balances, reconcile payment accounts, review taxes and receipts, and approve financial statements before closing. The server must return any unresolved checks before a period can be locked.</p>{head&&<form onSubmit={e=>submitForm(e,resource)}><div className="accounting-grid"><Field name="name" label="Year / term name"/><Field name="start_date" type="date"/><Field name="end_date" type="date"/><button className="primary" disabled={busy}>Create financial period</button></div></form>}</>}
    {['receipts','audit-events'].includes(resource)&&<p>This section is read-only.</p>}
   </div>}
  </>}
 </section>;
}
