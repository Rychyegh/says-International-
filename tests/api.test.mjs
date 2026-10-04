import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, request, getAuthToken, setAuthToken, setAuthUser, hasLiveDatabaseSession } from '../src/services/api.js';
function storage(){ const items=new Map(); return {getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)}; }
beforeEach(()=>{globalThis.localStorage=storage();globalThis.sessionStorage=storage();globalThis.window=new EventTarget();});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('session checks send opaque bearer tokens and still reject server-denied sessions', async () => {
  assert.equal(hasLiveDatabaseSession(), false);
  setAuthToken('   ');
  assert.equal(hasLiveDatabaseSession(), false);
  setAuthToken('opaque-server-token');
  assert.equal(hasLiveDatabaseSession(), true);
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/me'));
    assert.equal(options.headers.Authorization, 'Bearer opaque-server-token');
    return json({ user: { id: 'sub-admin', role: 'sub_admin' }, requiresSecondFactor: false });
  };
  assert.equal((await api.getVerifiedSession()).user.role, 'sub_admin');
  globalThis.fetch = async () => json({ detail: 'Session expired' }, 401);
  await assert.rejects(api.getVerifiedSession(), error => error.status === 401);
  setAuthToken(null);
  assert.equal(hasLiveDatabaseSession(), false);
});
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

test('provider persistence trims fields and keeps server errors visible', async () => {
 let payload;
 globalThis.fetch=async(url,opts)=>{payload=JSON.parse(opts.body);return json({id:'11111111-1111-4111-8111-111111111111',...payload});};
 const saved=await api.createServiceProvider({name:' Supplier ',telephone:' 123 ',email:'',address:''});
 assert.deepEqual(payload,{name:'Supplier',phone:'123',email:null,address:null});assert.equal(saved.name,'Supplier');
 globalThis.fetch=async()=>json({detail:'Not permitted'},403);await assert.rejects(api.createServiceProvider({name:'Forbidden supplier'}),/Not permitted/);
});
test('PV failure never drops lines or replays through a legacy endpoint', async () => {
 const calls=[];globalThis.fetch=async(url,opts)=>{calls.push({url,key:opts.headers['Idempotency-Key'],body:JSON.parse(opts.body)});return json({detail:'Database unavailable'},500);};
 const pv={provider:'Test vendor',providerId:'provider-uuid',description:'Supplies',qty:2,cost:25,amount:50,items:[{description:'Supplies',qty:2,costPerItem:25,totalAmount:50}]};
 await assert.rejects(api.createPaymentVoucher(pv));await assert.rejects(api.createPaymentVoucher(pv));
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url.endsWith('/finance/vouchers')));assert.equal(calls[0].key,calls[1].key);assert.equal(calls[0].body.items.length,1);
});
test('whole voucher approval uses documented pre-audit then approve routes', async () => {
 const calls=[];globalThis.fetch=async(url,opts)=>{calls.push({url,body:opts.body&&JSON.parse(opts.body)});return json({id:'pv',status:url.endsWith('/approve')?'APPROVED':url.endsWith('/pre-audit')?'PRE_AUDITED':'DRAFT'});};
 const saved=await api.reviewPaymentVoucher('pv',{action:'Validated',remarks:'Checked',items:[{status:'Validated'}]});assert.equal(saved.status,'APPROVED');
 assert.ok(calls[1].url.endsWith('/pre-audit'));assert.deepEqual(calls[1].body,{decision:'approve',audit_notes:'Checked'});assert.ok(calls[2].url.endsWith('/approve'));
 await assert.rejects(api.reviewPaymentVoucher('pv',{action:'Partially Approved',items:[]}),/backend supports/);
});

test('enrollment uses a persisted random key and UUID application route',async()=>{
 setAuthUser({id:'retry-test-actor'});const keys=[];
 globalThis.fetch=async(url,opts)=>{assert.ok(url.endsWith('/admissions/applications/app-uuid/enroll'));keys.push(opts.headers['Idempotency-Key']);return json({detail:'Retry later'},503);};
 await assert.rejects(api.enrollApplication('app-uuid',{level:'Basic 7'}));
 await assert.rejects(api.enrollApplication('app-uuid',{level:'Basic 7'}));
 assert.match(keys[0],/^[0-9a-f-]{36}$/);assert.equal(keys[0],keys[1]);
 await assert.rejects(api.enrollApplication('app-uuid',{level:'Basic 8'}),/unresolved/);assert.equal(keys.length,2);
});
test('timetable draft and publication use revisioned endpoints without fallback', async () => {
  const workspace = { contract_version: 1, id: 'w1', revision: 3, entries: [], catalogs: { classes: [], teachers: [], subjects: [], rooms: [] } };
  const calls = [];
  globalThis.fetch = async (url, opts) => { calls.push({ url, opts }); return json({ ...workspace, published_revision: 3 }); };
  await api.saveTimetableDraft(workspace);
  await api.publishTimetable(workspace);
  assert.ok(calls[0].url.endsWith('/timetables/workspace'));
  assert.equal(calls[0].opts.method, 'PUT');
  assert.equal(JSON.parse(calls[0].opts.body).revision, 3);
  assert.equal(calls[1].opts.headers['Idempotency-Key'], 'timetable-w1-3');
  globalThis.fetch = async () => json({ ...workspace, published_revision: 2 });
  await assert.rejects(api.publishTimetable(workspace), /did not confirm/);
  let count = 0;
  globalThis.fetch = async () => { count++; return json({ detail: 'Revision conflict' }, 409); };
  await assert.rejects(api.saveTimetableDraft(workspace));
  assert.equal(count, 1);
});

