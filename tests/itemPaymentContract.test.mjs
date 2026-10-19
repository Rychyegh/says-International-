import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentAccountOptions,ITEM_PAYMENTS_ENABLED} from '../src/lib/itemPaymentContract.js';
const id = i => `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, '0')}`;
test('all saved active account types are selectable for PV payments', () => {
  assert.equal(ITEM_PAYMENTS_ENABLED, false);
  const accounts = ['asset', 'expense', 'liability', 'income', 'equity'].map((type, i) => ({id:id(i), type, is_active:true}));
  assert.deepEqual(paymentAccountOptions([...accounts, {id:'10093',is_active:true}, {id:id(9),is_active:false}]), {sources:accounts,expenses:accounts});
});
test('grouped account responses are combined and deduplicated', () => {
  const source = {id:id(1),is_active:true}, expense = {id:id(2),status:'active'};
  assert.deepEqual(paymentAccountOptions({source_accounts:[source],expense_accounts:[source,expense]}), {sources:[source,expense],expenses:[source,expense]});
  assert.deepEqual(paymentAccountOptions({accounts:[{id:id(3),is_active:true,status:'archived'}]}), {sources:[],expenses:[]});
});
