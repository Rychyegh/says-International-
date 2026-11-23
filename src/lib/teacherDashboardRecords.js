import { gradeMarks, findGradeEntry } from './gradeRoll.js';
import { proficiencyGrade } from './schoolGrading.js';
import { studentInAssignedClass } from './teacherClassAssignments.js';
const key=value=>String(value || '').trim().toLowerCase();
const identity=student=>[student.id,student.studentId,student.student_id,student.studentUuid,student.student_uuid,student.studentCode,student.student_code].filter(Boolean).map(key);
const overlaps=(left,right)=>left.some(value=>right.includes(value));
const finite=value=>value==null || value==='' || !Number.isFinite(Number(value))?null:Number(value);
const percentage=value=>{const n=finite(value);return n!==null && n>=0 && n<=100?n:null;};
const validGrade=value=>value!=null && !['','n/a','—','not available'].includes(key(value));

export function attendanceFromRecords(student, records, scope={}) {
  const aliases=identity(student), days=new Map();
  for (const record of records) {
    const ids=[record.student_id,record.studentId,record.student_uuid,record.student_code,record.student?.id].filter(Boolean).map(key);
    if (!overlaps(aliases,ids)) continue;
    if (record.academic_year && String(record.academic_year).replace(/\D/g,'')!==String(scope.year).replace(/\D/g,'')) continue;
    if (record.term && key(record.term).replace(/^([123])(?:st|nd|rd) term$/,'term $1')!==key(scope.term)) continue;
    const date=String(record.date || record.scanned_at || '').slice(0,10);
    const status=key(record.status || record.scan_type).replace(/[\s_-]/g,'');
    if (!date || !['present','late','checkin','checkout','absent','excused'].includes(status)) continue;
    const timestamp=String(record.updated_at || record.scanned_at || record.timestamp || record.created_at || `${date} ${record.time || ''}`);
    const previous=days.get(date);
    if (!previous || timestamp>previous.timestamp || (timestamp===previous.timestamp && ['present','absent','late','excused'].includes(status))) days.set(date,{status,timestamp});
  }
  const recorded=[...days.values()].filter(day=>day.status!=='excused');
  if (!recorded.length) return {value:null,note:'No attendance recorded for this period'};
  const present=recorded.filter(day=>day.status!=='absent').length;
  return {value:Number((present/recorded.length*100).toFixed(1)),note:`${present} attended / ${recorded.length} recorded days · ${scope.term || ''} ${scope.year || ''}`};
}
function subjectGrade(student,results,family,scope,settings) {
  const aliases=identity(student);
  const candidates=results.filter(result=>{
    const subject=key(result.subject);
    return ['approved','published'].includes(key(result.status)) &&
      overlaps(aliases,[result.studentId,result.student_id,result.studentUuid,result.studentCode,result.student_code].filter(Boolean).map(key)) &&
      (family==='math'?(subject.includes('math') || subject==='numeracy'):subject.includes('science'));
  });
  const entry=findGradeEntry(candidates,{...scope,subject:'All Subjects'});
  const marks=gradeMarks(entry,settings);
  return marks.totalScore===null?null:proficiencyGrade(marks.totalScore);
}
export function teacherDashboardRows({students=[],dashboardStudents=[],classes=[],results=[],attendance=[],scope={},settings={}}) {
  const roster=[...students];
  dashboardStudents.forEach(student=>{if(identity(student).length && !roster.some(row=>overlaps(identity(row),identity(student)))) roster.push(student);});
  return roster.map(student=>{
    const extra=dashboardStudents.find(row=>overlaps(identity(row),identity(student))) || {};
    const merged={...extra,...student};
    if (!merged.level && !merged.classLevel) merged.level=extra.class;
    if (!classes.some(cls=>studentInAssignedClass(merged,cls))) return null;
    const rate=attendanceFromRecords(merged,attendance,scope);
    const savedRate=[student.attendancePercent,student.attendance_percent,extra.attendancePercent,extra.attendance].map(percentage).find(value=>value!==null);
    const math=subjectGrade(merged,results,'math',{...scope,classLevel:merged.level || merged.classLevel},settings);
    const science=subjectGrade(merged,results,'science',{...scope,classLevel:merged.level || merged.classLevel},settings);
    return {id:student.studentId || student.id,name:student.fullName || student.name || extra.name || 'Student',class:merged.level || merged.classLevel,
      attendance:savedRate ?? rate.value ?? null,attendanceNote:savedRate!=null?'Saved school attendance percentage':rate.note,
      mathGrade:math ?? (validGrade(extra.mathGrade)?extra.mathGrade:'N/A'),sciGrade:science ?? (validGrade(extra.sciGrade)?extra.sciGrade:'N/A'),
      email:student.studentEmail || student.email || extra.email || '',status:student.status || extra.status || 'Enrolled'};
  }).filter(Boolean);
}
