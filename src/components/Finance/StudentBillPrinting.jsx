import BillItemEditor from './BillItemEditor';
import React, { useState } from 'react';
import { usePortalData } from '../../data/PortalStore';
import { filterBills, money } from '../../lib/accountingRules';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import SavedBillStatement from './SavedBillStatement';
import ViewportModal from '../Modal/ViewportModal';
import { Field, PrintDocument, printDocument } from './AccountingUI';
export default function BillPrinting({onPrepareBill}) {
 const { studentFees = [], onboardedStudents = [], syncErrors = {}, resourceStatus = {}, isLoadingBackend, refreshAccounts, isRefreshingBackend } = usePortalData();
 const [filters,setFilters] = useState({ search:'',classLevel:'',term:'',year:'',status:'',min:'',max:'',sort:'name' });
 const [selected,setSelected] = useState([]);
 const [mode,setMode] = useState('individual');
 const [printAll,setPrintAll] = useState(false);
 const [preview,setPreview] = useState(false);
 const rows = studentFees.map(f => {
  const student = onboardedStudents.find(s => String(s.studentId) === String(f.studentId) || String(s.id) === String(f.studentId));
  return {...f,classLevel:f.classLevel || student?.level || '',academicYear:f.academicYear || ''};
 });
 const visible = filterBills(rows, filters);
 const printable = printAll ? visible : visible.filter(row => selected.includes(row.id));
 const blocked = Boolean(syncErrors.feesRes || syncErrors.connection || isLoadingBackend || resourceStatus.feesRes === 'loading');
 const choose = (key,value) => {setFilters(f => ({...f,[key]:value}));setSelected([]);};
 const opts = key => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
 const summary = <table><thead><tr>{['Student','Class','Year / term','Billed','Paid','Balance'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{printable.map(r => <tr key={r.id}><td>{r.studentName} ({r.studentId})</td><td>{r.classLevel}</td><td>{r.academicYear} / {r.term}</td><td>{money(r.billedAmount)}</td><td>{money(r.paidAmount)}</td><td>{money(r.balance)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total</th>{['billedAmount','paidAmount','balance'].map(k => <th key={k}>{money(printable.reduce((sum,r)=>sum+Number(r[k]||0),0))}</th>)}</tr></tfoot></table>;
 return <>
  <div className="accounting-toolbar"><button type="button" disabled={isRefreshingBackend} onClick={()=>refreshAccounts?.()}>Refresh saved bills</button><button type="button" disabled={blocked || !visible.length} onClick={()=>{setMode('individual');setPrintAll(true);requestAnimationFrame(()=>requestAnimationFrame(()=>{printDocument();setPrintAll(false);}));}}>Print all filtered bills ({visible.length})</button></div>
  <p>Bills posted by Admin appear here from the saved invoice ledger. Prepared schedules that have not been posted are not saved student invoices.</p>
  {preview && <ViewportModal onClose={()=>setPreview(false)} aria-label="Selected student bill preview"><div style={{background:"white",maxWidth:960,width:"95vw",maxHeight:"90vh",overflowY:"auto",borderRadius:14,padding:20}}><div className="accounting-toolbar"><button type="button" onClick={()=>setPreview(false)}>Close preview</button><button type="button" onClick={printDocument}>Print selected bills</button></div>{printable.map(bill=><React.Fragment key={bill.id}><SavedBillStatement bill={bill} student={onboardedStudents.find(student=>student.studentId===bill.studentId || student.id===bill.studentId)} /><BillItemEditor bill={bill} onSaved={async()=>{await refreshAccounts();setPreview(false);}}/></React.Fragment>)}</div></ViewportModal>}
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
  <div className="accounting-toolbar"><button disabled={blocked || !visible.length} onClick={()=>setSelected(visible.map(r=>r.id))}>Select filtered bills ({visible.length})</button><button onClick={()=>setSelected([])}>Clear selection</button><label>Print format<select aria-label="Print format" value={mode} onChange={e=>setMode(e.target.value)}><option value="individual">Individual bills</option><option value="summary">Class / term summary</option></select></label><button type="button" disabled={blocked || !printable.length} onClick={()=>setPreview(true)}>Preview selected bills</button><button className="primary" disabled={blocked || !printable.length} onClick={printDocument}>Print selected ({printable.length})</button></div>
  <div className="accounting-card"><table><thead><tr>{['Select','Student','Class','Academic year','Term','Billed','Paid','Balance'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><input type="checkbox" aria-label={`Select bill ${r.billId || r.id} for ${r.studentName}`} checked={selected.includes(r.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,r.id]:s.filter(id=>id!==r.id))}/></td><td><button type="button" disabled={blocked} aria-label={`View bill for ${r.studentName}`} onClick={()=>{setPrintAll(false);setSelected([r.id]);setMode('individual');setPreview(true);}} style={{background:'none',border:0,padding:0,color:'#0369a1',textAlign:'left',textDecoration:'underline',cursor:'pointer'}}>{r.studentName}</button><br/><small>{r.studentId}</small></td><td>{r.classLevel||'Not supplied'}</td><td>{r.academicYear||'Not supplied'}</td><td>{r.term}</td><td>{money(r.billedAmount)}</td><td>{money(r.paidAmount)}</td><td>{money(r.balance)}</td></tr>)}</tbody></table>{!visible.length && <p>No bills match these filters.</p>}</div>
  <PrintDocument>{mode==='summary'?<article><SchoolPrintHeader/><h2>Student billing summary</h2>{summary}</article>:printable.map(bill=><SavedBillStatement key={bill.id} bill={bill} student={onboardedStudents.find(student=>student.studentId===bill.studentId || student.id===bill.studentId)} />)}</PrintDocument>
 </>;
}
