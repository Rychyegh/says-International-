import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { billEditorTotals } from '../../lib/billEditorTotals';
import { savedBillItems } from '../../lib/savedBillItems';
import { money } from '../../lib/accountingRules';
import './SavedBillManager.css';

export default function BillItemEditor({ bill, onSaved }) {
  const original = savedBillItems(bill);
  const [items, setItems] = useState(() => original);
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const change = fn => {setItems(fn); setKey(crypto.randomUUID());};
  useEffect(() => {
    setItems(savedBillItems(bill));
    setKey(crypto.randomUUID());
    setError('');
  }, [bill.id, bill.version]);
  const totals = billEditorTotals(bill, items);
  const unavailable = bill.version == null || !original.length;
  if (!original.length) return <div className="be-missing" role="status"><h3>No saved fee items available</h3><p>{Number(bill.billedAmount || 0) === 0 && Number(bill.paidAmount || 0) === 0 ? 'This account shows no billed amount and no fee items. Prepare and post the compulsory bill first. If a bill was already posted, refresh the records; its saved details need to be returned by the server.' : 'This bill has a saved balance, but its fee breakdown was not returned. Refresh the records. If it is still missing, the backend needs to return the original invoice items before they can be edited.'}</p><p>Existing billed: <strong>{money(bill.billedAmount)}</strong> · Paid: <strong>{money(bill.paidAmount)}</strong> · Balance: <strong>{money(bill.balance)}</strong></p></div>;
  return <form className="bill-edit-form" onSubmit={async event => {
    event.preventDefault(); if (busy || unavailable) return;
    setBusy(true); setError('');
    try { await api.reviseBillItems(bill.id,{expected_version:bill.version,reason,items:items.map(item=>({...item,amount:Number(item.amount)}))},key); await onSaved(); }
    catch(err) {setError(/historical line.*posting account/i.test(err.message) ? 'Changes were not saved. An existing bill item has no verified active accounting account. Accounts must reconcile its original posting account on the server before this bill can be edited. Your entered changes are still shown here.' : err.message);} finally {setBusy(false);}
  }}>
    <div className="be-intro"><h3>Bill items</h3><p>Change an amount below, or add an optional service such as bus or feeding.</p></div>
    {unavailable && <p className="bm-warning" role="alert">{!original.length ? 'This record has no saved fee breakdown. Ask the backend administrator to restore its invoice items before editing.' : 'This bill is missing its revision version. The backend must return it before changes can be saved.'}</p>}
    <fieldset disabled={busy || unavailable}>
      <div className="be-lines">{items.map((item,i)=><div className="be-line" key={i}><label><span className={`be-badge ${item.is_optional ? 'optional' : ''}`}>{item.is_optional ? 'Optional service' : 'Compulsory fee'}</span><input aria-label={`Item ${i+1} description`} required placeholder="e.g. School bus" value={item.details} onChange={e=>change(rows=>rows.map((r,j)=>j===i?{...r,details:e.target.value}:r))}/></label><label><span>Amount · GHS</span><input aria-label={`Item ${i+1} amount`} type="number" required min="0" step="0.01" value={item.amount} onChange={e=>change(rows=>rows.map((r,j)=>j===i?{...r,amount:e.target.value}:r))}/></label><button className="be-remove" type="button" aria-label={`Remove ${item.details || 'item'}`} onClick={()=>change(rows=>rows.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}</div>
      <div className="be-add"><button className="be-add-optional" type="button" onClick={()=>change(rows=>[...rows,{details:'',amount:0,is_optional:true}])}><Plus size={15}/> Add optional service</button><button type="button" onClick={()=>change(rows=>[...rows,{details:'',amount:0,is_optional:false}])}><Plus size={15}/> Add compulsory fee</button></div>
      {totals.discrepancy !== 0 && <p className="bm-warning" role="alert">The saved fee breakdown differs from the saved bill total by {money(totals.discrepancy)}. Refresh bill records. If this persists, Accounts must reconcile the saved items and total before relying on this estimate.</p>}
      <div className="be-totals"><span>Currently saved bill <strong>{money(totals.savedTotal)}</strong></span><span>Fee subtotal <strong>{money(totals.subtotal)}</strong></span><span>Previous balance <strong>{money(totals.arrears)}</strong></span><span>Discount <strong>{money(totals.discount)}</strong></span></div>
      <div className="be-totals"><span>Revised bill <strong>{money(totals.total)}</strong></span><span>Already paid <strong>{money(totals.paid)}</strong></span><span>Estimated balance <strong>{money(totals.balance)}</strong></span></div>
      <label className="be-reason">Reason for changes <textarea required rows={2} placeholder="e.g. Parent requested school bus service" value={reason} onChange={e=>{setReason(e.target.value);setKey(crypto.randomUUID());}}/></label>
      <div className="be-save-row"><p>Saving updates this student's bill and ledger. Existing payments are preserved.</p><button className="be-save" disabled={!items.length || !reason.trim()}><Save size={15}/>{busy ? 'Saving…' : 'Save bill changes'}</button></div>
    </fieldset>
    {error && <p className="bm-warning" role="alert">{error}</p>}
  </form>;
}
