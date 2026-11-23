import test from 'node:test';
import assert from 'node:assert/strict';
import {reportAttendanceText,withReportAttendance} from '../src/lib/reportAttendance.js';
test('report attendance displays saved days, percentages and real zero without inventing attendance',()=>{
 assert.equal(reportAttendanceText({attendance_percentage:0}),'0%');
 assert.equal(reportAttendanceText({days_present:18,total_school_days:20}),'18 / 20 days');
 assert.equal(reportAttendanceText({}),'—');
 assert.equal(reportAttendanceText({attendance_percentage:200}),'—');
});
test('saved attendance logs fill only missing report attendance for the selected period',()=>{
 const report={student_id:'student'};
 const logs=[{student_id:'student',date:'2026-11-20',status:'Present'},{student_id:'student',date:'2026-11-21',status:'Absent'}];
 const [result]=withReportAttendance([report],logs,[],{academic_year:'2026/2027',term:'Term 1'});
 assert.equal(reportAttendanceText(result),'50% (1 attended / 2 recorded days)');
 assert.equal(withReportAttendance([{...report,attendance_percentage:80}],logs,[],{} )[0].attendance_percentage,80);
});
