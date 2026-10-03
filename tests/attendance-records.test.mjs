import test from 'node:test';
import assert from 'node:assert/strict';
import {attendanceRows} from '../src/lib/attendanceRecords.js';
test('attendance maps persisted IDs and school dates without inventing SMS delivery',()=>{
 const [row]=attendanceRows({logs:[{id:'event',student_id:'uuid',scanned_at:'2026-10-03T08:20:00Z',scan_type:'check_in'}]},[{id:'uuid',studentId:'CODE',fullName:'Learner'}]);
 assert.equal(row.studentId,'CODE');assert.equal(row.studentName,'Learner');assert.equal(row.date,'2026-10-03');assert.equal(row.status,'Check In');assert.equal(row.smsStatus,'Not confirmed');
});
test('malformed history does not masquerade as an empty register',()=>{
 assert.throws(()=>attendanceRows({success:true}));
 assert.throws(()=>attendanceRows([{student_id:'uuid',date:'2026-10-03'}]));
 assert.deepEqual(attendanceRows({logs:[]}),[]);
});
