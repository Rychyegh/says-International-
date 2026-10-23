const academicYearOf = record => record?.academicYear || record?.academic_year || '';

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
