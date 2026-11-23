import TerminalReportRemarks from './TerminalReportRemarks';
import { mergeApprovedRemarks } from '../../lib/terminalReportRemarks';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { api } from '../../services/api';
import { usePortalData } from '../../data/PortalStore';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import './ClassTeacherReports.css';
import { validateTerminalReports } from '../../lib/terminalReports';
import { loadClassTerminalReports, reportClass } from '../../lib/terminalReportRecords';

const shown = value => value === null || value === undefined || value === '' ? '—' : value;

function ReportPaper({ report, scope }) {
  const summary = report.summary || {};
  return <article className="class-report-paper">
    <SchoolPrintHeader />
    <h2>OFFICIAL STUDENT END OF TERM REPORT</h2>
    <div className="class-report-details">
      <span><b>Student name:</b> {shown(report.student_name)}</span>
      <span><b>Student ID:</b> {report.student_code || report.student_id}</span>
      <span><b>Class:</b> {report.sub_class || scope.sub_class || report.class_level || scope.class_level}</span>
      <span><b>Academic year:</b> {scope.academic_year}</span>
      <span><b>Term:</b> {scope.term}</span>
      <span><b>Position:</b> {shown(report.class_position)}</span>
      <span><b>Date of birth:</b> {shown(report.date_of_birth)}</span>
      <span><b>Next term begins:</b> {shown(report.resumption_date)}</span>
    </div>
    <table><thead><tr>{['No. of subjects','Total score','Highest score','Lowest score','Average score','Grade'].map(x=><th key={x}>{x}</th>)}</tr></thead>
      <tbody><tr>{['subject_count','total_score','highest_score','lowest_score','average_score','grade'].map(x=><td key={x}>{shown(summary[x])}</td>)}</tr></tbody></table>
    <table><thead><tr>{['Subject code','Subject','Class score','Exam score','Total / 100','Grade','Comments'].map(x=><th key={x}>{x}</th>)}</tr></thead>
      <tbody>{report.rows.map((row,i)=><tr key={row.subject_code || `${row.subject}-${i}`}><td>{shown(row.subject_code)}</td><td>{shown(row.subject)}</td><td>{shown(row.class_score)}</td><td>{shown(row.exam_score)}</td><td>{shown(row.total)}</td><td>{shown(row.grade)}</td><td>{shown(row.remark)}</td></tr>)}</tbody></table>
    {!report.rows.length && <p>No approved subject scores for this period.</p>}
    <div className="class-report-comments"><section><b>Class teacher's remarks</b><p>{shown(report.teacher_comment)}</p></section><section><b>Headteacher's remarks</b><p>{shown(report.head_comment)}</p></section></div>
    <div className="class-report-chart" aria-label="Subject performance out of 100">
      {report.rows.filter(row=>row.total != null && row.total !== '' && Number.isFinite(Number(row.total)) && Number(row.total)>=0 && Number(row.total)<=100).map((row,i)=><div className="class-report-bar" key={i}><span>{row.subject}</span><div><i style={{width:`${Number(row.total)}%`}} /></div><b>{row.total}</b></div>)}
    </div>
  </article>;
}

