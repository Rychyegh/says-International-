import test from 'node:test';
import assert from 'node:assert/strict';
import { mapStudentLedgerFromApi } from '../src/services/api.js';

test('saved receipt ledger preserves original payer, method and allocations for reprinting', () => {
 const allocations = [{account_code:'INC-1',account_name:'Tuition',amount:100}];
 const ledger = mapStudentLedgerFromApi({ledger_entries:[{id:'payment-1',type:'PAYMENT',receipt_number:'RCPT-1',credit:100,payer_name:'Actual Payer',payment_method:'Cash',allocations}]});
 assert.equal(ledger.entries[0].reference,'RCPT-1');
 assert.equal(ledger.entries[0].payerName,'Actual Payer');
 assert.equal(ledger.entries[0].paymentMethod,'Cash');
 assert.deepEqual(ledger.entries[0].allocations,allocations);
});
