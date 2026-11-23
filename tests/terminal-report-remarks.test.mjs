import test from 'node:test';
import assert from 'node:assert/strict';
import {extractReportRemarks,findReportRemark,reportRemarkPayload,confirmedSavedRemark,mergeApprovedRemarks} from '../src/lib/terminalReportRemarks.js';
const scope={academic_year:'2026/2027',term:'Term 1',class_level:'Kindergarten 2'};
const report={student_id:'learner',class_level:'KG 2',sub_class:'Kindergarten 2A'};
const record={id:'remark',student_id:'learner',kind:'teacher',academic_year:'2026/2027',term:'Term 1',comment:'Good effort',version:1,status:'draft'};
test('remarks are scoped by saved learner, period and author kind',()=>{
 assert.equal(findReportRemark([record],'learner','teacher',scope),record);
 for(const [id,kind,period] of [['other','teacher',scope],['learner','head',scope],['learner','teacher',{...scope,term:'Term 2'}],['learner','teacher',{...scope,academic_year:'2025/2026'}]])assert.equal(findReportRemark([record],id,kind,period),null);
 assert.throws(()=>extractReportRemarks({success:true}),/saved report remarks/);assert.deepEqual(extractReportRemarks({remarks:[]}),[]);
});
test('save payload uses backend version and trims text; invalid input stays unsaved',()=>{
 const payload=reportRemarkPayload(report,scope,'teacher',' Good effort ',null);
 assert.equal(payload.expected_version,0);assert.equal(payload.class_level,'Kindergarten 2');assert.equal(payload.comment,'Good effort');assert.ok(payload.reason);
 assert.equal(confirmedSavedRemark([record],report,scope,payload),record);
 assert.throws(()=>confirmedSavedRemark([{...record,version:0}],report,scope,payload),/could not be verified/);
 assert.throws(()=>reportRemarkPayload(report,scope,'teacher',' ',null));
 assert.throws(()=>reportRemarkPayload(report,scope,'teacher','x'.repeat(4001),null));
 assert.throws(()=>reportRemarkPayload(report,scope,'teacher','Edit',{...record,version:undefined}),/version/);
});
test('only approved remarks appear in report cards and print data',()=>{
 assert.equal(mergeApprovedRemarks([report],[record],scope)[0].teacher_comment,undefined);
 assert.equal(mergeApprovedRemarks([report],[{...record,status:'approved'}],scope)[0].teacher_comment,'Good effort');
 assert.equal(mergeApprovedRemarks([report],[{...record,status:'approved',term:'Term 2'}],scope)[0].teacher_comment,undefined);
});
