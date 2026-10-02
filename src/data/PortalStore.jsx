import { sameStudentIdentity, studentDisplayCode } from '../lib/studentIdentity.js';
import { validateAcademicSettings } from '../lib/assessmentRules.js';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, extractStudentList, extractExamRegistrations, mapExamRegistration, getUserFullName, hasLiveDatabaseSession, getAuthToken, getAuthUser, mapScoreSheetEntry } from '../services/api';
import { registerCustomSubClass, getCustomSubClassMap } from './classStructure';
import { pvNosMatch, isApprovedItem, normalizePvItemStatus, payableAmount, resolveFee, stripCredentials, portalForRole } from '../lib/recordRules.js';
export { pvNosMatch } from '../lib/recordRules.js';

const SNAPSHOT_KEY = 'says-session-snapshot-v1';
const SNAPSHOT_FIELDS = ['applications', 'onboardedStudents', 'studentFees', 'feeAccounts', 'paymentVouchers', 'serviceProviders', 'academicSettings', 'timetable', 'results', 'reportRequests', 'incidents', 'assetTasks', 'messages', 'assignments', 'teacherDirectory', 'teachingAssignments', 'classLevels', 'subjects', 'busRoutes', 'definedBills', 'semesterRegistrations', 'examRegistrations'];
function snapshotScope() {
  const user = getAuthUser();
  return user?.id ? JSON.stringify([user.id, user.role, user.schoolId || user.school_id || user.tenantId || '']) : '';
}
function persistSnapshot(data) {
  try {
    if (!getAuthToken() || !snapshotScope()) return;
    const records = Object.fromEntries(SNAPSHOT_FIELDS.map(key => [key, data[key]]));
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ scope: snapshotScope(), savedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt).getTime() : Date.now(), records: stripCredentials(records) }));
  } catch { /* Storage may be disabled or full; API reads still work. */ }
}

export function classLabelsMatch(assigned, target) {
  const left = String(assigned || '').trim().toLowerCase();
  const right = String(target || '').trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.startsWith(right) && !/\d/.test(left.slice(right.length))) return true;
  if (right.startsWith(left) && !/\d/.test(right.slice(left.length))) return true;
  return false;
}

export function findTeachingAssignment(assignments = [], person = {}) {
  const keys = [person.staffId, person.staff_id, person.id, person.userId, person.email, person.name, person.fullName, person.teacherName]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  return (assignments || []).find((item) => {
    const itemKeys = [item.staffId, item.userId, item.email, item.teacherName, item.id]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    return itemKeys.some((value) => keys.includes(value));
  }) || null;
}

export function teachersForClass(assignments = [], classLabel = '') {
  return (assignments || []).filter((item) => (item.classes || []).some((name) => classLabelsMatch(name, classLabel)));
}

function splitStoredList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function mapTeachingAssignment(item) {
  if (!item || typeof item !== 'object') return null;
  const classes = splitStoredList(
    item.classes || item.assigned_classes || item.assignedClasses || item.class_assigned || item.classAssigned || item.assigned_class || item.assignedClass
  );
  const subjects = splitStoredList(item.subjects || item.assigned_subjects || item.assignedSubjects || item.subject);
  const staffId = String(item.staffId || item.staff_id || item.staff_code || '').trim();
  const teacherName = String(item.teacherName || item.teacher_name || item.full_name || item.fullName || item.name || '').trim();
  const userId = String(item.userId || item.user_id || '').trim();
  if (!staffId && !teacherName && !userId) return null;
  return {
    id: item.id || userId || staffId || teacherName,
    staffId,
    userId,
    teacherName,
    role: item.role || '',
    email: item.email || '',
    classes,
    subjects,
  };
}

function extractTeachingAssignments(raw) {
  const list = Array.isArray(raw) ? raw
    : Array.isArray(raw?.assignments) ? raw.assignments
    : Array.isArray(raw?.teaching_assignments) ? raw.teaching_assignments
    : Array.isArray(raw?.data) ? raw.data
    : [];
  return list.map(mapTeachingAssignment).filter(Boolean);
}

function extractCatalogNames(raw) {
  const list = Array.isArray(raw) ? raw
    : Array.isArray(raw?.classes) ? raw.classes
    : Array.isArray(raw?.items) ? raw.items
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw?.results) ? raw.results
    : [];
  return list.map((item) => {
    if (typeof item === 'string') return item.trim();
    return String(item?.name || item?.class_name || item?.title || '').trim();
  }).filter(Boolean);
}

function extractAccountList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.users)) return raw.data.users;
  return [];
}

export function directoryProfileFromUser(user = {}) {
  const raw = String(user.role || '').trim().toLowerCase();
  const designation = String(user.teacherDesignation || user.teacher_designation || user.designation || '').trim().toLowerCase();
  let role = '';
  let subject = user.department || user.subject || '';
  if (designation === 'class_teacher' || raw === 'class_teacher' || raw === 'class teacher') {
    role = 'Class Teacher';
    subject = subject || 'Class Teacher';
  } else if (raw === 'teacher' || raw === 'teaching staff' || raw === 'subject teacher') {
    role = 'Subject Teacher';
  } else if (raw === 'admin' || raw === 'head_admin' || raw === 'head administrator') {
    role = 'Head Administrator';
    subject = subject || 'Administration';
  } else if (raw === 'sub_admin' || raw === 'sub-administrator' || raw === 'sub administrator') {
    role = 'Sub-Administrator';
    subject = subject || 'Administration';
  } else if (raw === 'accountant' || raw === 'finance & accounts') {
    role = 'Accountant';
    subject = subject || 'Administration';
  } else if (raw === 'security_driver' || raw === 'transport / security') {
    role = 'Transport / Security';
    subject = subject || 'Transport';
  } else {
    return null;
  }
  const name = user.fullName || user.full_name || user.name || '';
  const email = String(user.email || '').trim();
  const staffId = String(user.staffId || user.staff_id || user.staff_code || '').trim();
  if (!name && !email && !staffId) return null;
  const inactive = user.is_active === false || /suspend|inactive|offboard/i.test(String(user.status || ''));
  return {
    id: user.id || staffId || email,
    userId: user.id || user._id || '',
    staffRecordId: '',
    staffId,
    name: name || email,
    role,
    subject,
    mainClass: user.mainClass || user.main_class || '',
    classAssigned: user.mainClass || user.main_class || formatClassToBasic(user.assignedClass || user.assigned_class || user.class_assigned || user.classLevel || user.class_level || ''),
    email,
    phone: user.phone || user.phone_number || user.phoneNumber || '',
    status: inactive ? 'Offboarded' : 'Active',
    photo: '👤',
    joinedDate: user.createdAt || user.created_at || '',
  };
}

function mergeDirectoryAccount(list, profile) {
  if (!profile) return;
  const email = String(profile.email || '').trim().toLowerCase();
  const staffId = String(profile.staffId || '').trim().toLowerCase();
  const index = list.findIndex((person) => {
    const personEmail = String(person.email || '').trim().toLowerCase();
    const personStaffId = String(person.staffId || '').trim().toLowerCase();
    return (email && personEmail === email) || (staffId && personStaffId === staffId);
  });
  if (index >= 0) {
    list[index] = {
      ...list[index],
      name: profile.name || list[index].name,
      role: profile.role,
      subject: profile.subject || list[index].subject,
      classAssigned: profile.classAssigned || list[index].classAssigned,
      phone: profile.phone || list[index].phone,
      email: profile.email || list[index].email,
      staffId: profile.staffId || list[index].staffId,
      userId: profile.userId || list[index].userId || '',
      staffRecordId: list[index].staffRecordId || '',
      status: profile.status || list[index].status,
    };
    return;
  }
  list.push(profile);
}

function mergeByKey(arrA = [], arrB = [], keyFn) {
  const map = new Map();
  (arrA || []).forEach(item => {
    const k = String(keyFn(item) || '').toLowerCase().trim();
    if (k) map.set(k, item);
  });
  (arrB || []).forEach(item => {
    const k = String(keyFn(item) || '').toLowerCase().trim();
    if (k) {
      const prev = map.get(k);
      if (!prev) {
        map.set(k, item);
      } else {
        const prevTime = new Date(prev.updatedAt || prev.submittedAt || prev.lastSyncedAt || 0).getTime();
        const itemTime = new Date(item.updatedAt || item.submittedAt || item.lastSyncedAt || 0).getTime();
        if (itemTime > prevTime) {
          map.set(k, { ...prev, ...item });
        } else {
          map.set(k, { ...item, ...prev });
        }
      }
    }
  });
  return Array.from(map.values());
}

export function formatClassToBasic(level) {
  if (!level) return '';
  const str = String(level).trim();
  // Check Grade 1 to 9 (e.g. "Grade 1", "Grade 4", "Grade 7 (JHS 1)")
  const gradeMatch = str.match(/grade\s*([1-9])/i);
  if (gradeMatch) return `Basic ${gradeMatch[1]}`;
  // Check JHS 1 to 3 (e.g. "JHS 1", "JHS 2", "JHS 3", "J.H.S 1")
  const jhsMatch = str.match(/j\.?h\.?s\.?\s*([1-3])/i);
  if (jhsMatch) {
    const num = parseInt(jhsMatch[1], 10);
    return `Basic ${num + 6}`; // JHS 1 -> Basic 7, JHS 2 -> Basic 8, JHS 3 -> Basic 9
  }
  // Check standalone "JHS"
  if (/^j\.?h\.?s\.?$/i.test(str)) {
    return 'Basic 7';
  }
  // Check Primary 1 to 6
  const primMatch = str.match(/primary\s*([1-6])/i);
  if (primMatch) return `Basic ${primMatch[1]}`;
  return str;
}

function normalizePersonName(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isSyntheticLocalId(id) {
  const s = String(id || '').trim();
  return !s
    || /^stu(-bulk)?-/i.test(s)
    || /^fee-(acc-)?/i.test(s)
    || /^pv-\d+$/i.test(s);
}

export function isBackendUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function failedDatabaseAction(action, error) {
  const msg = String(error?.message || error || '').trim();
  if (!hasLiveDatabaseSession() || /401|403|unauthorized|jwt|token/i.test(msg)) {
    return `${action} failed: you are not signed in to the live database. Sign in again, then retry.`;
  }
  if (/failed to fetch|networkerror|offline|load failed|network request failed/i.test(msg)) {
    return `${action} failed: you appear to be offline. Check your connection and try again.`;
  }
  if (!msg || /uuid|no database record/i.test(msg)) {
    return `${action} failed: no database record id (UUID) is available.`;
  }
  return `${action} failed: ${msg}`;
}

function requireLiveDatabase(action) {
  if (!hasLiveDatabaseSession()) {
    throw new Error(failedDatabaseAction(action));
  }
}

function requireBackendUuid(id, action) {
  if (isBackendUuid(id)) return String(id).trim();
  if (id && !isSyntheticLocalId(id) && String(id).length >= 8) return String(id).trim();
  throw new Error(failedDatabaseAction(action, 'no UUID'));
}

export function normalizeRfidUid(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s:_-]/g, '')
    .replace(/^0+/, '')
    .trim();
}

export function rfidUidsMatch(a, b) {
  const left = normalizeRfidUid(a);
  const right = normalizeRfidUid(b);
  return Boolean(left && right && left === right);
}

const PLACEHOLDER_GUARDIAN_PHONES = new Set([
  '0541769621',
  '0241112222',
  '0240000000',
  '233241112222',
  '2332411122222',
]);

export function isPlaceholderGuardianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return !digits || PLACEHOLDER_GUARDIAN_PHONES.has(digits);
}

export function resolveGuardianPhone(...sources) {
  for (const source of sources) {
    if (source == null || source === false) continue;
    if (typeof source !== 'object') {
      const text = String(source || '').trim();
      if (text && !isPlaceholderGuardianPhone(text)) return text;
      continue;
    }
    const candidates = [
      source.custom,
      source.guardianPhone,
      source.guardian_phone,
      source.fatherPhone,
      source.father_phone,
      source.motherPhone,
      source.mother_phone,
      source.phone,
      source.contactPhone,
      source.payerPhone,
    ];
    for (const value of candidates) {
      const text = String(value || '').trim();
      if (text && !isPlaceholderGuardianPhone(text)) return text;
    }
  }
  return '';
}

function isPlaceholderRfid(value) {
  return /^card-\d{1,4}$/i.test(String(value || '').trim());
}

export function preferIssuedRfid(...values) {
  const codes = values.map((v) => String(v || '').trim()).filter(Boolean);
  return codes.find((c) => !isPlaceholderRfid(c)) || codes[0] || '';
}

function applicationLearnerName(app = {}) {
  return [app.firstName, app.otherNames, app.surname]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
    || app.learner || app.learner_name || app.fullName || '';
}

function applicationMatchesStudent(app, student) {
  if (!app || !student) return false;
  if (student.applicationId && String(app.id) === String(student.applicationId)) return true;
  if (app.officeStudentID && student.studentId && String(app.officeStudentID).toLowerCase() === String(student.studentId).toLowerCase()) return true;
  return false;
}

function studentDraftFromApplication(app = {}) {
  const learnerName = applicationLearnerName(app);
  return {
    fullName: learnerName,
    firstName: app.firstName || '',
    otherNames: app.otherNames || '',
    surname: app.surname || '',
    dob: app.dob || app.dateOfBirth || '',
    gender: app.sex || app.gender || 'Not Specified',
    level: formatClassToBasic(app.level || app.applyingClass || 'Basic 1'),
    classSection: app.classSection || app.subClass || app.officeFormAssigned || 'A',
    guardianName: blankGuardianText(app.fatherName) || blankGuardianText(app.motherName) || blankGuardianText(app.guardian) || blankGuardianText(app.guardianName),
    guardianEmail: (() => {
      const named = blankGuardianText(app.fatherName) || blankGuardianText(app.motherName) || blankGuardianText(app.guardian) || blankGuardianText(app.guardianName);
      const raw = app.fatherEmail || app.motherEmail || app.guardianEmail || '';
      if (!named && isGeneratedGuardianEmail(raw, app)) return '';
      return raw;
    })(),
    guardianPhone: resolveGuardianPhone(app),
    fatherName: app.fatherName || '',
    fatherPhone: app.fatherPhone || '',
    motherName: app.motherName || '',
    motherPhone: app.motherPhone || '',
    homeAddress: app.residentialAddress || app.homeAddress || 'Bogoso',
    rfidCardCode: preferIssuedRfid(app.rfidCardCode, app.formData?.rfidCardCode),
    applicationId: app.id || '',
    studentId: app.officeStudentID || app.studentId || '',
    status: /reject|declin|withdraw|cancel/i.test(String(app.status || '')) ? 'Inactive' : 'Active',
  };
}

function mergeRosterWithApplications(students = [], applications = []) {
  let roster = [...(students || [])];
  for (const app of applications || []) {
    const draft = studentDraftFromApplication(app);
    if (!draft.fullName) continue;
    const match = findStudentForUpsert(roster, draft);
    if (match) {
      roster = roster.map((s) => (
        studentsAreSamePerson(s, match)
          ? mergeStudentRecords(s, {
            ...draft,
            id: s.id,
            studentId: s.studentId || draft.studentId,
          })
          : s
      ));
    }
  }
  return deduplicateStudents(roster);
}

function applicationsAreSame(a = {}, b = {}) {
  if (!a || !b) return false;
  if (a.id && b.id) return String(a.id) === String(b.id);
  return false;
}

function findMatchingApplication(list = [], candidate = {}) {
  if (!candidate) return null;
  if (candidate.id) {
    const byId = (list || []).find((app) => String(app.id) === String(candidate.id));
    if (byId) return byId;
  }
  return (list || []).find((app) => applicationsAreSame(app, candidate)) || null;
}

function overwriteApplicationInList(list = [], incoming, { ids = [], previous = null } = {}) {
  const keepId = incoming?.id;
  const matchIds = [...new Set([keepId, ...ids].map((value) => String(value || '').trim()).filter(Boolean))];
  let replaced = false;
  const next = [];
  for (const app of list || []) {
    const sameId = matchIds.includes(String(app.id || ''))
      || matchIds.includes(String(app.formData?.id || ''));
    const samePrevious = previous && applicationsAreSame(app, previous);
    const sameIncoming = incoming && applicationsAreSame(app, incoming);
    if (sameId || samePrevious || sameIncoming) {
      if (replaced) continue;
      next.push(mergeApplicationRecords(app, { ...incoming, id: keepId || app.id }));
      replaced = true;
      continue;
    }
    next.push(app);
  }
  if (!replaced && incoming) next.unshift(incoming);
  return deduplicateApplications(next);
}

function mergeApplicationRecords(prev = {}, incoming = {}) {
  const prevTime = new Date(prev.updatedAt || prev.submittedAt || 0).getTime() || 0;
  const incomingTime = new Date(incoming.updatedAt || incoming.submittedAt || 0).getTime() || 0;
  const older = incomingTime >= prevTime ? prev : incoming;
  const newer = incomingTime >= prevTime ? incoming : prev;
  return {
    ...older,
    ...newer,
    id: preferCanonicalId(incoming.id, prev.id),
    formData: { ...(older.formData || {}), ...(newer.formData || {}) },
    rfidCardCode: preferIssuedRfid(newer.rfidCardCode, older.rfidCardCode, newer.formData?.rfidCardCode, older.formData?.rfidCardCode),
    learner: newer.learner || older.learner,
    fullName: newer.fullName || older.fullName || newer.learner || older.learner,
    status: newer.status || older.status,
  };
}

function blankGuardianText(value) {
  const text = String(value || '').trim();
  if (!text || /^(parent\s*\/?\s*guardian|parent|guardian|n\/a|na|—|-)$/i.test(text)) return '';
  return text;
}

function isGeneratedGuardianEmail(email, app = {}) {
  const text = String(email || '').trim().toLowerCase();
  if (!text) return false;
  if (text === 'parent@example.com' || text === 'parent@remaljcarewell.edu.gh') return true;
  if (/^parent\.[a-z0-9.]+@remaljcarewell\.edu\.gh$/.test(text)) return true;
  const bits = [app.surname, app.learner, app.firstName, app.fullName, app.learner_name]
    .map((part) => String(part || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
  return bits.some((bit) => text === `${bit}@remaljcarewell.edu.gh`);
}

function buildAdmissionEnrollPayload(app = {}) {
  const dobRaw = String(app.dob || app.dateOfBirth || '').trim();
  const dob = /^\d{4}-\d{2}-\d{2}/.test(dobRaw) ? dobRaw.slice(0, 10) : null;
  const level = formatClassToBasic(app.level || app.applyingClass || '') || null;
  const section = String(app.classSection || app.subClass || 'A').trim() || 'A';
  return {
    initial_billed_amount: 0,
    academic_year: app.academicYear || null,
    term: app.academicTerm || app.term || null,
    class_section: section,
    level,
    student_id: app.officeStudentID || null,
    card_id: app.rfidCardCode || null,
    home_address: app.residentialAddress || app.homeAddress || null,
    dob,
    gender: app.sex || app.gender || null,
  };
}

function mapApiApplication(a = {}) {
  const formData = a.formData || a.form_data || {};
  const fatherName = blankGuardianText(formData.fatherName || formData.father_name || a.fatherName || a.father_name);
  const motherName = blankGuardianText(formData.motherName || formData.mother_name || a.motherName || a.mother_name);
  const emailSource = { ...a, ...formData };
  const fatherEmailRaw = blankGuardianText(formData.fatherEmail || formData.father_email || a.fatherEmail || a.father_email);
  const motherEmailRaw = blankGuardianText(formData.motherEmail || formData.mother_email || a.motherEmail || a.mother_email);
  const fatherEmail = (!fatherName && isGeneratedGuardianEmail(fatherEmailRaw, emailSource)) ? '' : fatherEmailRaw;
  const motherEmail = (!motherName && isGeneratedGuardianEmail(motherEmailRaw, emailSource)) ? '' : motherEmailRaw;
  const guardian = [fatherName, motherName].filter(Boolean).join(' / ')
    || blankGuardianText(formData.guardian)
    || blankGuardianText(a.guardian)
    || blankGuardianText(a.guardian_name);
  return {
    learner: a.learner || a.learner_name || formData.learner,
    phone: a.phone || a.contact_phone || formData.phone,
    level: formatClassToBasic(a.level || a.applying_level || formData.level || formData.applyingClass),
    submittedAt: a.submittedAt || a.submitted_at,
    updatedAt: a.updatedAt || a.updated_at || a.submittedAt || a.submitted_at,
    office_use_notes: a.office_use_notes,
    firstName: formData.firstName || a.firstName,
    otherNames: formData.otherNames || a.otherNames,
    surname: formData.surname || a.surname,
    dob: formData.dob || a.dob,
    academicYear: formData.academicYear || a.academicYear,
    ...formData,
    fatherName,
    motherName,
    fatherEmail,
    motherEmail,
    guardian,
    email: fatherEmail || motherEmail || '',
    id: applicationRecordId(a.id, a.application_id, a.uuid, a._id, formData.application_id, formData.id)
      || preferCanonicalId(a.id, formData.id),
    status: a.status || formData.status,
    rfidCardCode: preferIssuedRfid(formData.rfidCardCode, a.rfidCardCode, a.rfid_card_code),
  };
}

async function findRemoteApplicationId(candidate) {
  try {
    const raw = await api.getApplications();
    const list = extractApplicationsList(raw).map(mapApiApplication);
    return findMatchingApplication(list, candidate)?.id || null;
  } catch (error) {
    throw new Error(failedDatabaseAction('Checking existing applications', error));
  }
}

async function removeDuplicateRemoteApplications(keepId, candidate, previous = null) {
  // Existing database duplicates require a reviewed, transactional migration.
  // The browser must never delete applications based on matching names.
  return;
}

function deduplicateApplications(list = []) {
  if (!Array.isArray(list)) return [];
  const result = [];
  for (const app of list) {
    if (!app || typeof app !== 'object') continue;
    const existingIndex = result.findIndex((prev) => applicationsAreSame(prev, app));
    if (existingIndex === -1) result.push(app);
    else result[existingIndex] = mergeApplicationRecords(result[existingIndex], app);
  }
  return result;
}

function unwrapApiApplication(res) {
  if (!res || typeof res !== 'object') return null;
  if (res.application && typeof res.application === 'object') return res.application;
  if (res.record && typeof res.record === 'object') return res.record;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data.application || res.data.record || res.data;
  }
  if (res.id || res.learner_name || res.learner || res.form_data || res.formData) return res;
  return null;
}

function extractApplicationsList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of ['applications', 'data', 'records', 'results', 'items']) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return extractApplicationsList(raw.data);
  }
  return [];
}

