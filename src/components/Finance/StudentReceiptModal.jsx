import React, {useEffect,useState} from 'react';
import ViewportModal from '../Modal/ViewportModal';
import {api} from '../../services/api';
import './StudentReceiptModal.css';

export default function StudentReceiptModal({fee,onClose}) {
 const [receipts,setReceipts]=useState([]),[selected,setSelected]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  api.getStudentLedger(fee.studentId).then(ledger=>{
   if(!active)return;
   const rows=ledger.entries.filter(entry=>['PAYMENT','RECEIPT','FEE_PAYMENT'].includes(String(entry.type).toUpperCase()) && entry.reference && Number(entry.credit || entry.amount)>0);
   setReceipts(rows);setSelected(rows[0]?.id || '');
  }).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;document.body.classList.remove('print-student-receipt');};
 },[fee.studentId]);
 const receipt=receipts.find(row=>row.id===selected);
 const print=()=>{
  if(!receipt)return;
  document.body.classList.add('print-student-receipt');
  const restore=()=>{document.body.classList.remove('print-student-receipt');window.removeEventListener('afterprint',restore);onClose();};
  window.addEventListener('afterprint',restore);
  try {window.print();} catch {document.body.classList.remove('print-student-receipt');window.removeEventListener('afterprint',restore);setError('Printing could not start. Please try again.');}
 };
 return <ViewportModal className="student-receipt-overlay" aria-label="Print student receipt" onClose={onClose}>
  <section className="student-receipt-dialog">
   <div className="student-receipt-controls"><h2>Print Receipt</h2><button type="button" className="btn btn-outline-green" onClick={onClose}>Close</button></div>
   {loading && <p role="status">Loading recorded payments…</p>}
   {error && <p role="alert">Receipts could not be loaded: {error}</p>}
   {!loading && !error && !receipts.length && <p role="status">No recorded payment receipt is available for {fee.studentName}.</p>}
   {receipts.length>0 && <label className="student-receipt-controls">Recorded payment for {fee.studentName}<select aria-label="Recorded payment" value={selected} onChange={e=>setSelected(e.target.value)}>{receipts.map(row=><option key={row.id} value={row.id}>{row.reference} · {row.date} · GHS {Number(row.credit || row.amount).toFixed(2)}</option>)}</select></label>}
   {receipt && <article className="student-receipt-paper">
    <h2>REMALJ Carewell Inspirational School</h2><h3>Student Payment Receipt</h3>
    <dl><dt>Receipt / payment reference</dt><dd>{receipt.reference}</dd><dt>Student</dt><dd>{fee.studentName}</dd><dt>Student ID</dt><dd>{fee.studentId}</dd><dt>Payment date</dt><dd>{receipt.date || 'Not provided'}</dd><dt>Description</dt><dd>{receipt.description}</dd><dt>Amount received</dt><dd><strong>GHS {Number(receipt.credit || receipt.amount).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></dd></dl>
    <p>Copy of the recorded payment shown in the student ledger.</p>
   </article>}
   {receipt && <button type="button" className="btn btn-green student-receipt-controls" onClick={print}>Print Receipt</button>}
  </section>
 </ViewportModal>;
}
