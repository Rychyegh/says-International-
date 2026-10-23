import SchoolPrintHeader from '../School/SchoolPrintHeader';
import SchoolContactDetails from '../School/SchoolContactDetails';
import { usePortalData } from '../../data/PortalStore';
import { identityRetry, listRetryOperations, recoveryPayload } from '../../lib/identityRetry';
import React, { useEffect, useRef, useState } from 'react';
import ViewportModal from '../Modal/ViewportModal';
import { api, getAuthUser } from '../../services/api';
import { isApprovedItem } from '../../lib/recordRules';
import { ITEM_PAYMENTS_ENABLED, isItemUuid, paymentAccountOptions } from '../../lib/itemPaymentContract';
import './ItemDisbursementModal.css';
import './StudentReceiptModal.css';

function ItemInstructions({ item, index, voucher, onPaid, accounts, accountsReady, onReceipt, onAddAccount }) {
  const {disbursePaymentVoucherItem} = usePortalData();
  const actor = getAuthUser()?.id;
  const canDisburse = ITEM_PAYMENTS_ENABLED && accountsReady && !voucher.itemReconciliationRequired && accounts.sources.length > 0 && accounts.expenses.length > 0;
  const endpoint = `/finance/vouchers/${encodeURIComponent(voucher.id)}/items/${encodeURIComponent(item.id)}/disburse`;
  const lock = useRef(false);
  const [busy,setBusy] = useState(false), [pending,setPending] = useState(null), [ready,setReady] = useState(false);
  const storageKey = `pv-item-instructions:${getAuthUser()?.id}:${voucher.id}:${item.id}`;
  const defaults = {source_account_id:'',destination_account:'',beneficiary:item.provider || '',payment_method:'Bank Transfer',reference:'',payment_date:new Date().toISOString().slice(0,10),expense_account_id:'',expense_account_draft:'',notes:''};
  const [fields, setFields] = useState(() => {
    try { return {...defaults,...JSON.parse(sessionStorage.getItem(storageKey) || '{}')}; }
    catch { return defaults; }
  });
  const defaultSources = accounts.sources.filter(account=>account.is_default === true);
  const sourceAccountId = accounts.sources.find(account=>account.id===fields.source_account_id)?.id
    || (defaultSources.length===1 ? defaultSources[0].id : accounts.sources.length===1 ? accounts.sources[0].id : '');
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
    if (!pending && (!accounts.sources.some(account=>account.id===sourceAccountId) || !accounts.expenses.some(account=>account.id===fields.expense_account_id) || !Number.isInteger(voucher.version))) {setNotice('Select saved payment accounts and refresh the voucher version before recording payment.');return;}
    if (pending?.input && !pending.input.source_account_id) {setNotice('This request uses an older contract. Reconcile its original key before recording another payment.');return;}
    lock.current=true;setBusy(true);setNotice('');
    let retry;
    const input = pending?.input || {source_account_id:sourceAccountId,expense_account_id:fields.expense_account_id,destination_account:fields.destination_account,beneficiary:item.provider,payment_method:fields.payment_method,reference:fields.reference,payment_date:fields.payment_date,notes:fields.notes,version:voucher.version};
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
    try {sessionStorage.setItem(storageKey,JSON.stringify({...fields,source_account_id:sourceAccountId}));setNotice('Instructions saved in this tab. No payment has been made.');}
    catch {setNotice('Could not save instructions in this tab. Keep this dialog open to retain your entries.');}
  };
  return <form className="item-payment-card" aria-label={`Item ${index+1} payment instructions`} onSubmit={save} noValidate>
    <div className="item-payment-heading"><div><small>ITEM {index+1} · {paid ? 'Paid' : eligible ? 'Approved' : 'Awaiting approval'}</small><h3>{item.description || `Item ${index+1}`}</h3></div><strong>GHS {Number(item.totalAmount ?? item.total ?? 0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
    <fieldset disabled={paid || busy || Boolean(pending) || !ready}>
      <div className="item-payment-fields">
        <label>Source account<select aria-label="Source account" required value={sourceAccountId} onChange={e=>field('source_account_id',e.target.value)}>
          <option value="">Select a configured source account</option>
          {accounts.sources.map(account=><option key={account.id} value={account.id}>{account.name || account.account_name} · {account.code || account.account_code || 'Asset'}</option>)}
        </select><small>REMALJ Carewell Inspirational School</small></label>
        <label>Beneficiary<input readOnly required value={item.provider || ''} /></label>
        <label>Payment method<select aria-label="Payment method" value={fields.payment_method} onChange={e=>field('payment_method',e.target.value)}>{['Bank Transfer','Mobile Money','Cheque','Cash'].map(method=><option key={method}>{method}</option>)}</select></label>
        <label>PL / Account<select aria-label="Expense account" required value={accounts.expenses.some(account=>account.id===fields.expense_account_id) ? fields.expense_account_id : ''} onChange={e=>{
          const value=e.target.value;
          setFields(current=>({...current,expense_account_id:value,expense_account_draft:''}));
          setNotice('Unsaved changes');
        }}><option value="">Select an account</option>
          {accounts.expenses.length>0 && <optgroup label="Configured accounts">{accounts.expenses.map(account=><option key={account.id} value={account.id}>{account.name || account.account_name} · {account.code || account.account_code}</option>)}</optgroup>}
        </select><button type="button" className="btn btn-outline-green" onClick={onAddAccount}>+ Add account</button>{fields.expense_account_draft && <small>Previous draft choice: {fields.expense_account_draft.replace(/^draft:/,'')}. Select a configured account to use for payment.</small>}</label>
        <label>Payment date<input type="date" required value={fields.payment_date} onChange={e=>field('payment_date',e.target.value)} /></label>
      </div>
      <label>Notes<textarea rows={2} value={fields.notes} onChange={e=>field('notes',e.target.value)} /></label>
    </fieldset>
    <div className="item-payment-actions">
      <button className="btn btn-outline-green" type="submit" disabled={paid || busy || Boolean(pending) || !ready}>Save item instructions</button>
    <button className="btn btn-green" type="button" onClick={disburse} disabled={!canDisburse || busy || !ready || !isItemUuid(item.backendItemId) || item.recoveredFromDescription || (pending ? !pending.input : !eligible || paid || !sourceAccountId || !accounts.expenses.some(account=>account.id===fields.expense_account_id) || !Number.isInteger(voucher.version))}>{busy ? 'Processing…' : pending ? `Retry item ${index+1} payment` : `Record confirmed payment for item ${index+1}`}</button>
    </div>
    {!pending && eligible && !paid && accountsReady && <p>{[
      !sourceAccountId && 'Select a configured source account.',
      !accounts.expenses.some(account=>account.id===fields.expense_account_id) && 'Select a configured expense account.',
      !Number.isInteger(voucher.version) && 'Refresh the voucher to load its current version.',
      !isItemUuid(item.backendItemId) && 'The backend must return a saved item ID before payment can be recorded.',
    ].filter(Boolean).join(' ')}</p>}
    {pending && <button type="button" className="btn" disabled={busy || !pending.input} onClick={reconcile}>Check saved payment</button>}
    {(item.payments || []).filter(payment=>isItemUuid(payment.id)).map(payment=><button type="button" className="btn" key={payment.id} onClick={()=>onReceipt(item,payment.id)}>View receipt {payment.receipt_number || payment.reference || payment.id}</button>)}
    {pending && <p role="status">Payment confirmation pending. Original inputs are locked. Request reference: {pending.key}</p>}
    {!eligible && <p>{paid ? 'This item has already been paid.' : 'This item must be approved before it can be disbursed. You can save its payment instructions now.'}</p>}
    {notice && <p role="status">{notice}</p>}
  </form>;
}

export default function ItemDisbursementModal({voucher:initialVoucher,onClose,onCompleted}) {
  const [addingAccount,setAddingAccount] = useState(false);
  const [accountDraft,setAccountDraft] = useState({name:'',code:''});
  const [savingAccount,setSavingAccount] = useState(false);
  const [createAccountError,setCreateAccountError] = useState('');
  const accountSaveLock = useRef(false);
  const [receipt,setReceipt] = useState(null), [receiptError,setReceiptError] = useState('');
  const [combined,setCombined] = useState([]), [receiptsLoading,setReceiptsLoading] = useState(false);
  useEffect(()=>()=>document.body.classList.remove('print-student-receipt'),[]);
  const loadReceipt = async (item,id) => {
    setReceipt(null);setCombined([]);setReceiptError('');
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
  const [accountsLoading,setAccountsLoading] = useState(true), [accountReload,setAccountReload] = useState(0);
  const saveAccount = async event => {
    event.preventDefault();
    if(accountSaveLock.current) return;
    const name = accountDraft.name.trim(), code = accountDraft.code.trim();
    if(!name || !code) {setCreateAccountError('Enter an account name and code.');return;}
    accountSaveLock.current=true;setSavingAccount(true);setCreateAccountError('');
    try {
      await api.createPaymentAccount({name,code,account_type:'expense',is_active:true});
      setAccountDraft({name:'',code:''});setAddingAccount(false);
      setAccountsLoading(true);setAccountReload(value=>value+1);
    } catch(error) {
      setCreateAccountError([404,405].includes(error.status) ? 'Account creation is not available on the backend yet. Ask the backend administrator to enable POST /finance/payment-accounts.' : error.message);
    } finally {accountSaveLock.current=false;setSavingAccount(false);}
  };
  useEffect(()=>{
    let active=true;
    setAccountsLoading(true);setAccountError('');
    api.getPaymentAccounts().then(raw=>{if(active)setAccounts(paymentAccountOptions(raw));})
      .catch(error=>{if(active){setAccounts({sources:[],expenses:[]});setAccountError(error.message);}})
      .finally(()=>{if(active)setAccountsLoading(false);});
    return()=>{active=false;};
  },[accountReload]);
  const {paymentVouchers=[]} = usePortalData();
  const voucher = paymentVouchers.find(row=>row.id===initialVoucher.id && row.items?.length > 1) || initialVoucher;
  const loadCombined = async () => {
    setReceipt(null);setCombined([]);setReceiptError('');setReceiptsLoading(true);
    try {
      const payments=voucher.items.flatMap(item=>(item.payments || []).filter(payment=>isItemUuid(payment.id)).map(payment=>({item,id:payment.id})));
      if(!payments.length) throw new Error('No confirmed vendor payments are available to print.');
      const records=await Promise.all(payments.map(async ({item,id})=>{
        const raw=await api.getItemPayment(voucher.id,item.id,id);
        const record=raw.payment || raw.data?.payment || raw.data || raw;
        if(record.id!==id || record.item_id!==item.id || record.voucher_id!==voucher.id || !record.receipt_number || !Number.isFinite(Number(record.amount))) throw new Error('The server did not return a matching confirmed vendor receipt.');
        return record;
      }));
      setCombined(records);
    } catch(error){setReceiptError(error.message);} finally {setReceiptsLoading(false);}
  };
  const onPaid = saved => {
    onCompleted?.(saved);
    if (saved.items.every(item => ['paid','disbursed','settled','declined','cancel pv','non-accrual'].includes(String(item.status).toLowerCase()))) {
      onClose();
    }
  };
  return <ViewportModal className="item-payment-overlay" aria-label="Item authorization and disbursement" onClose={onClose}>
    <section className="item-payment-dialog">
      <header><div><h2>Record item payments</h2><p>PV #{voucher.pvNo} · {voucher.items.length} items</p></div><button type="button" className="btn btn-outline-green" onClick={onClose}>Close</button></header>
      <p>Prepare each item separately with its PV beneficiary.</p>
      <p className="item-payment-availability" id="item-payment-availability">Record an external payment only after verifying its settlement and reference. This records the payment in the school ledger; it does not send money through a bank or mobile-money service.</p>
      {!ITEM_PAYMENTS_ENABLED && <p className="item-payment-availability">Item payment recording is disabled in this frontend release. The administrator must enable it after verifying backend payment setup.</p>}
      {voucher.itemReconciliationRequired && <p role="alert">This historical voucher requires audited reconciliation. Do not issue a second payment.</p>}
      {accountError && <p role="alert">Payment accounts could not be loaded: {accountError}</p>}
      {accountsLoading ? <p role="status">Loading configured payment accounts…</p> : !accountError && <>
        {!accounts.sources.length && <p>No active source asset accounts are available. An administrator must configure them in the backend.</p>}
        {!accounts.expenses.length && <p>No active expense accounts are available. An administrator must configure them in the backend.</p>}
      </>}
      <button type="button" className="btn" disabled={accountsLoading} onClick={()=>{setAccountsLoading(true);setAccountReload(value=>value+1);}}>Refresh payment accounts</button>
      {addingAccount && <form className="item-payment-card" aria-label="Add expense account" onSubmit={saveAccount}>
        <h3>Add PL / expense account</h3>
        <div className="item-payment-fields">
          <label>Account name<input required maxLength={255} disabled={savingAccount} value={accountDraft.name} onChange={event=>setAccountDraft(current=>({...current,name:event.target.value}))}/></label>
          <label>Account code<input required maxLength={50} disabled={savingAccount} value={accountDraft.code} onChange={event=>setAccountDraft(current=>({...current,code:event.target.value}))}/></label>
        </div>
        <p>The account is saved as an active expense account and becomes available after the saved accounts reload.</p>
        {createAccountError && <p role="alert">{createAccountError}</p>}
        <button type="submit" className="btn btn-green" disabled={savingAccount}>{savingAccount?'Saving…':'Save account'}</button>
        <button type="button" className="btn" disabled={savingAccount} onClick={()=>setAddingAccount(false)}>Cancel</button>
      </form>}
      {voucher.items.some(item => item.recoveredFromDescription) && <p className="item-payment-availability">These item details were recovered from the voucher description. The payment service must return saved item records before they can be paid separately.</p>}
      {voucher.items.map((item,index)=><ItemInstructions key={item.id || index} item={item} index={index} voucher={voucher} onPaid={onPaid} accounts={accounts} accountsReady={!accountsLoading && !accountError} onReceipt={loadReceipt} onAddAccount={()=>{setCreateAccountError('');setAddingAccount(true);}} />)}
      <button type="button" className="btn btn-outline-green" disabled={receiptsLoading} onClick={loadCombined}>{receiptsLoading?'Loading vendor receipts…':'View all vendor payments on one sheet'}</button>
      {receiptError && <p role="alert">{receiptError}</p>}
      {combined.length>0 && <><article className="student-receipt-paper vendor-payment-summary">
        <SchoolPrintHeader />
        <h3>Vendor payment summary · PV #{voucher.pvNo}</h3>
        <table><thead><tr><th>Vendor / beneficiary</th><th>Receipt / reference</th><th>Date / method</th><th>Amount (GHS)</th></tr></thead><tbody>{combined.map(record=><tr key={record.id}><td>{record.beneficiary}<br/>{record.destination_account}</td><td>{record.receipt_number}<br/>{record.reference}</td><td>{record.payment_date}<br/>{record.payment_method}</td><td>{Number(record.amount).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total confirmed payments</th><th>{combined.reduce((total,record)=>total+Number(record.amount),0).toFixed(2)}</th></tr></tfoot></table>
        <p>Includes confirmed payments only. Unpaid items are excluded.</p>
      </article><button type="button" className="btn" onClick={printReceipt}>Print all vendor payments on one sheet</button></>}
      {receipt && <><article className="student-receipt-paper">
        <SchoolPrintHeader />
        <h3>Confirmed item payment · {receipt.receipt_number}</h3>
        <dl>{[['Beneficiary',receipt.beneficiary],['Amount (GHS)',receipt.amount],['Date',receipt.payment_date],['Reference',receipt.reference],['Method',receipt.payment_method],['Source account',receipt.source_account_id],['Expense account',receipt.expense_account_id],['Destination',receipt.destination_account]].map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>
      </article><button className="btn" type="button" onClick={printReceipt}>Print confirmed receipt</button></>}
    </section>
  </ViewportModal>;
}
