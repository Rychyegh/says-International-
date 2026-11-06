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

test('roster amounts and class totals follow saved revisions, preserving unbilled quotes', async () => {
 const { studentBillAmount } = await import('../src/lib/studentSavedBills.js');
 const period={academicYear:'2026/2027',term:'Term 1'};
 const students=[{id:'uuid',studentId:'ARIANA'},{id:'unbilled'}];
 const bills=[{id:'invoice',studentId:'ARIANA',...period,billedAmount:3845,paidAmount:700}];
 const amounts=()=>students.map(student=>studentBillAmount(bills,student,period,2500));
 assert.deepEqual(amounts(),[3845,2500]);
 assert.equal(amounts().reduce((a,b)=>a+b,0),6345);
 bills[0]={...bills[0],billedAmount:3795,version:2};
 assert.deepEqual(amounts(),[3795,2500]);
 assert.equal(studentBillAmount(bills,students[0],{...period,term:'Term 2'},2500),2500);
});
