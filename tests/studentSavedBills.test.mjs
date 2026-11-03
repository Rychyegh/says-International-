import test from 'node:test';
import assert from 'node:assert/strict';
import { studentSavedBills } from '../src/lib/studentSavedBills.js';
test('saved bill selection follows student and period, not current class template',()=>{
 const student={id:'uuid',studentId:'DORCAS'};
 const bills=[{id:'current',studentId:'DORCAS',academicYear:'2026/2027',term:'Term 1',billedAmount:3775,itemsBreakdown:[{details:'Tuition',amount:3775}]},{id:'other-child',studentId:'OTHER',academicYear:'2026/2027',term:'Term 1',billedAmount:2750},{id:'old-term',studentId:'DORCAS',academicYear:'2026/2027',term:'Term 2',billedAmount:1000},{id:'empty-account',studentId:'uuid',academicYear:'2026/2027',term:'Term 1',billedAmount:0}];
 assert.deepEqual(studentSavedBills(bills,student,{academicYear:'2026/2027',term:'Term 1'}).map(b=>b.id),['current']);
 const revised=[{...bills[0],billedAmount:3000,version:2,itemsBreakdown:[{details:'Tuition',amount:3000}]}];
 assert.equal(studentSavedBills(revised,student,{academicYear:'2026/2027',term:'Term 1'})[0].billedAmount,3000);
 assert.deepEqual(studentSavedBills(bills,null,{academicYear:'2026/2027',term:'Term 1'}),[]);
});