test('provider transport retries persist random keys, with new keys only after confirmed completion', async () => {
 setAuthUser({id:'provider-retry-actor'});
 const keys=[];
 globalThis.fetch=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);throw new TypeError('Connection lost');};
 await assert.rejects(api.createServiceProvider({name:'Provider Retry Test'}));
 // An independent module instance simulates losing all in-memory request state.
 const fresh=await import(`../src/services/api.js?retry-test=${Date.now()}`);
 globalThis.fetch=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return json({id:'11111111-1111-4111-8111-111111111111',name:'Provider Retry Test'});};
 await fresh.api.createServiceProvider({name:'Provider Retry Test'});
 await fresh.api.createServiceProvider({name:'Provider Retry Test'});
 assert.match(keys[0],/^[0-9a-f-]{36}$/);
 assert.equal(keys[0],keys[1]);
 assert.notEqual(keys[1],keys[2]);
});

test('voucher totals reject a one-cent difference and provider aliases must agree', async () => {
 const base={provider_id:'provider-uuid',quantity:2,unit_cost:10,amount:20};
 assert.equal(api.normalizePaymentVoucherPayload(base).payee_id,'provider-uuid');
 for(const amount of [19.99,20.01]) assert.throws(()=>api.normalizePaymentVoucherPayload({...base,amount}),/exactly match/);
 assert.throws(()=>api.normalizePaymentVoucherPayload({...base,payee_id:'different'}),/same saved provider/);
 const aggregate=api.normalizePaymentVoucherPayload({provider_id:'provider-uuid',amount:10,quantity:3});
 assert.equal(aggregate.quantity,1);assert.equal(aggregate.unit_cost,10);assert.equal(aggregate.amount,10);
});

test('verified PIN uses server role and replacement token; provisional responses never authorize',async()=>{
 setAuthToken('eyJ-primary');setAuthUser({id:'admin-user',role:'head_admin',requiresSecondFactor:true});
 globalThis.fetch=async(url,opts)=>{
  assert.ok(url.endsWith('/auth/verify-admin-pin'));assert.deepEqual(JSON.parse(opts.body),{pin:'2468'});
  assert.equal(opts.headers.Authorization,'Bearer eyJ-primary');
  return json({token:'eyJ-complete',requiresSecondFactor:false,user:{id:'admin-user',role:'sub_admin',portalRole:'admin'}});
 };
 const result=await api.verifyAdminPin('2468');assert.equal(result.role,'sub_admin');assert.equal(getAuthToken(),'eyJ-complete');
 globalThis.fetch=async()=>json({token:'eyJ-incomplete',requiresSecondFactor:true,user:{id:'admin-user',role:'head_admin'}});
 await assert.rejects(api.verifyAdminPin('2468'),/fully verified/);assert.equal(getAuthToken(),'eyJ-complete');
});
test('PIN enrollment sends account password and lockout retains Retry-After',async()=>{
 setAuthToken('eyJ-primary');
 globalThis.fetch=async(url,opts)=>{
  assert.ok(url.endsWith('/auth/admin-pin'));assert.deepEqual(JSON.parse(opts.body),{pin:'2468',password:'password-test'});
  return new Response(JSON.stringify({detail:'Locked'}),{status:429,headers:{'Content-Type':'application/json','Retry-After':'900'}});
 };
 try {await api.verifyAdminPin('2468','password-test');assert.fail('Expected lockout');}catch(error){assert.equal(error.status,429);assert.equal(error.retryAfter,'900');}
});

test('ambiguous successful provider response cannot retire its retry key',async()=>{
 setAuthUser({id:'ambiguous-actor'});const keys=[];
 globalThis.fetch=async(url,opts)=>{keys.push(opts.headers['Idempotency-Key']);return json({success:true});};
 await assert.rejects(api.createServiceProvider({name:'Unconfirmed'}),/did not confirm/);
 globalThis.fetch=async(url,opts)=>{keys.push(opts.headers['Idempotency-Key']);return json({id:'11111111-1111-4111-8111-111111111111',name:'Unconfirmed'});};
 await api.createServiceProvider({name:'Unconfirmed'});assert.equal(keys[0],keys[1]);
});

