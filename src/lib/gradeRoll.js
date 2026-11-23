import { reportClass } from './terminalReportRecords.js';
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const key = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const term = value => key(value).replace(/^(1st|2nd|3rd)term$/,(_,n)=>`term${n[0]}`);

export function findGradeEntry(entries, scope) {
  return entries.filter(entry=>{
    if (scope.subject && scope.subject!=='All Subjects' && key(entry.subject)!==key(scope.subject)) return false;
    if (term(entry.term)!==term(scope.term) || key(entry.year || entry.academicYear || entry.academic_year)!==key(scope.year)) return false;
    if (entry.classLevel && key(reportClass(entry.classLevel).level)!==key(reportClass(scope.classLevel).level)) return false;
    return true;
  }).sort((a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0))[0];
}
export function gradeMarks(entry, settings = {}) {
  if (!entry) return {classScore:null,examScore:null,totalScore:null,hasClass:false,hasExam:false,hasScore:false};
  const classWeight=number(settings.classTestWeight), examWeight=number(settings.examWeight);
  let classScore=number(entry.classScoreConverted ?? entry.classScore);
  if (classScore===null && number(entry.rawClassScore)!==null && classWeight!==null) classScore=Number(entry.rawClassScore)*classWeight/100;
  let examScore=number(entry.examScoreConverted);
  if (examScore===null && number(entry.rawExamScore)!==null && examWeight!==null) examScore=Number(entry.rawExamScore)*examWeight/100;
  if (examScore===null && number(entry.rawExamScore)===null) examScore=number(entry.examScore);
  if (entry.hasClassScore===false) classScore=null;
  if (entry.hasExamScore===false) examScore=null;
  const savedTotal=number(entry.score ?? entry.total_score);
  const publishedTotal=savedTotal!==null && ['approved','published'].includes(String(entry.status || '').trim().toLowerCase());
  const totalScore=publishedTotal?savedTotal:classScore!==null && examScore!==null ? (savedTotal ?? Number((classScore+examScore).toFixed(2))) : null;
  return {classScore,examScore,totalScore,hasClass:classScore!==null,hasExam:examScore!==null,hasScore:classScore!==null || examScore!==null || totalScore!==null};
}
export function gradeRollStats(rows, missing = 'N/A') {
  const values = field => rows.map(row=>number(row[field])).filter(value=>value!==null);
  const average = field => {const data=values(field);return data.length?(data.reduce((sum,n)=>sum+n,0)/data.length).toFixed(1):missing;};
  const totals=values('totalScore');
  return {totalCount:rows.length,scoredCount:rows.filter(row=>row.hasScore).length,avgClass:average('classScore'),avgExam:average('examScore'),avgTotal:average('totalScore'),topScore:totals.length?Math.max(...totals).toFixed(1):missing};
}
