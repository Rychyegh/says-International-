import test from 'node:test';
import assert from 'node:assert/strict';
import {saveReportRequest, mapReportRequest} from '../src/lib/reportRecords.js';

test('parent requests require a linked child and preserve server identity', async () => {
  let calls = 0;
  await assert.rejects(saveReportRequest({child:'Student',submit:()=>{calls++;}}), /linked child/);
  assert.equal(calls,0);
  const saved = await saveReportRequest({child:'Learner',studentId:'uuid',semester:'Term 1',note:'Please',submit:async payload=>{
    assert.deepEqual(payload,{child:'Learner',semester:'Term 1',note:'Please'});
    return {id:'server-id',child_name:'Learner',status:'Requested',created_at:'2026-10-20'};
  }});
  assert.equal(saved.id,'server-id'); assert.equal(saved.child,'Learner');
  assert.equal(saved.requestedAt,'2026-10-20');
});
test('report failures and unconfirmed responses cannot become saved requests', async () => {
  const input={child:'Learner',studentId:'uuid',submit:async()=>{throw new Error('Access denied');}};
  await assert.rejects(saveReportRequest(input),/Access denied/);
  await assert.rejects(saveReportRequest({...input,submit:async()=>({success:true})}),/saved report request/);
  assert.equal(mapReportRequest({data:{id:'saved',file_url:'https://school.example/result.pdf'}}).fileUrl,'https://school.example/result.pdf');
});
