import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCompulsoryInitialBill } from '../src/lib/initialBillRules.js';
test('initial billing accepts compulsory fees and rejects optional charges regardless of selection', () => {
  assert.doesNotThrow(()=>assertCompulsoryInitialBill([{details:'Tuition',amount:1000,is_optional:false}]));
  for (const item of [{details:'Bus',is_optional:true},{details:'Bus',isOptional:true},{details:'Bus',optional:true},{details:'OPTIONAL: Feeding'}]) {
    assert.throws(()=>assertCompulsoryInitialBill([{details:'Tuition',amount:1000},item]), /Post compulsory fees first/);
  }
});
