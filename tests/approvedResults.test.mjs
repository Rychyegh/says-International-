import test from 'node:test';
import assert from 'node:assert/strict';
import { approvedResults } from '../src/lib/approvedResults.js';

test('terminal reports include approved and published records, excluding drafts and declined records', () => {
  const rows = ['Approved', ' PUBLISHED ', 'Pending Approval', 'Declined', 'Class Score Recorded', ''].map((status, id) => ({ id, status }));
  assert.deepEqual(approvedResults(rows).map(row => row.id), [0, 1]);
});
