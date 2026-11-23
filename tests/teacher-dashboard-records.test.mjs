import test from 'node:test';
import assert from 'node:assert/strict';
import {attendanceFromRecords,teacherDashboardRows} from '../src/lib/teacherDashboardRecords.js';
const student={id:'learner-1',studentId:'CODE-1',fullName:'Test Learner',level:'Kindergarten 2',subClass:'Kindergarten 2A'};
const scope={year:'2026/2027',term:'Term 1'};
test('attendance counts recorded days once, preserves real zero and does not invent absences',()=>{
 const records=[{student_id:'learner-1',date:'2026-11-20',status:'Present'},{student_id:'learner-1',date:'2026-11-20',status:'Check Out',time:'15:00'},{student_id:'learner-1',date:'2026-11-21',status:'Absent'},{student_id:'learner-1',date:'2026-11-22',status:'Present'}];
 const rate=attendanceFromRecords(student,records,scope);assert.equal(rate.value,66.7);assert.match(rate.note,/2 attended \/ 3 recorded days/);
 assert.equal(attendanceFromRecords(student,[records[2]],scope).value,0);
 assert.equal(attendanceFromRecords(student,[],scope).value,null);
 assert.equal(attendanceFromRecords(student,[{...records[0],academic_year:'2025/2026'}],scope).value,null);
});
test('saved roster and current approved grades fill incomplete dashboard projections',()=>{
 const record={studentId:'learner-1',subject:'Mathematics',classLevel:'KG 2',term:'Term 1',year:'2026/2027',score:82,status:'Approved'};
 const [row]=teacherDashboardRows({students:[student],dashboardStudents:[{id:'CODE-1',name:'Test Learner',class:'KG 2',mathGrade:'N/A',sciGrade:'—'}],classes:['KG 2'],results:[record,{...record,subject:'Science',year:'2025/2026',score:99}],scope});
 assert.equal(row.mathGrade,'1');assert.equal(row.sciGrade,'N/A');assert.equal(row.attendance,null);
 const pending=teacherDashboardRows({students:[student],classes:['KG 2'],results:[{...record,status:'Pending Approval'}],scope});assert.equal(pending[0].mathGrade,'N/A');
});
test('official saved attendance zero/percentage survives and unassigned sections stay excluded',()=>{
 const rows=teacherDashboardRows({students:[{...student,attendancePercent:0},{...student,id:'sibling',studentId:'CODE-2',subClass:'Kindergarten 2B'}],classes:['KG 2A'],scope});
 assert.equal(rows.length,1);assert.equal(rows[0].attendance,0);
});
