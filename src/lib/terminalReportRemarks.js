import { reportClass } from './terminalReportRecords.js';
const key=value=>String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const termKey=value=>key(value).replace(/^(1st|2nd|3rd)term$/,(_,n)=>`term${n[0]}`);
export function extractReportRemarks(raw) {
  const data=raw?.data ?? raw;
  const rows=Array.isArray(data)?data:data?.remarks ?? data?.terminal_report_remarks;
  if (!Array.isArray(rows)) throw new Error('The server did not return saved report remarks.');
  return rows;
}
export function findReportRemark(records,studentId,kind,scope) {
  return records.filter(row=>String(row.student_id)===String(studentId) && row.kind===kind && key(row.academic_year)===key(scope.academic_year) && termKey(row.term)===termKey(scope.term))
    .sort((a,b)=>Number(b.version || 0)-Number(a.version || 0))[0] || null;
}
export function reportRemarkPayload(report,scope,kind,comment,record) {
  if (!report?.student_id || !['teacher','head'].includes(kind)) throw new Error('Select a saved student report.');
  const text=String(comment || '').trim();
  if (!text || text.length>4000) throw new Error('Enter a remark of 1–4000 characters.');
  const version=record?Number(record.version):0;
  if (!Number.isInteger(version) || version<0) throw new Error('The saved remark version is missing. Refresh remarks before editing.');
  if (!scope.academic_year || !scope.term) throw new Error('Select an academic year and term.');
  return {academic_year:scope.academic_year,term:scope.term,class_level:reportClass(report.class_level || scope.class_level).level,sub_class:report.sub_class || scope.sub_class || null,kind,comment:text,expected_version:version,reason:kind==='teacher'?"Class teacher's end-of-term report remark":"Headteacher's end-of-term report remark"};
}
export function confirmedSavedRemark(records,report,scope,payload) {
  const saved=findReportRemark(records,report.student_id,payload.kind,scope);
  if (!saved?.id || saved.comment!==payload.comment || !Number.isInteger(saved.version) || saved.version<=payload.expected_version) throw new Error('The server accepted the request but the saved remark could not be verified. Refresh remarks before retrying.');
  return saved;
}
export function mergeApprovedRemarks(reports,records,scope) {
  return reports?.map(report=>{
    const result={...report};
    for (const kind of ['teacher','head']) {
      const remark=findReportRemark(records,report.student_id,kind,scope);
      if (String(remark?.status).toLowerCase()==='approved') result[kind==='teacher'?'teacher_comment':'head_comment']=remark.comment;
    }
    return result;
  }) ?? reports;
}
