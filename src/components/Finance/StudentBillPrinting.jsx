import React, { useState } from 'react';
import { usePortalData } from '../../data/PortalStore';
import { filterBills, money } from '../../lib/accountingRules';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import { Field, PrintDocument, printDocument } from './AccountingUI';
export default function BillPrinting({onPrepareBill}) {
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
