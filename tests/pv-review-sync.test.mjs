import test from 'node:test';
import assert from 'node:assert/strict';
import {isConfirmedReviewStatus,notifyVoucherChange,PV_CHANGED_KEY} from '../src/lib/pvReviewSync.js';
test('confirmed partial decisions are accepted immediately like full approvals',()=>{
 for (const status of ['APPROVED','PRE_AUDITED','VALIDATED','PARTIALLY_APPROVED','Partially Approved','partially-paid','REJECTED'])assert.equal(isConfirmedReviewStatus(status),true,status);
 for (const status of ['DRAFT','PENDING','SUBMITTED','',undefined,'DISBURSED'])assert.equal(isConfirmedReviewStatus(status),false,String(status));
});
test('confirmed voucher change signals other tabs and tolerates unavailable storage',()=>{
 const calls=[];
 globalThis.localStorage={setItem:(...args)=>calls.push(args)};
 notifyVoucherChange();notifyVoucherChange();
 assert.equal(calls.length,2);assert.equal(calls[0][0],PV_CHANGED_KEY);assert.notEqual(calls[0][1],calls[1][1]);
 globalThis.localStorage={setItem:()=>{throw new Error('unavailable');}};
 assert.doesNotThrow(notifyVoucherChange);
});
