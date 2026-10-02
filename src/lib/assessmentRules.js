const numberOrNull = value => value === null || value === undefined || value === '' ? null : Number(value);
export function rawAssessment(entry) {
  const max = Number(entry.classTestMax ?? 100);
  if (!Number.isFinite(max) || max <= 0) throw new Error('A positive class-test maximum is required.');
  const marks = [entry.arrivalTest, entry.test1, entry.test2, entry.test3].map(numberOrNull);
  const hasBreakdown = marks.every(value => value !== null);
  if (!hasBreakdown && marks.some(value => value !== null)) throw new Error('Supply all four class tests or a raw class percentage.');
  if (hasBreakdown && marks.some(value => !Number.isFinite(value) || value < 0 || value > max)) throw new Error(`Class tests must be between 0 and ${max}.`);
  const classScore = hasBreakdown ? marks.reduce((a, b) => a + b, 0) / (max * 4) * 100 : numberOrNull(entry.rawClassScore ?? entry.classScore);
  const examScore = numberOrNull(entry.rawExamScore ?? entry.examScore);
  if (classScore === null || !Number.isFinite(classScore) || classScore < 0 || classScore > 100) throw new Error('Raw class score must be between 0 and 100.');
  if (examScore !== null && (!Number.isFinite(examScore) || examScore < 0 || examScore > 100)) throw new Error('Raw exam score must be between 0 and 100.');
  return { classScore, examScore, max, marks, hasBreakdown };
}
export function normalizeAssessment(raw = {}) {
  const score = Array.isArray(raw.scores) ? (raw.scores[0] || {}) : raw;
  const breakdown = score.class_breakdown || raw.class_breakdown || {};
  const field = (snake, camel) => score[snake] ?? score[camel] ?? raw[snake] ?? raw[camel];
  const rawClass = field('raw_class_score', 'rawClassScore') ?? (raw.score_format === 'raw' ? score.class_score : null);
  const rawExam = field('raw_exam_score', 'rawExamScore') ?? (raw.score_format === 'raw' ? score.exam_score : null);
  const hasExam = field('has_exam_score', 'hasExamScore') ?? (rawExam !== null && rawExam !== undefined);
  const subClass = field('sub_class', 'subClass') || raw.sub_class_level || '';
  return {
    id: score.id || score._id,
    backendId: score.id || score._id,
    entryKey: raw.entry_key || raw.entryKey,
    studentId: field('student_id', 'studentId') || score.student_code,
    studentName: field('student_name', 'studentName'),
    classLevel: field('class_level', 'classLevel'), subClass, subClassLevel: subClass,
    subject: score.subject || raw.subject, category: score.category || raw.category,
    instructor: score.instructor || raw.instructor, term: score.term || raw.term,
    year: field('academic_year', 'academicYear') || raw.year,
    examDate: field('exam_date', 'examDate'),
    arrivalTest: breakdown.arrival_test ?? breakdown.arrivalTest ?? field('arrival_test', 'arrivalTest') ?? null,
    test1: breakdown.class_test_1 ?? breakdown.test1 ?? field('class_test_1', 'test1') ?? null,
    test2: breakdown.class_test_2 ?? breakdown.test2 ?? field('class_test_2', 'test2') ?? null,
    test3: breakdown.class_test_3 ?? breakdown.test3 ?? field('class_test_3', 'test3') ?? null,
    classTestMax: breakdown.class_test_max ?? field('class_test_max', 'classTestMax') ?? 100,
    classTestTotal: field('class_test_total', 'classTestTotal') ?? null,
    rawClassScore: numberOrNull(rawClass), rawExamScore: numberOrNull(rawExam),
    classScore: field('class_score', 'classScore') ?? null,
    examScore: hasExam ? numberOrNull(rawExam) : null,
    examScoreConverted: hasExam ? (field('exam_score_converted', 'examScoreConverted') ?? score.exam_score ?? null) : null,
    score: hasExam ? (field('total_score', 'score') ?? null) : null,
    grade: hasExam ? (score.grade ?? raw.grade ?? '') : '',
    remarks: score.remarks ?? raw.remarks ?? '',
    teacherNote: field('teacher_note', 'teacherNote') || '',
    hasClassScore: field('has_class_score', 'hasClassScore') ?? true,
    hasExamScore: Boolean(hasExam),
    status: score.status || raw.status || (hasExam ? 'Pending Approval' : 'Class Score Recorded'),
    updatedAt: field('updated_at', 'updatedAt'),
  };
}
export function validateAcademicSettings(settings) {
  const weights = [settings.classTestWeight, settings.examWeight].map(Number);
  if (weights.some(w => !Number.isFinite(w) || w < 0 || w > 100) || Math.abs(weights[0] + weights[1] - 100) > 0.001) throw new Error('Class and exam weights must total 100%.');
  if (!settings.academicYear || !settings.academicTerm) throw new Error('Choose an academic year and term.');
  if (settings.resumptionDate && settings.vacationDate && settings.resumptionDate > settings.vacationDate) throw new Error('Vacation must not be before resumption.');
  if (!Array.isArray(settings.gradingBands) || !settings.gradingBands.length) throw new Error('School-approved grading bands are missing. Ask the school administrator to configure them before saving.');
  return settings;
}
