import test from 'node:test';
import assert from 'node:assert/strict';
import { disbursementItems, requiresItemDisbursement } from '../src/lib/pvDisbursementItems.js';
const description = '[2026/2027 · 1st Term] STATIONERY (qty 2 × GHS 700.00 = GHS 1400.00); MEALS (qty 1 × GHS 700.00 = GHS 700.00)';
test('legacy multi-item descriptions require separate payment instructions', () => {
 const voucher = { description, status:'Validated', items:[{id:'fallback',description}] };
 const items = disbursementItems(voucher);
 assert.equal(requiresItemDisbursement(voucher),true);
 assert.deepEqual(items.map(i=>[i.description,i.totalAmount]),[['STATIONERY',1400],['MEALS',700]]);
 assert.ok(items.every(i=>i.recoveredFromDescription));
});
test('canonical item records take precedence and single items stay intact', () => {
 const items=[{id:'a'},{id:'b'}];
 assert.equal(disbursementItems({items,description}),items);
 assert.equal(requiresItemDisbursement({items:[{id:'a',description:'One item'}]}),false);
});
test('ordinary prose and inconsistent arithmetic are not converted to payment items', () => {
 assert.equal(disbursementItems({description:'Books; meals'}).length,0);
 assert.equal(disbursementItems({description:description.replace('1400.00','1500.00')}).length,0);
});
