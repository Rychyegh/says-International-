import test from 'node:test';
import assert from 'node:assert/strict';
import {sameStudentIdentity,studentDisplayCode} from '../src/lib/studentIdentity.js';
const id='11111111-1111-4111-8111-111111111111';
test('student UUID aliases identify the same database record across projections',()=>{
 assert.equal(sameStudentIdentity({id},{student_id:id}),true);
 assert.equal(sameStudentIdentity({id},{studentId:id}),true);
 assert.equal(sameStudentIdentity({student_id_code:'REMALJ-2026-ABC'},{studentId:'remalj-2026-abc'}),true);
 assert.equal(sameStudentIdentity({id:'one',applicationId:'app'},{id:'two',application_id:'app'}),true);
});
test('names, email and guardian email cannot merge distinct database records',()=>{
 const a={id:'one',fullName:'Same Name',studentId:'shared@example.test',guardianEmail:'parent@example.test'};
 assert.equal(sameStudentIdentity(a,{...a,id:'two'}),false);
 assert.equal(sameStudentIdentity({id:'one'},{applicationId:'one'}),false);
});
test('official student code takes priority over an email or UUID alias',()=>{
 assert.equal(studentDisplayCode({studentId:'student@example.test',student_id_code:'REMALJ-2026-02FC2FFF'}),'REMALJ-2026-02FC2FFF');
 assert.equal(studentDisplayCode({studentId:id,student_code:'REMALJ-2026-02FC2FFF'}),'REMALJ-2026-02FC2FFF');
 assert.equal(studentDisplayCode({studentId:'student@example.test'}),'');
});
