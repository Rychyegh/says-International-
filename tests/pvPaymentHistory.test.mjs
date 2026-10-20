import test from 'node:test';
import assert from 'node:assert/strict';
import { hasConfirmedPayment, confirmedPaidAmount, isFullyPaidVoucher } from '../src/lib/pvPaymentHistory.js';
test('partial history shows only confirmed item amounts', () => {
  const voucher={status:'Partially Paid',total:1100,items:[{status:'DISBURSED',totalAmount:100},{status:'Validated',totalAmount:1000}]};
  assert.equal(hasConfirmedPayment(voucher),true);
  assert.equal(confirmedPaidAmount(voucher),100);
  assert.equal(isFullyPaidVoucher(voucher),false);
  assert.equal(hasConfirmedPayment({...voucher,status:'Approved',items:[{status:'Approved',amount:1100}]}),false);
});
test('canonical paid totals and full voucher history remain supported', () => {
  assert.equal(confirmedPaidAmount({status:'PARTIALLY_DISBURSED',paid_total:100,total_amount:1100}),100);
  assert.equal(confirmedPaidAmount({status:'DISBURSED',total_amount:1100}),1100);
  assert.equal(hasConfirmedPayment({status:'Approved',paid_total:0}),false);
});
