import React, { useState } from 'react';
import { money, taxPreview } from '../../../lib/accountingRules';
import { Card, Field, Tabs, Metrics, Table, LoadState, MutationNotice, WorkflowActions, useBook, useList, accountOptions, today } from '../AccountingUI';

const categories=['VAT','NHIL','GETFUND','SSNIT_EMPLOYEE','SSNIT_EMPLOYER','OTHER'];
function Calculator({ssnit}) {
  const [base,setBase]=useState(''),[rate,setRate]=useState(''),[employerRate,setEmployerRate]=useState(''),[inclusive,setInclusive]=useState('exclusive');
  const preview=taxPreview(base,rate,!ssnit&&inclusive==='inclusive'),employer=taxPreview(base,employerRate);
  return <Card title={ssnit?'Payroll contribution calculator':'Single-component tax calculator'} hint={ssnit?'Enter the applicable pensionable pay and verified employee/employer rates. This is a preview, not a payroll posting or remittance allocation.':'Preview one VAT or levy component using a rate you enter. This does not combine levies or determine whether a supply is taxable.'}>
    <div className="accounting-grid"><Field name="calculator_base" label={ssnit?'Pensionable pay (GHS)':'Amount (GHS)'} type="number" min="0" step="0.01" optional value={base} onChange={e=>setBase(e.target.value)}/><Field name="calculator_rate" label={ssnit?'Employee rate (%)':'Component rate (%)'} type="number" min="0" max="100" step="0.0001" optional value={rate} onChange={e=>setRate(e.target.value)}/>{ssnit?<Field name="employer_rate" label="Employer rate (%)" type="number" min="0" max="100" step="0.0001" optional value={employerRate} onChange={e=>setEmployerRate(e.target.value)}/>:<Field name="calculation_mode" label="Amount entered" options={[{value:'exclusive',label:'Excludes this tax component'},{value:'inclusive',label:'Includes this tax component'}]} value={inclusive} onChange={e=>setInclusive(e.target.value)}/>}</div>
    <Metrics items={ssnit?[["Employee deduction",preview?money(preview.tax):null],["Employer contribution",employer?money(employer.tax):null],["Combined contribution",preview&&employer?money(preview.tax+employer.tax):null]]:[["Net amount",preview?money(preview.net):null],["This tax component",preview?money(preview.tax):null],["Including component",preview?money(preview.total):null]]}/>
  </Card>;
}
function RateForm({book,accounts,tab}) {
  const initial=['draft','returned'].includes(book.selected?.status)?book.selected:{};
  return <Card title={initial.id?'Revise rate proposal':'Propose a tax / SSNIT rate'} hint="Rates are versioned by effective dates. Head Admin approval is required before a proposal can be used on new postings."><form key={`${initial.id||tab}-${initial.version||0}`} onSubmit={e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget));
    if(p.effective_to&&p.effective_to<p.effective_from){book.mutation.setError('End date must follow the effective start date.');return;}
    const payload={...p,rate:Number(p.rate),effective_to:p.effective_to||null,...(initial.id?{expected_version:initial.version}:{})};
    book.mutation.save(initial.id?`tax-settings/${encodeURIComponent(initial.id)}/revisions`:'tax-settings',payload);
  }}><div className="accounting-grid"><Field name="name" defaultValue={initial.name}/><Field name="category" options={categories} defaultValue={initial.category||(tab==='SSNIT contributions'?'SSNIT_EMPLOYEE':'VAT')}/><Field name="rate" label="Rate (%)" type="number" min="0" max="100" step="0.0001" defaultValue={initial.rate}/><Field name="applies_to" options={['payroll','taxable_purchases','taxable_sales']} defaultValue={initial.applies_to||(tab==='SSNIT contributions'?'payroll':'taxable_sales')}/><Field name="effective_from" type="date" defaultValue={initial.effective_from||today()}/><Field name="effective_to" type="date" optional defaultValue={initial.effective_to||''}/><Field name="account_id" label="Posting account" options={accountOptions(accounts.rows)} defaultValue={initial.account_id}/><Field name="reason" defaultValue={initial.reason}/></div><LoadState state={accounts} label="Tax posting accounts"/><div className="accounting-toolbar"><button className="primary" disabled={book.mutation.busy||!accounts.loaded}>Save rate proposal</button>{initial.id&&<button type="button" onClick={()=>book.select(null)}>New rate proposal</button>}</div></form></Card>;
}
export default function TaxSettings({role}) {
  const book=useBook('tax-settings'),accounts=useList('accounts');
  const [tab,setTab]=useState('VAT & levies'),[asOf,setAsOf]=useState(today());
  const active=book.rows.filter(r=>r.status==='active'&&r.effective_from<=asOf&&(!r.effective_to||r.effective_to>=asOf));
  const chosen=tab==='SSNIT contributions'?['SSNIT_EMPLOYEE','SSNIT_EMPLOYER']:['VAT','NHIL','GETFUND','OTHER'];
  const visible=book.rows.filter(r=>tab==='Rate history'||chosen.includes(r.category));
  return <>
    <Tabs options={['VAT & levies','SSNIT contributions','Rate history']} value={tab} onChange={v=>{setTab(v);book.select(null);}}/>
    <MutationNotice mutation={book.mutation}/>
    <div className="accounting-toolbar"><Field name="rate_date" label="Rates effective on" type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></div>
    <div className="accounting-rate-cards">{(tab==='SSNIT contributions'?['SSNIT_EMPLOYEE','SSNIT_EMPLOYER']:['VAT','NHIL','GETFUND']).map(category=><Card key={category} title={category.replaceAll('_',' ')}>{!book.loaded?<p>Rate unavailable</p>:active.filter(r=>r.category===category).length?active.filter(r=>r.category===category).map(r=><p key={r.id}><strong className="accounting-rate">{r.rate}%</strong><br/>{String(r.applies_to||'').replaceAll('_',' ')} · From {r.effective_from}</p>):<p>No approved rate for this date.</p>}</Card>)}</div>
    {tab!=='Rate history'&&<Calculator key={tab} ssnit={tab==='SSNIT contributions'}/>}
    {role!=='auditor'&&<RateForm book={book} accounts={accounts} tab={tab}/>}
    {book.selected&&<Card title={`Rate review · ${book.selected.name}`}><p>{book.selected.category} · {book.selected.rate}% · {book.selected.effective_from} to {book.selected.effective_to||'Open-ended'}</p><p>{book.selected.reason}</p><WorkflowActions resource="tax-settings" record={book.selected} mutation={book.mutation} role={role}/></Card>}
    <Card title={tab==='Rate history'?'Rate versions and approval history':'Configured rates'}><LoadState state={book} label="Tax settings"/>{book.loaded&&<Table columns={[{key:'name'},{key:'category'},{key:'rate',label:'Rate (%)'},{key:'applies_to'},{key:'effective_from'},{key:'effective_to'},{key:'status'}]} rows={visible} onSelect={book.select}/>}</Card>
    <p className="accounting-muted">Verify applicable rates and tax treatment with <a href="https://gra.gov.gh/domestic-tax/tax-types/vat/" target="_blank" rel="noreferrer">GRA VAT guidance</a> and <a href="https://www.ssnit.org.gh/faqs/" target="_blank" rel="noreferrer">SSNIT guidance</a>. This workspace does not file returns or certify a GRA tax invoice.</p>
  </>;
}
