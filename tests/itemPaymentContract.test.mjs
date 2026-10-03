import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentAccountOptions,ITEM_PAYMENTS_ENABLED} from '../src/lib/itemPaymentContract.js';
test('payment accounts require real active UUIDs and correct types; rollout defaults off',()=>{
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 assert.equal(ITEM_PAYMENTS_ENABLED,false);
 assert.deepEqual(paymentAccountOptions([{id,name:'Cash',is_active:true,type:'asset'},{id:'10093',is_active:true,type:'expense'},{id,is_active:false,type:'expense'},{id,is_active:true,type:'liability'}]),{sources:[{id,name:'Cash',is_active:true,type:'asset'}],expenses:[]});
 assert.deepEqual(paymentAccountOptions({source_accounts:[{id,is_active:true}],expense_accounts:[{id,is_active:true}]}),{sources:[{id,is_active:true}],expenses:[{id,is_active:true}]});
});
