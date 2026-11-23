import { attendanceFromRecords } from './teacherDashboardRecords.js';
const number=value=>value==null || value==='' || !Number.isFinite(Number(value))?null:Number(value);
export function reportAttendanceText(report) {
  const present=number(report.attendance_present_days ?? report.days_present ?? report.attendance?.present_days);
  const total=number(report.attendance_total_days ?? report.total_school_days ?? report.attendance?.total_days);
  if(present!==null && total!==null && total>0 && present>=0 && present<=total)return `${present} / ${total} days`;
  const percentage=number(report.attendance_percentage ?? report.attendance_percent ?? report.attendancePercent ?? report.attendance?.percentage);
  if(percentage!==null && percentage>=0 && percentage<=100)return `${percentage}%`;
  return report.attendance_display || '—';
}
export function withReportAttendance(reports,logs,students,scope) {
  return reports.map(report=>{
    if(reportAttendanceText(report)!=='—')return report;
    const student=students.find(s=>[s.id,s.studentId,s.studentUuid].filter(Boolean).includes(report.student_id)) || {id:report.student_id,studentId:report.student_code};
    const rate=attendanceFromRecords(student,logs,{year:scope.academic_year,term:scope.term});
    return rate.value===null?report:{...report,attendance_display:`${rate.value}% (${rate.note.split(' · ')[0]})`};
  });
}
