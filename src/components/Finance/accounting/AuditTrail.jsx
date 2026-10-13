import React, { useState } from 'react';
import { auditChanges } from '../../../lib/accountingRules';
import { Card, Field, Metrics, Table, LoadState, ExportButton, useList, title } from '../AccountingUI';
const show=value=>value==null?'Not set':typeof value==='object'?JSON.stringify(value,null,2):String(value);
export default function AuditTrail() {
  const list=useList('audit-events'),[selected,select]=useState(null);
  const [filters,setFilters]=useState({search:'',actor:'',action:'',resource:'',from:'',to:''});
  const change=(key,value)=>{setFilters(f=>({...f,[key]:value}));select(null);};
  const rows=list.rows.filter(r=>(!filters.search||`${r.reference} ${r.reason||''}`.toLowerCase().includes(filters.search.toLowerCase()))&&(!filters.actor||r.actor_name===filters.actor)&&(!filters.action||r.action===filters.action)&&(!filters.resource||r.resource===filters.resource)&&(!filters.from||String(r.occurred_at).slice(0,10)>=filters.from)&&(!filters.to||String(r.occurred_at).slice(0,10)<=filters.to));
  const columns=[{key:'occurred_at'},{key:'actor_name'},{key:'action'},{key:'resource'},{key:'reference'},{key:'reason'}];
  const changes=selected?auditChanges(selected.before,selected.after):[];
  return <>
    <Metrics items={[["Events in scope",list.loaded?rows.length:null],["People making changes",list.loaded?new Set(rows.map(r=>r.actor_name)).size:null],["Reversals & reopened periods",list.loaded?rows.filter(r=>['reverse','reopen'].includes(r.action)).length:null]]}/>
    <Card title="Trace a financial change" hint="Filter by person, action, resource, reference, and dates. The history is read-only."><div className="accounting-grid"><Field name="audit_search" label="Reference or reason" optional value={filters.search} onChange={e=>change('search',e.target.value)}/>{[['actor','actor_name','Person'],['action','action','Action'],['resource','resource','Record type']].map(([key,field,label])=><Field key={key} name={`audit_${key}`} label={label} options={[...new Set(list.rows.map(r=>r[field]).filter(Boolean))]} optional value={filters[key]} onChange={e=>change(key,e.target.value)}/>)}<Field name="audit_from" label="From date" type="date" max={filters.to} optional value={filters.from} onChange={e=>change('from',e.target.value)}/><Field name="audit_to" label="To date" type="date" min={filters.from} optional value={filters.to} onChange={e=>change('to',e.target.value)}/></div><div className="accounting-toolbar"><button onClick={()=>{select(null);list.reload();}}>Refresh audit trail</button><ExportButton filename="audit-trail.csv" columns={columns} rows={rows} disabled={!list.loaded}/></div><LoadState state={list} label="Audit events"/></Card>
    <div className="accounting-split">
      <Card title="Event timeline">{list.loaded&&!rows.length&&<p>No audit events match these filters.</p>}{rows.map(r=><button className={`accounting-audit-event ${selected?.id===r.id?'is-selected':''}`} key={r.id} onClick={()=>select(r)}><time>{r.occurred_at}</time><strong>{r.actor_name} · {title(r.action)}</strong><span>{r.resource} / {r.reference}</span><small>{r.reason||'No reason recorded'}</small></button>)}{!list.loaded&&<p className="accounting-muted">Events will appear here when the audit service is available.</p>}</Card>
      <Card title="Before and after">{selected?<><p><strong>{selected.reference}</strong> · {selected.actor_name} · {selected.occurred_at}</p><p>{selected.reason||'No reason recorded'}</p><Table columns={[{key:'field',label:'Changed field',render:r=>title(r.field)},{key:'before',label:'Previous value',render:r=><pre>{show(r.before)}</pre>},{key:'after',label:'New value',render:r=><pre>{show(r.after)}</pre>}]} rows={changes} empty="This event does not contain a field-level change."/></>:<div className="accounting-document-empty"><strong>Select an audit event</strong><p>Compare the values before and after a change, along with who made it and why.</p></div>}</Card>
    </div>
  </>;
}