export default function ClassTeacherReports({ classes = [], students = [] }) {
  const { academicSettings = {} } = usePortalData();
  const allowedClasses = [...new Set(classes.filter(Boolean))];
  const [scope,setScope] = useState({ department:'',class_level:allowedClasses[0] || '',sub_class:'',academic_year:academicSettings.academicYear || '',term:academicSettings.academicTerm || '',preview_creche:false });
  const [reports,setReports] = useState(null), [index,setIndex] = useState(0), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const allowedKey = JSON.stringify(allowedClasses);
  useEffect(()=>{setScope(current=>allowedClasses.includes(current.class_level)?current:{...current,class_level:allowedClasses[0] || '',sub_class:''});setReports(null);setIndex(0);},[allowedKey]);
  const remarkPeriod=JSON.stringify([scope.academic_year,scope.term,scope.class_level,scope.sub_class]);
  const activeRemarkPeriod=useRef(remarkPeriod);activeRemarkPeriod.current=remarkPeriod;
  const onRemarkRecords=records=>{if(activeRemarkPeriod.current===remarkPeriod)setReports(current=>mergeApprovedRemarks(current,records,scope));};
  const [printAll, setPrintAll] = useState(false);
  useEffect(() => () => document.body.classList.remove('printing-class-teacher-report'), []);
  const touched = useRef(new Set());
  useEffect(() => {
    setScope(current=>({...current,
      academic_year:touched.current.has('academic_year')?current.academic_year:(academicSettings.academicYear || academicSettings.academic_year || current.academic_year),
      term:touched.current.has('term')?current.term:(academicSettings.academicTerm || academicSettings.academic_term || current.term),
    }));
  }, [academicSettings.academicYear, academicSettings.academic_year, academicSettings.academicTerm, academicSettings.academic_term]);
  const lock = useRef(false);
  const selectedClass = reportClass(scope.class_level);
  const subclasses = selectedClass.section ? [selectedClass.section] : [...new Set([selectedClass.section, ...students.filter(s=>reportClass(s.level || s.classLevel || s.class).level.replace(/\s/g,'').toLowerCase() === selectedClass.level.replace(/\s/g,'').toLowerCase()).map(s=>s.subClass || s.subClassLevel || s.classSection || reportClass(s.level || s.classLevel).section)].filter(Boolean))];
  const change = (key,value) => {touched.current.add(key);setScope(s=>({...s,[key]:value,...(key==='class_level'?{sub_class:''}:{})}));setReports(null);setIndex(0);setError('');};
  const preview = async event => {
    event.preventDefault(); if(lock.current) return;
    lock.current=true; setBusy(true);setError('');setReports(null);setIndex(0);
    try {
      const response = await loadClassTerminalReports({api, scope, students, settings:academicSettings});
      setReports(validateTerminalReports(response.data || response));
    } catch(err) {setError(err.message || 'Reports could not be loaded.');}
    finally {lock.current=false;setBusy(false);}
  };
  const print = (all = false) => {
    if (!reports?.length) return;
    flushSync(() => setPrintAll(all));
    document.body.classList.add('printing-class-teacher-report');
    const cleanup = () => document.body.classList.remove('printing-class-teacher-report');
    window.addEventListener('afterprint',cleanup,{once:true});
    try {window.print();} catch(err) {cleanup();window.removeEventListener('afterprint',cleanup);setError(err.message);}
  };
  return <div className="class-teacher-reports">
    <div className="page-header"><h1 className="page-header__title">Individual terminal report by year group</h1><p className="page-header__subtitle">Select the academic period and preview your class reports.</p></div>
    <div className="class-report-workspace"><form className="panel class-report-filters" onSubmit={preview}><fieldset disabled={busy}>
      <legend>Select academic period</legend>
      <label>Department / Sub unit<select value={scope.department} onChange={e=>change('department',e.target.value)}><option value="">All assigned departments</option>{['Pre-school','Lower Primary','Upper Primary','Junior High','Senior High'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Select class<select required value={scope.class_level} onChange={e=>change('class_level',e.target.value)}><option value="">Select assigned class</option>{allowedClasses.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Select subclass<select value={scope.sub_class} onChange={e=>change('sub_class',e.target.value)}><option value="">All assigned subclasses</option>{subclasses.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Select year<input required placeholder="2026/2027" pattern="[0-9]{4}/[0-9]{4}" value={scope.academic_year} onChange={e=>change('academic_year',e.target.value)} /></label>
      <label>Select semester / term<select required value={scope.term} onChange={e=>change('term',e.target.value)}><option value="">Select term</option>{[...new Set([academicSettings.academicTerm,'Term 1','Term 2','Term 3'].filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="class-report-checkbox"><input type="checkbox" checked={scope.preview_creche} onChange={e=>change('preview_creche',e.target.checked)} />Preview Creche reports</label>
      <button type="submit" disabled={busy || !allowedClasses.length}>{busy?'Loading reports…':'Preview'}</button>
      {!allowedClasses.length && <p>No class is assigned to this account. Ask the administrator to update UAC.</p>}
    </fieldset></form>
    <section className="class-report-viewer"><div className="class-report-toolbar"><strong>Main Report</strong><button disabled={!reports?.length || index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><span>{reports?.length?`${index+1} / ${reports.length}`:'0 / 0'}</span><button disabled={!reports?.length || index===reports.length-1} onClick={()=>setIndex(i=>i+1)}>Next</button><button disabled={!reports?.length} onClick={()=>print(false)}>Print this report</button><button disabled={!reports?.length} onClick={()=>print(true)}>Print all reports</button></div>
      {error && <p role="alert" className="class-report-error">{error}</p>}
      {reports?.length ? <ReportPaper report={reports[index]} scope={scope} /> : <p className="class-report-empty">{busy?'Loading saved reports…':reports?'No approved reports match this class, subclass, year and term. Check that these match the submitted score sheet, then select Preview again.':'Choose the academic period, then select Preview.'}</p>}
      {reports?.length > 0 && <TerminalReportRemarks key={`${remarkPeriod}|${reports[index].student_id}`} reports={[reports[index]]} scope={scope} onRecords={onRemarkRecords} />}
    </section></div>
    {reports?.length > 0 && createPortal(
      <div className="class-report-print-root">
        {(printAll ? reports : [reports[index]]).map(report => <ReportPaper key={report.student_id} report={report} scope={scope} />)}
      </div>, document.body
    )}
  </div>;
}
