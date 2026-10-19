const yearOf = row => row?.academicYear || row?.academic_year || row?.year || '';
const termOf = row => row?.academicTerm || row?.academic_term || row?.term || '';
const normalizedTerm = value => {
  const number = String(value || '').match(/(?:term\s*)?([123])/i)?.[1];
  return number ? `Term ${number}` : '';
};
export function billingPeriod(student = {}, registrations = [], applications = [], settings = {}) {
  const identities = [student.id, student.studentUuid, student.studentId].filter(Boolean).map(String);
  const registered = registrations.filter(row =>
    [row.studentId, row.student_id, row.student_uuid, row.student?.id].filter(Boolean).some(id => identities.includes(String(id)))
    && !/cancel|declin|withdraw|inactive/i.test(String(row.status || '')) && yearOf(row))
    .sort((a,b) => `${yearOf(b)} ${normalizedTerm(termOf(b))}`.localeCompare(`${yearOf(a)} ${normalizedTerm(termOf(a))}`))[0];
  const application = applications.find(row => student.applicationId && String(row.id) === String(student.applicationId));
  const source = registered || (yearOf(student) ? student : application) || settings;
  return {
    academicYear: yearOf(source) || yearOf(settings),
    term: normalizedTerm(termOf(source)) || normalizedTerm(termOf(settings)) || 'Term 1',
  };
}
export function billingPeriodLabel(period) {
  return `${period.term} · ${period.academicYear || 'Academic year not set'}`;
}
