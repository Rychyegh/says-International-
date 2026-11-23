import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { confirmedSavedRemark, findReportRemark, reportRemarkPayload } from '../../lib/terminalReportRemarks';
import './TerminalReportRemarks.css';

export default function TerminalReportRemarks({ reports, scope, canReview=false, onRecords }) {
  const [studentId,setStudentId]=useState(reports[0]?.student_id || '');
  const [records,setRecords]=useState([]),[drafts,setDrafts]=useState({teacher:'',head:''});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const dirty=useRef({teacher:false,head:false}), draftScope=useRef('');
  const lock=useRef(false), callback=useRef(onRecords);callback.current=onRecords;
  const signature=reports.map(report=>report.student_id).join('|');
  const period=`${scope.academic_year}|${scope.term}|${scope.class_level}|${scope.sub_class || ''}`;
  const report=reports.find(item=>String(item.student_id)===String(studentId)) || reports[0];
  const currentId=report?.student_id;
  const load=async()=>{const rows=await api.getTerminalReportRemarks();setRecords(rows);callback.current?.(rows);return rows;};
  useEffect(()=>{
    let cancelled=false;setLoading(true);setError('');setNotice('');
    api.getTerminalReportRemarks().then(rows=>{if(!cancelled){setRecords(rows);callback.current?.(rows);}}).catch(err=>{if(!cancelled)setError(err.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[period,signature]);
  useEffect(()=>{
    const identity=`${currentId}|${period}`;
    if(draftScope.current!==identity){dirty.current={teacher:false,head:false};draftScope.current=identity;}
    setDrafts(current=>Object.fromEntries(['teacher','head'].map(kind=>[kind,dirty.current[kind]?current[kind]:(findReportRemark(records,currentId,kind,scope)?.comment || report?.[kind==='teacher'?'teacher_comment':'head_comment'] || '')])));
  },[records,currentId,period]);

  const save=async kind=>{
    if(lock.current || !report)return;lock.current=true;setBusy(true);setError('');setNotice('');
    try {
      const payload=reportRemarkPayload(report,scope,kind,drafts[kind],findReportRemark(records,currentId,kind,scope));
      await api.saveTerminalReportRemark(currentId,payload);
      const rows=await api.getTerminalReportRemarks();const saved=confirmedSavedRemark(rows,report,scope,payload);
      dirty.current[kind]=false;setRecords(rows);callback.current?.(rows);
      setNotice(String(saved.status).toLowerCase()==='approved'?'Remark saved and approved for the report card.':'Remark saved for headteacher review. It will appear on the report card after approval.');
    } catch(err){setError(err.message);}finally{lock.current=false;setBusy(false);}
  };
  const approve=async kind=>{
    if(lock.current)return;const record=findReportRemark(records,currentId,kind,scope);
    if(!record?.id || !Number.isInteger(record.version) || record.version<1)return;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try {
      await api.approveTerminalReportRemark(record.id,{expected_version:record.version,reason:'Approve end-of-term report remark'});
      const rows=await api.getTerminalReportRemarks();const saved=findReportRemark(rows,currentId,kind,scope);
      if(saved?.id!==record.id || String(saved.status).toLowerCase()!=='approved' || saved.version<=record.version)throw new Error('Approval was not confirmed by the saved remark. Refresh remarks before retrying.');
      setRecords(rows);callback.current?.(rows);setNotice('Remark approved and added to the report card.');
    } catch(err){setError(err.message);}finally{lock.current=false;setBusy(false);}
  };
  return <section className="terminal-remark-editor no-print" aria-label="Report card remarks">
    <header><div><h3>{canReview?'Review report-card remarks':"Class teacher's report-card remark"}</h3><p>{report?.student_name} · {scope.academic_year} · {scope.term}</p></div><button type="button" disabled={busy || loading} onClick={async()=>{setError('');setLoading(true);try{await load();}catch(err){setError(err.message);}finally{setLoading(false);}}}>Refresh remarks</button></header>
    {reports.length>1 && <label>Student<select aria-label="Remark student" disabled={busy || loading} value={currentId} onChange={event=>setStudentId(event.target.value)}>{reports.map(item=><option key={item.student_id} value={item.student_id}>{item.student_name || item.student_id}</option>)}</select></label>}
    {loading && <p role="status">Loading saved remarks…</p>}
    {(['teacher',...(canReview?['head']:[])]).map(kind=>{
      const saved=findReportRemark(records,currentId,kind,scope),label=kind==='teacher'?"Class teacher's remarks":"Headteacher's remarks";
      const editable=!canReview || kind==='head';const changed=drafts[kind].trim()!==String(saved?.comment || '').trim();
      return <div className="terminal-remark-field" key={kind}><label>{label}<textarea aria-label={label} rows={3} maxLength={4000} placeholder={editable?'Type the remark to appear on this student’s report card…':'No class teacher remark has been submitted yet.'} readOnly={!editable} disabled={loading || busy} value={drafts[kind]} onChange={event=>{dirty.current[kind]=true;setDrafts(current=>({...current,[kind]:event.target.value}));}}/></label><div className="terminal-remark-actions"><small>{saved?`Status: ${saved.status || 'Saved'}`:'No saved remark'}{editable?` · ${drafts[kind].length}/4000`:''}</small>{editable && <button type="button" disabled={loading || busy || !drafts[kind].trim() || !changed || (Boolean(error) && !records.length)} onClick={()=>save(kind)}>{busy?'Saving…':'Save remark'}</button>}{canReview && saved?.id && String(saved.status).toLowerCase()!=='approved' && <button type="button" disabled={loading || busy || changed} onClick={()=>approve(kind)}>Approve {kind==='teacher'?'teacher':'headteacher'} remark</button>}</div></div>;
    })}
    {!canReview && <p className="terminal-remark-hint">The headteacher reviews this remark before it appears on the printed report. Headteacher remarks are entered in Administration → Academics → Assessment Reports.</p>}
    {error && <p role="alert" className="terminal-remark-error">{error}</p>}{notice && <p role="status" className="terminal-remark-success">{notice}</p>}
  </section>;
}
