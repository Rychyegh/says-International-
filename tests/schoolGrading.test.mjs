import test from 'node:test';
import assert from 'node:assert/strict';
import { proficiencyRemark, proficiencyGrade, SCHOOL_GRADING_BANDS } from '../src/lib/schoolGrading.js';

test('proficiency remarks follow all nine school thresholds', () => {
  for (const band of SCHOOL_GRADING_BANDS) {
    assert.equal(proficiencyRemark(band.min), band.remarks);
    assert.equal(proficiencyGrade(band.min), band.grade);
    assert.equal(proficiencyRemark(band.max), band.remarks);
  }
  assert.equal(proficiencyRemark(79.99), 'Proficient');
  assert.equal(proficiencyGrade(68.38), '3');
  assert.equal(proficiencyRemark(68.38), 'Approaching Proficient');
  assert.equal(proficiencyGrade(96.25), '1');
  for (const value of [null, undefined, '', 'N/A', -1, 101]) assert.equal(proficiencyRemark(value), 'N/A');
});
