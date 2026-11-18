import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, GraduationCap, BookOpen, Printer, Search } from 'lucide-react';
import { api } from '../../services/api';
import { usePortalData } from '../../data/PortalStore';
import { PrintDocument, printDocument, Table } from '../Finance/AccountingUI';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import { catalogNames } from '../../lib/catalogNames';
import { loadClassTerminalReports, reportClass } from '../../lib/terminalReportRecords';
import './AssessmentReports.css';

const unique = values => [...new Set(values.filter(Boolean))];
export default function AssessmentReports({ title }) {
  const { onboardedStudents = [], academicSettings = {}, classLevels = [], subjects = [], results = [] } = usePortalData();
  const [scope, setScope] = useState({ academic_year:academicSettings.academicYear || '', term:academicSettings.academicTerm || '', class_level:'', student_id:'', subject:'' });
  const [report, setReport] = useState(null), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const lock = useRef(false);
  const touched = useRef(new Set());
  useEffect(()=>{setScope(s=>({...s,
    academic_year:touched.current.has('academic_year')?s.academic_year:(academicSettings.academicYear || academicSettings.academic_year || s.academic_year),
    term:touched.current.has('term')?s.term:(academicSettings.academicTerm || academicSettings.academic_term || s.term),
  }));},[academicSettings.academicYear,academicSettings.academic_year,academicSettings.academicTerm,academicSettings.academic_term]);
  const yearGroup = /year group/i.test(title);
  const individual = /Individual/i.test(title) && !yearGroup;
  const subject = /Subject/i.test(title) && !/Consolidated/i.test(title);
  const type = individual ? 'individual' : yearGroup ? 'class' : /Consolidated/i.test(title) ? 'consolidated' : subject ? 'subject' : 'class';
  const years = unique([academicSettings.academicYear || academicSettings.academic_year,...results.map(r=>r.year || r.academic_year)]).sort().reverse();
  const terms = unique([academicSettings.academicTerm || academicSettings.academic_term,'Term 1','Term 2','Term 3',...results.map(r=>r.term)]);
  const classes = unique([...catalogNames(classLevels),...onboardedStudents.map(s=>s.level || s.classLevel),...results.map(r=>r.classLevel)]);
  const subjectOptions = unique([...catalogNames(subjects),...results.map(r=>r.subject)]);
  const students = onboardedStudents.filter(s=>!scope.class_level || reportClass(s.level || s.classLevel).level===reportClass(scope.class_level).level);
  const change = (field,value) => { touched.current.add(field); setScope(s => ({...s,[field]:value,...(field==='class_level'?{student_id:''}:{})})); setReport(null); setError(''); };
  const submit = async event => {
    event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setReport(null);setError('');
    try {
      const response = type==='class'
        ? await loadClassTerminalReports({api,scope,students:onboardedStudents,settings:academicSettings})
        : await api.getAssessmentReport({...scope,report_type:type});
      const data=response.data || response;
      if (!Array.isArray(data.reports) || data.reports.some(item=>!item || !Array.isArray(item.rows))) throw new Error('The backend did not return assessment report rows.');
      setReport(data);
    } catch(err) {setError(err.message);} finally {lock.current=false;setBusy(false);}
  };
  const content = report && <article className="assessment-report-output">{report.reports.map((item,i) => <section key={item.student_id || i} className="assessment-report-sheet"><SchoolPrintHeader /><h2>{title.replace(/^Print /,'')}</h2><p>{scope.class_level} · {scope.academic_year} · {scope.term}{scope.subject?` · ${scope.subject}`:''}</p><h3>{item.student_name || item.class_level || 'Assessment'}</h3><p>{item.student_code || item.student_id} · {item.sub_class || item.class_level}</p><Table columns={[{key:'subject'},{key:'class_score'},{key:'exam_score'},{key:'total'},{key:'grade'},{key:'remark'}]} rows={item.rows || []}/>{item.teacher_comment && <p>Teacher: {item.teacher_comment}</p>}{item.head_comment && <p>Head: {item.head_comment}</p>}</section>)}</article>;
  return <div className="assessment-report-dialog">
    <div className="assessment-report-intro"><span className="assessment-report-icon"><GraduationCap size={24}/></span><div><span className="assessment-report-eyebrow">ACADEMIC REPORTS</span><h2>Prepare your assessment report</h2><p>Choose the academic period and class to preview approved results.</p></div></div>
    <form onSubmit={submit}><fieldset disabled={busy} className="assessment-report-fields">
      <label><span><CalendarDays size={15}/>Academic year</span><select aria-label="Academic year" required value={scope.academic_year} onChange={e=>change('academic_year',e.target.value)}><option value="">Select academic year</option>{years.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span><CalendarDays size={15}/>Term</span><select aria-label="Term" required value={scope.term} onChange={e=>change('term',e.target.value)}><option value="">Select term</option>{terms.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span><GraduationCap size={15}/>Class level</span><select aria-label="Class level" required value={scope.class_level} onChange={e=>change('class_level',e.target.value)}><option value="">Select class level</option>{classes.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span><BookOpen size={15}/>Subject</span><select aria-label="Subject" required={subject} value={scope.subject} onChange={e=>change('subject',e.target.value)}><option value="">{subject?'Select subject':'All subjects'}</option>{subjectOptions.map(x=><option key={x}>{x}</option>)}</select></label>
      {individual && <label className="assessment-report-student"><span>Student</span><select aria-label="Student" required value={scope.student_id} onChange={e=>change('student_id',e.target.value)}><option value="">Select student</option>{students.map(s=><option key={s.id || s.studentId} value={s.id || s.studentId}>{s.fullName || s.studentName || s.name}</option>)}</select></label>}
      <div className="assessment-report-actions"><span>Only approved results appear on reports.</span><button className="assessment-preview-button" disabled={busy}><Search size={16}/>{busy?'Loading results…':'Preview report'}</button></div>
    </fieldset></form>
    {error && <p role="alert" className="assessment-report-error">{error}</p>}
    {report ? <><div className="assessment-report-result-toolbar"><strong>{report.reports.length} report{report.reports.length===1?'':'s'} ready</strong><button disabled={!report.reports.length} onClick={printDocument}><Printer size={16}/> Print / Save PDF</button></div>{report.reports.length?content:<p className="assessment-report-empty">No approved assessments match this selection.</p>}<PrintDocument>{content}</PrintDocument></> : !error && <div className="assessment-report-placeholder"><BookOpen size={28}/><strong>Your report preview will appear here</strong><span>Select your filters above to get started.</span></div>}
  </div>;
}