test('Accounts fee feed rejects malformed success instead of interpreting it as an empty ledger', async () => {
 globalThis.fetch=async()=>json({success:true});await assert.rejects(api.getFees(),/invalid fee list/);
 globalThis.fetch=async()=>json({data:{fees:[]}});assert.deepEqual(await api.getFees(),{data:{fees:[]}});
});

test('application page retains server count without changing legacy list reads', async () => {
  const records = [{ id: 'page-record' }];
  globalThis.fetch = async () => new Response(JSON.stringify(records), { headers: { 'X-Total-Count': '125' } });
  assert.deepEqual(await api.getApplicationsPage(), { data: records, total: 125 });
  assert.deepEqual(await api.getApplications(), records);
  for (const count of [null, '', 'unknown', '-1']) {
    globalThis.fetch = async () => new Response(JSON.stringify(records), { headers: count == null ? {} : { 'X-Total-Count': count } });
    assert.equal((await api.getApplicationsPage()).total, null);
  }
});

test('multi-provider vouchers preserve item payees and require a declared server contract', async () => {
 setAuthToken('opaque-token');setAuthUser({id:'head-provider-test',role:'head_admin'});
 const pv={description:'Two providers',quantity:1,unit_cost:75,amount:75,items:[
  {description:'Books',providerId:'provider-a',provider:'Books supplier',qty:1,costPerItem:25,totalAmount:25},
  {description:'Repairs',providerId:'provider-b',provider:'Repair supplier',qty:1,costPerItem:50,totalAmount:50},
 ]};
 let writes=0;
 globalThis.fetch=async()=>json({paths:{}});
 await assert.rejects(api.createPaymentVoucher(pv),/nothing was submitted/);
 const schema={paths:{'/api/v1/finance/vouchers':{post:{requestBody:{content:{'application/json':{schema:{$ref:'#/components/schemas/Create'}}}}}}},components:{schemas:{Create:{properties:{items:{type:'array',items:{$ref:'#/components/schemas/Item'}}}},Item:{properties:{payee_id:{type:'string'},payee_name:{type:'string'}}}}}};
 globalThis.fetch=async(url,opts)=>{
  if(url.endsWith('/openapi.json')) return json(schema);
  writes++;const body=JSON.parse(opts.body);
  assert.equal(body.payee_id,null);assert.equal(body.payee_name,'Multiple providers');
  assert.deepEqual(body.items.map(item=>item.payee_id),['provider-a','provider-b']);
  assert.deepEqual(body.items.map(item=>item.payee_name),['Books supplier','Repair supplier']);
  return json({id:'33333333-3333-4333-8333-333333333333',...body});
 };
 await api.createPaymentVoucher(pv);
 assert.equal(writes,1);
 const arraySchema=schema.components.schemas.Create.properties.items;
 schema.components.schemas.Create.properties.items={anyOf:[arraySchema,{type:'null'}]};
 await api.createPaymentVoucher(pv);
 assert.equal(writes,2, 'nullable item arrays permit a single voucher write with both payees');
 delete schema.components.schemas.Item.properties.payee_id;
 await assert.rejects(api.createPaymentVoucher(pv),/nothing was submitted/);
 assert.equal(writes,2, 'nullable arrays without item-level provider IDs must not write');
 globalThis.fetch=async(url)=>{
  assert.ok(url.endsWith('/openapi.json'), 'unavailable contracts must not trigger a write');
  return json({detail:'Unavailable'},503);
 };
 await assert.rejects(api.createPaymentVoucher(pv),/nothing was submitted/);
});

test('multi-item approval uses separate authorization with latest voucher version and no aggregate approve',async()=>{
 setAuthToken('opaque');setAuthUser({id:'reviewer'});
 const id='11111111-1111-4111-8111-111111111111',a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 let voucher={id,status:'PRE_AUDITED',version:2,items:[{id:a,status:'PENDING'},{id:b,status:'PENDING'}]},posts=[];
 globalThis.fetch=async(url,options)=>{
  if(options.method!=='POST') return json(voucher);
  assert.ok(url.endsWith('/authorize'));assert.ok(options.headers['Idempotency-Key']);
  const body=JSON.parse(options.body);posts.push(body);
  assert.equal(body.version,voucher.version);
  const target=url.split('/').at(-2);
  voucher={...voucher,version:voucher.version+1,status:target===b?'APPROVED':'PRE_AUDITED',items:voucher.items.map(item=>item.id===target?{...item,status:body.decision==='approve'?'APPROVED':'DECLINED'}:item)};
  return json({voucher});
 };
 await api.reviewPaymentVoucher(id,{action:'Partially Approved',remarks:'Review',items:[{id:a,status:'Validated'},{id:b,status:'Declined',auditRemarks:'Not required'}]});
 assert.deepEqual(posts,[{decision:'approve',version:2,notes:'Review'},{decision:'decline',version:3,notes:'Not required'}]);
});
