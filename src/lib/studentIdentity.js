const clean = value => String(value || '').trim().toLowerCase();
const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// API projections may expose a student UUID as id or student_id. Names,
// school email and guardian contact details are never identity keys.
export function studentIdentityKeys(student = {}) {
  const keys = new Set();
  for (const value of [student.id, student.uuid, student.backendId, student.studentUuid, student.student_uuid]) {
    const key = clean(value);
    if (key && !key.includes('@')) keys.add(`student:${key}`);
  }
  for (const value of [student.studentId, student.student_id, student.student_id_code, student.student_code, student.admission_no, student.admissionNo]) {
    const key = clean(value);
    if (key && !key.includes('@')) keys.add(`${uuid(key) ? 'student' : 'code'}:${key}`);
  }
  const app = clean(student.applicationId || student.application_id);
  if (app) keys.add(`application:${app}`);
  return keys;
}

export function sameStudentIdentity(left, right) {
  const keys = studentIdentityKeys(left);
  return [...studentIdentityKeys(right)].some(key => keys.has(key));
}

export function studentDisplayCode(student = {}, fallback = '') {
  const values = [student.student_id_code, student.student_code, student.admission_no, student.admissionNo, student.studentId, student.student_id, fallback]
    .map(value => String(value || '').trim()).filter(value => value && !value.includes('@') && !uuid(value));
  return values.find(value => /^(REMALJ|RCIS)-\d{4}-/i.test(value)) || values[0] || '';
}
