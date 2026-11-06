import test from 'node:test';
import assert from 'node:assert/strict';
import { billEditorTotals } from '../src/lib/billEditorTotals.js';

test('editor agrees with saved totals and applies edits while preserving payments', () => {
 const bill={billedAmount:3845,paidAmount:700,itemsBreakdown:[{amount:2100},{amount:600},{amount:450},{amount:695}]};
 assert.equal(billEditorTotals(bill).total,3845);
 assert.equal(billEditorTotals(bill).balance,3145);
 const changed=[{amount:2050},...bill.itemsBreakdown.slice(1)];
 assert.equal(billEditorTotals(bill,changed).total,3795);
 assert.equal(billEditorTotals(bill,changed).balance,3095);
 assert.equal(billEditorTotals(bill,changed).discrepancy,0);
});
test('includes arrears and discounts, detects inconsistent saved breakdowns, rounds cents',()=>{
 const bill={billed_amount:125.3,paid_amount:20,arrears_brought_forward:30,scholarship_discount:5,items:[{amount:100.1},{amount:0.2}]};
 assert.equal(billEditorTotals(bill).total,125.3);
 assert.equal(billEditorTotals(bill).balance,105.3);
 assert.equal(billEditorTotals(bill).discrepancy,0);
 assert.equal(billEditorTotals({...bill,billed_amount:130.3}).discrepancy,5);
});
