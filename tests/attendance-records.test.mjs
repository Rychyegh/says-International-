import test from 'node:test';
import assert from 'node:assert/strict';
import {attendanceRows, attendanceDate, saveManualAttendance} from '../src/lib/attendanceRecords.js';
test('attendance maps persisted IDs and school dates without inventing SMS delivery',()=>{
 const [row]=attendanceRows({logs:[{id:'event',student_id:'uuid',scanned_at:'2026-10-03T08:20:00Z',scan_type:'check_in'}]},[{id:'uuid',studentId:'CODE',fullName:'Learner'}]);
 assert.equal(row.studentId,'CODE');assert.equal(row.studentName,'Learner');assert.equal(row.date,'2026-10-03');assert.equal(row.status,'Check In');assert.equal(row.smsStatus,'Not confirmed');
});
test('malformed history does not masquerade as an empty register',()=>{
 assert.throws(()=>attendanceRows({success:true}));
 assert.throws(()=>attendanceRows([{student_id:'uuid',date:'2026-10-03'}]));
 assert.deepEqual(attendanceRows({logs:[]}),[]);
});

test('manual attendance persists without a guardian phone or SMS and confirms read-back', async () => {
 const student = {id:'student-uuid', studentId:'CODE', level:'Basic 1'};
 let stored = [], submitted = false;
 const record = await saveManualAttendance({student, status:'Present',
  submit: async payload => {
   assert.deepEqual(payload, {class_level:'Basic 1', records:[{student_id:student.id,status:'Present'}],sendSmsForAbsence:false});
   stored = [{id:'saved-event',student_id:student.id,date:attendanceDate(),status:'Present'}];
  }, onSubmitted: () => { submitted = true; },
  load: async () => attendanceRows({logs:stored}, [student]),
 });
 assert.equal(submitted,true);
 assert.equal(record.id,'saved-event');
 assert.equal(attendanceRows({logs:stored}, [student])[0].status,'Present');
});
test('manual attendance rejects failed writes and success responses without saved history', async () => {
 const student = {id:'uuid',level:'Basic 1'};
 let reads = 0;
 await assert.rejects(saveManualAttendance({student,status:'Absent',submit:async () => {throw new Error('Database unavailable');},load:async () => {reads++;return [];}}), /Database unavailable/);
 assert.equal(reads,0);
 await assert.rejects(saveManualAttendance({student,status:'Absent',submit:async () => ({}),load:async () => []}), /not visible in database history/);
});
