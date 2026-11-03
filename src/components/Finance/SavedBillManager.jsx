import { savedBillItems } from '../../lib/savedBillItems';
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Pencil, RefreshCw, Search, X } from 'lucide-react';
import ViewportModal from '../Modal/ViewportModal';
import { usePortalData } from '../../data/PortalStore';
import { money } from '../../lib/accountingRules';
import BillItemEditor from './BillItemEditor';
import './SavedBillManager.css';

export default function SavedBillManager({ onClose, onPrepareBill }) {
  const { studentFees = [], refreshAccounts, isRefreshingBackend, isLoadingBackend, syncErrors = {}, resourceStatus = {} } = usePortalData();
  const [search, setSearch] = useState(''), [classLevel, setClassLevel] = useState(''), [editing, setEditing] = useState(null), [notice, setNotice] = useState('');
  const blocked = isLoadingBackend || isRefreshingBackend || resourceStatus.feesRes === 'loading' || Boolean(syncErrors.feesRes || syncErrors.connection);
  const rows = studentFees.filter(bill => (!classLevel || bill.classLevel === classLevel) && `${bill.studentName} ${bill.studentId} ${bill.billId || bill.id}`.toLowerCase().includes(search.toLowerCase()));
  return <ViewportModal className="bill-manager-overlay" onClose={onClose} aria-labelledby="bill-manager-title">
    <section className="bill-manager">
      <header className="bm-header"><div><span className="bm-eyebrow">STUDENT BILLING</span><h2 id="bill-manager-title">{editing ? 'Edit student bill' : 'Manage saved bills'}</h2><p>{editing ? 'Review the fees, make your changes, then save.' : 'Find a student and click Edit bill to update their fees.'}</p></div><button type="button" className="bm-icon" aria-label="Close bill manager" onClick={onClose}><X size={19}/></button></header>
      <div className="bm-body">
        <div className="bm-steps"><span className={!editing ? 'active' : ''}>1 <b>Find bill</b></span><span className={editing ? 'active' : ''}>2 <b>Edit fees / add services</b></span><span>3 <b>Save changes</b></span></div>
        {notice && <p className="bm-success" role="status"><CheckCircle2 size={17}/>{notice}</p>}
        {editing ? <><button type="button" className="bm-back" onClick={() => setEditing(null)}><ArrowLeft size={15}/> Back to saved bills</button><div className="bm-student"><div><strong>{editing.studentName}</strong><span>{editing.studentId}</span></div><span>{editing.classLevel} · {editing.academicYear} · {editing.term}</span></div>{!savedBillItems(editing).length && <div className="be-add"><button type="button" disabled={isRefreshingBackend} onClick={async () => {try {await refreshAccounts();setEditing(null);setNotice('Records refreshed. Select the student again to load the latest bill.');} catch(error) {setNotice(error.message);}}}><RefreshCw size={14}/> Refresh bill records</button>{onPrepareBill && Number(editing.billedAmount || 0) === 0 && Number(editing.paidAmount || 0) === 0 && <button type="button" onClick={() => onPrepareBill(editing)}>Prepare compulsory bill</button>}</div>}<BillItemEditor key={`${editing.id}:${editing.version}`} bill={editing} onSaved={async () => {await refreshAccounts();setEditing(null);setNotice('Bill saved. The latest fees and balance have been loaded.');}}/></> : <>
          <div className="bm-filters"><label className="bm-search"><Search size={17}/><input aria-label="Find student or bill" placeholder="Search student name, ID or bill number…" value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label="Filter class" value={classLevel} onChange={e => setClassLevel(e.target.value)}><option value="">All classes</option>{[...new Set(studentFees.map(b=>b.classLevel).filter(Boolean))].sort().map(c=><option key={c}>{c}</option>)}</select><button type="button" onClick={() => refreshAccounts()} disabled={isRefreshingBackend}><RefreshCw size={14}/>Refresh</button></div>
          <p className="bm-hint">Compulsory fees are billed first. Add bus, feeding or another optional service to a student's existing bill only when requested.</p>
          {blocked && <p role="alert" className="bm-warning">{syncErrors.feesRes || syncErrors.connection || 'Loading saved bills…'} Editing is available once the saved records are verified.</p>}
          <div className="bm-table-scroll"><table><thead><tr><th>Student</th><th>Class / period</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Action</th></tr></thead><tbody>{rows.map(bill=><tr key={bill.id}><td><strong>{bill.studentName || 'Unnamed student'}</strong><small>{bill.studentId}</small></td><td>{bill.classLevel}<small>{bill.academicYear} · {bill.term}</small></td><td>{money(bill.billedAmount)}</td><td>{money(bill.paidAmount)}</td><td>{money(bill.balance)}</td><td><button className="bm-edit" type="button" disabled={blocked} onClick={() => {setEditing(bill);setNotice('');}} aria-label={`Edit bill for ${bill.studentName}`}><Pencil size={13}/>{savedBillItems(bill).length ? 'Edit bill' : 'View account'}</button></td></tr>)}</tbody></table></div>
          {!rows.length && <p className="bm-empty">No saved bills match your search. Prepare and post a compulsory bill first if this student has no saved invoice.</p>}
          <p className="bm-record-count">{rows.length} saved bill{rows.length === 1 ? '' : 's'}</p>
        </>}
      </div>
    </section>
  </ViewportModal>;
}
