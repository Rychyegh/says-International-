// Shared identity and approval rules. Display labels must never confer permission.
export function normalizePvItemStatus(value) {
  const status = String(value || '').trim().toLowerCase().replace(/_/g, '-');
  if (['validated', 'approved', 'pre-audited', 'pre-audited & approved', 'pre-audit approve pv'].includes(status)) return 'Validated';
  if (['declined', 'rejected'].includes(status)) return 'Declined';
  if (['cancel pv', 'cancelled', 'canceled'].includes(status)) return 'Cancel PV';
  if (status === 'non-accrual') return 'Non-accrual';
  if (status === 'postponed') return 'Postponed';
  return 'Pending approval';
}
export const isApprovedItem = (status) => normalizePvItemStatus(status) === 'Validated';
export function payableAmount(voucher) {
  if (Array.isArray(voucher?.items) && voucher.items.length) {
    return Math.round(voucher.items.filter(i => isApprovedItem(i.status)).reduce((total, i) => total + (Number(i.totalAmount ?? i.total_amount ?? i.total ?? i.amount) || 0), 0) * 100) / 100;
  }
  return isApprovedItem(voucher?.status) ? Number(voucher?.payableTotal ?? voucher?.total ?? voucher?.amount ?? 0) : 0;
}
export function voucherIdentityKey(voucher) {
  if (voucher?.id) return `id-${String(voucher.id).trim().toLowerCase()}`;
  return `no-${String(voucher?.pvNo || voucher?.pv_number || '').replace(/\s+/g, '').toUpperCase()}`;
}
export function pvNosMatch(a, b) {
  const normalize = value => String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^PV-/, '');
  return Boolean(normalize(a) && normalize(a) === normalize(b));
}
export function resolveFee(fees, {id, studentId}) {
  const exact = id && fees.find(f => String(f.id) === String(id));
  if (exact) return exact;
  const key = studentId || id;
  const matches = key ? fees.filter(f => String(f.studentId) === String(key)) : [];
  if (matches.length !== 1) throw new Error('Select one existing fee invoice before recording a payment.');
  return matches[0];
}
export function stripCredentials(value) {
  if (Array.isArray(value)) return value.map(stripCredentials);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/password|passcode|(^|_)pin$|token|secret/i.test(key))
    .map(([key, item]) => [key, stripCredentials(item)]));
}
export function portalForRole(role) {
  const normalized = String(role || '').toLowerCase().replace(/[ -]/g, '_');
  if (['admin', 'head_admin', 'sub_admin', 'super_admin'].includes(normalized)) return 'admin';
  if (['teacher', 'class_teacher', 'subject_teacher', 'staff'].includes(normalized)) return 'teacher';
  return ['parent', 'student', 'accountant'].includes(normalized) ? normalized : '';
}
export function studentBelongsToParent(student, parent) {
  const ids = [student?.id, student?.studentId].filter(Boolean).map(String);
  return ids.some(id => (parent?.linkedStudentIds || []).map(String).includes(id));
}

// Resolve API projections by immutable IDs; names are labels, never identity keys.
export function applicationLinksStudent(app, student) {
  if (student.applicationId || student.application_id) return String(student.applicationId || student.application_id) === String(app.id);
  return Boolean(app.officeStudentID && String(app.officeStudentID) === String(student.studentId));
}
export function buildStudentOptions(students = [], fees = []) {
  const options = new Map();
  const aliases = new Map();
  for (const student of students) {
    const id = String(student.studentId || student.id || '').trim();
    if (!id) continue;
    options.set(id, { id, uuid: student.id, name: student.fullName || student.name, classLevel: student.level || '' });
    for (const alias of [student.id, student.studentId]) if (alias) aliases.set(String(alias), id);
  }
  for (const fee of fees) {
    if (!fee.studentId) continue;
    const id = aliases.get(String(fee.studentId)) || String(fee.studentId);
    if (!options.has(id)) options.set(id, { id, name: fee.studentName, classLevel: fee.classLevel || '' });
  }
  return [...options.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}
