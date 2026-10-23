const academicYearOf = record => record?.academicYear || record?.academic_year || '';
const academicTermOf = record => record?.academicTerm || record?.academic_term || record?.term || '';

export function rosterAcademicTerm(student = {}, registrations = [], applications = [], settings = {}) {
  const year = rosterAcademicYear(student, registrations, applications, settings);
  const identities = [student.id, student.studentUuid, student.studentId].filter(Boolean).map(String);
  const registration = registrations.filter(record =>
    [record.studentId, record.student_id, record.student_uuid, record.student?.id]
      .filter(Boolean).some(identity => identities.includes(String(identity)))
    && !/cancel|declin|withdraw|inactive/i.test(String(record.status || ''))
    && academicYearOf(record) === year && academicTermOf(record))
    .sort((first, second) => String(academicTermOf(second)).localeCompare(String(academicTermOf(first)), undefined, { numeric: true }))[0];
  const application = applications.find(record => student.applicationId && String(record.id) === String(student.applicationId));
  const source = [registration, student, application, settings].find(record =>
    record && (!academicYearOf(record) || academicYearOf(record) === year) && academicTermOf(record));
  const term = academicTermOf(source);
  const number = String(term).trim().match(/^(?:term\s*)?([123])$/i)?.[1];
  return number ? `Term ${number}` : term;
}

export function rosterAcademicYear(student = {}, registrations = [], applications = [], settings = {}) {
  const identities = [student.id, student.studentUuid, student.studentId].filter(Boolean).map(String);
  const registration = registrations.filter(record =>
    [record.studentId, record.student_id, record.student_uuid, record.student?.id]
      .filter(Boolean).some(identity => identities.includes(String(identity)))
    && !/cancel|declin|withdraw|inactive/i.test(String(record.status || ''))
    && academicYearOf(record))
    .sort((first, second) => String(academicYearOf(second)).localeCompare(String(academicYearOf(first))))[0];
  const application = applications.find(record => student.applicationId && String(record.id) === String(student.applicationId));
  return academicYearOf(registration) || academicYearOf(student) || academicYearOf(application) || academicYearOf(settings);
}
