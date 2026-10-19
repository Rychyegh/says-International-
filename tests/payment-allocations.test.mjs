import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentAllocations,allocationNotes,receiptAllocations} from '../src/lib/paymentAllocations.js';
test('several fee accounts balance to one payment and survive receipt notes',()=>{
 const lines=paymentAllocations([{accountName:'Tuition',accountCode:'10012',amount:'75.10'},{accountName:'PTA',accountCode:'10124',amount:'24.90'}],100);
 assert.equal(lines.reduce((sum,line)=>sum+line.amount,0),100);
 const description=allocationNotes('Term fees',lines);
 assert.deepEqual(receiptAllocations({description}),lines);
 assert.deepEqual(receiptAllocations({allocations:lines}),lines);
});
test('unbalanced, missing, invalid and excessive precision allocations are rejected',()=>{
 for(const lines of [[],[{accountName:'PTA',amount:99.99}],[{accountName:'',amount:100}],[{accountName:'PTA',amount:-100}],[{accountName:'PTA',amount:100.001}]])assert.throws(()=>paymentAllocations(lines,100));
 assert.deepEqual(receiptAllocations({description:'Old receipt'}),[]);
});
