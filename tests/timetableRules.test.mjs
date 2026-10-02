import test from 'node:test';
import assert from 'node:assert/strict';
import { timetableErrors, validateTimetableWorkspace, validatePublishedTimetable } from '../src/lib/timetableRules.js';
const lesson = { class_id: 'c1', teacher_id: 't1', subject_id: 's1', room_id: 'r1', day: 'Monday', start_time: '08:00', end_time: '09:00' };
test('rejects overlapping class, teacher or room independently', () => {
  for (const key of ['class_id', 'teacher_id', 'room_id']) {
    const next = { ...lesson, class_id: 'c2', teacher_id: 't2', room_id: 'r2', start_time: '08:30', end_time: '10:00', [key]: lesson[key] };
    assert.equal(timetableErrors([lesson, next]).length, 1);
  }
});
test('allows adjacent periods, different days and independent resources', () => {
  assert.deepEqual(timetableErrors([lesson, { ...lesson, start_time: '09:00', end_time: '10:00' }]), []);
  assert.deepEqual(timetableErrors([lesson, { ...lesson, day: 'Tuesday' }]), []);
  assert.deepEqual(timetableErrors([lesson, { ...lesson, class_id: 'c2', teacher_id: 't2', room_id: 'r2' }]), []);
});
test('rejects enclosed overlap, reversed times, malformed times and missing identity', () => {
  assert.ok(timetableErrors([lesson, { ...lesson, start_time: '07:00', end_time: '10:00' }]).length);
  for (const patch of [{ end_time: '07:00' }, { end_time: '08:00' }, { start_time: '8am' }, { start_time: '25:00' }, { teacher_id: '' }]) assert.ok(timetableErrors([{ ...lesson, ...patch }]).length);
});
test('rejects legacy workspace responses and unpublished reader results', () => {
  assert.throws(() => validateTimetableWorkspace([]));
  assert.throws(() => validatePublishedTimetable({ contract_version: 1, entries: [{ status: 'DRAFT' }] }));
  assert.deepEqual(validatePublishedTimetable({ contract_version: 1, entries: [] }).entries, []);
});
