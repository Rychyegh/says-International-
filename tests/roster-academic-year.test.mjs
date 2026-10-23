import test from 'node:test';
import assert from 'node:assert/strict';
import { rosterAcademicYear, rosterAcademicTerm } from '../src/lib/rosterAcademicYear.js';

test('roster term uses the latest matching registration and normalizes numeric terms', () => {
  assert.equal(rosterAcademicTerm({ id: 'one' }, [
    { student_id: 'one', academic_year: '2026/2027', term: '1' },
    { student_id: 'one', academic_year: '2026/2027', term: '2' },
    { student_id: 'two', academic_year: '2026/2027', term: '3' },
  ]), 'Term 2');
});

test('roster term falls back without inventing a term or using a different year', () => {
  assert.equal(rosterAcademicTerm({}, [], [], { academicYear: '2026/2027', academicTerm: 'Term 1' }), 'Term 1');
  assert.equal(rosterAcademicTerm({ academicYear: '2025/2026' }, [], [], { academicYear: '2026/2027', academicTerm: 'Term 1' }), '');
  assert.equal(rosterAcademicTerm({}), '');
});

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
