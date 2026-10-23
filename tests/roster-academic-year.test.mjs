import test from 'node:test';
import assert from 'node:assert/strict';
import { rosterAcademicYear } from '../src/lib/rosterAcademicYear.js';

test('roster resolves the latest active registration for the student only', () => {
  assert.equal(rosterAcademicYear({ id: 'one' }, [
    { student_id: 'two', academic_year: '2030/2031' },
    { student_id: 'one', academic_year: '2025/2026' },
    { student_id: 'one', academic_year: '2026/2027' },
    { student_id: 'one', academic_year: '2027/2028', status: 'Cancelled' },
  ]), '2026/2027');
});

test('roster falls back through student, linked application and configured school year', () => {
  const applications = [{ id: 'application', academic_year: '2025/2026' }];
  const settings = { academicYear: '2026/2027' };
  assert.equal(rosterAcademicYear({ academicYear: '2024/2025' }, [], applications, settings), '2024/2025');
  assert.equal(rosterAcademicYear({ applicationId: 'application' }, [], applications, settings), '2025/2026');
  assert.equal(rosterAcademicYear({}, [], applications, settings), '2026/2027');
  assert.equal(rosterAcademicYear({ enrollmentYear: '2020', studentId: 'REMALJ-2020' }), '');
});
