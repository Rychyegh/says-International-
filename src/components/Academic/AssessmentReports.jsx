import React, { useState } from 'react';
import { api } from '../../services/api';
import { usePortalData } from '../../data/PortalStore';
import { PrintDocument, printDocument, Table } from '../Finance/AccountingUI';

export default function AssessmentReports({ title }) {
  const { onboardedStudents = [] } = usePortalData();
  const [scope, setScope] = useState({ academic_year:'', term:'', class_level:'', student_id:'', subject:'' });
  const [report, setReport] = useState(null), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const individual = /Individual/i.test(title);
  const subject = /Subject/i.test(title) && !/Consolidated/i.test(title);
  const type = individual ? (/year Group/i.test(title) ? 'individual_year_group' : 'individual') : /Consolidated/i.test(title) ? 'consolidated' : subject ? 'subject' : 'class';
  const change = (key,value) => { setScope(s => ({...s,[key]:value})); setReport(null); setError(''); };
  const content = report && <article><h2>{title}</h2><p>{scope.class_level} · {scope.academic_year} · {scope.term} · {scope.subject}</p>{report.reports.map((item,i) => <section key={item.student_id || i} style={{breakAfter:'page'}}><h3>{item.student_name || item.class_level || 'Assessment'}</h3><p>{item.student_id} · {item.class_level}</p><Table columns={[{key:'subject'},{key:'class_score'},{key:'exam_score'},{key:'total'},{key:'grade'},{key:'remark'}]} rows={item.rows || []}/>{item.teacher_comment && <p>Teacher: {item.teacher_comment}</p>}{item.head_comment && <p>Head: {item.head_comment}</p>}</section>)}{!report.reports.length && <p>No approved assessments match this selection.</p>}</article>;
  return <div style={{padding:20,color:'#172033',background:'white'}}><form onSubmit={async e => {e.preventDefault();setBusy(true);setReport(null);setError('');try {const response = await api.getAssessmentReport({...scope,report_type:type});const data=response.data || response;if (!Array.isArray(data.reports) || data.reports.some(item => !Array.isArray(item.rows))) throw new Error('The backend did not return assessment report rows.');setReport(data);}catch(err){setError(err.message);}finally{setBusy(false);}}}>
    <fieldset disabled={busy} className="accounting-toolbar">{['academic_year','term','class_level',...(subject?['subject']:[])].map(key => <label key={key}>{key.replaceAll('_',' ')}<input required value={scope[key]} onChange={e=>change(key,e.target.value)}/></label>)}{individual && <label>Student<select required value={scope.student_id} onChange={e=>change('student_id',e.target.value)}><option value="">Select student</option>{onboardedStudents.filter(s=>!scope.class_level || (s.level || s.classLevel)===scope.class_level).map(s=><option key={s.id || s.studentId} value={s.id || s.studentId}>{s.fullName || s.studentName || s.name}</option>)}</select></label>}<button disabled={busy}>{busy?'Loading…':'Preview report'}</button></fieldset>
  </form>{error && <p role="alert">{error}</p>}{report && <><button onClick={printDocument} disabled={!report.reports.length}>Print / Save as PDF</button>{content}<PrintDocument>{content}</PrintDocument></>}</div>;
}
