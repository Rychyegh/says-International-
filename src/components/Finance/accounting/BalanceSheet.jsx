import React, { useState } from 'react';
import { money, statementTotals } from '../../../lib/accountingRules';
import SchoolPrintHeader from '../../School/SchoolPrintHeader';
import { Card, Field, Metrics, Table, LoadState, MutationNotice, WorkflowActions, ExportButton, PrintDocument, printDocument, useBook, today } from '../AccountingUI';

const groups=[['asset','Assets'],['liability','Liabilities'],['equity','Equity & accumulated surplus']];
function StatementLayout({record,comparison}) {
  const totals=statementTotals(record?.lines),previous=statementTotals(comparison?.lines);
  const displayLines=[...(record?.lines||[]),...(record?comparison?.lines||[]:[]).filter(p=>!(record?.lines||[]).some(l=>l.account_code===p.account_code&&l.type===p.type)).map(p=>({...p,amount:0}))];
  return <div className="accounting-statement">
    <div className="accounting-statement-heading"><h2>Statement of financial position</h2><p>{record?`As at ${record.as_of} · ${record.reference||record.id} · ${record.status}`:'Choose a date to prepare a balance sheet'}<br/>Amounts in GHS</p></div>
    {groups.map(([type,label])=><section key={type}><h3>{label}</h3><table><thead><tr><th>Account</th><th>{record?.as_of||'Current date'}</th>{comparison&&<><th>{comparison.as_of}</th><th>Change</th></>}</tr></thead><tbody>{displayLines.filter(l=>l.type===type).map(l=>{const prior=comparison?.lines?.find(p=>p.account_code===l.account_code&&p.type===type);return <tr key={`${type}-${l.account_code}`}><td>{l.account_code} · {l.account_name}{l.classification&&<small className="accounting-muted"> · {l.classification.replaceAll('_',' ')}</small>}</td><td>{money(l.amount)}</td>{comparison&&<><td>{money(prior?.amount??0)}</td><td>{money(Number(l.amount)-Number(prior?.amount??0))}</td></>}</tr>;})}{!displayLines.some(l=>l.type===type)&&<tr><td colSpan={comparison?4:2} className="accounting-muted">{record?'No balances supplied for this group.':'Posted account balances will appear here.'}</td></tr>}</tbody><tfoot><tr><th>Total {label.toLowerCase()}</th><th>{totals?money(totals[type]):'—'}</th>{comparison&&<><th>{previous?money(previous[type]):'—'}</th><th>{totals&&previous?money(totals[type]-previous[type]):'—'}</th></>}</tr></tfoot></table></section>)}
    {totals&&<p className={totals.balanced?'accounting-notice':'accounting-error'}>{totals.balanced?'Balanced: assets equal liabilities plus equity.':`Out of balance by ${money(totals.asset-totals.liability-totals.equity)}. Resolve the ledger before submission.`}</p>}
    {record&&!totals&&<p className="accounting-error">The statement is incomplete. Valid asset, liability, and equity lines are needed.</p>}
  </div>;
}
export default function BalanceSheet({role}) {
  const book=useBook('statements'),[comparisonId,setComparisonId]=useState('');
  const record=book.selected,comparison=book.rows.find(r=>String(r.id)===comparisonId);
  const totals=statementTotals(record?.lines);
  return <>
    <MutationNotice mutation={book.mutation}/>
    <Card title="Prepare balance sheet" hint="Generate an immutable draft from posted account balances, then review assets, liabilities, and accumulated surplus before approval.">
      {role!=='auditor'&&<form onSubmit={e=>{e.preventDefault();book.mutation.save('statements',Object.fromEntries(new FormData(e.currentTarget)));}}><div className="accounting-grid"><Field name="as_of" label="As of date" type="date" defaultValue={today()}/><Field name="notes" label="Preparation notes" optional/><button className="primary" disabled={book.mutation.busy}>Generate draft from ledger</button></div></form>}
      <Metrics items={[["Total assets",totals?money(totals.asset):null],["Total liabilities",totals?money(totals.liability):null],["Net assets / equity",totals?money(totals.equity):null]]}/>
    </Card>
    <div className="accounting-toolbar"><Field name="compare_statement" label="Compare with saved statement" options={book.rows.filter(r=>r.id!==record?.id).map(r=>({value:String(r.id),label:`${r.as_of} · ${r.reference||r.id} · ${r.status}`}))} optional value={comparisonId} onChange={e=>setComparisonId(e.target.value)}/><button disabled={!totals} onClick={printDocument}>Print statement / save PDF</button><ExportButton filename="balance-sheet.csv" columns={[{key:'account_code'},{key:'account_name'},{key:'type'},{key:'amount'}]} rows={totals?record.lines:[]}/></div>
    <Card><StatementLayout record={record} comparison={comparison}/>{record&&<WorkflowActions resource="statements" record={record} mutation={book.mutation} role={role} valid={totals?.balanced}/>}</Card>
    <Card title="Saved balance sheets"><LoadState state={book} label="Saved balance sheets"/>{book.loaded&&<Table columns={[{key:'reference'},{key:'as_of'},{key:'status'},{key:'prepared_by'},{key:'approved_by'}]} rows={book.rows} onSelect={r=>{book.select(r);setComparisonId('');}}/>}</Card>
    {record&&<PrintDocument><article><SchoolPrintHeader/><StatementLayout record={record} comparison={comparison}/></article></PrintDocument>}
  </>;
}
