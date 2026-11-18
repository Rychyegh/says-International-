import { normalizeAssessment } from './assessmentRules.js';
import { proficiencyGrade, proficiencyRemark } from './schoolGrading.js';

const text = value => String(value || '').trim();
const key = value => text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export function reportClass(value) {
  const names = {nursery:'Nursery',basic:'Basic',kindergarten:'Kindergarten',kg:'KG',shs:'SHS'};
  const label = text(value).replace(/\s+/g, ' ').replace(/^(nursery|basic|kindergarten|kg|shs)\s*(\d)/i,(_,prefix,digit)=>`${names[prefix.toLowerCase()]} ${digit}`);
  const match = label.match(/^(.*?\d)\s*([a-z])(?:\s*[-–].*)?$/i);
  return match ? { level: match[1].trim(), section: label } : { level: label, section: '' };
}
export function terminalReportScope(scope) {
  const cls = reportClass(scope.class_level);
  if (cls.section && scope.sub_class && key(cls.section)!==key(scope.sub_class)) throw new Error('Choose the subclass assigned to the selected class.');
  return { ...scope, class_level: cls.level, sub_class: scope.sub_class || cls.section, report_type: 'class', preview_creche: String(Boolean(scope.preview_creche === true || scope.preview_creche === 'true')) };
}
const termKey = value => key(value).replace(/^(1st|2nd|3rd)term$/,(_,n)=>`term${n[0]}`).replace(/^term0*/, 'term');
const ids = row => [row.id,row.studentId,row.student_id,row.studentUuid,row.student_uuid,row.studentCode,row.student_code,row.student_id_code].filter(Boolean).map(String);

export function terminalReportsFromRecords({ records, students, scope, settings = {} }) {
  const filter = terminalReportScope(scope);
  const reports = new Map();
  for (const raw of records) {
    const entry = normalizeAssessment(raw);
    if (!['approved','published'].includes(text(entry.status).toLowerCase())) continue;
    if (scope.subject && key(entry.subject) !== key(scope.subject)) continue;
    if (key(entry.year) !== key(filter.academic_year) || termKey(entry.term) !== termKey(filter.term)) continue;
    const identity = [entry.studentId,entry.studentCode,entry.studentUuid].filter(Boolean).map(String);
    const student = students.find(s=>ids(s).some(id=>identity.includes(id)));
    // Only known learners in the teacher's supplied roster may enter the report.
    if (!student) continue;
    const cls = reportClass(entry.classLevel || student.level || student.classLevel);
    const section = entry.subClass || cls.section || student.subClass || student.subClassLevel || student.classSection || reportClass(student.level || student.classLevel).section;
    if (key(cls.level) !== key(filter.class_level)) continue;
    if (filter.sub_class && key(section) !== key(filter.sub_class)) continue;
    if (filter.department && key(student.department || student.department_name || '') !== key(filter.department)) {
      const base = key(filter.class_level);
      const inferred = /^basic[123]$/.test(base)?'lowerprimary':/^basic[456]$/.test(base)?'upperprimary':/^basic[789]$/.test(base)?'juniorhigh':/^(nursery|kindergarten|kg|creche)/.test(base)?'preschool':/^shs/.test(base)?'seniorhigh':'';
      if (inferred !== key(filter.department)) continue;
    }
    if (filter.preview_creche === 'true' && key(filter.class_level) !== 'creche') continue;
    const studentId = student.id || student.studentUuid || student.studentId;
    if (!reports.has(studentId)) reports.set(studentId, {
      student_id:studentId, student_code:student.studentId || student.student_code || student.student_id_code,
      student_name:student.fullName || student.name || entry.studentName,
      class_level:cls.level, sub_class:section, date_of_birth:student.dateOfBirth || student.date_of_birth || student.dob,
      resumption_date:settings.resumptionDate, rows:[], summary:{}, teacher_comment:'', head_comment:'',
    });
    const report = reports.get(studentId);
    const row = { subject:entry.subject, subject_code:raw.subject_code || null, class_score:number(entry.classScore), exam_score:number(entry.examScoreConverted), total:number(entry.score), grade:entry.grade, remark:entry.remarks };
    // Never apply weights again to server-converted marks or invent a total.
    const existing = report.rows.findIndex(r=>key(r.subject)===key(row.subject));
    if (existing < 0) report.rows.push(row); else report.rows[existing]=row;
  }
  const result = [...reports.values()].sort((a,b)=>a.student_name.localeCompare(b.student_name));
  for (const report of result) {
    const totals = report.rows.map(r=>r.total).filter(n=>n!==null);
    const total = totals.reduce((sum,n)=>sum+n,0);
    report.summary = {subject_count:report.rows.length,total_score:totals.length?Number(total.toFixed(2)):null,average_score:totals.length?Number((total/totals.length).toFixed(2)):null,grade:totals.length?proficiencyGrade(total/totals.length):null};
  }
  // Cohort ranks need a server-calculated complete cohort; do not rank this local subset.
  return result;
}

export async function loadClassTerminalReports({ api, scope, students, settings }) {
  const filter = terminalReportScope(scope);
  try {
    const response = await api.getAssessmentReport(filter);
    const data = response.data || response;
    if (!Array.isArray(data.reports)) throw new Error('The server did not return saved terminal reports.');
    if (data.reports.length) return filter.subject ? {...data,reports:data.reports.map(report=>({...report,rows:(report.rows || []).filter(row=>key(row.subject)===key(filter.subject))})).filter(report=>report.rows.length)} : data;
  } catch(error) {
    // Permission/session/network failures must never be bypassed using another route.
    if (![404,405,422].includes(error.status)) throw error;
  }
  const query = {academic_year:filter.academic_year,term:filter.term,class_level:filter.class_level,...(filter.sub_class?{sub_class:filter.sub_class}:{})};
  const sources = await Promise.allSettled([api.getResults(query),api.getScoreSheetEntries(query)]);
  const failure = sources.find(r=>r.status==='rejected' && ![404,405].includes(r.reason.status));
  if (failure) throw failure.reason;
  if (sources.every(r=>r.status==='rejected')) throw new Error('The server could not load approved results or score sheets.');
  return { reports:terminalReportsFromRecords({records:sources.flatMap(r=>r.status==='fulfilled'?r.value:[]),students,scope:filter,settings}), source:'approved_records' };
}