function pvMatchesRef(voucher, ref) {
  if (!voucher || ref == null || ref === '') return false;
  const key = String(ref);
  if (voucher.id && String(voucher.id) === key) return true;
  if (pvNosMatch(voucher.pvNo, key) || pvNosMatch(voucher.pv_number, key)) return true;
  return false;
}

function mapApiPvStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['DISBURSED', 'PAID', 'SETTLED'].includes(value)) return 'DISBURSED';
  if (value === 'PARTIALLY APPROVED' || value === 'PARTIALLY_APPROVED') return 'Partially Approved';
  const normalized = normalizePvItemStatus(status);
  return normalized === 'Pending approval' ? 'Pending Audit' : normalized;
}

function pvStatusRank(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('disburs') || s === 'paid') return 50;
  if (s.includes('declin') || s.includes('reject') || s.includes('cancel') || s.includes('non-accrual')) return 40;
  if (isApprovedItem(s)) return 40;
  if (s.includes('partial')) return 30;
  if (s.includes('postpon')) return 20;
  if (s.includes('pending') || s.includes('draft') || !s) return 10;
  return 15;
}

export function mapApiPaymentVoucher(p = {}) {
  let items = Array.isArray(p.items) ? p.items.map((it, idx) => ({
    id: it.id || `it-${p.id || p.pv_number}-${idx}`,
    description: it.description || it.particulars,
    provider: it.payee_name || it.provider || p.payee_name,
    providerId: it.payee_id || it.providerId,
    qty: Number(it.quantity || it.qty) || 1,
    cost: Number(it.unit_cost || it.cost) || 0,
    costPerItem: Number(it.unit_cost || it.costPerItem || it.cost) || 0,
    total: Number(it.total_amount || it.total) || 0,
    totalAmount: Number(it.total_amount || it.totalAmount || it.total) || 0,
    status: mapApiPvStatus(it.status || p.status),
    datePrepared: it.date_prepared || it.datePrepared || p.date_prepared || p.datePrepared,
  })) : [];
  if (!items.length) {
    const qty = Number(p.quantity || p.qty) || 1;
    const unit = Number(p.unit_cost || p.cost) || 0;
    const total = Number(p.total_amount || p.total) || Number((qty * unit).toFixed(2));
    items = [{
      id: `it-${p.id || p.pv_number || 'pv'}-1`,
      description: p.description || 'Expenditure Requisition',
      provider: p.payee_name || p.provider || 'Vendor',
      providerId: p.payee_id || p.providerId || '',
      qty,
      cost: unit,
      costPerItem: unit,
      total,
      totalAmount: total,
      status: mapApiPvStatus(p.status),
      datePrepared: p.date_prepared || p.datePrepared,
    }];
  }
  return {
    version: p.version,
    payableTotal: p.payable_total ?? p.payableTotal,
    id: p.id,
    pvNo: p.pv_number || p.pvNo || (p.id ? `PV-${p.id}` : ''),
    requisitionNo: p.requisition_no || p.requisitionNo,
    provider: p.payee_name || p.provider || 'Vendor',
    providerId: p.payee_id || p.providerId,
    description: p.description,
    qty: p.quantity || p.qty || 1,
    cost: p.unit_cost || p.cost || 0,
    total: p.total_amount || p.total || 0,
    datePrepared: p.date_prepared || p.datePrepared,
    valuedDate: p.valued_date || p.valuedDate || p.date_prepared,
    auditRemarks: p.audit_notes || p.auditRemarks || p.approval_notes || p.pre_audited_by || p.disbursement_notes || '',
    status: mapApiPvStatus(p.status),
    approvedBy: p.approved_by || p.approvedBy,
    approvedAt: p.approved_at || p.approvedAt,
    disbursedAt: p.disbursed_at || p.disbursedAt,
    disbursedBy: p.disbursed_by || p.disbursedBy,
    disbursementReference: p.reference_number || p.disbursement_reference || p.disbursementReference,
    disbursementNotes: p.disbursement_notes || p.disbursementNotes || p.notes || '',
    paymentMethod: p.payment_method || p.paymentMethod,
    paymentSourceAccount: p.account_number || p.source_account || p.payment_source || p.paymentSourceAccount,
    updatedAt: p.updated_at || p.updatedAt || p.disbursed_at || p.approved_at || p.date_prepared,
    items,
  };
}

function pvItemsScore(items = []) {
  if (!Array.isArray(items) || !items.length) return 0;
  return items.reduce((score, it) => {
    const qty = Number(it.qty || it.quantity || 0);
    const cost = Number(it.costPerItem || it.unit_cost || it.cost || 0);
    const desc = String(it.description || '').trim();
    return score + 1 + (qty > 1 ? 2 : 0) + (cost > 0 ? 1 : 0) + (desc.length > 3 ? 1 : 0);
  }, 0);
}

function pickPreferredPvItems(prevItems, incomingItems) {
  const prev = Array.isArray(prevItems) ? prevItems : [];
  const incoming = Array.isArray(incomingItems) ? incomingItems : [];
  if (incoming.length > prev.length) return incoming;
  if (prev.length > incoming.length) return prev;
  if (!incoming.length) return prev;
  return pvItemsScore(incoming) >= pvItemsScore(prev) ? incoming : prev;
}

function unwrapApiPaymentVoucher(res) {
  if (!res || typeof res !== 'object') return null;
  if (res.voucher && typeof res.voucher === 'object') return res.voucher;
  if (res.payment_voucher && typeof res.payment_voucher === 'object') return res.payment_voucher;
  if (res.paymentVoucher && typeof res.paymentVoucher === 'object') return res.paymentVoucher;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data.voucher || res.data.payment_voucher || res.data.paymentVoucher || res.data;
  }
  if (res.id || res.pv_number || res.pvNo) return res;
  return null;
}

function upsertPaymentVoucherList(existing = [], newPV) {
  if (!newPV) return deduplicatePaymentVouchers(existing);
  const idx = existing.findIndex((p) =>
    (p.id && newPV.id && String(p.id) === String(newPV.id))
    || pvNosMatch(p.pvNo, newPV.pvNo)
  );
  const next = idx === -1
    ? [newPV, ...existing]
    : existing.map((p, i) => (i === idx ? mergePaymentVoucherRecords(p, newPV) : p));
  return deduplicatePaymentVouchers(next);
}

