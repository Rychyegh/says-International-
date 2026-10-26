import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogNames } from '../src/lib/catalogNames.js';

test('catalog accepts subject and nested data responses across devices', () => {
  for (const response of [
    ['Creative Arts'], {subjects:[{name:'Creative Arts'}]},
    {data:{subjects:[{subject_name:'Creative Arts'}]}},
    {data:[{name:'Creative Arts'}]}, {items:[{title:'Creative Arts'}]},
  ]) assert.deepEqual(catalogNames(response), ['Creative Arts']);
});

test('catalog handles empty responses without inventing subjects', () => {
  assert.deepEqual(catalogNames(null), []);
  assert.deepEqual(catalogNames({subjects:[]}), []);
});
