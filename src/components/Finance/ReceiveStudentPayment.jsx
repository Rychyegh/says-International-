import React, {useEffect,useRef,useState} from 'react';
import {usePortalData} from '../../data/PortalStore';
import {getAuthUser} from '../../services/api';
import {identityRetry,listRetryOperations,recoveryPayload} from '../../lib/identityRetry';
import StudentReceiptModal from './StudentReceiptModal';
import './ReceiveStudentPayment.css';

const OPERATION='/finance/receive-payment';
const empty=()=>({id:'',paidAmount:'',paymentMethod:'Cash',paymentDate:new Date().toISOString().slice(0,10),transactionRef:'',notes:''});
export default function ReceiveStudentPayment() {
 const {studentFees=[],recordFeePayment}=usePortalData();
 const [form,setForm]=useState(empty),[search,setSearch]=useState(''),[pending,setPending]=useState(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmation,setConfirmation]=useState(null),[showReceipt,setShowReceipt]=useState(false);
 const lock=useRef(false);
 const actor=getAuthUser()?.id;
 useEffect(()=>{
  let active=true;
  (async()=>{
   try {
    if(!actor)throw new Error('Sign in again to receive payments.');
    const records=await listRetryOperations(OPERATION,actor);
    const unresolved=records.find(record=>record.state==='pending');
    if(unresolved){
     if(active)setPending({key:unresolved.key});
     const input=await recoveryPayload(unresolved);
     if(active){setPending({...unresolved,input});setForm({...input.payment,paymentDate:input.payment.paymentDate.slice(0,10)});}
    }
    if(active)setReady(true);
   }catch(err){if(active)setError(err.message);}
  })();
  return()=>{active=false;};
 },[actor]);
 const fee=studentFees.find(item=>String(item.id)===String(form.id));
 const options=studentFees.filter(item=>Number(item.balance)>0 && `${item.studentName} ${item.studentId} ${item.id}`.toLowerCase().includes(search.toLowerCase()));
 const change=(name,value)=>{setForm(current=>({...current,[name]:value}));setError('');};
 const submit=async event=>{
  event.preventDefault();
  if(lock.current || !ready || confirmation)return;
  setError('');
  let input=pending?.input;
  if(!input){
   const amount=Number(form.paidAmount);
   if(!fee){setError('Select an invoice for this payment.');return;}
   if(!Number.isFinite(amount)||amount<=0||amount>Number(fee.balance)||Math.abs(amount*100-Math.round(amount*100))>0.000001){setError('Enter an amount with up to two decimal places, no greater than the outstanding balance.');return;}
   if(!form.paymentDate){setError('Choose the payment date.');return;}
   input={fee:{id:fee.id,studentId:fee.studentId,studentName:fee.studentName},payment:{...form,paidAmount:amount,paymentDate:`${form.paymentDate}T00:00:00Z`}};
  }
  lock.current=true;setBusy(true);
  let retry;
  try {
   retry=await identityRetry(OPERATION,actor,input,localStorage,{replayCompleted:false});
   setPending({key:retry.key,input});
   retry.dispatched();
   const raw=await recordFeePayment({...input.payment,idempotencyKey:retry.key});
   const number=raw.receipt_number || raw.receipt?.receipt_number || raw.data?.receipt_number;
   const receipt=number ? {id:number,reference:number,type:'PAYMENT',amount:input.payment.paidAmount,credit:input.payment.paidAmount,date:input.payment.paymentDate.slice(0,10),description:input.payment.notes || 'Student fee payment',paymentMethod:input.payment.paymentMethod} : null;
   // The store confirms the matching updated invoice before returning.
   // A missing receipt must never cause a second payment submission.
   setConfirmation({fee:input.fee,receipt});setShowReceipt(Boolean(receipt));
   retry.complete();setPending(null);setForm(empty());
  }catch(err){
   if(retry){
    try {retry.rejected(err);}catch{/* Keep the original local key and locked inputs. */}
    if(!pending && [401,403,422].includes(err.status))setPending(null);
   }
   setError(err.message || 'Payment was not confirmed. Retry the original payment.');
  }finally{lock.current=false;setBusy(false);}
 };
 return <section className="receive-payment-page">
  <h1>Receive Payments</h1><p>Select a student invoice, enter the amount received, then save and print the receipt.</p>
  {error && <p role="alert" className="receive-payment-error">{error}</p>}
  {pending && <p role="status">An earlier payment needs confirmation. Retry with its original details. Reference: {pending.key}</p>}
  {!ready && !error && <p role="status">Checking saved payment requests…</p>}
  {confirmation ? <div role="status" className="receive-payment-confirmed">
   <h2>Payment saved for {confirmation.fee.studentName}</h2>
   {confirmation.receipt ? <><p>Receipt {confirmation.receipt.reference} · GHS {Number(confirmation.receipt.amount).toFixed(2)}</p><button type="button" className="btn btn-outline-green" onClick={()=>setShowReceipt(true)}>Print Receipt</button></> : <p>The payment is saved, but the server did not return a receipt number. Check the student ledger or contact the backend administrator. Do not submit this payment again.</p>}
   {!pending && <button type="button" className="btn btn-green" onClick={()=>{setConfirmation(null);setSearch('');setError('');}}>Receive another payment</button>}
  </div> : <form onSubmit={submit} aria-label="Receive student payment">
   <fieldset disabled={busy || Boolean(pending) || !ready}>
    <label>Find student<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Student name, student ID or invoice ID" /></label>
    <label>Student invoice<select aria-label="Student invoice" required value={form.id} onChange={e=>change('id',e.target.value)}><option value="">Select an unpaid invoice</option>{options.map(item=><option key={item.id} value={item.id}>{item.studentName} · {item.studentId} · {item.id} · GHS {Number(item.balance).toFixed(2)} owing</option>)}</select></label>
    {fee && <p>Outstanding balance: <strong>GHS {Number(fee.balance).toFixed(2)}</strong></p>}
    {!options.length && <p>No unpaid invoices match. Refresh Accounts or change your search.</p>}
    <div className="receive-payment-fields">
     <label>Amount received (GHS)<input required type="number" min="0.01" step="0.01" max={fee?.balance} value={form.paidAmount} onChange={e=>change('paidAmount',e.target.value)} /></label>
     <label>Payment method<select aria-label="Payment method" value={form.paymentMethod} onChange={e=>change('paymentMethod',e.target.value)}>{['Cash','Mobile Money','Bank Transfer','Cheque'].map(value=><option key={value}>{value}</option>)}</select></label>
     <label>Payment date<input type="date" required value={form.paymentDate} onChange={e=>change('paymentDate',e.target.value)} /></label>
     <label>Transaction reference<input value={form.transactionRef} onChange={e=>change('transactionRef',e.target.value)} /></label>
    </div>
    <label>Notes<textarea rows={3} value={form.notes} onChange={e=>change('notes',e.target.value)} /></label>
   </fieldset>
   <button className="btn btn-green" type="submit" disabled={busy || !ready || (Boolean(pending)&&!pending.input)}>{busy?'Saving payment…':pending?'Retry original payment':'Receive Payment & Print Receipt'}</button>
  </form>}
  {showReceipt && confirmation?.receipt && <StudentReceiptModal fee={confirmation.fee} confirmedReceipt={confirmation.receipt} onClose={()=>setShowReceipt(false)} />}
 </section>;
}
