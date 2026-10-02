import test from 'node:test';
import assert from 'node:assert/strict';
import { retryPresentation } from '../src/lib/retryPresentation.js';

test('validation failures explain numeric limits without raw server output', () => {
  const result = retryPresentation({ state: 'rejected', lastFailure: { status: 422, message: JSON.stringify([
    { type: 'decimal_max_digits', loc: ['body', 'amount'], ctx: { max_digits: 12 } },
    { type: 'less_than_equal', loc: ['body', 'quantity'], ctx: { le: 100000 } },
  ]) } });
  assert.equal(result.kind, 'validation');
  assert.equal(result.message, 'Total amount must contain no more than 12 digits in total. Quantity must be 100,000 or less.');
});

test('truncated stored validation output has a readable fallback', () => {
  const result = retryPresentation({ state: 'rejected', lastFailure: { status: 422, message: '[{"type":"decimal_max_digits"' } });
  assert.equal(result.kind, 'validation');
  assert.match(result.message, /Check the amount/);
});

test('later validation or authentication rejection never invites edits to uncertain writes', () => {
  for (const status of [401, 403, 422]) {
    const result = retryPresentation({ state: 'pending', lastFailure: { status } });
    assert.equal(result.kind, 'uncertain');
    assert.match(result.message, /Retry the original request/);
  }
});
