import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, request, getAuthToken, setAuthToken, setAuthUser } from '../src/services/api.js';
function storage(){ const items=new Map(); return {getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)}; }
beforeEach(()=>{globalThis.localStorage=storage();globalThis.sessionStorage=storage();globalThis.window=new EventTarget();});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('sends authenticated JSON to the configured database API',async()=>{
  setAuthToken('opaque-token');let called;
  globalThis.fetch=async(url,opts)=>{called={url,opts};return json({ok:true});};
  await request('/test',{method:'POST',body:'{}'});
  assert.equal(called.opts.headers.Authorization,'Bearer opaque-token');assert.ok(called.url.endsWith('/api/v1/test'));
});
test('HTTP failures and success false never become success',async()=>{
  for(const response of [()=>json({detail:'Rejected'},403),()=>json({success:false,message:'Not committed'})]){
    globalThis.fetch=async()=>response();await assert.rejects(request('/test'));
  }
});
test('HTML and empty successful responses do not confirm database writes',async()=>{
  for(const text of ['<html>Proxy page</html>','']){globalThis.fetch=async()=>new Response(text);await assert.rejects(request('/test'));}
});
test('financial HTTP 500 is never replayed on a legacy route',async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return json({detail:'Failed'},500);};
  await assert.rejects(api.approvePaymentVoucher('id',{}));assert.equal(calls,1);
});
test('voucher status update no longer recursively calls itself',async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return json({id:'v',status:'REJECTED'});};
  await api.updatePaymentVoucherStatus('v',{status:'REJECTED'});assert.equal(calls,1);
});
test('fee and disbursement requests carry idempotency keys',async()=>{
  const seen=[];globalThis.fetch=async(url,options)=>{seen.push(options.headers['Idempotency-Key']);return json({id:'ok'});};
  await api.recordFeePayment('invoice',{paidAmount:10,idempotencyKey:'fee-key'});
  await api.disbursePaymentVoucher('voucher',{idempotencyKey:'pv-key'});
  assert.deepEqual(seen,['fee-key','pv-key']);
});
test('SMS uses only the backend and preserves the requested message',async()=>{
  let called;globalThis.fetch=async(url,options)=>{called={url,body:JSON.parse(options.body)};return json({id:'sms-1',status:'queued'});};
  const result=await api.sendSms({recipientPhone:'0241112222',messageText:'Exact text'});
  assert.equal(result.status,'queued');assert.ok(called.url.endsWith('/attendance/send-sms'));
  assert.equal(called.body.messageText,'Exact text');assert.equal(called.body.recipientPhone,'233241112222');
});
test('SMS failure is never replaced by attendance scan or fabricated queue',async()=>{
  let count=0;globalThis.fetch=async()=>{count++;return json({detail:'SMS down'},503);};
  await assert.rejects(api.sendSms({recipientPhone:'0241112222',messageText:'Hello'}));assert.equal(count,1);
  globalThis.fetch=async()=>json({success:true});await assert.rejects(api.sendSms({recipientPhone:'0241112222',messageText:'Hello'}));
});
test('SMS balance errors remain errors',async()=>{
  globalThis.fetch=async()=>json({detail:'Unavailable'},503);await assert.rejects(api.getSmsBalance());
});
test('score payload retains student identity and write kind',async()=>{
  let sent;globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return json({id:'score'});};
  await api.saveScoreSheet({studentId:'s2',subject:'Math',term:'Term 1',year:'2026/2027',submitKind:'class',entryKey:'key',classScore:40});
  assert.equal(sent.scores[0].student_id,'s2');assert.equal(sent.submit_kind,'class');assert.equal(sent.entry_key,'key');assert.equal(sent.scores[0].exam_score,null);
});

