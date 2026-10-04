import test from 'node:test';
import assert from 'node:assert/strict';
import { supportsVoucherItemProviders } from '../src/lib/pvProviders.js';

function contract(items) {
  return {
    paths: { '/api/v1/finance/vouchers': { post: { requestBody: {
      content: { 'application/json': { schema: { properties: { items } } } },
    } } } },
    components: { schemas: { Item: {
      properties: { payee_id: { type: 'string' }, payee_name: { type: 'string' } },
    } } },
  };
}

test('voucher capability recognizes direct and nullable arrays with item payees', () => {
  const array = { type: 'array', items: { $ref: '#/components/schemas/Item' } };
  for (const items of [array, { anyOf: [array, { type: 'null' }] }, { anyOf: [{ type: 'null' }, array] }]) {
    assert.equal(supportsVoucherItemProviders(contract(items)), true);
  }
});

test('voucher capability fails closed for absent, malformed, or incomplete item contracts', () => {
  for (const items of [
    undefined, { type: 'null' }, { anyOf: {} },
    { anyOf: [{ type: 'null' }, { type: 'array' }] },
    { anyOf: [{ type: 'array', items: { $ref: '#/components/schemas/Missing' } }] },
    ...['payee_id', 'payee_name'].map(field => ({ anyOf: [{ type: 'array', items: {
      properties: { [field]: { type: 'string' } },
    } }, { type: 'null' }] })),
    { anyOf: [{ type: 'object', items: { $ref: '#/components/schemas/Item' } }, { type: 'null' }] },
  ]) {
    assert.equal(supportsVoucherItemProviders(contract(items)), false);
  }
  assert.equal(supportsVoucherItemProviders(null), false);
});
