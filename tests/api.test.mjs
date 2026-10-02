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
  assert.equal(calls.length,2);
  assert.equal(calls[0],calls[1]);
});
test('login uses the original persistent auth storage',async()=>{
  globalThis.fetch=async()=>json({token:'eyJ-test-token',user:{id:'admin-id',role:'admin'}});
  await api.login({email:'admin@test.com',password:'test',portal:'admin'});
  assert.equal(localStorage.getItem('auth_token'),'eyJ-test-token');
  assert.equal(JSON.parse(localStorage.getItem('auth_user')).id,'admin-id');
  assert.equal(sessionStorage.getItem('auth_token'),null);
});
