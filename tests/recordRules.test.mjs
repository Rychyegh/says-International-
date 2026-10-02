import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePvItemStatus, payableAmount, pvNosMatch, voucherIdentityKey, resolveFee, stripCredentials, portalForRole, studentBelongsToParent, buildStudentOptions, applicationLinksStudent } from '../src/lib/recordRules.js';

test('pending, invalid and unapproved statuses never authorize money', () => {
  for (const s of ['Pending approval', 'Invalid', 'Not approved', 'Awaiting approval', 'DRAFT', 'unknown']) assert.equal(normalizePvItemStatus(s), 'Pending approval');
  for (const s of ['APPROVED', 'Validated', 'PRE_AUDITED']) assert.equal(normalizePvItemStatus(s), 'Validated');
});
test('mixed vouchers pay only explicitly approved lines and preserve zero', () => {
  assert.equal(payableAmount({items:[{status:'Validated',totalAmount:100},{status:'Pending approval',totalAmount:900}]}),100);
  assert.equal(payableAmount({total:1000,items:[{status:'Rejected',totalAmount:1000}]}),0);
  assert.equal(payableAmount({status:'Approved',payableTotal:0,total:1000}),0);
});
test('voucher identity keeps years and UUIDs distinct', () => {
  assert.equal(pvNosMatch('PV-2025-1234','PV-2026-1234'),false);
  assert.equal(pvNosMatch('PV-2026-1234','2026-1234'),true);
  assert.notEqual(voucherIdentityKey({id:'one',pvNo:'1234'}),voucherIdentityKey({id:'two',pvNo:'1234'}));
});
test('invoice selection never falls back to names or the first student', () => {
  const fees=[{id:'a',studentId:'sa',studentName:'Same Name'},{id:'b',studentId:'sb',studentName:'Same Name'}];
  assert.equal(resolveFee(fees,{id:'b'}).id,'b');
  assert.throws(()=>resolveFee(fees,{studentName:'Same Name'}));
  assert.throws(()=>resolveFee([...fees,{id:'c',studentId:'sb'}],{studentId:'sb'}));
  assert.throws(()=>resolveFee(fees,{id:'all'}));
});
test('credential scrubbing is recursive and keeps identity',()=>{
  assert.deepEqual(stripCredentials({id:'a',password:'secret',students:[{id:'b',defaultPassword:'secret',passcode:'1234'}]}),{id:'a',students:[{id:'b'}]});
});
test('parent links use IDs, never similar names',()=>{
  assert.equal(studentBelongsToParent({id:'a',guardianName:'Ama Boateng'},{name:'Ama',linkedStudentIds:[]}),false);
  assert.equal(studentBelongsToParent({id:'a'},{linkedStudentIds:['a']}),true);
});
test('portal roles fail closed',()=>{
  assert.equal(portalForRole('head_admin'),'admin'); assert.equal(portalForRole('class_teacher'),'teacher'); assert.equal(portalForRole('unrecognized'),'');
});

test('accountant selectors reconcile student UUIDs and codes without merging names',()=>{
  const students=[{id:'uuid-a',studentId:'CODE-A',fullName:'Same Name'},{id:'uuid-b',studentId:'CODE-B',fullName:'Same Name'}];
  const options=buildStudentOptions(students,[{id:'f1',studentId:'uuid-a',studentName:'Same Name'},{id:'f2',studentId:'CODE-A',studentName:'Same Name'}]);
  assert.equal(options.length,2);
  assert.equal(options[0].id,'CODE-A');
  assert.equal(applicationLinksStudent({id:'app-a'},{applicationId:'app-a'}),true);
  assert.equal(applicationLinksStudent({id:'app-b',learner:'Same Name'},{applicationId:'app-a',fullName:'Same Name'}),false);
});
