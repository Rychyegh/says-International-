export const SCHOOL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const minutes = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;

export function timetableErrors(entries) {
  const errors = [];
  entries.forEach((entry, index) => {
    if (!entry.class_id || !entry.teacher_id || !entry.subject_id || !entry.room_id || !SCHOOL_DAYS.includes(entry.day)) errors.push(`Lesson ${index + 1}: select a class, subject, teacher, room and day.`);
    if (!(minutes(entry.start_time) < minutes(entry.end_time))) errors.push(`Lesson ${index + 1}: end time must be after start time (HH:mm).`);
    entries.slice(0, index).forEach((other, previous) => {
      if (entry.day !== other.day || !(minutes(entry.start_time) < minutes(other.end_time) && minutes(other.start_time) < minutes(entry.end_time))) return;
      const shared = ['class', 'teacher', 'room'].filter(key => entry[`${key}_id`] && entry[`${key}_id`] === other[`${key}_id`]);
      if (shared.length) errors.push(`Lessons ${previous + 1} and ${index + 1} overlap: same ${shared.join(', ')}.`);
    });
  });
  return errors;
}

export function validateTimetableWorkspace(value) {
  if (value?.contract_version !== 1 || !value.id || value.revision == null || !Array.isArray(value.entries) || !value.catalogs || !['classes', 'teachers', 'subjects', 'rooms'].every(key => Array.isArray(value.catalogs[key]))) {
    throw new Error('The backend does not yet support the timetable publishing contract. Please contact the backend developer.');
  }
  return value;
}

export function validatePublishedTimetable(value) {
  if (value?.contract_version !== 1 || !Array.isArray(value.entries) || value.entries.some(entry => entry.status !== 'PUBLISHED')) throw new Error('The backend returned an invalid published timetable.');
  return value;
}
