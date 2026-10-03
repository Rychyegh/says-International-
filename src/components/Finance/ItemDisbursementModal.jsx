import { usePortalData } from '../../data/PortalStore';
import { identityRetry, listRetryOperations, recoveryPayload } from '../../lib/identityRetry';
import React, { useEffect, useRef, useState } from 'react';
import ViewportModal from '../Modal/ViewportModal';
import { api, getAuthUser } from '../../services/api';
import { isApprovedItem } from '../../lib/recordRules';
import { ITEM_PAYMENTS_ENABLED, isItemUuid, paymentAccountOptions } from '../../lib/itemPaymentContract';
import './ItemDisbursementModal.css';
import './StudentReceiptModal.css';

function ItemInstructions({ item, index, voucher, onPaid, accounts, onReceipt }) {
  const {disbursePaymentVoucherItem} = usePortalData();
  const actor = getAuthUser()?.id;
  const canDisburse = ITEM_PAYMENTS_ENABLED && !voucher.itemReconciliationRequired && accounts.sources.length > 0 && accounts.expenses.length > 0;
  const endpoint = `/finance/vouchers/${encodeURIComponent(voucher.id)}/items/${encodeURIComponent(item.id)}/disburse`;
  const lock = useRef(false);
  const [busy,setBusy] = useState(false), [pending,setPending] = useState(null), [ready,setReady] = useState(false);
  const storageKey = `pv-item-instructions:${getAuthUser()?.id}:${voucher.id}:${item.id}`;
  const defaults = {source_account_id:'',destination_account:'',beneficiary:item.provider || '',payment_method:'Bank Transfer',reference:'',payment_date:new Date().toISOString().slice(0,10),expense_account_id:'',notes:''};
  const [fields, setFields] = useState(() => {
    try { return {...defaults,...JSON.parse(sessionStorage.getItem(storageKey) || '{}')}; }
    catch { return defaults; }
  });
  const [notice, setNotice] = useState('');
  const eligible = isApprovedItem(item.status);
  const paid = ['paid','disbursed','settled'].includes(String(item.status).toLowerCase());
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!actor) throw new Error('Sign in again before disbursement.');
        const record = (await listRetryOperations(endpoint, actor)).find(record => record.state === 'pending');
        if (record) {
          if (active) setPending(record);
          const input = await recoveryPayload(record);
          if (active) { setPending({...record,input}); setFields(input); }
        }
        if (active) setReady(true);
      } catch(error) { if(active) setNotice(error.message); }
    })();
    return () => {active=false;};
  }, [endpoint,actor]);
  const disburse = async event => {
    if (lock.current || !canDisburse || !ready || (!pending && (!eligible || paid))) return;
    if (!pending && !event.currentTarget.form.reportValidity()) return;
    if (!pending && (!accounts.sources.some(account=>account.id===fields.source_account_id) || !accounts.expenses.some(account=>account.id===fields.expense_account_id) || !Number.isInteger(voucher.version))) {setNotice('Select saved payment accounts and refresh the voucher version before recording payment.');return;}
    if (pending?.input && !pending.input.source_account_id) {setNotice('This request uses an older contract. Reconcile its original key before recording another payment.');return;}
    lock.current=true;setBusy(true);setNotice('');
    let retry;
    const input = pending?.input || {source_account_id:fields.source_account_id,expense_account_id:fields.expense_account_id,destination_account:fields.destination_account,beneficiary:item.provider,payment_method:fields.payment_method,reference:fields.reference,payment_date:fields.payment_date,notes:fields.notes,version:voucher.version};
    try {
      retry = await identityRetry(endpoint,actor,input);
      setPending({key:retry.key,input});retry.dispatched();
      const saved = await disbursePaymentVoucherItem(voucher.id,item.id,input,retry.key);
      retry.complete();setPending(null);sessionStorage.removeItem(storageKey);
      setNotice('Item payment confirmed.');onPaid(saved);
    } catch(error) {
      if(retry) {
        try {retry.rejected(error);} catch { /* Keep inputs locked if storage fails. */ }
        if(!pending && [401,403,422].includes(error.status)) setPending(null);
      }
      setNotice(error.status === 404 || error.status === 405 ? 'The backend item-payment endpoint is not available. Keep this request for reconciliation; do not pay the whole voucher instead.' : error.message);
    } finally {lock.current=false;setBusy(false);}
  };
  const reconcile = async () => {
    if(lock.current || !pending?.input)return;
    lock.current=true;setBusy(true);
    try {
      const saved=await disbursePaymentVoucherItem(voucher.id,item.id,pending.input,pending.key,true);
      const retry=await identityRetry(endpoint,actor,pending.input);retry.complete();setPending(null);onPaid(saved);setNotice('Saved payment reconciled.');
    } catch(error){setNotice(`Reconciliation did not confirm payment: ${error.message}. Keep the original request key.`);}
    finally{lock.current=false;setBusy(false);}
  };
  const field = (name, value) => {setFields(current=>({...current,[name]:value}));setNotice('Unsaved changes');};
  const save = event => {
    event.preventDefault();
    try {sessionStorage.setItem(storageKey,JSON.stringify(fields));setNotice('Instructions saved in this tab. No payment has been made.');}
    catch {setNotice('Could not save instructions in this tab. Keep this dialog open to retain your entries.');}
  };
  return <form className="item-payment-card" aria-label={`Item ${index+1} payment instructions`} onSubmit={save}>
    <div className="item-payment-heading"><div><small>ITEM {index+1} · {paid ? 'Paid' : eligible ? 'Approved' : 'Awaiting approval'}</small><h3>{item.description || `Item ${index+1}`}</h3></div><strong>GHS {Number(item.totalAmount ?? item.total ?? 0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
    <fieldset disabled={paid || busy || Boolean(pending) || !ready}>
      <div className="item-payment-fields">
        <label>Source account<select aria-label="Source account" required value={fields.source_account_id} onChange={e=>field('source_account_id',e.target.value)}><option value="">Select a saved asset account</option>{accounts.sources.map(account=><option key={account.id} value={account.id}>{account.name || account.account_name} · {account.code || account.account_code}</option>)}</select></label>
        <label>Destination account<input required value={fields.destination_account} onChange={e=>field('destination_account',e.target.value)} placeholder="Recipient bank account or MoMo number" /></label>
        <label>Beneficiary<input readOnly required value={item.provider || ''} /></label>
        <label>Payment method<select aria-label="Payment method" value={fields.payment_method} onChange={e=>field('payment_method',e.target.value)}>{['Bank Transfer','Mobile Money','Cheque','Cash'].map(method=><option key={method}>{method}</option>)}</select></label>
        <label>Expense account<select aria-label="Expense account" required value={fields.expense_account_id} onChange={e=>field('expense_account_id',e.target.value)}><option value="">Select an account</option>{accounts.expenses.map(account=><option key={account.id} value={account.id}>{account.name || account.account_name} · {account.code || account.account_code}</option>)}</select></label>
        <label>Payment reference<input required value={fields.reference} onChange={e=>field('reference',e.target.value)} /></label>
        <label>Payment date<input type="date" required value={fields.payment_date} onChange={e=>field('payment_date',e.target.value)} /></label>
      </div>
      <label>Notes<textarea rows={2} value={fields.notes} onChange={e=>field('notes',e.target.value)} /></label>
      <div className="item-payment-actions"><button className="btn btn-outline-green" type="submit">Save item instructions</button></div>
    </fieldset>
    <button className="btn btn-green" type="button" onClick={disburse} disabled={!canDisburse || busy || !ready || !isItemUuid(item.backendItemId) || item.recoveredFromDescription || (pending ? !pending.input : !eligible || paid)}>{busy ? 'Processing…' : pending ? `Retry item ${index+1} payment` : `Record confirmed payment for item ${index+1}`}</button>
    {!canDisburse && <p>Payment recording is unavailable until rollout is verified, payment accounts are configured, and reconciliation is clear.</p>}
    {pending && <button type="button" className="btn" disabled={busy || !pending.input} onClick={reconcile}>Check saved payment</button>}
    {(item.payments || []).filter(payment=>isItemUuid(payment.id)).map(payment=><button type="button" className="btn" key={payment.id} onClick={()=>onReceipt(item,payment.id)}>View receipt {payment.receipt_number || payment.reference || payment.id}</button>)}
    {pending && <p role="status">Payment confirmation pending. Original inputs are locked. Request reference: {pending.key}</p>}
    {!eligible && <p>{paid ? 'This item has already been paid.' : 'This item must be approved before it can be disbursed. You can save its payment instructions now.'}</p>}
    {notice && <p role="status">{notice}</p>}
  </form>;
}

export default function ItemDisbursementModal({voucher:initialVoucher,onClose}) {
  const [receipt,setReceipt] = useState(null), [receiptError,setReceiptError] = useState('');
  useEffect(()=>()=>document.body.classList.remove('print-student-receipt'),[]);
  const loadReceipt = async (item,id) => {
    setReceipt(null);setReceiptError('');
    try {
      const raw=await api.getItemPayment(initialVoucher.id,item.id,id);
      const record=raw.payment || raw.data?.payment || raw.data || raw;
      if(record.id!==id || record.item_id!==item.id || record.voucher_id!==initialVoucher.id || !record.receipt_number) throw new Error('The server did not return a matching confirmed receipt.');
      setReceipt(record);
    } catch(error){setReceiptError(error.message);}
  };
  const printReceipt = () => {
    document.body.classList.add('print-student-receipt');
    const done=()=>{document.body.classList.remove('print-student-receipt');onClose();};
    window.addEventListener('afterprint',done,{once:true});
    try {window.print();} catch(error){window.removeEventListener('afterprint',done);document.body.classList.remove('print-student-receipt');setReceiptError(error.message);}
  };
  const [accounts,setAccounts] = useState({sources:[],expenses:[]}), [accountError,setAccountError] = useState('');
  useEffect(()=>{let active=true;api.getPaymentAccounts().then(raw=>{if(active)setAccounts(paymentAccountOptions(raw));}).catch(error=>{if(active)setAccountError(error.message);});return()=>{active=false;};},[]);
  const {paymentVouchers=[]} = usePortalData();
  const voucher = paymentVouchers.find(row=>row.id===initialVoucher.id && row.items?.length > 1) || initialVoucher;
  const onPaid = saved => {
    if (saved.items.every(item => ['paid','disbursed','settled','declined','cancel pv','non-accrual'].includes(String(item.status).toLowerCase()))) onClose();
  };
  return <ViewportModal className="item-payment-overlay" aria-label="Item authorization and disbursement" onClose={onClose}>
    <section className="item-payment-dialog">
      <header><div><h2>Record item payments</h2><p>PV #{voucher.pvNo} · {voucher.items.length} items</p></div><button type="button" className="btn btn-outline-green" onClick={onClose}>Close</button></header>
      <p>Prepare each item separately, with its own source account, destination account and payment reference.</p>
      <p className="item-payment-availability" id="item-payment-availability">Record an external payment only after verifying its settlement and reference. This records the payment in the school ledger; it does not send money through a bank or mobile-money service.</p>
      {!ITEM_PAYMENTS_ENABLED && <p className="item-payment-availability">Item payment recording is awaiting backend rollout verification.</p>}
      {voucher.itemReconciliationRequired && <p role="alert">This historical voucher requires audited reconciliation. Do not issue a second payment.</p>}
      {accountError && <p role="alert">Payment accounts could not be loaded: {accountError}</p>}
      {(!accounts.sources.length || !accounts.expenses.length) && <p>Active source asset and expense accounts must be configured before recording payments.</p>}
      {voucher.items.some(item => item.recoveredFromDescription) && <p className="item-payment-availability">These item details were recovered from the voucher description. The payment service must return saved item records before they can be paid separately.</p>}
      {voucher.items.map((item,index)=><ItemInstructions key={item.id || index} item={item} index={index} voucher={voucher} onPaid={onPaid} accounts={accounts} onReceipt={loadReceipt} />)}
      {receiptError && <p role="alert">{receiptError}</p>}
      {receipt && <><article className="student-receipt-paper">
        <header className="student-receipt-letterhead"><img src="/remalj-carewell-logo.jpg" alt="School logo" width="80" height="80" /><div><h2>REMALJ Carewell Inspirational School</h2><p>P.O. Box 139, Bogoso</p></div></header>
        <h3>Confirmed item payment · {receipt.receipt_number}</h3>
        <dl>{[['Beneficiary',receipt.beneficiary],['Amount (GHS)',receipt.amount],['Date',receipt.payment_date],['Reference',receipt.reference],['Method',receipt.payment_method],['Source account',receipt.source_account_id],['Expense account',receipt.expense_account_id],['Destination',receipt.destination_account]].map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>
      </article><button className="btn" type="button" onClick={printReceipt}>Print confirmed receipt</button></>}
    </section>
  </ViewportModal>;
}
