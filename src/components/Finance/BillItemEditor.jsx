import React, { useState } from 'react';
import { api } from '../../services/api';
import { savedBillItems } from '../../lib/savedBillItems';

export default function BillItemEditor({ bill, onSaved }) {
 const [items,setItems] = useState(()=>savedBillItems(bill));
 const [reason,setReason] = useState(''), [error,setError] = useState(''), [busy,setBusy] = useState(false);
 const [key,setKey] = useState(()=>crypto.randomUUID());
 const change = fn => {setItems(fn);setKey(crypto.randomUUID());};
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api.reviseBillItems(bill.id,{expected_version:bill.version,reason,items:items.map(item=>({...item,amount:Number(item.amount)}))},key);await onSaved();}catch(err){setError(err.message);}finally{setBusy(false);}}}>
 <h3>Edit saved bill items</h3><fieldset disabled={busy} style={{border:0}}>{items.map((item,i)=><div key={i} className="accounting-toolbar"><input aria-label="Item description" required value={item.details} readOnly={!item.is_optional} onChange={e=>change(rows=>rows.map((r,j)=>j===i?{...r,details:e.target.value}:r))}/><input aria-label="Item amount" type="number" required min="0" step="0.01" value={item.amount} readOnly={!item.is_optional} onChange={e=>change(rows=>rows.map((r,j)=>j===i?{...r,amount:e.target.value}:r))}/>{item.is_optional && <button type="button" onClick={()=>change(rows=>rows.filter((_,j)=>j!==i))}>Remove optional item</button>}</div>)}<button type="button" onClick={()=>change(rows=>[...rows,{details:'',amount:0,is_optional:true}])}>Add optional item</button><label>Reason<input required value={reason} onChange={e=>{setReason(e.target.value);setKey(crypto.randomUUID());}}/></label><button disabled={!items.length || bill.version == null}>Save bill revision</button>{bill.version == null && <p>The backend must return an invoice version before this bill can be revised safely.</p>}</fieldset>{error && <p role="alert">{error}</p>}</form>;
}
