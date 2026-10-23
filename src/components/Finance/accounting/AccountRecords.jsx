import React, { useState } from 'react';
import { usePortalData } from '../../../data/PortalStore';
import { money, validateJournal } from '../../../lib/accountingRules';
import { Field, Card, Tabs, Metrics, Table, LoadState, MutationNotice, WorkflowActions, ExportButton, useBook, useList, useReport, accountOptions, amountColumn, today } from '../AccountingUI';

function JournalEditor({ book, accounts }) {
  const initial = ['draft', 'returned'].includes(book.selected?.status) ? book.selected : null;
  return <JournalForm key={`${initial?.id || 'new'}-${initial?.version || 0}`} initial={initial} book={book} accounts={accounts} />;
}
function JournalForm({ initial, book, accounts }) {
  const [lines, setLines] = useState(initial?.lines || [{ account_id:'', debit:'', credit:'' }, { account_id:'', debit:'', credit:'' }]);
  const [error, setError] = useState('');
  const edit = (i, key, value) => setLines(rows => rows.map((r,j) => i === j ? {...r,[key]:value} : r));
  const debit = lines.reduce((s,l) => s + Math.round(Number(l.debit || 0)*100),0)/100;
  const credit = lines.reduce((s,l) => s + Math.round(Number(l.credit || 0)*100),0)/100;
  return <Card title={initial ? `Edit journal · ${initial.reference || initial.id}` : 'Prepare journal / opening balances'} hint="Enter income, expenses, opening balances, or an adjustment. The ledger changes only after approval and posting.">
    <form onSubmit={e => {
      e.preventDefault(); setError('');
      try {
        validateJournal(lines); const values = Object.fromEntries(new FormData(e.currentTarget));
        const payload = {date:values.date, description:values.description, kind:values.kind, supporting_reference:values.supporting_reference, lines:lines.map(l=>({account_id:l.account_id,debit:Number(l.debit),credit:Number(l.credit)}))};
        book.mutation.save(initial ? `journals/${encodeURIComponent(initial.id)}/revisions` : 'journals', {...payload,...(initial?{expected_version:initial.version}:{})});
      } catch (err) { setError(err.message); }
    }}>
      <div className="accounting-grid"><Field name="date" type="date" defaultValue={initial?.date || today()}/><Field name="description" defaultValue={initial?.description}/><Field name="kind" options={['income','expense','adjustment','opening_balance']} defaultValue={initial?.kind}/><Field name="supporting_reference" label="Supporting document reference" defaultValue={initial?.supporting_reference}/></div>
      <LoadState state={accounts} label="Posting accounts"/>
      {lines.map((line,i)=><div className="accounting-journal-line" key={i}><span>{i+1}</span><Field name={`account-${i}`} label={`Account ${i+1}`} options={accountOptions(accounts.rows)} value={line.account_id} onChange={e=>edit(i,'account_id',e.target.value)}/><Field name={`debit-${i}`} label="Debit" type="number" min="0" step="0.01" optional value={line.debit} onChange={e=>edit(i,'debit',e.target.value)}/><Field name={`credit-${i}`} label="Credit" type="number" min="0" step="0.01" optional value={line.credit} onChange={e=>edit(i,'credit',e.target.value)}/><button type="button" disabled={lines.length<=2} onClick={()=>setLines(rows=>rows.filter((_,j)=>i!==j))}>Remove line</button></div>)}
      <Metrics items={[["Total debit",money(debit)],["Total credit",money(credit)],["Difference",money(debit-credit),debit===credit&&debit>0?'Ready to validate':'Debits must equal credits']]}/>
      {error&&<p role="alert" className="accounting-error">{error}</p>}
      <div className="accounting-toolbar"><button type="button" onClick={()=>setLines(rows=>[...rows,{account_id:'',debit:'',credit:''}])}>Add journal line</button><button className="primary" disabled={book.mutation.busy||!accounts.loaded}>Save journal draft</button>{!accounts.loaded&&<span className="accounting-muted">Connect posting accounts to save.</span>}</div>
    </form>
  </Card>;
}
function LedgerReport({ accounts, trial }) {
  const { onboardedStudents = [] } = usePortalData();
  const report = useReport();
  const [account, setAccount] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(today());
  const change = (setter,value) => { setter(value); report.clear(); };
  const columns = trial ? [{key:'account_code'},{key:'account_name'},amountColumn('debit'),amountColumn('credit')] : [{key:'student_name',label:'Student name'},{key:'payer_name',label:'Name of payer'},{key:'reference'},{key:'description'},amountColumn('amount'),{key:'date'},{key:'direction',label:'Dr/Cr'},amountColumn('running_balance')];
  const rows = Array.isArray(report.data?.lines) ? report.data.lines.map(line => {
    if (trial) return line;
    const debit = Number(line.debit || 0), credit = Number(line.credit || 0);
    const mixed = debit > 0 && credit > 0;
    const studentKey = line.student_id || line.studentId || line.student_code || line.payment?.student_id || line.receipt?.student_id;
    const student = studentKey ? onboardedStudents.find(row => [row.id, row.studentId, row.student_code].filter(Boolean).some(value => String(value) === String(studentKey))) : null;
    line = { ...line, student_name: line.student_name || line.studentName || line.student?.full_name || line.payment?.student_name || line.receipt?.student_name || student?.fullName || 'Not supplied' };
    return { ...line, payer_name: line.payer_name || line.payerName || line.paid_by_name || line.payer?.full_name || line.payer?.name || 'Not supplied', amount: mixed ? null : debit > 0 ? debit : credit > 0 ? credit : line.amount ?? 0, direction: mixed ? 'Dr & Cr' : debit > 0 ? 'Dr' : credit > 0 ? 'Cr' : line.direction || '—' };
  }) : null;
  const valid = Array.isArray(rows);
  return <Card title={trial?'Trial balance':'General ledger'} hint={trial?'Review debit and credit balances across all posted accounts at a reporting date.':'Choose one account to follow posted entries and the running balance.'}>
    <form onSubmit={e=>{e.preventDefault();report.load(trial?'reports/trial-balance':`accounts/${encodeURIComponent(account)}/ledger`,trial?{as_of:to}:{from,to});}}>
      <div className="accounting-grid">{!trial&&<><Field name="ledger_account" label="Ledger account" options={accountOptions(accounts.rows)} value={account} onChange={e=>change(setAccount,e.target.value)}/><Field name="from" label="From date" type="date" max={to} optional value={from} onChange={e=>change(setFrom,e.target.value)}/></>}<Field name="to" label={trial?'Reporting date':'To date'} type="date" min={from} value={to} onChange={e=>change(setTo,e.target.value)}/><button className="primary" disabled={report.busy}>{report.busy?'Loading report…':trial?'Load trial balance':'Load ledger'}</button></div>
    </form>
    {report.error&&<p role="alert" className="accounting-error">{report.error}</p>}
    {report.data&&!valid&&<p role="alert">The report did not include its ledger lines.</p>}
    <Metrics items={trial?[["Total debits",report.data?.total_debit!=null?money(report.data.total_debit):null],["Total credits",report.data?.total_credit!=null?money(report.data.total_credit):null],["Difference",report.data?.total_debit!=null&&report.data?.total_credit!=null?money(report.data.total_debit-report.data.total_credit):null]]:[["Opening balance",report.data?.opening_balance!=null?money(report.data.opening_balance):null],["Closing balance",report.data?.closing_balance!=null?money(report.data.closing_balance):null],["Entries",valid?rows.length:null]]}/>
    <ExportButton filename={trial?'trial-balance.csv':'general-ledger.csv'} columns={columns} rows={valid?rows:[]}/>
    <Table columns={columns} rows={valid?rows:[]} empty={valid?'No posted entries in this reporting period.':'Choose the reporting scope and load the report.'}/>
  </Card>;
}
export default function AccountRecords({ role }) {
  const book = useBook('journals'), accounts = useList('accounts');
  const [tab,setTab] = useState('Journal entries'),[status,setStatus]=useState(''),[search,setSearch]=useState('');
  const visible=book.rows.filter(r=>(!status||r.status===status)&&`${r.reference} ${r.description}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <Metrics items={[["Draft journals",book.loaded?book.rows.filter(r=>['draft','returned'].includes(r.status)).length:null],["Awaiting approval",book.loaded?book.rows.filter(r=>r.status==='submitted').length:null],["Posted journals",book.loaded?book.rows.filter(r=>r.status==='posted').length:null]]}/>
    <Tabs options={['Journal entries','General ledger','Trial balance']} value={tab} onChange={setTab}/>
    <MutationNotice mutation={book.mutation}/>
    {tab==='Journal entries'?<>
      {role!=='auditor'&&<JournalEditor book={book} accounts={accounts}/>}
      {book.selected&&<Card title={`Journal detail · ${book.selected.reference||book.selected.id}`}><p>{book.selected.description}</p><Table columns={[{key:'account_id',label:'Account',render:l=>accounts.rows.find(a=>a.id===l.account_id)?.name||l.account_id},amountColumn('debit'),amountColumn('credit')]} rows={book.selected.lines||[]}/><WorkflowActions resource="journals" record={book.selected} mutation={book.mutation} role={role}/><button onClick={()=>book.select(null)}>Start a new journal</button></Card>}
      <Card title="Journal register"><div className="accounting-toolbar"><Field name="journal_search" label="Reference or description" optional value={search} onChange={e=>setSearch(e.target.value)}/><Field name="journal_status" label="Journal status" options={['draft','submitted','posted','returned','rejected','reversed']} optional value={status} onChange={e=>setStatus(e.target.value)}/><button onClick={book.reload}>Refresh journals</button></div><LoadState state={book} label="Journal register"/>{book.loaded&&<Table columns={[{key:'reference'},{key:'date'},{key:'description'},{key:'kind'},{key:'status'}]} rows={visible} onSelect={book.select} selectedId={book.selected?.id}/>}</Card>
    </>:<LedgerReport key={tab} accounts={accounts} trial={tab==='Trial balance'}/>}
  </>;
}
