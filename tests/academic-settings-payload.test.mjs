import test from 'node:test';
import assert from 'node:assert/strict';
import { academicSettingsPayload, academicSettingsVersion } from '../src/lib/academicSettingsPayload.js';

test('settings keep the loaded version including zero without inventing a version', () => {
  assert.equal(academicSettingsVersion({ version: 0 }), 0);
  assert.equal(academicSettingsVersion({ version: 7 }), 7);
  assert.equal(academicSettingsVersion({}), null);
  assert.equal(academicSettingsVersion({ version: '7' }), null);
  assert.equal(academicSettingsPayload({ expectedVersion: 7 }, { gradingOnly: true }).expectedVersion, 7);
});

test('grading-only saves never send hidden dates or mutate existing settings', () => {
  const settings = { gradingBands: [{ grade: 1 }], resumptionDate: '2026-10-26', vacationDate: '' };
  assert.deepEqual(academicSettingsPayload(settings, { gradingOnly: true }), { gradingBands: [{ grade: 1 }] });
  assert.equal(settings.resumptionDate, '2026-10-26');
});

test('full settings omit empty optional dates and preserve supplied dates', () => {
  assert.deepEqual(academicSettingsPayload({ resumptionDate: '', vacationDate: '  ' }), {});
  assert.deepEqual(academicSettingsPayload({ resumptionDate: null }), {});
  assert.deepEqual(academicSettingsPayload({ resumptionDate: '2026-10-26' }), { resumptionDate: '2026-10-26' });
});