test('application retries retain an idempotency key and concurrent creates share one request',async()=>{
  let calls=[];
  globalThis.fetch=async(url,opts)=>{calls.push(opts.headers['Idempotency-Key']);await new Promise(r=>setTimeout(r,20));return json({id:'application-id'});};
  const body={learner_name:'Same Name',form_data:{dob:'2016-01-01'}};
  await Promise.all([api.submitApplication(body),api.submitApplication(body)]);
  assert.equal(calls.length,1);
  await api.submitApplication(body);
  assert.equal(calls.length,1, 'a repeated confirmed submission reuses the saved response');
});
test('login uses the original persistent auth storage',async()=>{
  globalThis.fetch=async()=>json({token:'eyJ-test-token',user:{id:'admin-id',role:'admin'}});
  await api.login({email:'admin@test.com',password:'test',portal:'admin'});
  assert.equal(localStorage.getItem('auth_token'),'eyJ-test-token');
  assert.equal(JSON.parse(localStorage.getItem('auth_user')).id,'admin-id');
  assert.equal(sessionStorage.getItem('auth_token'),null);
});
test('assessment routes use raw POST, canonical PATCH and nested list records',async()=>{
 let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return json(url.includes('?')?{scores:[{id:'score',student_id:'student',raw_class_score:80,raw_exam_score:60,has_exam_score:true}]}:{scores:[{id:'score'}]});};
 await api.saveScoreSheet({studentId:'student',arrivalTest:80,test1:80,test2:80,test3:80,classScore:40,examScore:60,hasExamScore:true});
 let body=JSON.parse(calls[0].options.body);assert.equal(body.score_format,'raw');assert.equal(body.scores[0].class_score,80);
 await api.updateScoreSheet('score',{studentId:'student',classScore:80,examScore:60});
 assert.ok(calls[1].url.endsWith('/sims/score-sheets/score'));assert.equal(calls[1].options.method,'PATCH');
 await api.updateScoreSheet('score',{studentId:'student',arrivalTest:80,test1:80,test2:80,test3:80,examScore:60});
 assert.ok(calls[2].url.endsWith('/sims/score-sheets/entry'));assert.equal(calls[2].options.method,'POST');
 const rows=await api.getScoreSheetEntries({term:'Term 1'});assert.equal(rows[0].id,'score');assert.ok(calls[3].url.includes('/sims/score-sheets?'));
 await api.publishScoreSheet('score');assert.ok(calls[4].url.endsWith('/sims/test-results/score/publish'));
});
test('corrections require invoice identity and cancellation uses a separate endpoint',async()=>{
 let calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return json({fee:{id:'invoice',balance:-20}});};
 await assert.rejects(api.adjustStudentBill({studentId:'student',amount:20}));assert.equal(calls.length,0);
 await api.adjustStudentBill({feeId:'invoice',adjustmentType:'CREDIT',amount:20,reason:'Approved discount'},'stable-key');
 assert.ok(calls[0].url.endsWith('/finance/fees/invoice/adjust'));assert.equal(calls[0].options.headers['Idempotency-Key'],'stable-key');
 await api.cancelStudentBill('invoice','Duplicate','cancel-key');assert.ok(calls[1].url.endsWith('/finance/fees/invoice/cancel'));
});
test('unfinished bulk billing makes no backend request',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return json({});};
 await assert.rejects(api.postClassBillsBatch({classLevel:'Basic 1'}),/approved fee structures/);assert.equal(calls,0);
});

test('failed admission retries keep one key and still reach the backend', async () => {
  const keys=[];let fail=true;
  globalThis.fetch=async(url,opts)=>{keys.push(opts.headers['Idempotency-Key']);return fail?json({detail:'Unavailable'},503):json({id:'saved-app'});};
  const body={learner_name:'Retry learner'};
  await assert.rejects(api.submitApplication(body));fail=false;
  assert.equal((await api.submitApplication(body)).id,'saved-app');
  assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
});
test('bill retries retain amount and key, and mismatched totals never post', async () => {
  const calls=[];let fail=true;
  globalThis.fetch=async(url,opts)=>{calls.push({body:JSON.parse(opts.body),key:opts.headers['Idempotency-Key']});return fail?json({detail:'Unavailable'},503):json({bill_id:'bill',total_payable:123.45});};
  const bill={studentId:'student-uuid',academicYear:'2026/2027',term:'Term 1',items:[{details:'Tuition',amount:100},{details:'Stationery',amount:23.45}],totalAmount:123.45,dueDate:'2027-01-01'};
  await assert.rejects(api.postStudentAcademicBill(bill));fail=false;await api.postStudentAcademicBill(bill);
  assert.equal(calls[0].key,calls[1].key);assert.equal(calls[1].body.total_payable,123.45);
  assert.equal(calls[1].body.tuition_fee+calls[1].body.stationery_fee,123.45);
  await assert.rejects(api.postStudentAcademicBill({...bill,totalAmount:150}),/total must equal/);assert.equal(calls.length,2);
  globalThis.fetch=async()=>json({bill_id:'wrong',total_billed:1800});
  await assert.rejects(api.postStudentAcademicBill(bill),/different bill amount/);
  globalThis.fetch=async()=>json({success:true});
  await assert.rejects(api.postStudentAcademicBill(bill),/did not confirm/);
});

test('admissions use the published multipart metadata contract', async () => {
  const payload={learner_name:'Multipart learner',form_data:{firstName:'Multipart'}};
  globalThis.fetch=async(url,opts)=>{
    assert.ok(opts.body instanceof FormData);
    assert.deepEqual(JSON.parse(opts.body.get('metadata')),payload);
    assert.equal(opts.headers['Content-Type'],undefined);
    return json({id:'saved-multipart'});
  };
  await api.submitApplication(payload);
});
test('proposed merge integration requires UUIDs, reviewed preview and visible backend errors', async () => {
 const canonicalStudentId='11111111-1111-4111-8111-111111111111', duplicateStudentIds=['22222222-2222-4222-8222-222222222222'];
 await assert.rejects(api.previewStudentMerge({canonicalStudentId:'Name',duplicateStudentIds}),/UUIDs/);
 await assert.rejects(api.commitStudentMerge({canonicalStudentId,duplicateStudentIds,reason:'Duplicate'}),/preview/);
 let calls=[];globalThis.fetch=async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body),key:opts.headers['Idempotency-Key']});return json({preview_token:'reviewed'});};
 await api.previewStudentMerge({canonicalStudentId,duplicateStudentIds});
 assert.ok(calls[0].url.endsWith('/students/merges/preview'));assert.equal(calls[0].body.canonical_student_id,canonicalStudentId);
 const merge={canonicalStudentId,duplicateStudentIds,previewToken:'reviewed',reason:'Confirmed duplicate'};
 await api.commitStudentMerge(merge);await api.commitStudentMerge(merge);assert.equal(calls[1].key,calls[2].key);
 globalThis.fetch=async()=>json({detail:'Not Found'},404);await assert.rejects(api.previewStudentMerge({canonicalStudentId,duplicateStudentIds}),/Not Found/);
});