function buildPersistedPaymentVoucher(pvData = {}, apiRecord = null) {
  const mapped = apiRecord ? mapApiPaymentVoucher(apiRecord) : {};
  const localItems = Array.isArray(pvData.items) && pvData.items.length ? pvData.items : [];
  const items = pickPreferredPvItems(mapped.items, localItems);
  const grandTotal = Number(pvData.grandTotal || pvData.total || pvData.amount || mapped.total) || 0;
  return {
    ...mapped,
    id: preferCanonicalId(mapped.id, pvData.id) || `pv-${Date.now()}`,
    pvNo: mapped.pvNo || pvData.pvNo || '',
    requisitionNo: pvData.requisitionNo || mapped.requisitionNo || `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
    provider: pvData.provider || mapped.provider || 'General Vendor',
    providerId: pvData.providerId || mapped.providerId || 'VEN-001',
    department: pvData.department || 'Administration',
    paymentMode: pvData.paymentMode || pvData.payment_mode || 'Cash',
    description: pvData.description || mapped.description || 'Expenditure Voucher',
    qty: Number(pvData.qty || pvData.quantity || mapped.qty) || 1,
    cost: Number(pvData.cost || pvData.costPerItem || mapped.cost) || 0,
    total: grandTotal || mapped.total || 0,
    grandTotal: grandTotal || mapped.total || 0,
    datePrepared: pvData.datePrepared || mapped.datePrepared || new Date().toISOString().split('T')[0],
    valuedDate: pvData.valuedDate || mapped.valuedDate || pvData.datePrepared || new Date().toISOString().split('T')[0],
    auditRemarks: pvData.auditRemarks || mapped.auditRemarks || 'Submitted by Sub-Admin. Pending pre-audit approval.',
    status: pvData.status || mapped.status || 'Pending Audit',
    editedByHeadmaster: false,
    correctionsLog: pvData.correctionsLog || [],
    items,
    academicYear: pvData.academicYear,
    academicTerm: pvData.academicTerm,
    submittedBy: pvData.submittedBy || 'Sub-Admin / Accounts Officer',
    updatedAt: new Date().toISOString(),
  };
}

function mergePaymentVoucherRecords(prev = {}, incoming = {}) {
  const prevRank = pvStatusRank(prev.status);
  const incRank = pvStatusRank(incoming.status);
  const preferIncoming = incRank > prevRank
    || (incRank === prevRank && new Date(incoming.updatedAt || incoming.approvedAt || incoming.disbursedAt || 0) >= new Date(prev.updatedAt || prev.approvedAt || prev.disbursedAt || 0));
  const older = preferIncoming ? prev : incoming;
  const newer = preferIncoming ? incoming : prev;
  return {
    ...older,
    ...newer,
    id: preferCanonicalId(incoming.id, prev.id),
    pvNo: (String(incoming.pvNo || '').length >= String(prev.pvNo || '').length)
      ? (incoming.pvNo || prev.pvNo)
      : (prev.pvNo || incoming.pvNo),
    status: preferIncoming ? (incoming.status || prev.status) : (prev.status || incoming.status),
    items: pickPreferredPvItems(prev.items, incoming.items),
    auditRemarks: (newer.auditRemarks && newer.auditRemarks !== 'Registered in system')
      ? newer.auditRemarks
      : (older.auditRemarks || newer.auditRemarks || ''),
    approvedBy: newer.approvedBy || older.approvedBy,
    approvedAt: newer.approvedAt || older.approvedAt,
    disbursedAt: newer.disbursedAt || older.disbursedAt,
    disbursedBy: newer.disbursedBy || older.disbursedBy,
    disbursementReference: newer.disbursementReference || older.disbursementReference,
    paymentMethod: newer.paymentMethod || older.paymentMethod,
    updatedAt: newer.updatedAt || older.updatedAt,
  };
}

function deduplicatePaymentVouchers(list = []) {
  if (!Array.isArray(list)) return [];
  const result = [];
  for (const pv of list) {
    if (!pv || typeof pv !== 'object') continue;
    const existingIndex = result.findIndex((prev) =>
      (prev.id && pv.id && String(prev.id) === String(pv.id))
      || pvNosMatch(prev.pvNo, pv.pvNo)
    );
    if (existingIndex === -1) result.push(pv);
    else result[existingIndex] = mergePaymentVoucherRecords(result[existingIndex], pv);
  }
  return result;
}

export function findStudentByCardUid(students = [], applications = [], rawCode) {
  const code = String(rawCode || '').trim();
  if (!code) return null;
  const fromRoster = (students || []).find((s) => rfidUidsMatch(s.rfidCardCode, code));
  if (fromRoster) return fromRoster;
  const app = (applications || []).find((a) =>
    rfidUidsMatch(a.rfidCardCode, code) || rfidUidsMatch(a.formData?.rfidCardCode, code)
  );
  if (app) {
    const learnerName = applicationLearnerName(app);
    return findMatchingStudent(students, {
      fullName: learnerName,
      studentId: app.officeStudentID || app.studentId,
    }) || {
      id: app.id,
      studentId: app.officeStudentID || app.studentId || '',
      fullName: learnerName || 'Student',
      level: formatClassToBasic(app.applyingClass || app.level || ''),
      classSection: app.classSection || app.subClass || '',
      guardianName: app.fatherName || app.motherName || app.guardian || '',
      guardianPhone: app.fatherPhone || app.motherPhone || app.phone || '',
      rfidCardCode: app.rfidCardCode,
    };
  }
  return null;
}

function isOfficialStudentCode(code) {
  return /REMALJ-\d{4}-\d{3,}$/i.test(String(code || '').trim());
}

function applicationRecordId(...values) {
  const texts = values.map((value) => String(value || '').trim()).filter(Boolean);
  return texts.find((value) => isBackendUuid(value)) || '';
}

function preferCanonicalId(incoming, existing) {
  const incomingId = applicationRecordId(incoming);
  const existingId = applicationRecordId(existing);
  if (incomingId && !existingId) return incomingId;
  if (existingId && !incomingId) return existingId;
  if (incoming && !isSyntheticLocalId(incoming) && isSyntheticLocalId(existing)) return incoming;
  if (existing && !isSyntheticLocalId(existing) && isSyntheticLocalId(incoming)) return existing;
  return incomingId || existingId || incoming || existing;
}

function preferStudentCode(incoming, existing) {
  const inc = incoming ? String(incoming).trim() : '';
  const ex = existing ? String(existing).trim() : '';
  const incOff = isOfficialStudentCode(inc);
  const exOff = isOfficialStudentCode(ex);
  if (incOff && !exOff) return inc;
  if (exOff && !incOff) return ex;
  if (inc && isSyntheticLocalId(ex)) return inc;
  return inc || ex;
}

function billedAmountForLevel(level) {
  const formatted = formatClassToBasic(level || '');
  if (formatted.includes('Basic 7') || formatted.includes('Basic 8') || formatted.includes('Basic 9')) return 5200;
  if ((formatted || '').includes('SHS')) return 5800;
  return 4800;
}

function schoolEmailFromName(fullName) {
  const slug = String(fullName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'student';
  return `${slug}@remaljcarewell.edu.gh`;
}

export function unwrapApiStudent(res) {
  if (!res || typeof res !== 'object') return null;
  if (res.student && typeof res.student === 'object') return res.student;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data.student || res.data;
  }
  if (res.record && typeof res.record === 'object') return res.record;
  if (res.id || res.studentId || res.student_id || res.student_id_code || res.fullName || res.full_name) return res;
  return null;
}

export function mapStudentFromApi(s = {}, fallback = {}) {
  const assembledName = [s.firstName || fallback.firstName, s.otherNames || fallback.otherNames, s.surname || fallback.surname]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const fullComputed = (
    s.fullName || s.full_name || s.name
    || fallback.fullName || fallback.name
    || assembledName
    || 'Student'
  ).replace(/\s+/g, ' ').trim();

  const studentId = studentDisplayCode(s, fallback.studentId);
  const id = preferCanonicalId(s.id || s.uuid || s.pk, fallback.id);

  return {
    id: id || studentId || fallback.id,
    studentId: studentId || (id ? String(id) : fallback.studentId),
    studentUuid: isBackendUuid(s.student_id) ? s.student_id : (s.studentUuid || s.student_uuid || fallback.studentUuid || id),
    rfidCardCode: s.rfidCardCode || s.rfid_card_code || s.card_id || fallback.rfidCardCode || '',
    parentPickupCardIssued: [true, 1, '1', 'true'].includes(
      s.parentPickupCardIssued ?? s.parent_pickup_card_issued ?? s.parent_card_issued
    ),
    parentCardCode: s.parentCardCode || s.parent_card_code || s.pickup_card_code || fallback.parentCardCode || '',
    dailyLimit: s.dailyLimit || s.daily_limit || s.spending_limit || fallback.dailyLimit || '',
    fullName: fullComputed,
    firstName: s.firstName || fallback.firstName || '',
    otherNames: s.otherNames || s.other_names || fallback.otherNames || '',
    surname: s.surname || fallback.surname || '',
    dob: s.dob || fallback.dob || '',
    gender: s.gender || fallback.gender || 'Not Specified',
    level: formatClassToBasic(s.level || s.class_level || fallback.level || 'Basic 1'),
    classSection: s.classSection || s.class_section || fallback.classSection || 'A',
    guardianName: blankGuardianText(s.guardianName || s.guardian_name || fallback.guardianName)
      || blankGuardianText(s.fatherName || s.father_name || fallback.fatherName)
      || blankGuardianText(s.motherName || s.mother_name || fallback.motherName)
      || '',
    guardianEmail: (() => {
      const raw = s.guardianEmail || s.guardian_email || fallback.guardianEmail || '';
      const named = blankGuardianText(s.guardianName || s.guardian_name || fallback.guardianName)
        || blankGuardianText(s.fatherName || s.father_name || fallback.fatherName)
        || blankGuardianText(s.motherName || s.mother_name || fallback.motherName);
      if (!named && isGeneratedGuardianEmail(raw, { ...s, ...fallback, fullName: fullComputed, learner: fullComputed })) return '';
      return raw;
    })(),
    guardianPhone: resolveGuardianPhone(s, fallback) || '',
    homeAddress: s.homeAddress || s.home_address || fallback.homeAddress || '',
    enrollmentDate: s.enrollmentDate || s.enrollment_date || fallback.enrollmentDate || new Date().toISOString().split('T')[0],
    onboardedAt: s.onboardedAt || s.onboarded_at || s.created_at || s.createdAt || fallback.onboardedAt || s.enrollmentDate || s.enrollment_date || fallback.enrollmentDate || null,
    createdAt: s.created_at || s.createdAt || fallback.createdAt || null,
    status: (/inactive|withdrawn|declin|cancel|suspend|deleted|archived/i.test(String(s.status || '')) || s.is_active === false || s.isActive === false)
      ? 'Inactive'
      : (/^(active|enrolled|approved)$/i.test(String(s.status || fallback.status || 'Active')) ? 'Active' : (s.status || fallback.status)),
    is_active: s.is_active !== false && s.isActive !== false && !/inactive|withdrawn|declin|cancel|suspend|deleted|archived/i.test(String(s.status || '')),
    studentEmail: s.studentEmail || s.student_email || s.school_email || s.email || fallback.studentEmail || '',
    defaultPassword: s.defaultPassword || s.default_password || fallback.defaultPassword || '',
    fatherName: s.fatherName || s.father_name || fallback.fatherName || '',
    fatherPhone: s.fatherPhone || s.father_phone || fallback.fatherPhone || '',
    motherName: s.motherName || s.mother_name || fallback.motherName || '',
    motherPhone: s.motherPhone || s.mother_phone || fallback.motherPhone || '',
    applicationId: s.applicationId || s.application_id || fallback.applicationId || '',
  };
}

export function studentsAreSamePerson(a = {}, b = {}) {
  return sameStudentIdentity(a, b);
}

export function findMatchingStudent(list = [], candidate = {}) {
  return (list || []).find((s) => studentsAreSamePerson(s, candidate)) || null;
}

function findStudentForUpsert(list = [], candidate = {}) {
  const rows = list || [];
  const applicationId = String(candidate.applicationId || '').trim();
  if (applicationId) {
    const byApp = rows.find((s) => String(s.applicationId || '') === applicationId);
    if (byApp) return byApp;
  }
  const backendId = String(candidate.id || '').trim();
  if (backendId && !isSyntheticLocalId(backendId)) {
    const byId = rows.find((s) => String(s.id || '') === backendId);
    if (byId) return byId;
  }
  const code = String(candidate.studentId || candidate.officeStudentID || '').trim().toLowerCase();
  if (code) {
    const byCode = rows.find((s) => String(s.studentId || '').trim().toLowerCase() === code);
    if (byCode) return byCode;
  }
  const previousName = candidate.previousName || candidate.previousFullName;
  if (previousName) {
    const byPrevious = findMatchingStudent(rows, { ...candidate, fullName: previousName, name: previousName });
    if (byPrevious) return byPrevious;
  }
  return findMatchingStudent(rows, candidate)
    || rows.find((s) => applicationMatchesStudent({
      id: candidate.applicationId,
      officeStudentID: candidate.studentId,
      firstName: candidate.firstName,
      otherNames: candidate.otherNames,
      surname: candidate.surname,
      learner: candidate.fullName,
      fullName: candidate.fullName,
    }, s))
    || null;
}

function syncIssuedRfidAcrossIdentities(students = [], applications = []) {
  const roster = (students || []).map((s) => {
    const app = (applications || []).find((a) => applicationMatchesStudent(a, s));
    const issued = preferIssuedRfid(s?.rfidCardCode, app?.rfidCardCode, app?.formData?.rfidCardCode);
    if (!issued || rfidUidsMatch(s?.rfidCardCode, issued)) return s;
    return { ...s, rfidCardCode: issued };
  });

  const apps = (applications || []).map((app) => {
    const student = roster.find((s) => applicationMatchesStudent(app, s));
    const issued = preferIssuedRfid(student?.rfidCardCode, app.rfidCardCode, app.formData?.rfidCardCode);
    if (!issued) return app;
    if (rfidUidsMatch(app.rfidCardCode, issued) && rfidUidsMatch(app.formData?.rfidCardCode, issued)) {
      return app;
    }
    return {
      ...app,
      rfidCardCode: issued,
      formData: { ...(app.formData || {}), rfidCardCode: issued },
    };
  });

  return { students: roster, applications: apps };
}

export function mergeStudentRecords(prev, incoming) {
  return {
    ...prev,
    ...incoming,
    id: preferCanonicalId(incoming.id, prev.id),
    studentId: preferStudentCode(incoming.studentId, prev.studentId),
    fullName: incoming.fullName || prev.fullName || incoming.name || prev.name,
    otherNames: incoming.otherNames || prev.otherNames || '',
    dob: incoming.dob || prev.dob,
    gender: incoming.gender || prev.gender,
    level: formatClassToBasic(incoming.level || prev.level),
    classSection: incoming.classSection || prev.classSection || 'A',
    guardianName: blankGuardianText(incoming.guardianName) || blankGuardianText(prev.guardianName) || '',
    guardianEmail: incoming.guardianEmail || prev.guardianEmail,
    guardianPhone: resolveGuardianPhone(incoming, prev),
    homeAddress: incoming.homeAddress || prev.homeAddress,
    enrollmentDate: prev.enrollmentDate || incoming.enrollmentDate || new Date().toISOString().split('T')[0],
    onboardedAt: incoming.onboardedAt || prev.onboardedAt || incoming.createdAt || prev.createdAt || prev.enrollmentDate || incoming.enrollmentDate,
    createdAt: incoming.createdAt || prev.createdAt,
    status: incoming.status || prev.status || 'Active',
    studentEmail: incoming.studentEmail || prev.studentEmail,
    defaultPassword: incoming.defaultPassword || prev.defaultPassword,
    rfidCardCode: preferIssuedRfid(incoming.rfidCardCode, prev.rfidCardCode),
    parentPickupCardIssued: incoming.parentPickupCardIssued ?? prev.parentPickupCardIssued ?? false,
    parentCardCode: incoming.parentCardCode || prev.parentCardCode || '',
    dailyLimit: incoming.dailyLimit || prev.dailyLimit || '',
    fatherName: incoming.fatherName || prev.fatherName || '',
    fatherPhone: incoming.fatherPhone || prev.fatherPhone || '',
    motherName: incoming.motherName || prev.motherName || '',
    motherPhone: incoming.motherPhone || prev.motherPhone || '',
    applicationId: incoming.applicationId || prev.applicationId || '',
  };
}

export function deduplicateStudents(students = []) {
  if (!Array.isArray(students)) return [];
  const result = [];

  for (const s of students) {
    if (!s || typeof s !== 'object') continue;
    const normalized = {
      ...s,
      level: formatClassToBasic(s.level || s.class_level || s.classLevel)
    };
    const existingIndex = result.findIndex((prev) => studentsAreSamePerson(prev, normalized));
    if (existingIndex === -1) {
      result.push(normalized);
    } else {
      result[existingIndex] = mergeStudentRecords(result[existingIndex], normalized);
    }
  }

  return result;
}

function studentIdentityKey(student = {}) {
  const appId = String(student.applicationId || '').toLowerCase().trim();
  if (appId) return `app:${appId}`;
  const sid = String(student.studentId || '').toLowerCase().trim();
  return sid || JSON.stringify([normalizePersonName(student.fullName || student.name), student.dob || '', student.guardianEmail || '', student.level || '']);
}

function upsertCanonicalLoginAccount() {
  // Accounts and parent links are managed by the authenticated backend.
}

function applyCanonicalStudentToState(current, canonical) {
  return {
    ...current,
    onboardedStudents: deduplicateStudents([canonical, ...(current.onboardedStudents || []).filter(s => !studentsAreSamePerson(s, canonical))]),
  };
}

function extractApiList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of ['fees', 'student_fees', 'studentFees', 'ledgers', 'accounts', 'data', 'records', 'items', 'results', 'bills']) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  if (raw.data && typeof raw.data === 'object') return extractApiList(raw.data);
  return [];
}

export function mapFeeFromApi(f = {}) {
  const billedAmount = Number(
    f.billedAmount ?? f.billed_amount ?? f.total_billed ?? f.total_payable ?? f.billed ?? f.amount ?? 0
  ) || 0;
  const paidAmount = Number(
    f.paidAmount ?? f.paid_amount ?? f.total_paid ?? f.amount_paid ?? f.paid ?? 0
  ) || 0;
  const balanceRaw = f.balance ?? f.current_balance ?? f.amount_due ?? f.outstanding;
  const balance = balanceRaw === undefined || balanceRaw === null
    ? billedAmount - paidAmount
    : Number(balanceRaw) || 0;
  const status = f.status
    || (balance <= 0 && billedAmount > 0 ? 'Paid' : paidAmount > 0 ? 'Balance Due' : 'Not Paid');
  return {
    id: f.id || f.fee_id || f.bill_id || `fee-${f.student_id || f.studentId || Date.now()}`,
    studentId: f.studentId || f.student_id || f.student_code || f.student_id_code || '',
    studentName: f.studentName || f.student_name || f.full_name || f.learner || f.child || '',
    guardianName: f.guardianName || f.guardian_name || f.parent_name || '',
    guardianEmail: f.guardianEmail || f.guardian_email || f.parent_email || '',
    term: f.term || 'Term 1 · 2026',
    billedAmount,
    paidAmount,
    balance,
    status,
    dueDate: f.dueDate || f.due_date || '2026-09-15',
    paymentDate: f.paymentDate || f.payment_date || null,
    itemsBreakdown: f.itemsBreakdown || f.items || f.lines || [],
    updatedAt: f.updatedAt || f.updated_at || f.created_at || f.lastBillPostedAt || null,
    lastBillPostedAt: f.lastBillPostedAt || f.updated_at || f.created_at || null,
  };
}

export function deduplicateFees(fees = []) {
  return [...new Map(fees.filter(f => f?.id).map(f => [String(f.id), f])).values()];
}
function buildFeeAccountsFromStudentFees(fees) {
  return fees.map(f => ({ id: `fee-acc-${f.id}`, child: f.studentName, studentId: f.studentId,
    guardianEmail: f.guardianEmail, school: 'REMALJ Carewell Inspirational School', term: f.term,
    billed: f.billedAmount, paid: f.paidAmount, status: f.status }));
}

// One score sheet per student, subject, term and year — saving the same combination edits that record
export function scoreSheetEntryKey(entry = {}) {
  if (entry.entryKey) return entry.entryKey;
  const parts = [
    entry.studentId || entry.student_id || entry.studentName || entry.student_name,
    entry.subject,
    entry.term,
    entry.year || entry.academicYear,
  ];
  return parts.map((p) => String(p || '').trim().toLowerCase()).join('::');
}

export const MISSING_SCORE = 'N/A';

export function hasRecordedClassScore(entry) {
  if (!entry) return false;
  if (entry.hasClassScore === true || entry.classSubmitted === true) return true;
  if (entry.hasClassScore === false) return false;
  return Number(entry.classScore) > 0 || Number(entry.classTestTotal) > 0
    || Number(entry.arrivalTest) > 0 || Number(entry.test1) > 0
    || Number(entry.test2) > 0 || Number(entry.test3) > 0;
}

export function hasRecordedExamScore(entry) {
  if (!entry) return false;
  if (entry.hasExamScore === true || entry.examSubmitted === true) return true;
  if (entry.hasExamScore === false) return false;
  return Number(entry.examScore) > 0 || Number(entry.examScoreConverted) > 0;
}

export function displayScoreValue(value, suffix = '') {
  if (value == null || value === '' || Number.isNaN(Number(value))) return MISSING_SCORE;
  const n = Number(value);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return suffix ? `${text}${suffix}` : text;
}

function resultMatchesStudent(entry, student) {
  if (!entry || !student) return false;
  const sid = String(student.studentId || student.id || '').toLowerCase().trim();
  const name = normalizePersonName(student.fullName || student.name);
  const eSid = String(entry.studentId || '').toLowerCase().trim();
  const eName = normalizePersonName(entry.studentName);
  if (sid && eSid && sid === eSid) return true;
  return Boolean(name && eName && name === eName);
}

function gpaPointFromTotal(total) {
  if (total == null || Number.isNaN(Number(total))) return null;
  const n = Number(total);
  if (n >= 80) return 4.0;
  if (n >= 75) return 3.5;
  if (n >= 70) return 3.0;
  if (n >= 65) return 2.5;
  if (n >= 60) return 2.0;
  if (n >= 50) return 1.5;
  return 1.0;
}

export function resultsForStudent(results = [], student) {
  return (results || []).filter((entry) => resultMatchesStudent(entry, student));
}

export function buildStudentTranscriptData(student, results = []) {
  if (!student) {
    return {
      courses: [],
      subjects: [],
      totalCredits: 0,
      totalGradePoints: '0.0',
      cgpa: 'N/A',
      averageScore: 'N/A',
      standing: 'N/A',
      academicStanding: 'N/A',
      classRank: 'N/A',
      attendancePercentage: 'N/A',
      term: '',
    };
  }

  const studentResults = resultsForStudent(results, student);
  const subjects = studentResults.map((entry, idx) => {
    const classScore = hasRecordedClassScore(entry) ? Number(entry.classScore) : null;
    const examScore = hasRecordedExamScore(entry)
      ? Number(entry.examScoreConverted != null ? entry.examScoreConverted : entry.examScore)
      : null;
    const total = (classScore != null && examScore != null)
      ? Number(entry.score != null ? entry.score : classScore + examScore)
      : null;
    const gpaPoint = gpaPointFromTotal(total);
    return {
      code: `SUB-${String(idx + 1).padStart(2, '0')}`,
      title: entry.subject || 'Subject',
      name: entry.subject || 'Subject',
      credits: 3,
      score: total,
      classScore,
      examScore,
      total,
      grade: total != null ? (entry.grade || MISSING_SCORE) : MISSING_SCORE,
      gpaPoint: gpaPoint == null ? MISSING_SCORE : gpaPoint,
      remark: total != null ? (entry.remarks || 'Recorded') : MISSING_SCORE,
      status: entry.status,
    };
  });

  const complete = subjects.filter((s) => s.total != null);
  const averageScore = complete.length
    ? (complete.reduce((acc, s) => acc + Number(s.total), 0) / complete.length).toFixed(1)
    : MISSING_SCORE;
  const gpaVals = complete.map((s) => Number(s.gpaPoint)).filter((n) => Number.isFinite(n));
  const cgpa = gpaVals.length
    ? (gpaVals.reduce((acc, n) => acc + n, 0) / gpaVals.length).toFixed(2)
    : MISSING_SCORE;
  const standing = cgpa === MISSING_SCORE
    ? MISSING_SCORE
    : (Number(cgpa) >= 3.5 ? 'First Class Honor Roll' : Number(cgpa) >= 3.0 ? 'Second Class Upper' : 'Good Standing');

  return {
    courses: subjects,
    subjects,
    totalCredits: subjects.length * 3,
    totalGradePoints: gpaVals.length ? gpaVals.reduce((acc, n) => acc + n, 0).toFixed(1) : MISSING_SCORE,
    cgpa,
    averageScore,
    standing,
    academicStanding: standing,
    classRank: MISSING_SCORE,
    attendancePercentage: MISSING_SCORE,
    term: studentResults[0]?.term || '',
  };
}

function terminalReportNoticeKey(entry = {}) {
  return [
    'terminal-ready',
    entry.classLevel,
    entry.subClass || entry.classSection,
    entry.subject,
    entry.term,
    entry.year || entry.academicYear,
  ].map((p) => String(p || '').trim().toLowerCase()).join('::');
}

function studentInScoreCohort(student, entry) {
  if (!student || !entry) return false;
  const sCls = formatClassToBasic(student.level || student.classLevel || student.class || '');
  const eCls = formatClassToBasic(entry.classLevel || '');
  if (sCls && eCls && sCls.toLowerCase() !== eCls.toLowerCase()) return false;
  const eSub = String(entry.subClass || entry.subClassLevel || entry.classSection || '').trim().toLowerCase();
  if (!eSub || eSub === 'all') return true;
  const sSub = String(student.classSection || student.subClass || student.section || '').trim().toLowerCase();
  return !sSub || sSub === eSub || sSub.includes(eSub) || eSub.includes(sSub);
}

function classHasCompleteExamCoverage(results = [], students = [], entry = {}) {
  const cohort = (students || []).filter((s) => studentInScoreCohort(s, entry));
  if (cohort.length === 0) return false;
  const matching = (r) => (
    String(r.subject || '').toLowerCase() === String(entry.subject || '').toLowerCase()
    && String(r.term || '') === String(entry.term || '')
    && String(r.year || r.academicYear || '') === String(entry.year || entry.academicYear || '')
  );
  const classScoreRows = cohort.map((student) => (
    (results || []).find((r) => matching(r) && resultMatchesStudent(r, student))
  )).filter(hasRecordedClassScore);
  if (classScoreRows.length === 0) return false;
  if (classScoreRows.length < cohort.length) return false;
  return classScoreRows.every(hasRecordedExamScore);
}

export function isDeepEqual(a, b) {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export const DEFAULT_CLASS_LEVELS = [
  'Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'Basic 7', 'Basic 8', 'Basic 9',
  'SHS 1', 'SHS 2', 'SHS 3'
];

export const DEFAULT_SUBJECTS = [
  'Pure Mathematics', 'Mathematics', 'English Language', 'Integrated Science',
  'Social Studies', 'ICT / Computing', 'French', 'Religious & Moral Education',
  'Physics', 'Chemistry', 'Biology', 'Literature in English'
];

export const DEFAULT_TIMETABLE = [];

export const DEFAULT_SERVICE_PROVIDERS = [];

const INITIAL_DATA = {
  timetable: DEFAULT_TIMETABLE,
  results: [],
  courses: [],
  reportRequests: [],
  publishedReports: [],
  incidents: [],
  assetTasks: [],
  documentation: [],
  acceptanceChecks: [],
  academicCalendar: [],
  feeAccounts: [],
  messages: [],
  assignments: [],
  applications: [],
  serviceRecords: [],
  profiles: {
    teacher: { name: 'Teacher', photo: '' },
    parent: { name: 'Parent', photo: '' },
    student: { name: 'Student', photo: '' },
    admin: { name: 'System Administrator', photo: '' },
    accountant: { name: 'Finance / Accounts Office', photo: '' },
  },
  securityAlerts: [],
  onboardedStudents: [],
  teacherDirectory: [],
  teachingAssignments: [],
  classLevels: DEFAULT_CLASS_LEVELS,
  subjects: DEFAULT_SUBJECTS,
  studentFees: [],
  accountantMessages: [],
  busRoutes: [],
  definedBills: [],
  semesterRegistrations: [],
  examRegistrations: [],
  paymentVouchers: [],
  pvNotifications: [],
  serviceProviders: DEFAULT_SERVICE_PROVIDERS,
  ledgerLogs: [],
  academicSettings: {
    academicYear: '2025/2026',
    academicTerm: 'Term 3',
    classTestWeight: 50,
    examWeight: 50,
    schoolName: 'REMALJ Carewell Inspirational School',
    schoolBranch: 'Bogoso Main Campus',
    gradingSystem: 'BECE 9-Point Scale (GES Standard)',
    resumptionDate: '2026-09-08',
    vacationDate: '2026-12-18'
  },
  theme: 'light',
  backendConnected: false,
  isLoadingBackend: true,
};

const PortalDataContext = createContext(null);

function readData(enabled) {
  const initial = { ...INITIAL_DATA, timetable: [], serviceProviders: [], isLoadingBackend: Boolean(enabled), isRefreshingBackend: Boolean(enabled) };
  if (!enabled || !getAuthToken()) return initial;
  try {
    const cached = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || 'null');
    if (cached?.scope === snapshotScope() && Date.now() - cached.savedAt < 30 * 60 * 1000) {
      const records = Object.fromEntries(SNAPSHOT_FIELDS.filter(key => key in cached.records).map(key => [key, cached.records[key]]));
      return { ...initial, ...records, lastSyncedAt: new Date(cached.savedAt).toISOString(), isLoadingBackend: false, showingCachedData: true };
    }
  } catch { /* Invalid cache is ignored. */ }
  return initial;
}

export function PortalDataProvider({ children, enabled = false }) {
  const [data, rawSetData] = useState(() => readData(enabled));
  const mountedRef = useRef(true);
  const mutationEpochRef = useRef(0);
  const writeLocksRef = useRef(new Set());
  const paymentKeysRef = useRef(new Map());
  const dataRef = useRef(data);
  dataRef.current = data;
  const setData = useCallback((update) => {
    if (!mountedRef.current) return;
    rawSetData(current => stripCredentials(typeof update === 'function' ? update(current) : update));
  }, []);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => { if (enabled) persistSnapshot(data); }, [data, enabled]);
  const onboardLocksRef = useRef(new Map());
  const applicationSubmitLocksRef = useRef(new Map());
  const recentRosterIdsRef = useRef(new Set());
  const cacheGenerationRef = useRef({ admissions: 0, 'payment-vouchers': 0 });
  useEffect(() => { document.documentElement.dataset.theme = data.theme || 'light'; }, [data.theme]);

  const isRefreshingRef = useRef(false);

  // Sync strictly with live backend API endpoints  on mount & intervals
  // Uses concurrent Promise.allSettled and atomic deep equality diffing to eliminate UI glitching/flicker
  const refreshBackendData = useCallback(async () => {
    if (!enabled || !hasLiveDatabaseSession() || isRefreshingRef.current) return;
    const sessionToken = getAuthToken();
    const refreshEpoch = mutationEpochRef.current;
    isRefreshingRef.current = true;

    try {
      const role = portalForRole(getAuthUser()?.role);
      const privileged = ['admin', 'accountant'].includes(role);
      const staff = privileged || role === 'teacher';
      const allowed = (condition, fetcher) => condition ? fetcher() : Promise.resolve(null);
      const progressive = (resource, promise) => promise.then(value => {
        if (!mountedRef.current || sessionToken !== getAuthToken() || refreshEpoch !== mutationEpochRef.current) return value;
        setData(current => {
          const patch = {};
          if (resource === 'students') patch.onboardedStudents = deduplicateStudents(extractStudentList(value).map(s => mapStudentFromApi(s)).filter(s => isBackendUuid(s.id) && s.is_active !== false && s.status === 'Active'));
          if (resource === 'applications') patch.applications = deduplicateApplications(extractApplicationsList(value).map(mapApiApplication).filter(app => isBackendUuid(app.id)));
          if (resource === 'payment-vouchers') patch.paymentVouchers = deduplicatePaymentVouchers(api.extractPaymentVoucherList(value).map(mapApiPaymentVoucher));
          if (resource === 'providers') patch.serviceProviders = (Array.isArray(value) ? value : value.providers || value.data || []).filter(p => p.is_active !== false);
          if (resource === 'fees') {
            patch.studentFees = deduplicateFees(extractApiList(value).map(mapFeeFromApi));
            patch.feeAccounts = buildFeeAccountsFromStudentFees(patch.studentFees);
          }
          return { ...current, ...patch, backendConnected: true, isLoadingBackend: false };
        });
        return value;
      });
      setData(current => ({ ...current, isRefreshingBackend: true }));
      // 1. Fetch all backend endpoints in a single concurrent burst
      const [
        settingsRes,
        routesRes,
        timetablesRes,
        resultsRes,
        reportsRes,
        incidentsRes,
        assetTasksRes,
        messagesRes,
        assignmentsRes,
        appsRes,
        studentsRes,
        feesRes,
        staffRes,
        classTeachersRes,
        usersRes,
        billsRes,
        pvsRes,
        semRegsRes,
        examRegsRes,
        scoreSheetsRes,
        providersRes,
        classesRes,
        subclassesRes,
        subjectsRes,
        teachingAssignmentsRes
      ] = await Promise.allSettled([
        api.getAcademicSettings(),
        api.getBusRoutes(),
        api.getTimetables(),
        api.getResults(),
        api.getReportRequests(),
        allowed(staff, () => api.getIncidents()),
        allowed(privileged, () => api.getAssetTasks()),
        api.getMessages(),
        api.getAssignments(),
        allowed(privileged, () => progressive('applications', api.getApplications())),
        role === 'parent' ? progressive('students', api.getMyChildren().then(raw => raw.children || raw.data || raw)) : allowed(staff, () => progressive('students', api.getStudents())),
        allowed(privileged || role === "parent" || role === "student", () => progressive('fees', api.getFees())),
        allowed(staff, () => api.getStaff()),
        allowed(role === "admin", () => api.listClassTeacherCredentials()),
        allowed(role === "admin", () => api.getUsers()),
        allowed(privileged, () => api.getDefinedBills()),
        allowed(privileged, () => progressive('payment-vouchers', api.getPaymentVouchers())),
        allowed(staff, () => api.getSemesterRegistrations()),
        allowed(staff, () => api.getExamRegistrations()),
        allowed(staff, () => api.getScoreSheetEntries()),
        allowed(privileged, () => progressive('providers', api.getServiceProviders())),
        api.getCatalog('classes'),
        api.getCatalog('subclasses'),
        api.getCatalog('subjects'),
        api.getTeachingAssignments()
      ]);

      if (!mountedRef.current || sessionToken !== getAuthToken() || refreshEpoch !== mutationEpochRef.current) return;
      const responses = { settingsRes, routesRes, timetablesRes, resultsRes, reportsRes, incidentsRes, assetTasksRes, messagesRes, assignmentsRes, appsRes, studentsRes, feesRes, staffRes, classTeachersRes, usersRes, billsRes, pvsRes, semRegsRes, examRegsRes, scoreSheetsRes, providersRes, classesRes, subclassesRes, subjectsRes, teachingAssignmentsRes };
      const syncErrors = Object.fromEntries(Object.entries(responses)
        .filter(([, result]) => result.status === 'rejected')
        .map(([resource, result]) => [resource, result.reason?.message || 'Request failed']));
      const successful = Object.values(responses).filter(result => result.status === 'fulfilled' && result.value !== null).length;

      // 2. Perform a single atomic state commit only if data actually changed
      setData(current => {
        let hasChanges = false;
        const updates = {};
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          const settings = settingsRes.value.settings || settingsRes.value.data || settingsRes.value;
          if (!isDeepEqual(current.academicSettings, settings)) { updates.academicSettings = settings; hasChanges = true; }
        }

        if (classesRes.status === 'fulfilled' && classesRes.value != null) {
          const names = extractCatalogNames(classesRes.value);
          const merged = Array.from(new Set([...DEFAULT_CLASS_LEVELS, ...names]));
          if (!isDeepEqual(current.classLevels, merged)) {
            updates.classLevels = merged;
            hasChanges = true;
          }
        }

        if (subclassesRes && subclassesRes.status === 'fulfilled' && subclassesRes.value != null && subclassesRes.value) {
          const rawList = Array.isArray(subclassesRes.value) ? subclassesRes.value
            : Array.isArray(subclassesRes.value?.subclasses) ? subclassesRes.value.subclasses
            : Array.isArray(subclassesRes.value?.items) ? subclassesRes.value.items
            : Array.isArray(subclassesRes.value?.data) ? subclassesRes.value.data
            : [];
          rawList.forEach((item) => {
            const sc = typeof item === 'string' ? item : item?.name || item?.subClass || item?.sub_class;
            const c = item?.className || item?.class_name || item?.classLevel || item?.level;
            if (c && sc) {
              registerCustomSubClass(c, sc);
            }
          });
        }

        if (subjectsRes && subjectsRes.status === 'fulfilled' && subjectsRes.value != null && subjectsRes.value) {
          const names = extractCatalogNames(subjectsRes.value);
          if (names.length > 0) {
            const merged = Array.from(new Set([...DEFAULT_SUBJECTS, ...(current.subjects || []), ...names]));
            if (!isDeepEqual(current.subjects, merged)) {
              updates.subjects = merged;
              hasChanges = true;
            }
          }
        }

        if (teachingAssignmentsRes.status === 'fulfilled' && teachingAssignmentsRes.value != null) {
          const mapped = extractTeachingAssignments(teachingAssignmentsRes.value);
          if (mapped.length > 0 && !isDeepEqual(current.teachingAssignments, mapped)) {
            updates.teachingAssignments = mapped;
            hasChanges = true;
          }
          // Also merge subjects from teaching assignments
          const assignedSubjects = (mapped || [])
            .flatMap(t => Array.isArray(t.subjects) ? t.subjects : [t.subject, t.department])
            .map(s => String(s || '').trim())
            .filter(Boolean);
          if (assignedSubjects.length > 0) {
            const currentSubj = updates.subjects || current.subjects || DEFAULT_SUBJECTS;
            const mergedSubj = Array.from(new Set([...currentSubj, ...assignedSubjects]));
            if (!isDeepEqual(currentSubj, mergedSubj)) {
              updates.subjects = mergedSubj;
              hasChanges = true;
            }
          }
        }

        // Bus Routes
        if (routesRes.status === 'fulfilled' && routesRes.value != null && routesRes.value) {
          const raw = routesRes.value;
          const routes = Array.isArray(raw) ? raw : (raw.routes || []);
          if (routes.length > 0 && !isDeepEqual(current.busRoutes, routes)) {
            updates.busRoutes = routes;
            hasChanges = true;
          }
        }

        // Timetable
        if (timetablesRes.status === 'fulfilled' && timetablesRes.value != null && Array.isArray(timetablesRes.value)) {
          const mapped = timetablesRes.value.map(t => ({
            id: t.id,
            day: t.day,
            time: t.time || `${t.start_time || ''}${t.end_time ? ' - ' + t.end_time : ''}`,
            subject: t.subject,
            room: t.room,
            lecturer: t.lecturer || t.lecturer_name,
            classLevel: formatClassToBasic(t.class_level || t.classLevel)
          }));
          const merged = mapped;
          if (!isDeepEqual(current.timetable, merged)) {
            updates.timetable = merged;
            hasChanges = true;
          }
        }

        // Results
        if (resultsRes.status === 'fulfilled' && resultsRes.value != null && Array.isArray(resultsRes.value)) {
          const mapped = resultsRes.value.map(r => ({
            id: r.id,
            backendId: r.id,
            studentId: r.student_id || r.studentId,
            studentName: r.student_name || r.studentName,
            subject: r.subject,
            classLevel: formatClassToBasic(r.class_level || r.classLevel),
            term: r.term,
            year: r.academic_year || r.academicYear,
            score: r.score,
            grade: r.grade,
            remarks: r.remarks,
            lecturer: r.lecturer,
            arrivalTest: r.arrival_test ?? r.arrivalTest,
            test1: r.class_test_1 ?? r.test1,
            test2: r.class_test_2 ?? r.test2,
            test3: r.class_test_3 ?? r.test3,
            classTestTotal: r.class_test_total ?? r.classTestTotal,
            classScore: r.class_score ?? r.classScore,
            examScore: r.exam_score ?? r.examScore,
            teacherNote: r.teacher_note ?? r.teacherNote ?? '',
            status: r.status || 'Approved',
            declineNote: r.decline_note || r.declineNote,
            approvedBy: r.approved_by || r.approvedBy,
            updatedAt: r.updated_at || r.updatedAt
          }));
          const merged = mergeByKey(current.results || [], mapped, r => scoreSheetEntryKey(r) || r.id);
          if (!isDeepEqual(current.results, merged)) {
            updates.results = merged;
            hasChanges = true;
          }
        }

        if (scoreSheetsRes.status === 'fulfilled' && scoreSheetsRes.value != null && Array.isArray(scoreSheetsRes.value)) {
          const mappedSheets = scoreSheetsRes.value.map((r) => ({
            ...r,
            backendId: r.backendId || r.id,
            lecturer: r.instructor || r.lecturer,
            status: r.status || (r.hasExamScore ? 'Pending Approval' : 'Class Score Recorded'),
            assessmentRecord: true,
          }));
          const base = updates.results || current.results || [];
          const mergedSheets = mergeByKey(base.filter(r => !r.assessmentRecord), mappedSheets, r => scoreSheetEntryKey(r) || r.id);
          if (!isDeepEqual(base, mergedSheets)) {
            updates.results = mergedSheets;
            hasChanges = true;
          }
        }

        // Report Requests
        if (reportsRes.status === 'fulfilled' && reportsRes.value != null && Array.isArray(reportsRes.value)) {
          const mapped = reportsRes.value.map(r => ({
            id: r.id,
            child: r.child || r.child_name,
            semester: r.semester,
            note: r.note,
            status: r.status,
            fileName: r.file_name || r.fileName,
            fileUrl: r.file_url || r.fileUrl,
            requestedAt: r.created_at || r.requestedAt,
            uploadedAt: r.uploaded_at || r.uploadedAt
          }));
          if (!isDeepEqual(current.reportRequests, mapped)) {
            updates.reportRequests = mapped;
            hasChanges = true;
          }
        }

        // Incidents
        if (incidentsRes.status === 'fulfilled' && incidentsRes.value != null && Array.isArray(incidentsRes.value)) {
          const mapped = incidentsRes.value.map(i => ({
            id: i.id,
            category: i.category,
            person: i.person,
            severity: i.severity,
            status: i.status,
            loggedAt: i.logged_at || i.loggedAt
          }));
          if (!isDeepEqual(current.incidents, mapped)) {
            updates.incidents = mapped;
            hasChanges = true;
          }
        }

        // Asset Tasks
        if (assetTasksRes.status === 'fulfilled' && assetTasksRes.value != null && Array.isArray(assetTasksRes.value)) {
          const mapped = assetTasksRes.value.map(t => ({
            id: t.id,
            asset: t.asset,
            task: t.task,
            owner: t.owner,
            status: t.status,
            due: t.due_date || t.due
          }));
          if (!isDeepEqual(current.assetTasks, mapped)) {
            updates.assetTasks = mapped;
            hasChanges = true;
          }
        }

        // Messages
        if (messagesRes.status === 'fulfilled' && messagesRes.value != null && Array.isArray(messagesRes.value)) {
          const mapped = messagesRes.value.map(m => ({
            id: m.id,
            from: m.from || m.from_name || m.sender_name,
            senderRole: m.senderRole || m.sender_role,
            to: m.to || m.to_role || m.recipient_role,
            recipient: m.recipient || m.recipient_name || m.recipient_email,
            studentName: m.studentName || m.student_name,
            subject: m.subject,
            body: m.body,
            sentAt: m.sentAt || m.sent_at
          }));
          if (!isDeepEqual(current.messages, mapped)) {
            updates.messages = mapped;
            hasChanges = true;
          }
        }

        // Assignments
        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value != null && Array.isArray(assignmentsRes.value)) {
          const mapped = assignmentsRes.value.map(a => ({
            id: a.id,
            title: a.title,
            instructions: a.instructions,
            audience: a.audience,
            due: a.due || a.due_date,
            author: a.author || a.author_name,
            status: a.status
          }));
          if (!isDeepEqual(current.assignments, mapped)) {
            updates.assignments = mapped;
            hasChanges = true;
          }
        }

        // Applications come only from the database. An empty response clears the list.
        if (appsRes.status === 'fulfilled' && appsRes.value != null) {
          const appList = extractApplicationsList(appsRes.value);
          const mapped = deduplicateApplications(
            (Array.isArray(appList) ? appList : [])
              .map(mapApiApplication)
              .filter((app) => isBackendUuid(app?.id))
          );
          if (!isDeepEqual(current.applications, mapped)) {
            updates.applications = mapped;
            hasChanges = true;
          }
        }

        // Students come only from the database. An empty response clears the roster.
        if (studentsRes.status === 'fulfilled' && studentsRes.value != null) {
          const students = extractStudentList(studentsRes.value);
          if (Array.isArray(students)) {
            const mappedFromApi = deduplicateStudents(
              students
                .map((s) => mapStudentFromApi(s))
                .filter((s) => isBackendUuid(s?.id) && s?.is_active !== false && s?.status === 'Active')
            );
            const mapped = mappedFromApi;
            if (!isDeepEqual(current.onboardedStudents, mapped)) {
              updates.onboardedStudents = mapped;
              hasChanges = true;
              mapped.forEach((s) => {
                if (!s?.studentEmail && !s?.studentId) return;
                upsertCanonicalLoginAccount({
                  studentId: s.studentId,
                  studentEmail: s.studentEmail || schoolEmailFromName(s.fullName),
                  password: s.defaultPassword,
                  fullName: s.fullName,
                  guardianEmail: s.guardianEmail,
                  guardianName: s.guardianName,
                  guardianPhone: s.guardianPhone,
                });
              });
            }
          }
        }

        // Student Fees & Accounts
        if (feesRes.status === 'fulfilled' && feesRes.value != null) {
          const fees = extractApiList(feesRes.value);
          if (Array.isArray(fees)) {
            const mapped = fees.map((f) => mapFeeFromApi(f));
            const mergedFees = deduplicateFees(mapped);
            if (!isDeepEqual(current.studentFees, mergedFees)) {
              updates.studentFees = mergedFees;
              updates.feeAccounts = mergedFees.map(f => ({
                id: `fee-acc-${f.id}`,
                child: f.studentName,
                studentId: f.studentId,
                guardianEmail: f.guardianEmail,
                school: 'REMALJ Carewell Inspirational School',
                term: f.term,
                billed: f.billedAmount,
                paid: f.paidAmount,
                status: f.status
              }));
              hasChanges = true;
            }
          }
        }

        // Staff directory comes only from the database. An empty response clears the list.
        if (staffRes.status === 'fulfilled' && staffRes.value != null) {
          const sRaw = staffRes.value;
          const staff = Array.isArray(sRaw)
            ? sRaw
            : (Array.isArray(sRaw?.staff) ? sRaw.staff : Array.isArray(sRaw?.teachers) ? sRaw.teachers : Array.isArray(sRaw?.data) ? sRaw.data : []);
          const mapped = staff.map(s => ({
            id: s.id || s.staffId || s.staff_id || s.staff_code,
            staffRecordId: s.id || '',
            userId: s.userId || s.user_id || '',
            staffId: s.staffId || s.staff_id || s.staff_code || '',
            name: s.name || s.fullName || s.full_name,
            role: s.role || s.designation || 'Subject Teacher',
            subject: s.subject || '',
            classAssigned: formatClassToBasic(s.classAssigned || s.class_assigned || s.level || ''),
            email: s.email || s.contact_email || '',
            phone: s.phone || s.phone_number || s.contact_phone || '',
            status: s.status || (s.is_active === false ? 'Offboarded' : 'Active'),
            photo: s.photo || (s.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'),
            joinedDate: s.joinedDate || s.created_at || s.joined_date || ''
          })).filter((s) => s.id || s.staffId || s.email || s.name);
          if (classTeachersRes.status === 'fulfilled' && classTeachersRes.value != null && Array.isArray(classTeachersRes.value)) {
            const seen = new Set(
              mapped.flatMap((person) => [String(person.staffId || '').toLowerCase(), String(person.id || '').toLowerCase()]).filter(Boolean)
            );
            classTeachersRes.value.forEach((credential) => {
              const staffId = String(credential.staffId || '').trim();
              const key = staffId.toLowerCase();
              if (!key || seen.has(key)) return;
              seen.add(key);
              mapped.push({
                id: credential.id || staffId,
                staffId,
                name: credential.teacherName || staffId,
                role: 'Class Teacher',
                subject: 'Class Teacher',
                classAssigned: formatClassToBasic(credential.classAssigned || ''),
                email: '',
                phone: credential.phone || '',
                status: 'Active',
                photo: '👩‍🏫',
                joinedDate: credential.issuedAt || '',
              });
            });
          }
          if (usersRes.status === 'fulfilled' && usersRes.value != null) {
            extractAccountList(usersRes.value).forEach((account) => {
              mergeDirectoryAccount(mapped, directoryProfileFromUser(account));
            });
          }
          const derivedAssignments = [];
          const rememberAssignment = (item) => {
            if (!item) return;
            const subjects = (item.subjects || []).filter((name) => !/^(class teacher|subject teacher|administration|academics|general|transport)$/i.test(name));
            const classes = item.classes || [];
            if (!classes.length && !subjects.length) return;
            if (item.role && !/teacher|tutor/i.test(item.role)) return;
            const next = { ...item, subjects };
            const index = derivedAssignments.findIndex((row) => findTeachingAssignment([row], next));
            if (index >= 0) {
              derivedAssignments[index] = {
                ...derivedAssignments[index],
                ...next,
                classes: next.classes.length ? next.classes : derivedAssignments[index].classes,
                subjects: next.subjects.length ? next.subjects : derivedAssignments[index].subjects,
              };
              return;
            }
            derivedAssignments.push(next);
          };
          staff.forEach((member) => {
            const role = member.role || member.designation || '';
            rememberAssignment(mapTeachingAssignment({
              ...member,
              role,
              teacherName: member.name || member.full_name || member.fullName,
              userId: member.userId || member.user_id || '',
              staffId: member.staffId || member.staff_id || member.staff_code || '',
              classes: member.class_assigned || member.classAssigned,
              subjects: member.subject || member.department,
            }));
          });
          if (usersRes.status === 'fulfilled' && usersRes.value != null) {
            extractAccountList(usersRes.value).forEach((account) => {
              const profile = directoryProfileFromUser(account);
              if (!profile) return;
              rememberAssignment(mapTeachingAssignment({
                ...account,
                role: profile.role,
                teacherName: profile.name,
                userId: profile.userId,
                staffId: profile.staffId,
                email: profile.email,
                classes: account.class_assigned || account.classAssigned || account.assigned_class || account.assignedClass,
                subjects: account.subject,
              }));
            });
          }
          if (derivedAssignments.length > 0 && !updates.teachingAssignments) {
            if (!isDeepEqual(current.teachingAssignments, derivedAssignments)) {
              updates.teachingAssignments = derivedAssignments;
              hasChanges = true;
            }
          }
          if (!isDeepEqual(current.teacherDirectory, mapped)) {
            updates.teacherDirectory = mapped;
            hasChanges = true;
          }
        }

        // Defined Bills
        if (billsRes.status === 'fulfilled' && billsRes.value != null) {
          const bRaw = billsRes.value;
          const bills = Array.isArray(bRaw) ? bRaw : (bRaw?.bills || bRaw?.definitions || bRaw?.data || []);
          if (Array.isArray(bills)) {
            const mergedBills = bills;
            if (!isDeepEqual(current.definedBills, mergedBills)) {
              updates.definedBills = mergedBills;
              hasChanges = true;
            }
          }
        }

        // Payment vouchers come only from the database. An empty response clears the queue.
        if (pvsRes.status === 'fulfilled' && pvsRes.value != null) {
          const pvs = api.extractPaymentVoucherList(pvsRes.value);
          const mapped = Array.isArray(pvs) ? deduplicatePaymentVouchers(pvs.map(mapApiPaymentVoucher)) : [];
          if (!isDeepEqual(current.paymentVouchers, mapped)) {
            updates.paymentVouchers = mapped;
            hasChanges = true;
          }
        }

        // Semester & Exam Registrations
        if (semRegsRes.status === 'fulfilled' && semRegsRes.value != null && Array.isArray(semRegsRes.value)) {
          if (!isDeepEqual(current.semesterRegistrations, semRegsRes.value)) {
            updates.semesterRegistrations = semRegsRes.value;
            hasChanges = true;
          }
        }
        if (examRegsRes.status === 'fulfilled' && examRegsRes.value != null) {
          const mapped = extractExamRegistrations(examRegsRes.value);
          if (!isDeepEqual(current.examRegistrations, mapped)) {
            updates.examRegistrations = mapped;
            hasChanges = true;
          }
        }

        // Service Providers
        if (providersRes?.status === 'fulfilled' && providersRes.value != null) {
          const raw = providersRes.value;
          const list = Array.isArray(raw) ? raw : (raw?.data || raw?.providers || raw?.records || []);
          if (Array.isArray(list)) {
            const mapped = list.filter(p => p.is_active !== false).map(p => ({
              id: String(p.id || p.provider_id),
              name: p.name || p.provider_name,
              address: p.address || 'Bogoso',
              email: p.email || '',
              phone: p.phone || p.telephone || ''
            }));
            const merged = mapped;
            if (!isDeepEqual(current.serviceProviders, merged)) {
              updates.serviceProviders = merged;
              hasChanges = true;
            }
          }
        }

        const nextApps = updates.applications || current.applications;
        const nextStudents = updates.onboardedStudents || current.onboardedStudents;
        const syncedIdentities = syncIssuedRfidAcrossIdentities(nextStudents, nextApps);
        if (!isDeepEqual(current.onboardedStudents, syncedIdentities.students)) {
          updates.onboardedStudents = syncedIdentities.students;
          hasChanges = true;
        }
        if (!isDeepEqual(current.applications, syncedIdentities.applications)) {
          updates.applications = syncedIdentities.applications;
          hasChanges = true;
        }

        const shouldClearLoading = current.backendConnected !== (successful > 0) || current.isLoadingBackend || current.isRefreshingBackend || current.showingCachedData || !isDeepEqual(current.syncErrors, syncErrors);

        // If no changes exist and already connected, return current directly!
        // This causes React to skip re-renders completely, ensuring 0% glitching during auto-refresh
        if (!hasChanges && !shouldClearLoading) {
          return current;
        }

        return {
          ...current,
          ...updates,
          backendConnected: successful > 0,
          syncErrors,
          lastSyncedAt: successful ? new Date().toISOString() : current.lastSyncedAt,
          isLoadingBackend: false, isRefreshingBackend: false, showingCachedData: false
        };
      });

    } catch (err) {
      console.warn('Backend sync error:', err);
      setData(current => ({ ...current, backendConnected: false, isLoadingBackend: false, syncErrors: { connection: err.message } }));
    } finally {
      isRefreshingRef.current = false;
      setData(current => ({ ...current, isRefreshingBackend: false }));
    }
  }, [enabled, setData]);

  const invalidateQueries = useCallback(async (keys = []) => {
    const jobs = [];
    const epoch = mutationEpochRef.current;
    const tokenAtStart = getAuthToken();

    if (keys.includes('admissions') || keys.includes('fees')) {
      const token = getAuthToken();
      jobs.push(api.getFees().then(raw => {
        if (token !== getAuthToken() || epoch !== mutationEpochRef.current) return;
        const fees = deduplicateFees(extractApiList(raw).map(mapFeeFromApi));
        setData(current => ({ ...current, studentFees: fees, feeAccounts: buildFeeAccountsFromStudentFees(fees) }));
      }).catch(error => setData(current => ({ ...current, syncErrors: { ...current.syncErrors, feesRes: error.message } }))));
    }
    if (keys.includes('admissions')) {
      const generation = (cacheGenerationRef.current.admissions || 0) + 1;
      cacheGenerationRef.current.admissions = generation;
      jobs.push((async () => {
        const [appsRes, studentsRes] = await Promise.allSettled([
          api.getApplications(),
          api.getStudents(),
        ]);
        if (cacheGenerationRef.current.admissions !== generation || tokenAtStart !== getAuthToken() || epoch !== mutationEpochRef.current) return;
        setData((current) => {
          if (cacheGenerationRef.current.admissions !== generation) return current;
          let next = current;
          let changed = false;

          if (appsRes.status === 'fulfilled' && appsRes.value != null) {
            const appList = extractApplicationsList(appsRes.value);
            const mapped = deduplicateApplications(
              (Array.isArray(appList) ? appList : []).map(mapApiApplication).filter(app => isBackendUuid(app.id))
            );
            if (!isDeepEqual(next.applications, mapped)) {
              next = { ...next, applications: mapped };
              changed = true;
            }
          }

          if (studentsRes.status === 'fulfilled' && studentsRes.value != null) {
            const students = extractStudentList(studentsRes.value);
            if (Array.isArray(students)) {
              const mappedFromApi = deduplicateStudents(
                students
                  .map((s) => mapStudentFromApi(s))
                  .filter((s) => isBackendUuid(s?.id) && s?.is_active !== false && s?.status === 'Active')
              );
              const mapped = mappedFromApi;
              if (!isDeepEqual(current.onboardedStudents, mapped)) {
                mapped.forEach((s) => {
                  if (!s?.studentEmail && !s?.studentId) return;
                  upsertCanonicalLoginAccount({
                    studentId: s.studentId,
                    studentEmail: s.studentEmail || schoolEmailFromName(s.fullName),
                    password: s.defaultPassword,
                    fullName: s.fullName,
                    guardianEmail: s.guardianEmail,
                    guardianName: s.guardianName,
                    guardianPhone: s.guardianPhone,
                  });
                });
                next = { ...next, onboardedStudents: mapped };
                changed = true;
              }
            }
          }

          return changed ? next : current;
        });
      })());
    }

    if (keys.includes('payment-vouchers')) {
      const generation = (cacheGenerationRef.current['payment-vouchers'] || 0) + 1;
      cacheGenerationRef.current['payment-vouchers'] = generation;
      jobs.push((async () => {
        try {
          const raw = await api.getPaymentVouchers();
          if (cacheGenerationRef.current['payment-vouchers'] !== generation) return;
          setData((current) => {
            if (cacheGenerationRef.current['payment-vouchers'] !== generation) return current;
            const pvs = api.extractPaymentVoucherList(raw);
            const mapped = Array.isArray(pvs) ? deduplicatePaymentVouchers(pvs.map(mapApiPaymentVoucher)) : [];
            if (isDeepEqual(current.paymentVouchers, mapped)) return current;
            return { ...current, paymentVouchers: mapped };
          });
        } catch (e) {
          console.warn('Payment voucher cache refresh failed:', e);
        }
      })());
    }

    await Promise.all(jobs);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Refresh authenticated database records only.
    refreshBackendData();

    // Auto-refresh when tab/window regains focus
    const handleFocus = () => {
      refreshBackendData();
    };
    window.addEventListener('focus', handleFocus);

    // Background auto-refresh every 30 seconds (30,000ms)
    // Runs silently in the background without UI flicker or glitching
    const autoRefreshInterval = setInterval(() => {
      refreshBackendData();
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(autoRefreshInterval);
    };
  }, [refreshBackendData, enabled]);

  const performOnboardStudent = useCallback(async (student) => {
    const fName = (student.firstName || '').trim();
    const oName = (student.otherNames || '').trim();
    const sName = (student.surname || '').trim();
    const fullComputed = (fName || sName || oName)
      ? [fName, oName, sName].filter(Boolean).join(' ')
      : (student.fullName || student.name || 'Applicant');
    const formattedLevel = formatClassToBasic(student.level || student.applyingClass || 'Basic 1');
    const draft = {
      ...student,
      fullName: fullComputed,
      level: formattedLevel,
      classSection: student.classSection || student.officeFormAssigned || student.subClass || 'A',
      guardianName: blankGuardianText(student.guardianName) || blankGuardianText(student.guardian) || blankGuardianText(student.fatherName) || blankGuardianText(student.motherName) || '',
      guardianEmail: student.guardianEmail || student.email || student.fatherEmail || '',
      guardianPhone: student.guardianPhone || student.phone || student.fatherPhone || '',
      fatherName: student.fatherName || '',
      fatherPhone: student.fatherPhone || student.guardianPhone || student.phone || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      applicationId: student.applicationId || '',
      homeAddress: student.homeAddress || student.residentialAddress || 'Bogoso',
      dob: student.dob || student.dateOfBirth || '2015-01-01',
      gender: student.gender || student.sex || 'Not Specified',
    };

    const lockKey = studentIdentityKey(draft);
    const existingLock = onboardLocksRef.current.get(lockKey);
    if (existingLock) return existingLock;

    const run = (async () => {
      requireLiveDatabase('Saving this student');
      mutationEpochRef.current += 1;
      let existing = findStudentForUpsert(dataRef.current.onboardedStudents || [], draft);
      if (!existing && draft.applicationId) {
        const remote = extractStudentList(await api.getStudents()).map(s => mapStudentFromApi(s));
        existing = findStudentForUpsert(remote, draft);
      }
      // Admission creates the student; explicit bill posting creates charges.
      const billed = 0;
      const payload = {
        fullName: draft.fullName,
        full_name: draft.fullName,
        name: draft.fullName,
        dob: draft.dob,
        gender: draft.gender,
        level: draft.level,
        class_level: draft.level,
        classSection: draft.classSection,
        class_section: draft.classSection,
        guardianName: draft.guardianName,
        guardian_name: draft.guardianName,
        guardianEmail: draft.guardianEmail,
        guardian_email: draft.guardianEmail,
        guardianPhone: draft.guardianPhone,
        guardian_phone: draft.guardianPhone,
        homeAddress: draft.homeAddress,
        home_address: draft.homeAddress,
        initialBilledAmount: billed,
        initial_billed_amount: billed,
        term: 'Term 1 · 2026',
        rfidCardCode: draft.rfidCardCode,
        rfid_card_code: draft.rfidCardCode,
        fatherName: draft.fatherName,
        father_name: draft.fatherName,
        fatherPhone: draft.fatherPhone,
        father_phone: draft.fatherPhone,
        motherName: draft.motherName,
        mother_name: draft.motherName,
        motherPhone: draft.motherPhone,
        mother_phone: draft.motherPhone,
        applicationId: draft.applicationId,
        application_id: draft.applicationId,
      };

      let createdFromApi = null;
      const existingBackendId = existing?.id && !isSyntheticLocalId(existing.id) ? existing.id : null;
      try {
        if (existingBackendId) {
          const { initialBilledAmount, initial_billed_amount, ...studentUpdate } = payload;
          createdFromApi = await api.updateStudent(existingBackendId, studentUpdate);
        } else if (draft.applicationId) {
          // An application has one enrollment endpoint; never create a second
          // standalone student/account for the same application.
          createdFromApi = await api.enrollApplication(draft.applicationId, buildAdmissionEnrollPayload({ ...student, ...draft }));
        } else {
          createdFromApi = await api.onboardStudent(payload);
        }
      } catch (e) {
        const msg = String(e?.message || e || '');
        if (/409|already|exists|duplicate/i.test(msg)) {
          try {
            const all = await api.getStudents();
            const list = extractStudentList(all).map((s) => mapStudentFromApi(s));
            createdFromApi = findStudentForUpsert(list, draft) || findMatchingStudent(list, draft);
          } catch (lookupErr) {
            throw new Error(failedDatabaseAction('Saving this student', lookupErr));
          }
          if (!createdFromApi?.id) {
            throw new Error(failedDatabaseAction('Saving this student', 'no UUID'));
          }
        } else {
          throw new Error(failedDatabaseAction('Saving this student', e));
        }
      }

      const apiStudent = unwrapApiStudent(createdFromApi);
      const mappedApi = apiStudent ? mapStudentFromApi(apiStudent, { ...draft, ...(existing || {}) }) : null;
      const backendId = preferCanonicalId(mappedApi?.id, existingBackendId);
      requireBackendUuid(backendId, 'Saving this student');
      const rosterCount = (dataRef.current.onboardedStudents || []).length + 1;
      const fallbackCode = existing?.studentId || draft.studentId || mappedApi?.studentId || `REMALJ-${new Date().getFullYear()}-${String(rosterCount).padStart(3, '0')}`;
      const canonical = mapStudentFromApi(mappedApi || {}, {
        ...existing,
        ...draft,
        id: backendId,
        studentId: mappedApi?.studentId || fallbackCode,
        studentEmail: mappedApi?.studentEmail || existing?.studentEmail || '',
        // Keyed identity responses intentionally omit generated credentials.
        defaultPassword: mappedApi?.defaultPassword || existing?.defaultPassword || '',
        rfidCardCode: preferIssuedRfid(mappedApi?.rfidCardCode, draft.rfidCardCode, existing?.rfidCardCode),
      });

      canonical.id = backendId;
      recentRosterIdsRef.current.add(String(backendId));
      if (!canonical.studentId) canonical.studentId = fallbackCode;
      const nowIso = new Date().toISOString();
      if (!existing) {
        canonical.onboardedAt = nowIso;
        canonical.enrollmentDate = nowIso.slice(0, 10);
      } else {
        canonical.onboardedAt = existing.onboardedAt || existing.enrollmentDate || nowIso;
        canonical.enrollmentDate = existing.enrollmentDate || nowIso.slice(0, 10);
      }

      setData((current) => applyCanonicalStudentToState(current, canonical));
      mutationEpochRef.current += 1;
      await invalidateQueries(['admissions']);
      return canonical;
    })();

    onboardLocksRef.current.set(lockKey, run);
    try {
      return await run;
    } finally {
      onboardLocksRef.current.delete(lockKey);
    }
  }, [invalidateQueries]);

  const rosterDbSyncRef = useRef(false);
  const syncApplicationsToStudentDatabase = useCallback(async () => {
    if (rosterDbSyncRef.current) return;
    rosterDbSyncRef.current = true;
    try {
      await refreshBackendData();
    } catch (e) {
      console.warn('Student roster refresh failed:', e);
    } finally {
      rosterDbSyncRef.current = false;
    }
  }, [refreshBackendData, enabled]);

  const lastAutoRefreshedAtRef = useRef(new Date().toLocaleTimeString());

  const sortedOnboardedStudents = useMemo(() => {
    return deduplicateStudents(data.onboardedStudents || []).sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));
  }, [data.onboardedStudents]);

  const sortedStudentFees = useMemo(() => {
    return deduplicateFees(data.studentFees || []).sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  }, [data.studentFees]);

  const setDirectoryAccess = async (staffOrId, action) => {
    const person = staffOrId && typeof staffOrId === 'object' ? staffOrId : { id: staffOrId, staffId: staffOrId };
    const offboard = action === 'offboard';
    let userId = String(person.userId || '').trim();
    const staffRecordId = String(person.staffRecordId || '').trim();
    const staffCode = String(person.staffId || '').trim();
    const email = String(person.email || '').trim().toLowerCase();

    if (!userId) {
      try {
        const accounts = extractAccountList(await api.getUsers());
        const match = accounts.find((account) => {
          const accountId = String(account.id || account._id || '').trim();
          const accountEmail = String(account.email || '').trim().toLowerCase();
          const accountStaff = String(account.staffId || account.staff_id || account.staff_code || '').trim().toLowerCase();
          return (person.id && accountId === String(person.id))
            || (email && accountEmail === email)
            || (staffCode && accountStaff === staffCode.toLowerCase());
        });
        userId = String(match?.id || match?._id || '').trim();
      } catch {
        userId = '';
      }
    }

    const errors = [];
    let staffSaved = false;
    let userSaved = false;
    const staffTarget = staffRecordId || (staffCode && staffCode !== userId ? staffCode : '');
    if (staffTarget) {
      try {
        if (offboard) await api.offboardStaff(staffTarget);
        else await api.reactivateStaff(staffTarget);
        staffSaved = true;
      } catch (error) {
        errors.push(error?.message || 'Staff update failed');
      }
    }
    if (userId) {
      try {
        await api.toggleUserAccountStatus(userId, offboard ? 'Suspended' : 'Active');
        userSaved = true;
      } catch (statusError) {
        try {
          await api.updateUserAccount(userId, { status: offboard ? 'Suspended' : 'Active' });
          userSaved = true;
        } catch (updateError) {
          errors.push(updateError?.message || statusError?.message || 'Account update failed');
        }
      }
    }
    if (!staffSaved && !userSaved) {
      throw new Error(errors[errors.length - 1] || 'The database did not update this staff member.');
    }

    const keys = new Set([person.id, person.staffId, person.userId, userId, email].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean));
    setData((current) => ({
      ...current,
      teacherDirectory: (current.teacherDirectory || []).map((member) => {
        const memberKeys = [member.id, member.staffId, member.userId, member.email].map((value) => String(value || '').trim().toLowerCase());
        if (!memberKeys.some((value) => value && keys.has(value))) return member;
        return { ...member, status: offboard ? 'Offboarded' : 'Active', userId: member.userId || userId };
      }),
    }));
  };

  const value = useMemo(() => ({
    ...data,
    academicSettings: data.academicSettings || INITIAL_DATA.academicSettings,
    updateAcademicSettings: async (newSettings) => {
      validateAcademicSettings(newSettings);
      const raw = await api.updateAcademicSettings(newSettings);
      const saved = raw.settings || raw.data || raw;
      if (!saved.academicYear || !saved.academicTerm) throw new Error('The server did not return the saved academic settings.');
      setData(current => ({ ...current, academicSettings: saved }));
      return saved;
    },
    onboardedStudents: sortedOnboardedStudents,
    studentFees: sortedStudentFees,
    refreshBackendData,
    invalidateQueries,
    syncApplicationsToStudentDatabase,
    lastAutoRefreshedAt: lastAutoRefreshedAtRef.current,
    saveTimetableEntry: async () => {
      throw new Error('Use the head of academics timetable workspace to save and publish lessons.');
    },
    // Exam submissions go to Head Admin; class-only scores do not
    publishResult: (result) => {
      setData((current) => {
        const existingResults = current.results || [];
        const key = scoreSheetEntryKey(result);
        const existing = existingResults.find((item) => scoreSheetEntryKey(item) === key)
          || (result.id ? existingResults.find((item) => item.id === result.id) : null);
        const next = {
          ...existing,
          ...result,
          id: existing?.id || result.id || crypto.randomUUID?.() || String(Date.now()),
          entryKey: key,
          hasExamScore: true,
          examSubmitted: true,
          status: 'Pending Approval',
          declineNote: null,
          updatedAt: new Date().toLocaleString(),
        };
        return {
          ...current,
          results: existing
            ? existingResults.map((item) => item.id === next.id ? { ...item, ...next } : item)
            : [...existingResults, next],
        };
      });
      api.recordResult(result).catch((e) => console.warn('Backend result record fallback:', e));
    },
    approveResult: async (id, note) => {
      const record = dataRef.current.results.find(r => r.id === id || r.backendId === id);
      if (record?.assessmentRecord) {
        if (!hasRecordedExamScore(record)) throw new Error('Class-only drafts cannot be published.');
        await api.publishScoreSheet(record.backendId);
      } else await api.updateResultStatus(id, { status: 'Approved' });
      setData(current => ({ ...current, results: current.results.map(r => r.id === id ? { ...r, status: 'Approved', declineNote: 'Approved' === 'Declined' ? note : null } : r) }));
    },
    declineResult: async (id, note) => {
      await api.updateResultStatus(id, { status: 'Declined', decline_note: 'Declined' === 'Declined' ? note : undefined });
      setData(current => ({ ...current, results: current.results.map(r => r.id === id ? { ...r, status: 'Declined', declineNote: 'Declined' === 'Declined' ? note : null } : r) }));
    },
    registerCourse: (course) => setData((current) => ({
      ...current,
      courses: current.courses.includes(course) ? current.courses : [...current.courses, course],
    })),
    requestReport: async ({ child, semester, note }) => {
      try {
        await api.createReportRequest({ child, semester, note });
      } catch (e) {
        console.warn('Backend report request fallback:', e);
      }
      setData((current) => ({
        ...current,
        reportRequests: [{ id: crypto.randomUUID?.() || String(Date.now()), child, semester, note, status: 'Requested', requestedAt: new Date().toLocaleString() }, ...current.reportRequests],
      }));
    },
    uploadRequestedReport: async ({ id, fileName, fileData, fileType, fileObj }) => {
      if (fileObj) {
        try {
          await api.uploadReport(id, fileObj);
        } catch (e) {
          console.warn('Backend report upload fallback:', e);
        }
      }
      setData((current) => {
        const request = current.reportRequests.find((item) => item.id === id);
        if (!request) return current;
        const uploadedAt = new Date().toLocaleString();
        const published = { id, child: request.child, semester: request.semester, fileName, fileData, fileType, uploadedAt };
        return {
          ...current,
          reportRequests: current.reportRequests.map((item) => item.id === id ? { ...item, status: 'Available', fileName, uploadedAt } : item),
          publishedReports: [published, ...current.publishedReports.filter((item) => item.id !== id)],
        };
      });
    },
    logIncident: async ({ category, person, severity }) => {
      try {
        await api.createIncident({ category, person, severity, status: 'Open' });
      } catch (e) {
        console.warn('Backend incident create fallback:', e);
      }
      setData((current) => ({
        ...current,
        incidents: [{ id: crypto.randomUUID?.() || String(Date.now()), category, person, severity, status: 'Open', loggedAt: new Date().toLocaleString() }, ...current.incidents],
      }));
    },
    addAssetTask: async ({ asset, task, owner, due }) => {
      try {
        await api.createAssetTask({ asset, task, owner, due_date: due, status: 'Scheduled' });
      } catch (e) {
        console.warn('Backend asset task create fallback:', e);
      }
      setData((current) => ({
        ...current,
        assetTasks: [{ id: crypto.randomUUID?.() || String(Date.now()), asset, task, owner, due, status: 'Scheduled' }, ...current.assetTasks],
      }));
    },
    addDocumentationRecord: async ({ title, owner }) => {
      try {
        await api.createDocumentRecord({ title, owner, status: 'Current' });
      } catch (e) {
        console.warn('Backend document record fallback:', e);
      }
      setData((current) => ({
        ...current,
        documentation: [{ id: crypto.randomUUID?.() || String(Date.now()), title, owner, status: 'Current', updatedAt: new Date().toLocaleDateString() }, ...current.documentation],
      }));
    },
    toggleAcceptanceCheck: async (id) => {
      let nextDone = false;
      setData((current) => {
        const item = (current.acceptanceChecks || []).find((check) => check.id === id);
        nextDone = item ? !item.done : true;
        return {
          ...current,
          acceptanceChecks: current.acceptanceChecks.map((check) => check.id === id ? { ...check, done: !check.done } : check),
        };
      });
      try {
        await api.updateAcceptanceCheck(id, nextDone);
      } catch (e) {
        console.warn('Backend acceptance check fallback:', e);
      }
    },
    publishAcademicDate: async ({ title, start, end, type }) => {
      try {
        await api.createCalendarEvent({ title, start, end, type });
      } catch (e) {
        console.warn('Backend calendar create fallback:', e);
      }
      setData((current) => ({
        ...current,
        academicCalendar: [{ id: crypto.randomUUID?.() || String(Date.now()), title, start, end: end || start, type }, ...current.academicCalendar],
      }));
    },
    sendMessage: async ({ from, senderRole, to, recipient, recipientEmail, studentName, subject, body }) => {
      try {
        await api.sendMessage({
          recipient_role: to || 'All',
          recipient_name: recipient || 'Parents',
          recipient_email: recipientEmail,
          student_name: studentName,
          subject,
          body
        });
      } catch (e) {
        console.warn('Backend send message fallback:', e);
      }
      setData((current) => ({
        ...current,
        messages: [{ id: crypto.randomUUID?.() || String(Date.now()), from, senderRole, to, recipient, subject, body, sentAt: new Date().toLocaleString() }, ...current.messages],
      }));
    },
    publishAssignment: async ({ title, instructions, audience, due }) => {
      try {
        await api.createAssignment({ title, instructions, audience, due_date: due });
      } catch (e) {
        console.warn('Backend publish assignment fallback:', e);
      }
      setData((current) => ({
        ...current,
        assignments: [{ id: crypto.randomUUID?.() || String(Date.now()), title, instructions, audience, due, author: getUserFullName() || 'Staff', status: 'Published' }, ...current.assignments],
      }));
    },
    submitApplication: async (application) => {
      const submissionKey = JSON.stringify(application);
      if (applicationSubmitLocksRef.current.has(submissionKey)) return applicationSubmitLocksRef.current.get(submissionKey);
      const operation = (async () => {
      requireLiveDatabase('Saving this application');
      const otherNames = (application.otherNames || '').trim();
      const learnerName = (application.firstName || application.surname || otherNames)
        ? `${application.firstName || ''} ${otherNames ? otherNames + ' ' : ''}${application.surname || ''}`.replace(/\s+/g, ' ').trim()
        : (application.learner || application.fullName || 'Applicant');
      const enteredGuardian = (value) => {
        const text = String(value || '').trim();
        if (!text || /^(parent\/guardian|parent|guardian|n\/a|na|—|-)$/i.test(text)) return '';
        return text;
      };
      const guardianName = [application.fatherName, application.motherName].map(enteredGuardian).filter(Boolean).join(' / ')
        || enteredGuardian(application.guardianName)
        || enteredGuardian(application.guardian);
      const contactEmail = enteredGuardian(application.fatherEmail) || enteredGuardian(application.motherEmail);
      const contactPhone = resolveGuardianPhone(application) || '';
      const applyingLevel = formatClassToBasic(application.applyingClass || application.level || 'Basic 1');
      const academicYear = application.academicYear || '2025/2026';
      const academicTerm = application.academicTerm || application.term || 'Term 1';
      const candidate = {
        ...application,
        learner: learnerName,
        fullName: learnerName,
        firstName: application.firstName || '',
        otherNames,
        surname: application.surname || '',
        email: contactEmail,
        academicYear,
        academicTerm,
      };
      const existingMatch = findMatchingApplication(dataRef.current.applications || [], candidate);
      let persistId = existingMatch?.id && !isSyntheticLocalId(existingMatch.id) ? existingMatch.id : null;
      if (!persistId) {
        persistId = await findRemoteApplicationId(candidate);
      }

      if (persistId) {
        try {
          await api.updateApplication(persistId, {
            ...application,
            ...candidate,
            id: persistId,
          });
        } catch (e) {
          throw new Error(failedDatabaseAction('Saving this application', e));
        }
      } else {
        let createdFromApi = null;
        try {
          createdFromApi = await api.submitApplication({
            learner_name: learnerName,
            guardian_name: guardianName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            applying_level: applyingLevel,
            form_data: {
              ...application,
              academicYear,
              academicTerm,
              otherNames,
            }
          });
        } catch (e) {
          throw new Error(failedDatabaseAction('Saving this application', e));
        }
        persistId = unwrapApiApplication(createdFromApi)?.id;
        requireBackendUuid(persistId, 'Saving this application');
      }

      const resolvedId = persistId;

      setData((current) => {
        const newApp = {
          ...(existingMatch || {}),
          ...application,
          id: resolvedId,
          learner: learnerName,
          fullName: learnerName,
          firstName: application.firstName || '',
          otherNames: otherNames,
          surname: application.surname || '',
          guardian: guardianName,
          email: contactEmail,
          phone: contactPhone,
          level: applyingLevel,
          applyingClass: applyingLevel,
          academicYear,
          academicTerm,
          term: academicTerm,
          status: existingMatch?.status || 'Submitted',
          submittedAt: existingMatch?.submittedAt || new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          rfidCardCode: application.rfidCardCode || existingMatch?.rfidCardCode || '',
          formData: {
            ...(existingMatch?.formData || {}),
            ...application,
            rfidCardCode: application.rfidCardCode || existingMatch?.rfidCardCode || '',
          },
        };

        const issuedRfid = application.rfidCardCode || '';
        const apps = existingMatch
          ? (current.applications || []).map((app) => (applicationsAreSame(app, existingMatch) ? mergeApplicationRecords(app, newApp) : app))
          : [newApp, ...(current.applications || [])];

        return {
          ...current,
          applications: deduplicateApplications(apps),
          onboardedStudents: issuedRfid
            ? (current.onboardedStudents || []).map((s) => (
              studentsAreSamePerson(s, { fullName: learnerName, studentId: application.officeStudentID || application.studentId }) && !s.rfidCardCode
                ? { ...s, rfidCardCode: issuedRfid }
                : s
            ))
            : current.onboardedStudents,
        };
      });
      if (resolvedId) {
        void removeDuplicateRemoteApplications(resolvedId, candidate);
      }
      await performOnboardStudent({
        ...studentDraftFromApplication({
          ...application,
          ...candidate,
          id: resolvedId,
          rfidCardCode: application.rfidCardCode || existingMatch?.rfidCardCode || '',
        }),
        id: findStudentForUpsert(dataRef.current.onboardedStudents || [], {
          fullName: learnerName,
          studentId: application.officeStudentID || application.studentId,
          applicationId: resolvedId,
          previousName: existingMatch?.learner || existingMatch?.fullName || learnerName,
        })?.id,
        applicationId: resolvedId,
        previousName: existingMatch?.learner || existingMatch?.fullName || learnerName,
      });
      await invalidateQueries(['admissions']);
      return resolvedId;
      })();
      applicationSubmitLocksRef.current.set(submissionKey, operation);
      try { return await operation; } catch (error) {
        applicationSubmitLocksRef.current.delete(submissionKey);
        throw error;
      }
    },
    updateApplicationStatus: async (id, status) => {
      requireLiveDatabase('Updating this application');
      const persistId = requireBackendUuid(id, 'Updating this application');
      const app = dataRef.current.applications.find(item => String(item.id) === String(id)) || { id };
      const lock = `enroll:${id}`;
      if (writeLocksRef.current.has(lock)) throw new Error('This application is already being updated.');
      writeLocksRef.current.add(lock);
      mutationEpochRef.current += 1;
      try {
        const saved = status === 'Enrolled'
          ? await api.enrollApplication(persistId, buildAdmissionEnrollPayload(app))
          : await api.updateApplicationStatus(persistId, { status });
        mutationEpochRef.current += 1;
        await invalidateQueries(['admissions']);
        return saved;
      } finally { writeLocksRef.current.delete(lock); }
    },
    updateApplication: async (id, updatedForm) => {
      requireLiveDatabase('Saving this application');
      const rosterApps = dataRef.current.applications || [];
      const existingApp = rosterApps.find((a) => String(a.id) === String(id))
        || findMatchingApplication(rosterApps, { id, ...updatedForm })
        || {};
      let persistId = existingApp.id || id || await findRemoteApplicationId({ id, ...updatedForm, ...existingApp });
      if (persistId && isSyntheticLocalId(persistId)) {
        persistId = await findRemoteApplicationId({ id, ...updatedForm, ...existingApp });
      }
      persistId = requireBackendUuid(persistId, 'Saving this application');

      try {
        await api.updateApplication(persistId, { ...existingApp, ...updatedForm, id: persistId });
      } catch (e) {
        const remoteId = await findRemoteApplicationId({ id: persistId, ...existingApp, ...updatedForm });
        if (remoteId) {
          persistId = remoteId;
          try {
            await api.updateApplication(remoteId, { ...existingApp, ...updatedForm, id: remoteId });
          } catch (retryErr) {
            throw new Error(failedDatabaseAction('Saving this application', retryErr));
          }
        } else {
          throw new Error(failedDatabaseAction('Saving this application', e));
        }
      }

      const otherNames = String(updatedForm.otherNames || existingApp.otherNames || '').trim();
      const learnerName = [updatedForm.firstName || existingApp.firstName, otherNames, updatedForm.surname || existingApp.surname]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
        || updatedForm.learner || updatedForm.fullName || existingApp.learner || existingApp.fullName || '';
      const guardianName = updatedForm.fatherName || updatedForm.motherName || updatedForm.guardian || updatedForm.guardianName || existingApp.guardian;
      const contactEmail = updatedForm.fatherEmail || updatedForm.email || updatedForm.guardianEmail || existingApp.email;
      const contactPhone = updatedForm.fatherPhone || updatedForm.motherPhone || updatedForm.phone || updatedForm.guardianPhone || existingApp.phone;
      const applyingLevel = formatClassToBasic(updatedForm.applyingClass || updatedForm.level || existingApp.level || 'Basic 1');
      const classSection = updatedForm.classSection || updatedForm.subClass || updatedForm.officeFormAssigned || updatedForm.class_section || existingApp.classSection || existingApp.subClass || 'A';
      const studentPatch = {
        fullName: learnerName,
        firstName: updatedForm.firstName || existingApp.firstName || '',
        otherNames,
        surname: updatedForm.surname || existingApp.surname || '',
        level: applyingLevel,
        classSection,
        guardianName,
        guardianEmail: contactEmail,
        guardianPhone: contactPhone,
        fatherName: updatedForm.fatherName || existingApp.fatherName || '',
        fatherPhone: updatedForm.fatherPhone || existingApp.fatherPhone || contactPhone || '',
        motherName: updatedForm.motherName || existingApp.motherName || '',
        motherPhone: updatedForm.motherPhone || existingApp.motherPhone || '',
        homeAddress: updatedForm.residentialAddress || existingApp.residentialAddress,
        dob: updatedForm.dob || existingApp.dob,
        gender: updatedForm.sex || updatedForm.gender || existingApp.sex,
        applicationId: persistId,
      };

      const roster = dataRef.current.onboardedStudents || [];
      const previousName = existingApp.learner || existingApp.fullName || applicationLearnerName(existingApp) || learnerName;
      const matchedStudent = findStudentForUpsert(roster, {
        ...studentPatch,
        studentId: updatedForm.officeStudentID || existingApp.officeStudentID || existingApp.studentId,
        applicationId: persistId || id,
        previousName,
        fullName: learnerName,
      });

      const issuedRfid = String(matchedStudent?.rfidCardCode || '').trim();
      const formRfid = String(updatedForm.rfidCardCode || existingApp.rfidCardCode || '').trim();
      studentPatch.rfidCardCode = issuedRfid || formRfid;

      setData((current) => {
        const updatedApplicationRecord = {
          ...(existingApp || {}),
          ...updatedForm,
          id: persistId || existingApp.id || id,
          learner: learnerName,
          fullName: learnerName,
          guardian: guardianName,
          email: contactEmail,
          phone: contactPhone,
          level: applyingLevel,
          applyingClass: applyingLevel,
          classSection,
          subClass: classSection,
          rfidCardCode: studentPatch.rfidCardCode,
          formData: {
            ...((existingApp || {}).formData || {}),
            ...updatedForm,
            id: persistId || existingApp.id || id,
            applyingClass: applyingLevel,
            classSection,
            subClass: classSection,
            rfidCardCode: studentPatch.rfidCardCode,
          },
          updatedAt: new Date().toLocaleString(),
        };

        const updatedApplications = overwriteApplicationInList(
          current.applications || [],
          updatedApplicationRecord,
          { ids: [id, persistId, existingApp.id], previous: existingApp },
        );

        let rosterTouched = false;
        const updatedOnboardedStudents = [];
        for (const stu of current.onboardedStudents || []) {
          const isMatch = matchedStudent
            ? studentsAreSamePerson(stu, matchedStudent)
            : (
              String(stu.applicationId || '') === String(id)
              || String(stu.applicationId || '') === String(persistId)
              || stu.fullName === previousName
              || stu.fullName === learnerName
            );
          if (!isMatch) {
            updatedOnboardedStudents.push(stu);
            continue;
          }
          if (rosterTouched) continue;
          rosterTouched = true;
          updatedOnboardedStudents.push(mergeStudentRecords(stu, {
            ...studentPatch,
            id: stu.id,
            studentId: stu.studentId || studentPatch.studentId,
            previousName,
            passportPhoto: updatedForm.passportPhoto || stu.passportPhoto,
          }));
        }
        if (!rosterTouched && persistId) {
          updatedOnboardedStudents.push({
            ...studentPatch,
            id: matchedStudent?.id || `stu-app-${persistId || id}`,
            studentId: matchedStudent?.studentId || studentPatch.studentId || '',
            studentEmail: matchedStudent?.studentEmail || schoolEmailFromName(learnerName),
            passportPhoto: updatedForm.passportPhoto || '',
            status: 'Active',
          });
        }

        const updatedStudentFees = (current.studentFees || []).map((fee) => {
          if (fee.studentName === previousName || fee.studentName === learnerName || fee.studentId === id || (matchedStudent && (fee.studentId === matchedStudent.studentId || fee.studentId === matchedStudent.id))) {
            return {
              ...fee,
              studentName: learnerName,
              guardianName,
              guardianEmail: contactEmail,
            };
          }
          return fee;
        });

        const updatedFeeAccounts = (current.feeAccounts || []).map((acc) => {
          if (acc.child === previousName || acc.child === learnerName || (matchedStudent && acc.studentId === matchedStudent.studentId)) {
            return {
              ...acc,
              child: learnerName,
            };
          }
          return acc;
        });

        return {
          ...current,
          applications: updatedApplications,
          onboardedStudents: deduplicateStudents(updatedOnboardedStudents),
          studentFees: updatedStudentFees,
          feeAccounts: updatedFeeAccounts,
        };
      });
      if (persistId) {
        void removeDuplicateRemoteApplications(
          persistId,
          {
            id: persistId,
            ...existingApp,
            ...updatedForm,
            learner: learnerName,
            fullName: learnerName,
          },
          existingApp,
        );
      }
      await performOnboardStudent({
        ...studentDraftFromApplication({
          ...existingApp,
          ...updatedForm,
          id: persistId || id,
          rfidCardCode: studentPatch.rfidCardCode,
        }),
        ...studentPatch,
        id: matchedStudent?.id,
        studentId: matchedStudent?.studentId || studentPatch.studentId,
        applicationId: persistId || id,
        previousName,
      });
      void invalidateQueries(['admissions']);
    },
    updateApplicationOfficeUse: async (id, officeData) => {
      requireLiveDatabase('Saving office evaluation');
      requireBackendUuid(id, 'Saving office evaluation');
      const currentApp = (dataRef.current.applications || []).find((item) => String(item.id) === String(id));
      const updatedApp = { ...(currentApp || {}), ...officeData, id };
      try {
        await api.updateApplication(id, updatedApp);
      } catch (e) {
        throw new Error(failedDatabaseAction('Saving office evaluation', e));
      }
      setData((current) => ({
        ...current,
        applications: (current.applications || []).map((item) => (
          String(item.id) === String(id) ? { ...item, ...officeData } : item
        )),
      }));
    },
    deleteApplication: async (id) => {
      try {
        await api.deleteApplication(id);
      } catch (e) {
        console.warn('Backend delete application fallback:', e);
      }
      setData((current) => ({
        ...current,
        applications: (current.applications || []).filter((item) => item.id !== id),
      }));
    },
    addServiceRecord: async ({ module, person, detail, status }) => {
      try {
        await api.createServiceRecord({ module, person, detail, status });
      } catch (e) {
        console.warn('Backend service record fallback:', e);
      }
      setData((current) => ({
        ...current,
        serviceRecords: [{ id: crypto.randomUUID?.() || String(Date.now()), module, person, detail, status, recordedAt: new Date().toLocaleString() }, ...(current.serviceRecords || [])],
      }));
    },
    addSecurityAlert: async ({ portal, targetAccount, reason, severity = 'Medium', device }) => {
      const alert = {
        portal: portal || 'portal',
        target_account: targetAccount || 'Unknown Target Account',
        reason: reason || 'Unauthorized login attempt detected',
        severity,
        status: 'Unresolved',
        device: device || (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Web Device'),
      };
      try {
        await api.createSecurityAlert(alert);
      } catch (e) {
        console.warn('Backend security alert fallback:', e);
      }
      setData((current) => ({
        ...current,
        securityAlerts: [
          {
            id: `sec-${Date.now()}`,
            portal: alert.portal,
            targetAccount: alert.target_account,
            ipAddress: '197.251.14.82 (Bogoso Web Network)',
            attemptedAt: new Date().toLocaleString(),
            reason: alert.reason,
            severity: alert.severity,
            status: 'Unresolved',
            device: alert.device,
          },
          ...(current.securityAlerts || [])
        ]
      }));
    },
    resolveSecurityAlert: async (id) => {
      try {
        await api.resolveSecurityAlert(id);
      } catch (e) {
        console.warn('Backend security alert resolve fallback:', e);
      }
      setData((current) => ({
        ...current,
        securityAlerts: (current.securityAlerts || []).map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a)
      }));
    },
    deleteSecurityAlert: async (id) => {
      try {
        await api.deleteSecurityAlert(id);
      } catch (e) {
        console.warn('Backend security alert delete fallback:', e);
      }
      setData((current) => ({
        ...current,
        securityAlerts: (current.securityAlerts || []).filter(a => a.id !== id)
      }));
    },
    updateProfile: async (portal, updates) => {
      try {
        await api.updateMyProfile({ portal, name: updates.name, photo: updates.photo });
      } catch (e) {
        console.warn('Backend profile update fallback:', e);
      }
      setData((current) => ({ ...current, profiles: { ...current.profiles, [portal]: { ...current.profiles[portal], ...updates } } }));
    },
    setTheme: (theme) => setData((current) => ({ ...current, theme })),
    onboardStudent: performOnboardStudent,
    onboardStudentsBulk: async (studentsArray) => {
      if (!Array.isArray(studentsArray) || studentsArray.length === 0) return [];
      const onboardedResults = [];
      for (const student of studentsArray) {
        const created = await performOnboardStudent(student);
        if (created) onboardedResults.push(created);
      }
      return onboardedResults;
    },
    updateOnboardedStudent: async (id, updates) => {
      const currentRoster = dataRef.current.onboardedStudents || [];
      const existing = currentRoster.find((s) => s.id === id || s.studentId === id)
        || findMatchingStudent(currentRoster, updates);
      const backendId = existing?.id && !isSyntheticLocalId(existing.id) ? existing.id : null;
      const payload = {
        fullName: updates.fullName || existing?.fullName,
        full_name: updates.fullName || existing?.fullName,
        level: updates.level || existing?.level,
        class_level: updates.level || existing?.level,
        classSection: updates.classSection || existing?.classSection,
        class_section: updates.classSection || existing?.classSection,
        guardianName: updates.guardianName || existing?.guardianName,
        guardian_name: updates.guardianName || existing?.guardianName,
        guardianEmail: updates.guardianEmail || existing?.guardianEmail,
        guardian_email: updates.guardianEmail || existing?.guardianEmail,
        guardianPhone: updates.guardianPhone || existing?.guardianPhone,
        guardian_phone: updates.guardianPhone || existing?.guardianPhone,
        fatherName: updates.fatherName || existing?.fatherName,
        father_name: updates.fatherName || existing?.fatherName,
        fatherPhone: updates.fatherPhone || existing?.fatherPhone,
        father_phone: updates.fatherPhone || existing?.fatherPhone,
        motherName: updates.motherName || existing?.motherName,
        mother_name: updates.motherName || existing?.motherName,
        motherPhone: updates.motherPhone || existing?.motherPhone,
        mother_phone: updates.motherPhone || existing?.motherPhone,
        rfidCardCode: updates.rfidCardCode || existing?.rfidCardCode,
        rfid_card_code: updates.rfidCardCode || existing?.rfidCardCode,
        parentPickupCardIssued: updates.parentPickupCardIssued ?? existing?.parentPickupCardIssued ?? false,
        parent_pickup_card_issued: updates.parentPickupCardIssued ?? existing?.parentPickupCardIssued ?? false,
        parentCardCode: updates.parentCardCode ?? existing?.parentCardCode ?? '',
        parent_card_code: updates.parentCardCode ?? existing?.parentCardCode ?? '',
        dailyLimit: updates.dailyLimit || existing?.dailyLimit,
        daily_limit: updates.dailyLimit || existing?.dailyLimit,
      };
      const matchingApps = existing
        ? (dataRef.current.applications || []).filter((app) => applicationMatchesStudent(app, existing))
        : [];
      const cardMustBeSaved = updates.parentPickupCardIssued === true || Boolean(updates.rfidCardCode);
      let savedToDatabase = false;
      try {
        if (backendId) {
          await api.updateStudent(backendId, payload);
          savedToDatabase = true;
        } else if (existing?.studentId && !isSyntheticLocalId(existing.studentId)) {
          await api.updateStudent(existing.studentId, payload);
          savedToDatabase = true;
        }
      } catch (e) {
        if (cardMustBeSaved) throw e;
        console.warn('Backend update student fallback:', e);
      }
      if (cardMustBeSaved && !savedToDatabase) {
        throw new Error('The database did not save this card.');
      }
      if (updates.rfidCardCode) {
        await Promise.all(matchingApps.map(async (app) => {
          try {
            await api.updateApplication(app.id, {
              ...app,
              rfidCardCode: updates.rfidCardCode,
              formData: { ...(app.formData || {}), rfidCardCode: updates.rfidCardCode },
            });
          } catch (e) {
            console.warn('Backend RFID cascade to application fallback:', e);
          }
        }));
      }
      setData((current) => {
        const roster = current.onboardedStudents || [];
        const prev = roster.find((s) => s.id === id || s.studentId === id)
          || findMatchingStudent(roster, updates);
        if (!prev) return current;
        const merged = mergeStudentRecords(prev, {
          ...updates,
          id: prev.id,
          studentId: prev.studentId,
          level: updates.level ? formatClassToBasic(updates.level) : prev.level,
        });
        const oldName = normalizePersonName(prev.fullName || prev.name);
        const oldSid = String(prev.studentId || prev.id || '');
        const issuedRfid = updates.rfidCardCode || merged.rfidCardCode;
        return {
          ...current,
          onboardedStudents: deduplicateStudents(
            roster.map((s) => (studentsAreSamePerson(s, prev) ? merged : s))
          ),
          applications: issuedRfid
            ? (current.applications || []).map((app) => (
              applicationMatchesStudent(app, prev)
                ? { ...app, rfidCardCode: issuedRfid, formData: { ...(app.formData || {}), rfidCardCode: issuedRfid } }
                : app
            ))
            : current.applications,
          studentFees: (current.studentFees || []).map((f) => {
            const same = (f.studentId && String(f.studentId) === oldSid)
              || (f.id && String(f.id) === String(prev.id))
              || normalizePersonName(f.studentName) === oldName;
            return same
              ? {
                  ...f,
                  studentId: merged.studentId || f.studentId,
                  studentName: merged.fullName,
                  guardianName: merged.guardianName || f.guardianName,
                  guardianEmail: merged.guardianEmail || f.guardianEmail,
                }
              : f;
          }),
          feeAccounts: (current.feeAccounts || []).map((a) => {
            const same = (a.studentId && String(a.studentId) === oldSid)
              || normalizePersonName(a.child) === oldName;
            return same
              ? {
                  ...a,
                  studentId: merged.studentId || a.studentId,
                  child: merged.fullName,
                  guardianEmail: merged.guardianEmail || a.guardianEmail,
                }
              : a;
          }),
        };
      });
    },
    deleteOnboardedStudent: async (id) => {
      try {
        await api.deleteStudent(id);
      } catch (e) {
        console.warn('Backend delete student fallback:', e);
      }

      setData((current) => {
        const targetStudent = (current.onboardedStudents || []).find((s) => s.id === id || s.studentId === id);
        const studentId = targetStudent?.studentId || id;
        const fullName = targetStudent?.fullName;
        const email = targetStudent?.studentEmail;

        const updatedStudents = (current.onboardedStudents || []).filter(
          (s) => s.id !== id && s.studentId !== id && (!fullName || s.fullName !== fullName)
        );

        const updatedFees = (current.studentFees || []).filter(
          (f) => f.id !== id && f.studentId !== id && (!fullName || f.studentName !== fullName)
        );

        const updatedFeeAccounts = (current.feeAccounts || []).filter(
          (a) => a.id !== id && (!fullName || a.child !== fullName)
        );

        const updatedRegs = (current.semesterRegistrations || []).filter(
          (r) => r.id !== id && r.studentId !== id && (!fullName || r.studentName !== fullName)
        );

        const updatedApps = (current.applications || []).filter(
          (app) => app.id !== id && (!fullName || app.learner !== fullName)
        );

        const updatedResults = (current.results || []).filter(
          (res) => res.id !== id && res.studentId !== id && (!fullName || res.studentName !== fullName)
        );

        const updatedExamRegs = (current.examRegistrations || []).filter(
          (e) => e.id !== id && e.studentId !== studentId && (!fullName || e.studentName !== fullName)
        );

        try {
          const raw = localStorage.getItem('registered_accounts');
          if (raw) {
            const list = JSON.parse(raw);
            if (email && list[email.toLowerCase()]) {
              delete list[email.toLowerCase()];
            }
            if (studentId && list[studentId.toLowerCase()]) {
              delete list[studentId.toLowerCase()];
            }
            localStorage.setItem('registered_accounts', JSON.stringify(stripCredentials(list)));
          }
        } catch (e) {}

        return {
          ...current,
          onboardedStudents: updatedStudents,
          studentFees: updatedFees,
          feeAccounts: updatedFeeAccounts,
          semesterRegistrations: updatedRegs,
          applications: updatedApps,
          results: updatedResults,
          examRegistrations: updatedExamRegs,
        };
      });
    },
    // Admissions Edit & Update
    updateStudentAdmission: async (id, updates) => {
      requireLiveDatabase('Updating this admission');
      const app = dataRef.current.applications.find(item => String(item.id) === String(id));
      const student = dataRef.current.onboardedStudents.find(item => [item.id, item.studentId].some(key => String(key) === String(id)));
      if (!app && !student) throw new Error('Select an existing admission or student record.');
      mutationEpochRef.current += 1;
      const saved = app
        ? await api.updateApplication(app.id, { ...app, ...updates, id: app.id })
        : await api.updateStudent(student.id, updates);
      mutationEpochRef.current += 1;
      await invalidateQueries(['admissions']);
      return saved;
    },
    // Define Bills Methods
    saveDefinedBill: async (billItem) => {
      try {
        await api.createDefinedBill(billItem);
      } catch (e) {
        console.warn('Backend bill create fallback:', e);
      }
      setData((current) => {
        const existing = current.definedBills || [];
        const newBill = {
          id: billItem.id || `def-${Date.now()}`,
          classLevel: billItem.classLevel || 'All Classes',
          academicYear: billItem.academicYear || '2026/2027',
          term: billItem.term || 'Term 1',
          billCategory: billItem.billCategory || 'Tuition Fee',
          amount: Number(billItem.amount) || 0,
          specification: billItem.specification || 'Compulsory',
          description: billItem.description || billItem.billCategory,
          dateDefined: billItem.dateDefined || new Date().toISOString().split('T')[0]
        };
        const updated = existing.some(b => b.id === newBill.id)
          ? existing.map(b => b.id === newBill.id ? newBill : b)
          : [newBill, ...existing];
        return { ...current, definedBills: updated };
      });
    },
    deleteDefinedBill: async (id) => {
      try {
        await api.deleteDefinedBill(id);
      } catch (e) {
        console.warn('Backend bill delete fallback:', e);
      }
      setData((current) => ({
        ...current,
        definedBills: (current.definedBills || []).filter(b => b.id !== id)
      }));
    },
    // Semester Registration Methods
    registerClassSemester: async ({ classLevel, academicYear, term, studentId, studentName }) => {
      try {
        if (studentId && studentName) {
          await api.createSemesterRegistration({ studentId, studentName, classLevel, academicYear, term });
        }
      } catch (e) {
        console.warn('Backend semester reg fallback:', e);
      }
      setData((current) => {
        const existingRegs = current.semesterRegistrations || [];
        let newEntries = [];

        if (studentId && studentName) {
          // Individual Registration
          newEntries.push({
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentId,
            studentName,
            classLevel: classLevel || 'All Classes',
            academicYear: academicYear || '2026/2027',
            term: term || 'Term 1',
            status: 'Registered',
            registeredAt: new Date().toISOString().split('T')[0]
          });
        } else if (classLevel) {
          // Class-based Bulk Registration
          const targetStudents = (current.onboardedStudents || []).filter(s =>
            classLevel === 'All Classes' || (s.level || '').toLowerCase().includes(classLevel.toLowerCase())
          );
          const listToUse = targetStudents.length > 0 ? targetStudents : current.onboardedStudents || [];
          listToUse.forEach(s => {
            newEntries.push({
              id: `reg-${Date.now()}-${s.id || s.studentId}`,
              studentId: s.studentId || s.id,
              studentName: s.fullName || s.name,
              classLevel: s.level || classLevel,
              academicYear: academicYear || '2026/2027',
              term: term || 'Term 1',
              status: 'Registered',
              registeredAt: new Date().toISOString().split('T')[0]
            });
          });
        }

        return {
          ...current,
          semesterRegistrations: [...newEntries, ...existingRegs]
        };
      });
    },
    deleteSemesterRegistration: async (id) => {
      try {
        await api.deleteSemesterRegistration(id);
      } catch (e) {
        console.warn('Backend semester reg delete fallback:', e);
      }
      setData((current) => ({
        ...current,
        semesterRegistrations: (current.semesterRegistrations || []).filter(r => r.id !== id && r.studentId !== id)
      }));
    },
    // Score Sheet Entry Persistence — upserts on the entry key so a saved sheet can be edited later
    saveScoreSheetEntry: async (entry) => {
      requireLiveDatabase('Saving this score sheet');
      if (!entry.studentId) throw new Error('Select a student before saving scores.');
      const rosterStudent = (dataRef.current.onboardedStudents || []).find(student => [student.id, student.studentId].some(id => id && String(id) === String(entry.studentId)));
      entry = { ...entry, studentId: rosterStudent?.id || entry.studentId };
      const entryKey = scoreSheetEntryKey(entry);
      if (writeLocksRef.current.has(entryKey)) throw new Error('This score sheet is already being saved.');
      writeLocksRef.current.add(entryKey);
      mutationEpochRef.current += 1;
      try {
        const existing = (dataRef.current.results || []).find(r => scoreSheetEntryKey({ ...r, studentId: rosterStudent && [rosterStudent.id, rosterStudent.studentId].includes(r.studentId) ? rosterStudent.id : r.studentId }) === entryKey);
        if (/published|approved/i.test(existing?.status || '')) throw new Error('Published scores require an approved correction workflow.');
        if (entry.submitKind === 'class' && existing?.hasExamScore) {
          if (existing.rawExamScore == null) throw new Error('Reopen the saved sheet to load its raw exam score before editing class marks.');
          entry = { ...entry, examScore: existing.rawExamScore, rawExamScore: existing.rawExamScore, hasExamScore: true };
        }
        const payload = { ...existing, ...entry, rawExamScore: entry.examScore, entryKey, status: entry.hasExamScore ? 'Pending Approval' : 'Class Score Recorded' };
        const raw = existing?.backendId
          ? await api.updateScoreSheet(existing.backendId, payload)
          : await api.saveScoreSheet(payload);
        const record = raw.entry || raw.data || raw;
        const saved = mapScoreSheetEntry(record);
        if (!saved.id || !saved.studentId) throw new Error('The server did not return the saved score sheet. Refresh before retrying.');
        if (![entry.studentId, rosterStudent?.studentId].filter(Boolean).some(id => String(saved.studentId) === String(id))) throw new Error('The server returned a different student record. Refresh before retrying.');
        const persisted = { ...saved, assessmentRecord: true, studentId: entry.studentId, backendId: saved.id, entryKey };
        setData(current => ({ ...current, results: [persisted, ...(current.results || []).filter(r => r.id !== existing?.id && scoreSheetEntryKey(r) !== entryKey)] }));
        return persisted;
      } finally {
        mutationEpochRef.current += 1;
        writeLocksRef.current.delete(entryKey);
      }
    },
    // Payment Recording with Robust Match Logic
    recordFeePaymentBatch: async (items, idempotencyKey) => {
      requireLiveDatabase('Recording this payment batch');
      const payments = items.map(item => {
        const fee = resolveFee(dataRef.current.studentFees, { id: item.feeId, studentId: item.studentId });
        if (!Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) throw new Error('Every batch amount must be positive.');
        return { feeId: fee.id, paidAmount: Number(item.amount), paymentDate: item.date, notes: item.description, transactionRef: item.reference };
      });
      const raw = await api.createFeePaymentBatch({ payments }, idempotencyKey);
      const saved = raw.batch || raw.data?.batch;
      const fees = raw.fees || raw.data?.fees;
      if (!saved?.id || !saved.batchNo || !Array.isArray(fees)) throw new Error('No committed batch and invoices were returned. Refresh before retrying.');
      setData(current => {
        const updated = current.studentFees.map(f => { const match = fees.find(x => String(x.id) === String(f.id)); return match ? mapFeeFromApi(match) : f; });
        return { ...current, studentFees: updated, feeAccounts: buildFeeAccountsFromStudentFees(updated) };
      });
      return saved;
    },
    recordFeePayment: async (payment) => {
      requireLiveDatabase('Recording this payment');
      const fee = resolveFee(dataRef.current.studentFees || [], payment);
      const paidAmount = Number(payment.paidAmount);
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) throw new Error('Enter a positive payment amount.');
      const lock = `fee:${fee.id}`;
      if (writeLocksRef.current.has(lock)) throw new Error('A payment for this invoice is already being recorded.');
      const payload = { paidAmount, paymentDate: payment.paymentDate || new Date().toISOString().slice(0, 10), paymentMethod: payment.paymentMethod || 'Cash', receivingAccount: payment.receivingAccount, notes: payment.notes || '', transactionRef: payment.transactionRef };
      const fingerprint = JSON.stringify([fee.id, payload]);
      const idempotencyKey = payment.idempotencyKey || paymentKeysRef.current.get(fingerprint) || crypto.randomUUID();
      paymentKeysRef.current.set(fingerprint, idempotencyKey);
      writeLocksRef.current.add(lock);
      mutationEpochRef.current += 1;
      try {
        const raw = await api.recordFeePayment(fee.id, { ...payload, idempotencyKey });
        const confirmed = raw.fee || raw.data?.fee;
        if (!confirmed?.id || String(confirmed.id) !== String(fee.id)) throw new Error('Payment was not confirmed with the updated invoice. Refresh before retrying.');
        const saved = mapFeeFromApi(confirmed);
        setData(current => ({ ...current, studentFees: current.studentFees.map(f => String(f.id) === String(saved.id) ? saved : f), feeAccounts: buildFeeAccountsFromStudentFees(current.studentFees.map(f => String(f.id) === String(saved.id) ? saved : f)) }));
        paymentKeysRef.current.delete(fingerprint);
        return raw;
      } finally {
        mutationEpochRef.current += 1;
        writeLocksRef.current.delete(lock);
      }
    },
    addStudentFee: (feeRecord) => setData((current) => ({
      ...current,
      studentFees: [{
        id: crypto.randomUUID?.() || String(Date.now()),
        ...feeRecord,
        balance: feeRecord.billedAmount - (feeRecord.paidAmount || 0),
        status: (feeRecord.paidAmount || 0) >= feeRecord.billedAmount
          ? 'Paid'
          : (feeRecord.paidAmount || 0) > 0
            ? 'Balance Due'
            : 'Not Paid',
        paymentDate: (feeRecord.paidAmount || 0) > 0 ? (feeRecord.paymentDate || new Date().toISOString().split('T')[0]) : null,
      }, ...(current.studentFees || [])],
    })),
    postAcademicBill: async ({ studentId, studentName, classLevel, items, totalAmount, term = 'Term 1 · 2026', targetStudents: requestedStudents } = {}) => {
      const current = dataRef.current || {};
      const amountToPost = Number(totalAmount) || 0;
      let targetStudents = [];
      if (Array.isArray(requestedStudents) && requestedStudents.length > 0) {
        targetStudents = requestedStudents.map((req) => (
          findStudentForUpsert(current.onboardedStudents || [], { id: req.id, studentId: req.studentId }) || req
        )).filter((s) => s && (s.studentId || s.id || s.fullName || s.name));
      } else if (studentId) {
        targetStudents = (current.onboardedStudents || []).filter(s => String(s.studentId) === String(studentId) || String(s.id) === String(studentId));
      } else if (classLevel && classLevel !== 'All Classes') {
        const cleanClass = classLevel.toLowerCase();
        targetStudents = (current.onboardedStudents || []).filter(s => {
          const sLvl = (s.level || '').toLowerCase();
          return sLvl.includes(cleanClass) || cleanClass.includes(sLvl);
        });
      }

      const settings = current.academicSettings || {};
      let persistResult = { posted: 0, skipped: 0, failed: 0, errors: [], postedStudentKeys: [] };
      try {
        persistResult = await api.persistPostedAcademicBills({
          students: targetStudents,
          items,
          totalAmount: amountToPost,
          term,
          classLevel,
          academicYear: settings.academicYear || '2025/2026',
          billedBy: getUserFullName() || 'Accounts Office',
          dueDate: settings.resumptionDate || '2026-09-15',
        });
      } catch (e) {
        persistResult = { posted: 0, skipped: 0, failed: Math.max(1, targetStudents.length), errors: [e.message], postedStudentKeys: [] };
        console.warn('Backend bill post fallback:', e);
      }

      if ((persistResult.posted || 0) + (persistResult.skipped || 0) > 0) {
        try {
          const fees = deduplicateFees(extractApiList(await api.getFees()).map(mapFeeFromApi));
          mutationEpochRef.current += 1;
          setData(latest => ({ ...latest, studentFees: fees, feeAccounts: buildFeeAccountsFromStudentFees(fees) }));
        } catch (error) {
          persistResult.errors.push(`Bill submitted, but the account could not be reloaded: ${error.message}. Refresh before retrying.`);
          persistResult.failed = Math.max(1, persistResult.failed);
          persistResult.reconciliationPending = true;
        }
      }
      return persistResult;
    },
    fetchStudentLedger: async (studentId) => api.getStudentLedger(studentId),
    postClassBillsBatch: async ({ classLevel, academicYear, term, excludeStudentIds, billTemplateId } = {}) => {
      const settings = (dataRef.current || {}).academicSettings || {};
      const result = await api.persistPostedAcademicBills({
        classLevel,
        academicYear: academicYear || settings.academicYear || '2025/2026',
        term: term || 'Term 1',
        useBatch: true,
        excludeStudentIds,
        billTemplateId,
      });
      if ((result.posted || 0) + (result.skipped || 0) > 0) {
        try { await refreshBackendData(); } catch (e) { console.warn('Fee ledger refresh after class batch failed:', e); }
      }
      return result;
    },
    adjustStudentBill: async (adjustment) => {
      requireLiveDatabase('Correcting this invoice');
      const student = (dataRef.current.onboardedStudents || []).find(s => [s.id, s.studentId].includes(adjustment.studentId));
      const feeId = adjustment.feeId || adjustment.fee_id;
      const matching = feeId
        ? (dataRef.current.studentFees || []).filter(f => String(f.id) === String(feeId))
        : (dataRef.current.studentFees || []).filter(f => [student?.id, student?.studentId, adjustment.studentId].filter(Boolean).some(id => String(f.studentId) === String(id)));
      if (matching.length !== 1) throw new Error('Select one existing invoice, including its term, before correcting it.');
      const fee = matching[0];
      const type = String(adjustment.adjustmentType || 'CREDIT').toUpperCase();
      if (!['CREDIT', 'DEBIT', 'CANCEL'].includes(type)) throw new Error('Choose Credit, Debit or Cancel for the selected invoice.');
      const amount = Number(adjustment.amount);
      if (type !== 'CANCEL' && (!Number.isFinite(amount) || amount <= 0)) throw new Error('Enter a positive adjustment amount.');
      if (!String(adjustment.reason || '').trim()) throw new Error('An adjustment reason is required.');
      const lock = `adjust:${fee.id}`;
      if (writeLocksRef.current.has(lock)) throw new Error('This invoice is already being updated.');
      const fingerprint = JSON.stringify([fee.id, type, amount, adjustment.reason]);
      const key = paymentKeysRef.current.get(fingerprint) || crypto.randomUUID();
      paymentKeysRef.current.set(fingerprint, key);
      writeLocksRef.current.add(lock); mutationEpochRef.current += 1;
      try {
        const raw = type === 'CANCEL'
          ? await api.cancelStudentBill(fee.id, adjustment.reason, key)
          : await api.adjustStudentBill({ ...adjustment, feeId: fee.id, adjustmentType: type }, key);
        const candidate = raw.fee || raw.data?.fee || (raw.billed_amount !== undefined || raw.billedAmount !== undefined ? raw : null);
        const fees = candidate ? [mapFeeFromApi(candidate)] : extractApiList(await api.getFees()).map(mapFeeFromApi);
        const saved = fees.find(f => String(f.id) === String(fee.id));
        if (!saved) throw new Error('The operation was submitted, but the updated invoice could not be loaded. Refresh before retrying.');
        setData(current => {
          const updated = current.studentFees.map(f => String(f.id) === String(saved.id) ? saved : f);
          return { ...current, studentFees: updated, feeAccounts: buildFeeAccountsFromStudentFees(updated) };
        });
        paymentKeysRef.current.delete(fingerprint);
        return saved;
      } finally { mutationEpochRef.current += 1; writeLocksRef.current.delete(lock); }
    },
    sendAccountantMessage: async (msg) => {
      try {
        await api.sendFeeReminder({
          to: msg.to || msg.recipientEmail || 'Parents',
          recipientEmail: msg.recipientEmail || 'parent@remaljcarewell.edu.gh',
          studentName: msg.studentName || 'Student',
          subject: msg.subject,
          body: msg.body
        });
      } catch (e) {
        console.warn('Backend accountant message fallback:', e);
      }

      setData((current) => ({
        ...current,
        accountantMessages: [{
          id: crypto.randomUUID?.() || String(Date.now()),
          from: (current.profiles?.accountant?.name) || 'Mrs. Grace Accountant',
          senderRole: 'Accountant',
          ...msg,
          sentAt: new Date().toLocaleString(),
          status: 'Sent',
        }, ...(current.accountantMessages || [])],
        messages: [{
          id: crypto.randomUUID?.() || String(Date.now()),
          from: (current.profiles?.accountant?.name) || 'Mrs. Grace Accountant',
          senderRole: 'Accountant',
          to: msg.to || 'Parents',
          recipient: msg.to || msg.guardianName || 'Parents',
          subject: msg.subject,
          body: msg.body,
          sentAt: new Date().toLocaleString(),
        }, ...(current.messages || [])],
      }));
    },
    recordAttendanceScan: async (scanData) => {
      try {
        return await api.recordAttendanceScan(scanData);
      } catch (e) {
        console.warn('Attendance scan API warning:', e);
      }
    },
    submitRollCall: async (rollCallData) => {
      try {
        return await api.submitRollCall(rollCallData);
      } catch (e) {
        console.warn('Submit roll call API warning:', e);
      }
    },
    notifyAbsent: async (data) => {
      try {
        return await api.notifyAbsentGuardians(data);
      } catch (e) {
        console.warn('Notify absent API warning:', e);
      }
    },
    notifyAbsentGuardians: async (data) => {
      try {
        return await api.notifyAbsentGuardians(data);
      } catch (e) {
        console.warn('Notify absent guardians API warning:', e);
      }
    },
    sendSingleFeeOwingReminder: async (feeId, data = {}) => {
      try {
        return await api.sendSingleFeeOwingReminder(feeId, { sendSms: true, ...data });
      } catch (e) {
        console.warn('Send single fee owing reminder API warning:', e);
        throw e;
      }
    },
    broadcastOwingReminders: async (data = {}) => {
      try {
        return await api.broadcastOwingReminders({ sendSms: true, ...data });
      } catch (e) {
        console.warn('Broadcast owing reminders API warning:', e);
        throw e;
      }
    },
    sendDirectSms: async (data) => {
      try {
        return await api.sendDirectSms(data);
      } catch (e) {
        console.warn('Send direct SMS API warning:', e);
        throw e;
      }
    },
    getSmsBalance: async () => {
      try {
        return await api.getSmsBalance();
      } catch (e) {
        console.warn('Get SMS balance API warning:', e);
        throw e;
      }
    },
    // Staff Onboarding & Management Methods
    addStaffMember: async (staffData) => {
      const created = await api.createStaff({
        ...staffData,
        classAssigned: formatClassToBasic(staffData.classAssigned || ''),
        role: staffData.role || 'Subject Teacher',
        status: staffData.status || 'Active'
      });
      const createdPayload = (created && typeof created === 'object') ? (created.staff || created.data || created) : null;
      if (!createdPayload || typeof createdPayload !== 'object') {
        throw new Error('The database did not save this staff member.');
      }
      const newStaff = {
        ...createdPayload,
        id: createdPayload.id || createdPayload.staffId || createdPayload.staff_id,
        staffId: createdPayload.staffId || createdPayload.staff_id || staffData.staffId || '',
        name: createdPayload.name || createdPayload.fullName || createdPayload.full_name || staffData.name,
        classAssigned: formatClassToBasic(createdPayload.classAssigned || createdPayload.class_assigned || staffData.classAssigned || ''),
        role: createdPayload.role || createdPayload.designation || staffData.role || 'Subject Teacher',
        teacherDesignation: staffData.teacherDesignation || createdPayload.teacherDesignation || createdPayload.teacher_designation,
        subject: createdPayload.subject || staffData.subject || '',
        email: createdPayload.email || staffData.email || '',
        phone: createdPayload.phone || staffData.phone || '',
        status: createdPayload.status || 'Active'
      };
      setData((current) => {
        const currentList = current.teacherDirectory || [];
        return {
          ...current,
          teacherDirectory: [newStaff, ...currentList.filter(t => t.id !== newStaff.id && t.staffId !== newStaff.staffId)]
        };
      });
    },
    updateStaffMember: async (id, updates) => {
      const sanitizedUpdates = {
        ...updates,
        ...(updates.classAssigned ? { classAssigned: formatClassToBasic(updates.classAssigned) } : {})
      };
      await api.updateStaff(id, sanitizedUpdates);
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || []).map((t) => (t.id === id || t.staffId === id) ? { ...t, ...sanitizedUpdates } : t)
      }));
    },
    offboardStaffMember: async (staffOrId) => {
      await setDirectoryAccess(staffOrId, 'offboard');
    },
    reactivateStaffMember: async (staffOrId) => {
      await setDirectoryAccess(staffOrId, 'reactivate');
    },
    deleteStaffMember: async (id) => {
      await api.deleteStaff(id);
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || []).filter((t) => t.id !== id && t.staffId !== id)
      }));
    },
    // Dynamic Classes & Subjects Methods
    addClassLevel: async (newClass, category) => {
      const name = String(newClass || '').trim();
      if (!name) return;
      await api.createCatalogEntry('classes', name, { category });
      setData((current) => {
        const existing = current.classLevels || DEFAULT_CLASS_LEVELS;
        if (existing.includes(name)) return current;
        return {
          ...current,
          classLevels: [...existing, name]
        };
      });
      return name;
    },
    addSubClassLevel: async (className, subClassName) => {
      const c = String(className || '').trim();
      const sc = String(subClassName || '').trim();
      if (!c || !sc) return;
      registerCustomSubClass(c, sc);
      try {
        await api.createCatalogEntry('subclasses', sc, { className: c, classLevel: c, name: sc });
      } catch (e) {
        console.warn('Backend subclass catalog fallback:', e?.message || e);
      }
      setData((current) => ({
        ...current,
        customSubClassMap: {
          ...(current.customSubClassMap || {}),
          [c]: Array.from(new Set([...((current.customSubClassMap || {})[c] || []), sc]))
        }
      }));
      return { className: c, subClass: sc };
    },
    saveTeachingAssignment: async (assignment) => {
      const saved = await api.saveTeachingAssignment(assignment);
      const mapped = mapTeachingAssignment({
        ...assignment,
        ...(saved && typeof saved === 'object' ? saved : {}),
        classes: assignment.classes,
        subjects: assignment.subjects,
        teacherName: assignment.teacherName,
        staffId: assignment.staffId,
        userId: assignment.userId,
        role: assignment.role,
        email: assignment.email,
      });
      if (!mapped) throw new Error('The database did not save this teaching assignment.');
      setData((current) => {
        const list = current.teachingAssignments || [];
        const index = list.findIndex((item) => findTeachingAssignment([item], mapped));
        const next = index >= 0
          ? list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...mapped } : item))
          : [mapped, ...list];
        return { ...current, teachingAssignments: next };
      });
      return mapped;
    },
    addSubject: async (newSubject) => {
      if (!newSubject) return;
      const subjectName = newSubject.trim();
      try {
        await api.createCatalogEntry('subjects', subjectName);
      } catch (e) {
        console.warn('Backend subject catalog fallback:', e);
      }
      setData((current) => {
        const existing = current.subjects || DEFAULT_SUBJECTS;
        if (existing.includes(subjectName)) return current;
        return {
          ...current,
          subjects: [...existing, subjectName]
        };
      });
    },
    // Examination Candidate Registration Methods
    registerIndividualExam: async (regData) => {
      const saved = await api.createExamRegistration(regData);
      const mapped = mapExamRegistration(saved, regData);
      if (!mapped) throw new Error('The database did not save this exam registration.');
      setData((current) => {
        const existing = (current.examRegistrations || []).filter((item) => item.id !== mapped.id && item.studentId !== mapped.studentId);
        return { ...current, examRegistrations: [mapped, ...existing] };
      });
      return mapped;
    },

    registerClassExams: async (classRegData) => {
      const saved = await api.createBulkExamRegistration(classRegData);
      const fromApi = extractExamRegistrations(saved);
      const students = classRegData.students || [];
      const mapped = fromApi.length ? fromApi : students.map((student) => mapExamRegistration({
        student_id: student.studentUuid || student.id || student.studentId,
        student_name: student.studentName,
        class_level: classRegData.classLevel,
        academic_year: classRegData.academicYear,
        term: classRegData.term,
        exam_type: classRegData.examType,
        exam_center: classRegData.examCenter,
        subjects: classRegData.subjects,
        index_number: student.indexNumber,
      }, student)).filter(Boolean);
      if (!mapped.length) throw new Error('The database did not save this class exam registration.');
      setData((current) => {
        const existing = current.examRegistrations || [];
        const keys = new Set(mapped.map((item) => item.studentId || item.id));
        return {
          ...current,
          examRegistrations: [...mapped, ...existing.filter((item) => !keys.has(item.studentId || item.id))],
        };
      });
      return mapped;
    },
    cancelExamRegistration: async (regId) => {
      const id = String(regId || '').trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        await api.deleteExamRegistration(id);
      }
      setData((current) => ({
        ...current,
        examRegistrations: (current.examRegistrations || []).filter((item) => item.id !== regId && item.indexNumber !== regId)
      }));
    },
    refreshPaymentVoucherDesk: async () => {
      const [rawVouchers, rawProviders] = await Promise.all([api.getPaymentVouchers(), api.getServiceProviders()]);
      const providers = Array.isArray(rawProviders) ? rawProviders : rawProviders.providers || rawProviders.data;
      if (!Array.isArray(providers)) throw new Error('The database returned an invalid provider list.');
      mutationEpochRef.current += 1;
      setData(current => ({ ...current, paymentVouchers: deduplicatePaymentVouchers(api.extractPaymentVoucherList(rawVouchers).map(mapApiPaymentVoucher)), serviceProviders: providers.filter(p => p.is_active !== false) }));
    },
    // Payment Voucher (PV) Management Methods
    addPaymentVoucher: async (pvData) => {
      requireLiveDatabase('Saving this payment voucher');
      let apiRecord = null;
      try {
        const created = await api.createPaymentVoucher({
          pv_number: pvData.pvNo,
          requisitionNo: pvData.requisitionNo,
          payee_name: pvData.provider || pvData.payee_name || 'General Vendor',
          payee_id: pvData.providerId || pvData.payee_id || 'VEN-001',
          department: pvData.department || 'Administration',
          description: pvData.description || 'Expenditure Voucher',
          payment_mode: pvData.paymentMode || pvData.payment_mode || 'Cash',
          quantity: Number(pvData.qty) || 1,
          unit_cost: Number(pvData.cost || pvData.costPerItem || pvData.unit_cost) || 0,
          amount: Number(pvData.grandTotal || pvData.total || pvData.cost || pvData.amount) || 0,
          date_prepared: pvData.datePrepared,
          valued_date: pvData.valuedDate || pvData.datePrepared,
          items: pvData.items || [],
        });
        apiRecord = unwrapApiPaymentVoucher(created);
      } catch (e) {
        throw new Error(failedDatabaseAction('Saving this payment voucher', e));
      }
      requireBackendUuid(apiRecord?.id, 'Saving this payment voucher');
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const existingNotifs = current.pvNotifications || [];
        const newPV = buildPersistedPaymentVoucher({
          ...pvData,
          pvNo: pvData.pvNo || `PV-2026-${String(existing.length + 100).padStart(3, '0')}`,
          auditRemarks: pvData.auditRemarks || 'Created in system.',
          submittedBy: pvData.submittedBy || 'Sub-Admin',
        }, apiRecord);
        const newNotif = {
          id: `notif-pv-${Date.now()}`,
          pvNo: newPV.pvNo,
          provider: newPV.provider,
          grandTotal: newPV.grandTotal || newPV.total,
          description: newPV.description,
          submittedBy: newPV.submittedBy,
          submittedAt: new Date().toLocaleString(),
          read: false,
        };
        return {
          ...current,
          paymentVouchers: upsertPaymentVoucherList(existing, newPV),
          pvNotifications: [newNotif, ...existingNotifs],
        };
      });
      void invalidateQueries(['payment-vouchers']);
    },
    createServiceProvider: async (providerData) => {
      requireLiveDatabase('Saving this service provider');
      mutationEpochRef.current += 1;
      const raw = await api.createServiceProvider(providerData);
      mutationEpochRef.current += 1;
      const saved = raw.provider || raw.data || raw;
      if (!saved.id) throw new Error('The server did not return the saved provider.');
      setData(current => ({ ...current, serviceProviders: [saved, ...current.serviceProviders.filter(p => p.id !== saved.id)] }));
      return saved;
    },
    updateServiceProvider: async (id, providerData) => {
      requireLiveDatabase('Updating this service provider');
      mutationEpochRef.current += 1;
      const raw = await api.updateServiceProvider(id, providerData);
      mutationEpochRef.current += 1;
      const saved = raw.provider || raw.data || raw;
      if (String(saved.id) !== String(id)) throw new Error('The server did not confirm the updated provider.');
      setData(current => ({ ...current, serviceProviders: current.serviceProviders.map(p => p.id === id ? saved : p) }));
      return saved;
    },
    deleteServiceProvider: async (id) => {
      requireLiveDatabase('Deleting this service provider');
      mutationEpochRef.current += 1;
      await api.deleteServiceProvider(id);
      mutationEpochRef.current += 1;
      setData(current => ({ ...current, serviceProviders: current.serviceProviders.filter(p => p.id !== id) }));
    },
    // Alias so SubmitPVRequest can call createPaymentVoucher too
    createPaymentVoucher: async (pvData) => {
      requireLiveDatabase('Saving this payment voucher');
      mutationEpochRef.current += 1;
      const raw = await api.createPaymentVoucher(pvData);
      const saved = unwrapApiPaymentVoucher(raw);
      requireBackendUuid(saved?.id, 'Saving this payment voucher');
      mutationEpochRef.current += 1;
      const canonical = mapApiPaymentVoucher(saved);
      setData(current => ({ ...current, paymentVouchers: upsertPaymentVoucherList(current.paymentVouchers || [], canonical) }));
      return canonical;
    },

    // Notification management
    markAllPVNotificationsRead: () => setData((current) => {
      const notifs = current.pvNotifications || [];
      return {
        ...current,
        pvNotifications: notifs.map(n => ({ ...n, read: true }))
      };
    }),
    clearPVNotifications: () => setData((current) => ({
      ...current,
      pvNotifications: []
    })),
    markPVNotificationRead: (idOrPvNo) => setData((current) => {
      const key = String(idOrPvNo).toLowerCase().trim();
      return {
        ...current,
        pvNotifications: (current.pvNotifications || []).map(n => {
          const nKey = String(n.pvNo || n.id || '').toLowerCase().trim();
          return (n.id === idOrPvNo || nKey === key) ? { ...n, read: true } : n;
        })
      };
    }),
    updatePaymentVoucher: async (pvNo, updatedFields, editorRole = 'Headmaster / Pre-Auditor') => {
      requireLiveDatabase('Saving voucher corrections');
      const currentVouchers = dataRef.current.paymentVouchers || [];
      const existingVoucher = currentVouchers.find((p) => pvMatchesRef(p, pvNo));
      const targetUuid = existingVoucher?.id;
      requireBackendUuid(targetUuid, 'Saving voucher corrections');
      try {
        await api.correctPaymentVoucher(targetUuid, {
          reason: `Voucher details corrected by ${editorRole} prior to approval`,
          changes: updatedFields
        });
      } catch (e) {
        throw new Error(failedDatabaseAction('Saving voucher corrections', e));
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const updated = existing.map(p => {
          if (pvMatchesRef(p, pvNo)) {
            const qtyVal = Number(updatedFields.qty !== undefined ? updatedFields.qty : p.qty) || 1;
            const costVal = Number(updatedFields.cost !== undefined ? updatedFields.cost : (updatedFields.costPerItem !== undefined ? updatedFields.costPerItem : (p.cost || 0))) || 0;
            const newTotal = qtyVal * costVal;
            const correctionEntry = {
              id: `corr-${Date.now()}`,
              timestamp: new Date().toLocaleString(),
              editedBy: editorRole,
              changes: updatedFields
            };
            return {
              ...p,
              ...updatedFields,
              qty: qtyVal,
              cost: costVal,
              total: newTotal,
              editedByHeadmaster: true,
              correctionsLog: [correctionEntry, ...(p.correctionsLog || [])]
            };
          }
          return p;
        });
        return {
          ...current,
          paymentVouchers: updated
        };
      });
    },
    approvePaymentVoucher: async (reference, action, remarks, updatedFields = null) => {
      requireLiveDatabase('Reviewing this voucher');
      const voucher = (dataRef.current.paymentVouchers || []).find(v => String(v.id) === String(reference) || pvNosMatch(v.pvNo, reference));
      requireBackendUuid(voucher?.id, 'Reviewing this voucher');
      const reviewKey = `review:${voucher.id}`;
      if (writeLocksRef.current.has(reviewKey)) throw new Error('This voucher is already being reviewed.');
      writeLocksRef.current.add(reviewKey);
      try {
      mutationEpochRef.current += 1;
      const raw = await api.reviewPaymentVoucher(voucher.id, { action, remarks, items: updatedFields?.items || voucher.items, version: voucher.version });
      mutationEpochRef.current += 1;
      const saved = unwrapApiPaymentVoucher(raw);
      if (String(saved?.id) !== String(voucher.id)) throw new Error('The database did not return the reviewed voucher. Refresh before retrying.');
      if (!['APPROVED', 'REJECTED'].includes(String(saved.status).toUpperCase())) throw new Error('The database did not confirm approval or rejection. Refresh the voucher before retrying.');
      setData(current => ({ ...current, paymentVouchers: current.paymentVouchers.map(v => String(v.id) === String(saved.id) ? mapApiPaymentVoucher(saved) : v) }));
      return saved;
      } finally { writeLocksRef.current.delete(reviewKey); }
    },
    disbursePaymentVoucher: async (reference, paymentDetails = {}) => {
      requireLiveDatabase('Disbursing this voucher');
      const voucher = (dataRef.current.paymentVouchers || []).find(v => String(v.id) === String(reference) || pvNosMatch(v.pvNo, reference));
      requireBackendUuid(voucher?.id, 'Disbursing this voucher');
      if (payableAmount(voucher) <= 0) throw new Error('This voucher has no approved amount to disburse.');
      const key = `disburse:${voucher.id}`;
      if (writeLocksRef.current.has(key)) throw new Error('This voucher is already being paid.');
      const idempotencyKey = paymentKeysRef.current.get(key) || crypto.randomUUID();
      paymentKeysRef.current.set(key, idempotencyKey);
      writeLocksRef.current.add(key);
      try {
        const raw = await api.disbursePaymentVoucher(voucher.id, { ...paymentDetails, idempotencyKey, version: voucher.version });
        const saved = unwrapApiPaymentVoucher(raw);
        if (String(saved?.id) !== String(voucher.id) || !['DISBURSED', 'PAID'].includes(String(saved.status).toUpperCase())) throw new Error('The database did not confirm disbursement. Refresh before retrying.');
        setData(current => ({ ...current, paymentVouchers: current.paymentVouchers.map(v => String(v.id) === String(saved.id) ? mapApiPaymentVoucher(saved) : v) }));
        paymentKeysRef.current.delete(key);
        return saved;
      } finally { writeLocksRef.current.delete(key); }
    },
    adminSetUserPassword: async ({ identifier, email, studentId, staffId, newPassword, role = 'student', fullName = '', adminName = 'System Administrator' }) => {
      const targetId = identifier || email || studentId || staffId;
      if (!targetId || !newPassword) return false;
      const cleanId = String(targetId).toLowerCase().trim();

      await api.adminSetUserPassword({
        identifier: cleanId,
        newPassword,
        role,
        fullName,
        adminName
      });

      setData((current) => {
        const updatedStudents = (current.onboardedStudents || []).map(s => {
          if ((s.studentId && s.studentId.toLowerCase() === cleanId) || (s.studentEmail && s.studentEmail.toLowerCase() === cleanId) || (s.id && s.id.toLowerCase() === cleanId) || (s.guardianEmail && s.guardianEmail.toLowerCase() === cleanId)) {
            return {
              ...s,
              defaultPassword: newPassword,
              portalPassword: newPassword,
              password: newPassword,
              lastPasswordResetBy: adminName,
              lastPasswordResetAt: new Date().toLocaleString()
            };
          }
          return s;
        });

        const updatedTeachers = (current.teacherDirectory || []).map(t => {
          if ((t.staffId && t.staffId.toLowerCase() === cleanId) || (t.email && t.email.toLowerCase() === cleanId) || (t.id && t.id.toLowerCase() === cleanId)) {
            return {
              ...t,
              password: newPassword,
              passcode: newPassword,
              lastPasswordResetBy: adminName,
              lastPasswordResetAt: new Date().toLocaleString()
            };
          }
          return t;
        });

        return {
          ...current,
          onboardedStudents: updatedStudents,
          teacherDirectory: updatedTeachers
        };
      });

      return true;
    },
  }), [data, refreshBackendData, invalidateQueries, performOnboardStudent, syncApplicationsToStudentDatabase]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}

export const usePortalStore = usePortalData;
export const usePortalContext = usePortalData;
