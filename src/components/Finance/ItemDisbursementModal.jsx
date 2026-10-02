import React, { useState } from 'react';
import ViewportModal from '../Modal/ViewportModal';
import { getAuthUser } from '../../services/api';
import { isApprovedItem } from '../../lib/recordRules';
import { SCHOOL_PL_ACCOUNTS } from '../../data/chartOfAccounts';
import './ItemDisbursementModal.css';

function ItemInstructions({ item, index, voucher }) {
  const storageKey = `pv-item-instructions:${getAuthUser()?.id}:${voucher.id}:${item.id}`;
  const defaults = {sourceAccount:'',destinationAccount:'',beneficiary:item.provider || voucher.provider || '',method:'Bank transfer',reference:'',date:new Date().toISOString().slice(0,10),expenseAccount:'',notes:''};
  const [fields, setFields] = useState(() => {
    try { return {...defaults,...JSON.parse(sessionStorage.getItem(storageKey) || '{}')}; }
    catch { return defaults; }
  });
  const [notice, setNotice] = useState('');
  const eligible = isApprovedItem(item.status);
  const paid = ['paid','disbursed','settled'].includes(String(item.status).toLowerCase());
  const field = (name, value) => {setFields(current=>({...current,[name]:value}));setNotice('Unsaved changes');};
  const save = event => {
    event.preventDefault();
    try {sessionStorage.setItem(storageKey,JSON.stringify(fields));setNotice('Instructions saved in this tab. No payment has been made.');}
    catch {setNotice('Could not save instructions in this tab. Keep this dialog open to retain your entries.');}
  };
  return <form className="item-payment-card" aria-label={`Item ${index+1} payment instructions`} onSubmit={save}>
    <div className="item-payment-heading"><div><small>ITEM {index+1} · {paid ? 'Paid' : eligible ? 'Approved' : 'Awaiting approval'}</small><h3>{item.description || `Item ${index+1}`}</h3></div><strong>GHS {Number(item.totalAmount ?? item.total ?? 0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
    <fieldset disabled={!eligible || paid}>
      <div className="item-payment-fields">
        <label>Source account<input required value={fields.sourceAccount} onChange={e=>field('sourceAccount',e.target.value)} placeholder="Account paying this item" /></label>
        <label>Destination account<input required value={fields.destinationAccount} onChange={e=>field('destinationAccount',e.target.value)} placeholder="Recipient bank account or MoMo number" /></label>
        <label>Beneficiary<input required value={fields.beneficiary} onChange={e=>field('beneficiary',e.target.value)} /></label>
        <label>Payment method<select aria-label="Payment method" value={fields.method} onChange={e=>field('method',e.target.value)}>{['Bank transfer','Mobile money','Cheque','Cash'].map(method=><option key={method}>{method}</option>)}</select></label>
        <label>Expense account<select aria-label="Expense account" required value={fields.expenseAccount} onChange={e=>field('expenseAccount',e.target.value)}><option value="">Select an account</option>{SCHOOL_PL_ACCOUNTS.map(account=><option key={account.code+account.name} value={account.code+': '+account.name}>{account.code} · {account.name}</option>)}</select></label>
        <label>Payment reference<input required value={fields.reference} onChange={e=>field('reference',e.target.value)} /></label>
        <label>Payment date<input type="date" required value={fields.date} onChange={e=>field('date',e.target.value)} /></label>
      </div>
      <label>Notes<textarea rows={2} value={fields.notes} onChange={e=>field('notes',e.target.value)} /></label>
      <div className="item-payment-actions"><button className="btn btn-outline-green" type="submit">Save item instructions</button><button className="btn btn-green" type="button" disabled aria-describedby="item-payment-availability">Authorize &amp; disburse item {index+1}</button></div>
    </fieldset>
    {!eligible && <p>{paid ? 'This item has already been paid.' : 'This item must be approved before payment instructions can be prepared.'}</p>}
    {notice && <p role="status">{notice}</p>}
  </form>;
}

export default function ItemDisbursementModal({voucher,onClose}) {
  return <ViewportModal className="item-payment-overlay" aria-label="Item authorization and disbursement" onClose={onClose}>
    <section className="item-payment-dialog">
      <header><div><h2>Authorization &amp; disbursement</h2><p>PV #{voucher.pvNo} · {voucher.items.length} items</p></div><button type="button" className="btn btn-outline-green" onClick={onClose}>Close</button></header>
      <p>Prepare each item separately, with its own source account, destination account and payment reference.</p>
      <p className="item-payment-availability" id="item-payment-availability">Item payments are not available yet. The payment service currently settles the whole voucher. You can save separate instructions in this tab; authorization and disbursement will be enabled when individual item payments are supported.</p>
      {voucher.items.some(item => item.recoveredFromDescription) && <p className="item-payment-availability">These item details were recovered from the voucher description. The payment service must return saved item records before they can be paid separately.</p>}
      {voucher.items.map((item,index)=><ItemInstructions key={item.id || index} item={item} index={index} voucher={voucher} />)}
    </section>
  </ViewportModal>;
}
