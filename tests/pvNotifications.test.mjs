import test from 'node:test';
import assert from 'node:assert/strict';
import { voucherNotifications, isPendingVoucher } from '../src/lib/pvNotifications.js';

test('server vouchers create stable pending alerts and approval removes them', () => {
  const pending = {id:'database-id',pvNo:'PV-1001',status:'Pending Audit',total:50};
  const first = voucherNotifications([pending]);
  assert.equal(first.length,1);
  assert.equal(first[0].grandTotal,50);
  const read = [{...first[0],read:true}];
  assert.equal(voucherNotifications([pending],read)[0].read,true);
  assert.equal(isPendingVoucher(pending),true,'reading the alert does not approve its voucher');
  assert.deepEqual(voucherNotifications([{...pending,status:'Validated'}],read),[]);
  assert.deepEqual(voucherNotifications([pending],read,new Set(['database-id'])),[]);
  assert.equal(voucherNotifications([pending,{...pending,id:'second-id'}],read,new Set(['database-id'])).length,1);
});
