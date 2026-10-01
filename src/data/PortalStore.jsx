import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, getUserFullName, ensureDemoClassTeacherAccounts } from '../services/api';
import { cloudSync } from '../services/cloudSync';

const STORAGE_KEY = 'remalj-portal-live-data-v3';

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
  return !s || /^stu(-bulk)?-/i.test(s) || /^fee-(acc-)?/i.test(s);
}

function isOfficialStudentCode(code) {
  return /REMALJ-\d{4}-\d{3,}$/i.test(String(code || '').trim());
}

function preferCanonicalId(incoming, existing) {
  if (incoming && !isSyntheticLocalId(incoming) && isSyntheticLocalId(existing)) return incoming;
  if (existing && !isSyntheticLocalId(existing) && isSyntheticLocalId(incoming)) return existing;
  return incoming || existing;
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

  const rawCode = s.studentId || s.student_id_code || s.student_code || s.admission_no || s.admissionNo
    || (typeof s.student_id === 'string' && /[A-Za-z]/.test(s.student_id) ? s.student_id : '');
  const studentId = preferStudentCode(rawCode, fallback.studentId);
  const id = preferCanonicalId(s.id || s.uuid || s.pk, fallback.id);

  return {
    id: id || studentId || fallback.id,
    studentId: studentId || (id ? String(id) : fallback.studentId),
    rfidCardCode: s.rfidCardCode || s.rfid_card_code || s.card_id || fallback.rfidCardCode || '',
    fullName: fullComputed,
    firstName: s.firstName || fallback.firstName || '',
    otherNames: s.otherNames || s.other_names || fallback.otherNames || '',
    surname: s.surname || fallback.surname || '',
    dob: s.dob || fallback.dob || '',
    gender: s.gender || fallback.gender || 'Not Specified',
    level: formatClassToBasic(s.level || s.class_level || fallback.level || 'Basic 1'),
    classSection: s.classSection || s.class_section || fallback.classSection || 'A',
    guardianName: s.guardianName || s.guardian_name || fallback.guardianName || 'Parent/Guardian',
    guardianEmail: s.guardianEmail || s.guardian_email || fallback.guardianEmail || '',
    guardianPhone: s.guardianPhone || s.guardian_phone || fallback.guardianPhone || '',
    homeAddress: s.homeAddress || s.home_address || fallback.homeAddress || 'Bogoso',
    enrollmentDate: s.enrollmentDate || s.enrollment_date || fallback.enrollmentDate || new Date().toISOString().split('T')[0],
    status: s.status || fallback.status || 'Active',
    studentEmail: s.studentEmail || s.student_email || s.school_email || fallback.studentEmail || '',
    defaultPassword: s.defaultPassword || s.default_password || fallback.defaultPassword || '',
  };
}

export function studentsAreSamePerson(a = {}, b = {}) {
  const aName = normalizePersonName(a.fullName || a.name || a.full_name);
  const bName = normalizePersonName(b.fullName || b.name || b.full_name);
  const aSid = String(a.studentId || a.student_id_code || a.student_code || '').toLowerCase().trim();
  const bSid = String(b.studentId || b.student_id_code || b.student_code || '').toLowerCase().trim();
  const aId = String(a.id || '').toLowerCase().trim();
  const bId = String(b.id || '').toLowerCase().trim();
  const aEmail = String(a.studentEmail || a.student_email || a.email || '').toLowerCase().trim();
  const bEmail = String(b.studentEmail || b.student_email || b.email || '').toLowerCase().trim();
  const aRfid = String(a.rfidCardCode || a.rfid_card_code || '').toLowerCase().trim();
  const bRfid = String(b.rfidCardCode || b.rfid_card_code || '').toLowerCase().trim();

  if (aSid && bSid && aSid === bSid) return true;
  if (aId && bId && aId === bId) return true;
  if (aEmail && bEmail && aEmail === bEmail && aEmail.includes('@')) return true;
  if (aRfid && bRfid && aRfid === bRfid) return true;
  if (aName && bName && aName === bName) {
    if (isOfficialStudentCode(aSid) && isOfficialStudentCode(bSid) && aSid !== bSid) {
      if (aEmail && bEmail && aEmail !== bEmail) return false;
      if (a.dob && b.dob && String(a.dob) !== String(b.dob)) return false;
    }
    return true;
  }
  return false;
}

export function findMatchingStudent(list = [], candidate = {}) {
  return (list || []).find((s) => studentsAreSamePerson(s, candidate)) || null;
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
    guardianName: (incoming.guardianName && incoming.guardianName !== 'Parent/Guardian')
      ? incoming.guardianName
      : (prev.guardianName || incoming.guardianName || 'Parent/Guardian'),
    guardianEmail: incoming.guardianEmail || prev.guardianEmail,
    guardianPhone: incoming.guardianPhone || prev.guardianPhone,
    homeAddress: incoming.homeAddress || prev.homeAddress,
    enrollmentDate: prev.enrollmentDate || incoming.enrollmentDate || new Date().toISOString().split('T')[0],
    status: incoming.status || prev.status || 'Active',
    studentEmail: incoming.studentEmail || prev.studentEmail,
    defaultPassword: incoming.defaultPassword || prev.defaultPassword,
    rfidCardCode: incoming.rfidCardCode || prev.rfidCardCode,
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
  const sid = String(student.studentId || '').toLowerCase().trim();
  const email = String(student.studentEmail || student.guardianEmail || '').toLowerCase().trim();
  const name = normalizePersonName(student.fullName || student.name);
  return sid || email || name;
}

function upsertCanonicalLoginAccount({
  studentId,
  studentEmail,
  password,
  fullName,
  guardianEmail,
  guardianName,
  guardianPhone,
  parentPassword,
}) {
  if (!studentEmail && !studentId) return;
  try {
    const raw = localStorage.getItem('registered_accounts');
    const list = raw ? JSON.parse(raw) : {};
    const emailKey = (studentEmail || '').toLowerCase().trim();
    const sidKey = String(studentId || '').toLowerCase().trim();
    const personName = normalizePersonName(fullName);

    let keptPassword = password;
    let keptId = `usr_${studentId || emailKey}`;
    Object.keys(list).forEach((key) => {
      const item = list[key];
      if (!item || item.role !== 'student') return;
      const sameId = sidKey && item.studentId && String(item.studentId).toLowerCase() === sidKey;
      const sameEmail = emailKey && item.email && item.email.toLowerCase() === emailKey;
      const sameName = personName && normalizePersonName(item.fullName) === personName;
      if (sameId || sameEmail || sameName) {
        if (!keptPassword) keptPassword = item.password;
        if (item.id) keptId = item.id;
        delete list[key];
      }
    });

    const account = {
      id: keptId,
      studentId,
      email: studentEmail,
      password: keptPassword,
      fullName,
      role: 'student',
    };
    if (emailKey) list[emailKey] = account;
    if (sidKey && sidKey !== emailKey) list[sidKey] = account;

    const parentKey = (guardianEmail || '').toLowerCase().trim();
    if (parentKey && parentKey !== emailKey) {
      const existingParent = list[parentKey] && list[parentKey].role === 'parent' ? list[parentKey] : null;
      const linkedStudentIds = Array.from(new Set([
        ...(existingParent?.linkedStudentIds || []),
        studentId,
      ].filter(Boolean)));
      list[parentKey] = {
        ...(existingParent || {}),
        id: existingParent?.id || `usr_parent_${studentId}`,
        email: guardianEmail,
        phone: guardianPhone || existingParent?.phone,
        password: existingParent?.password || parentPassword || 'ParentPass2026!',
        fullName: guardianName || existingParent?.fullName || `Parent of ${fullName}`,
        role: 'parent',
        linkedStudentIds,
      };
    }

    localStorage.setItem('registered_accounts', JSON.stringify(list));
  } catch (e) { /* local cache only */ }
}

function applyCanonicalStudentToState(current, canonical) {
  const billed = billedAmountForLevel(canonical.level);
  const existingFee = (current.studentFees || []).find((f) =>
    (f.studentId && canonical.studentId && String(f.studentId) === String(canonical.studentId))
    || normalizePersonName(f.studentName) === normalizePersonName(canonical.fullName)
  );
  const existingFeeAccount = (current.feeAccounts || []).find((a) =>
    normalizePersonName(a.child) === normalizePersonName(canonical.fullName)
  );

  const newFee = {
    id: existingFee?.id || `fee-${canonical.studentId || canonical.id}`,
    studentId: canonical.studentId,
    studentName: canonical.fullName,
    otherNames: canonical.otherNames || '',
    guardianName: canonical.guardianName,
    guardianEmail: canonical.guardianEmail,
    term: existingFee?.term || 'Term 1 · 2026',
    billedAmount: Number(existingFee?.billedAmount) || billed,
    paidAmount: Number(existingFee?.paidAmount) || 0,
    balance: existingFee?.balance !== undefined ? Number(existingFee.balance) : billed,
    status: existingFee?.status || 'Not Paid',
    dueDate: existingFee?.dueDate || '2026-09-15',
    paymentDate: existingFee?.paymentDate || null,
  };
  const newFeeAccount = {
    id: existingFeeAccount?.id || `fee-acc-${canonical.studentId || canonical.id}`,
    child: canonical.fullName,
    school: 'REMALJ Carewell Inspirational School',
    term: existingFeeAccount?.term || 'Term 1 · 2026',
    billed: existingFeeAccount?.billed || newFee.billedAmount,
    paid: existingFeeAccount?.paid || newFee.paidAmount,
    status: existingFeeAccount?.status || newFee.status,
  };

  const otherStudents = (current.onboardedStudents || []).filter((s) => !studentsAreSamePerson(s, canonical));
  const otherFees = (current.studentFees || []).filter((f) => f !== existingFee);
  const otherFeeAccounts = (current.feeAccounts || []).filter((a) => a !== existingFeeAccount);

  upsertCanonicalLoginAccount({
    studentId: canonical.studentId,
    studentEmail: canonical.studentEmail,
    password: canonical.defaultPassword,
    fullName: canonical.fullName,
    guardianEmail: canonical.guardianEmail,
    guardianName: canonical.guardianName,
    guardianPhone: canonical.guardianPhone,
    parentPassword: canonical.parentPassword || 'ParentPass2026!',
  });

  return {
    ...current,
    onboardedStudents: deduplicateStudents([canonical, ...otherStudents]),
    studentFees: deduplicateFees([newFee, ...otherFees]),
    feeAccounts: [newFeeAccount, ...otherFeeAccounts],
  };
}

export function deduplicateFees(fees = []) {
  const map = new Map();
  (fees || []).forEach(f => {
    if (!f) return;
    const nameKey = (f.studentName || '').toLowerCase().trim();
    const termKey = (f.term || 'Term 1 · 2026').toLowerCase().trim();
    const key = nameKey ? `${nameKey}::${termKey}` : (f.studentId || f.id || '').toLowerCase().trim();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, f);
    } else {
      const prev = map.get(key);
      map.set(key, {
        ...prev,
        ...f,
        paidAmount: Math.max(Number(prev.paidAmount) || 0, Number(f.paidAmount) || 0),
        balance: Math.min(Number(prev.balance !== undefined ? prev.balance : prev.billedAmount) || 0, Number(f.balance !== undefined ? f.balance : f.billedAmount) || 0),
        status: (prev.status === 'Paid' || f.status === 'Paid') ? 'Paid' : (prev.status === 'Partially Paid' || f.status === 'Partially Paid') ? 'Partially Paid' : (f.status || prev.status || 'Not Paid')
      });
    }
  });
  return Array.from(map.values());
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

export const DEFAULT_TEACHER_DIRECTORY = [
  {
    id: 'stf-1',
    staffId: 'STF-2026-001',
    name: 'Joseph Asamoah Arthur',
    role: 'Class Teacher',
    teacherDesignation: 'class_teacher',
    subject: 'Pure Mathematics',
    classAssigned: 'Basic 4',
    email: 'j.arthur@remaljcarewell.edu.gh',
    phone: '024 900 1101',
    status: 'Active',
    photo: '👨‍🏫',
    joinedDate: '2024-01-15'
  },
  {
    id: 'stf-2',
    staffId: 'STF-2026-002',
    name: 'Prof. Kwabena Mensah',
    role: 'Department Head',
    subject: 'Science / Physics',
    classAssigned: 'Basic 7',
    email: 'k.mensah@remaljcarewell.edu.gh',
    phone: '024 900 1102',
    status: 'Active',
    photo: '👨‍🏫',
    joinedDate: '2023-09-01'
  },
  {
    id: 'stf-3',
    staffId: 'STF-2026-003',
    name: 'Mr. Samuel Amponsah',
    role: 'Subject Teacher',
    subject: 'ICT / Computing',
    classAssigned: 'Basic 8',
    email: 's.amponsah@remaljcarewell.edu.gh',
    phone: '024 900 1100',
    status: 'Active',
    photo: '👨‍🏫',
    joinedDate: '2024-02-10'
  },
  {
    id: 'stf-4',
    staffId: 'STF-2026-004',
    name: 'Mrs. Abena Sarfo',
    role: 'Class Teacher',
    teacherDesignation: 'class_teacher',
    subject: 'English Language',
    classAssigned: 'Basic 2',
    email: 'a.sarfo@remaljcarewell.edu.gh',
    phone: '024 900 1104',
    status: 'Active',
    photo: '👩‍🏫',
    joinedDate: '2024-03-01'
  },
  {
    id: 'stf-ct-demo',
    staffId: 'CT-2026-DEMO',
    name: 'Ms. Efua Boateng',
    role: 'Class Teacher',
    teacherDesignation: 'class_teacher',
    subject: 'General Education',
    classAssigned: 'Basic 1',
    email: 'classteacher@remaljcarewell.edu.gh',
    phone: '024 900 2200',
    status: 'Active',
    photo: '👩‍🏫',
    joinedDate: '2026-02-01'
  },
  {
    id: 'stf-5',
    staffId: 'STF-2026-005',
    name: 'Mr. Emmanuel Darko',
    role: 'Subject Teacher',
    subject: 'Social Studies',
    classAssigned: 'Basic 5',
    email: 'e.darko@remaljcarewell.edu.gh',
    phone: '024 900 1105',
    status: 'Active',
    photo: '👨‍🏫',
    joinedDate: '2024-05-15'
  },
  {
    id: 'stf-6',
    staffId: 'STF-2026-006',
    name: 'Madam Grace Anim-Ansah',
    role: 'Subject Teacher',
    subject: 'French',
    classAssigned: 'Basic 6',
    email: 'g.anim@remaljcarewell.edu.gh',
    phone: '024 900 1106',
    status: 'Active',
    photo: '👩‍🏫',
    joinedDate: '2023-11-20'
  }
];

export const DEFAULT_TIMETABLE = [
  { id: 'tt-1', day: 'Monday', time: '08:00 AM', subject: 'Pure Mathematics', room: 'Room 402', lecturer: 'Prof. Mensah' },
  { id: 'tt-2', day: 'Wednesday', time: '08:00 AM', subject: 'Literature in English', room: 'Auditorium B', lecturer: 'Dr. Anane' },
  { id: 'tt-3', day: 'Tuesday', time: '10:30 AM', subject: 'Physics Lab', room: 'Science Block 1', lecturer: 'Mr. Boateng' },
  { id: 'tt-4', day: 'Monday', time: '01:00 PM', subject: 'ICT Project', room: 'Lab 2', lecturer: 'Ms. Mensah' },
  { id: 'tt-5', day: 'Tuesday', time: '01:00 PM', subject: 'English Essay', room: 'Room 204', lecturer: 'Mrs. Adjei' },
  { id: 'tt-6', day: 'Wednesday', time: '01:00 PM', subject: 'Mathematics', room: 'Room 402', lecturer: 'Prof. Mensah' },
  { id: 'tt-7', day: 'Thursday', time: '08:00 AM', subject: 'Integrated Science', room: 'Science Block 1', lecturer: 'Mr. Boateng' },
  { id: 'tt-8', day: 'Thursday', time: '01:00 PM', subject: 'ICT Project', room: 'Lab 2', lecturer: 'Ms. Mensah' },
  { id: 'tt-9', day: 'Friday', time: '08:00 AM', subject: 'Pure Mathematics', room: 'Room 402', lecturer: 'Prof. Mensah' },
  { id: 'tt-10', day: 'Friday', time: '10:30 AM', subject: 'Social Studies', room: 'Room 204', lecturer: 'Mrs. Adjei' },
  { id: 'tt-11', day: 'Friday', time: '01:00 PM', subject: 'English Essay', room: 'Auditorium B', lecturer: 'Dr. Anane' },
];

export const DEFAULT_SERVICE_PROVIDERS = [
  { id: '931001', name: 'AUNTI LIZZY', address: 'Bogoso Main Market', phone: '024 456 7890', email: 'auntilizzy@gmail.com' },
  { id: '931002', name: 'Electricity Company of Ghana (ECG)', address: 'Bogoso District Office', phone: '0302-611611', email: 'callcenter@ecggh.com' },
  { id: '931003', name: 'Ghana Water Company Limited (GWCL)', address: 'Bogoso Water Works', phone: '0800 40000', email: 'customercare@gwcl.com.gh' },
  { id: '931004', name: 'Telecel Ghana (Telecom & Internet)', address: 'Takoradi Regional Office', phone: '020 000 0100', email: 'business@telecel.com.gh' },
  { id: '931005', name: 'Distrikt 24 Ghana Limited (Stationery & Office)', address: 'Accra / Bogoso Depot', phone: '024 111 2233', email: 'supplies@distrikt24.com' },
  { id: '931006', name: 'Modern Lab & Science Equipment', address: 'Kumasi Tech Center', phone: '024 555 6677', email: 'sales@modernlab.edu.gh' },
  { id: '931007', name: 'Isaac Addae Transport & Fleet Care', address: 'Bogoso Central Garage', phone: '024 888 9900', email: 'i.addae.transport@gmail.com' },
  { id: '931008', name: 'Accra Book Depot & Publishing Ltd', address: 'Barnes Road, Accra', phone: '0302 223344', email: 'orders@accrabooks.com' },
  { id: '931009', name: 'Market Depot (Hardware & General Repairs)', address: 'Bogoso High Street', phone: '024 332 2110', email: 'marketdepot.bogoso@gmail.com' },
];

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
  teacherDirectory: DEFAULT_TEACHER_DIRECTORY,
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

function readData() {
  try {
    ensureDemoClassTeacherAccounts();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DATA;
    const parsed = JSON.parse(saved);
    return {
      ...INITIAL_DATA,
      ...parsed,
      teacherDirectory: Array.isArray(parsed.teacherDirectory) && parsed.teacherDirectory.length > 0 ? parsed.teacherDirectory : DEFAULT_TEACHER_DIRECTORY,
      classLevels: Array.isArray(parsed.classLevels) && parsed.classLevels.length > 0 ? parsed.classLevels : DEFAULT_CLASS_LEVELS,
      subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0 ? parsed.subjects : DEFAULT_SUBJECTS,
      timetable: Array.isArray(parsed.timetable) && parsed.timetable.length > 0 ? parsed.timetable : DEFAULT_TIMETABLE,
      profiles: {
        ...INITIAL_DATA.profiles,
        ...(parsed.profiles || {})
      },
      onboardedStudents: deduplicateStudents(parsed.onboardedStudents || []),
      studentFees: deduplicateFees(parsed.studentFees || []),
      academicSettings: {
        ...INITIAL_DATA.academicSettings,
        ...(parsed.academicSettings || {})
      },
      // Always ensure these arrays exist even in old localStorage snapshots
      pvNotifications: Array.isArray(parsed.pvNotifications) ? parsed.pvNotifications : [],
      paymentVouchers: Array.isArray(parsed.paymentVouchers) ? parsed.paymentVouchers : [],
      serviceProviders: (() => {
        try {
          const list = Array.isArray(parsed.serviceProviders) && parsed.serviceProviders.length > 0
            ? parsed.serviceProviders
            : (() => {
                const sp = localStorage.getItem('says_service_providers');
                return sp ? JSON.parse(sp) : [];
              })();
          return mergeByKey(DEFAULT_SERVICE_PROVIDERS, list, p => p.id || p.name);
        } catch (_) {
          return DEFAULT_SERVICE_PROVIDERS;
        }
      })(),
    };
  } catch {
    return INITIAL_DATA;
  }
}

export function PortalDataProvider({ children }) {
  const [data, setData] = useState(readData);

  // Identifies this tab so its own broadcasts are never applied back to itself
  const senderIdRef = useRef(`portal-${Math.random().toString(36).slice(2)}`);
  // Set while applying a snapshot received from another tab, so it is not echoed back
  const applyingRemoteRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const onboardLocksRef = useRef(new Map());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      (data.onboardedStudents || []).forEach((s) => {
        if (!s || (!s.studentEmail && !s.studentId)) return;
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

      if (applyingRemoteRef.current) {
        applyingRemoteRef.current = false;
        return;
      }

      // Real-Time Cloud Hub Push for instant cross-user / multi-portal synchronization
      cloudSync.pushLatestData(data);

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('rcis_portal_data_sync');
        channel.postMessage({ type: 'DATA_UPDATE', sender: senderIdRef.current, payload: data });
        channel.close();
      }
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.theme || 'light';
  }, [data.theme]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const incoming = JSON.parse(event.newValue);
          setData((current) => {
            if (isDeepEqual(current, incoming)) return current;
            applyingRemoteRef.current = true;
            return incoming;
          });
        } catch (e) {}
      }
    };
    window.addEventListener('storage', sync);

    let channel = null;
    let unsubRealtime = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('rcis_portal_data_sync');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'DATA_UPDATE' && event.data.payload) {
            if (event.data.sender === senderIdRef.current) return;
            setData(current => {
              const next = { ...current, ...event.data.payload };
              if (isDeepEqual(current, next)) return current;
              applyingRemoteRef.current = true;
              return next;
            });
          } else if (event.data && event.data.type === 'PV_SUBMITTED') {
            const { notif } = event.data;
            if (notif) {
              setData(current => {
                const existing = current.pvNotifications || [];
                if (existing.some(n => n.id === notif.id || (notif.pvNo && n.pvNo === notif.pvNo))) return current;
                return {
                  ...current,
                  pvNotifications: [notif, ...existing]
                };
              });
            }
          } else if (event.data && event.data.type === 'NEW_SERVICE_PROVIDER' && event.data.provider) {
            const newP = event.data.provider;
            setData(current => {
              const list = current.serviceProviders || DEFAULT_SERVICE_PROVIDERS;
              if (list.some(p => p.id === newP.id || p.name?.toLowerCase() === newP.name?.toLowerCase())) return current;
              const next = [newP, ...list];
              try { localStorage.setItem('says_service_providers', JSON.stringify(next)); } catch (_) {}
              return { ...current, serviceProviders: next };
            });
          }
        };
      }

      // Live Server-Sent Events subscription for cross-device instant sync
      if (cloudSync.initRealtimeSubscription) {
        unsubRealtime = cloudSync.initRealtimeSubscription((liveProvider) => {
          if (!liveProvider || !liveProvider.name) return;
          setData(current => {
            const list = current.serviceProviders || DEFAULT_SERVICE_PROVIDERS;
            if (list.some(p => p.id === liveProvider.id || p.name?.toLowerCase() === liveProvider.name?.toLowerCase())) {
              return current;
            }
            const next = [liveProvider, ...list];
            try { localStorage.setItem('says_service_providers', JSON.stringify(next)); } catch (_) {}
            return { ...current, serviceProviders: next };
          });
        });
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', sync);
      if (channel) channel.close();
      if (typeof unsubRealtime === 'function') unsubRealtime();
    };
  }, []);

  const isRefreshingRef = useRef(false);

  // Sync strictly with live backend API endpoints and Universal Cloud Sync Hub on mount & intervals
  // Uses concurrent Promise.allSettled and atomic deep equality diffing to eliminate UI glitching/flicker
  const refreshBackendData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      // 1. Fetch all backend endpoints and cloud hub in a single concurrent burst
      const [
        cloudRes,
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
        billsRes,
        pvsRes,
        semRegsRes,
        examRegsRes,
        scoreSheetsRes,
        providersRes
      ] = await Promise.allSettled([
        cloudSync.pullLatestData(),
        api.getBusRoutes(),
        api.getTimetables(),
        api.getResults(),
        api.getReportRequests(),
        api.getIncidents(),
        api.getAssetTasks(),
        api.getMessages(),
        api.getAssignments(),
        api.getApplications(),
        api.getStudents(),
        api.getFees(),
        api.getStaff(),
        api.getDefinedBills(),
        api.getPaymentVouchers(),
        api.getSemesterRegistrations(),
        api.getExamRegistrations(),
        api.getScoreSheetEntries(),
        api.getServiceProviders ? api.getServiceProviders() : Promise.resolve([])
      ]);

      const cloudData = (cloudRes.status === 'fulfilled' && cloudRes.value && typeof cloudRes.value === 'object') ? cloudRes.value : null;

      // 2. Perform a single atomic state commit only if data actually changed
      setData(current => {
        let hasChanges = false;
        const updates = {};

        // Bus Routes
        if (routesRes.status === 'fulfilled' && routesRes.value) {
          const raw = routesRes.value;
          const routes = Array.isArray(raw) ? raw : (raw.routes || []);
          if (routes.length > 0 && !isDeepEqual(current.busRoutes, routes)) {
            updates.busRoutes = routes;
            hasChanges = true;
          }
        }

        // Timetable
        if (timetablesRes.status === 'fulfilled' && Array.isArray(timetablesRes.value)) {
          const mapped = timetablesRes.value.map(t => ({
            id: t.id,
            day: t.day,
            time: t.time || `${t.start_time || ''}${t.end_time ? ' - ' + t.end_time : ''}`,
            subject: t.subject,
            room: t.room,
            lecturer: t.lecturer || t.lecturer_name,
            classLevel: formatClassToBasic(t.class_level || t.classLevel)
          }));
          const merged = mergeByKey(current.timetable || [], mapped, t => t.id || `${t.day}-${t.time}-${t.subject}`);
          if (!isDeepEqual(current.timetable, merged)) {
            updates.timetable = merged;
            hasChanges = true;
          }
        }

        // Results
        if (resultsRes.status === 'fulfilled' && Array.isArray(resultsRes.value)) {
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

        if (scoreSheetsRes.status === 'fulfilled' && Array.isArray(scoreSheetsRes.value)) {
          const mappedSheets = scoreSheetsRes.value.map((r) => ({
            ...r,
            backendId: r.backendId || r.id,
            lecturer: r.instructor || r.lecturer,
            status: r.status || 'Pending Approval',
          }));
          const base = updates.results || current.results || [];
          const mergedSheets = mergeByKey(base, mappedSheets, r => scoreSheetEntryKey(r) || r.id);
          if (!isDeepEqual(base, mergedSheets)) {
            updates.results = mergedSheets;
            hasChanges = true;
          }
        }

        // Report Requests
        if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
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
        if (incidentsRes.status === 'fulfilled' && Array.isArray(incidentsRes.value)) {
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
        if (assetTasksRes.status === 'fulfilled' && Array.isArray(assetTasksRes.value)) {
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
        if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value)) {
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
        if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value)) {
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

        // Admissions Applications
        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
          const mapped = appsRes.value.map(a => ({
            id: a.id,
            learner: a.learner || a.learner_name,
            guardian: a.guardian || a.guardian_name,
            email: a.email || a.contact_email,
            phone: a.phone || a.contact_phone,
            level: formatClassToBasic(a.level || a.applying_level),
            status: a.status,
            submittedAt: a.submittedAt || a.submitted_at,
            office_use_notes: a.office_use_notes,
            ...(a.formData || a.form_data || {})
          }));
          const merged = mergeByKey(current.applications || [], mapped, a => a.id || a.learner);
          if (!isDeepEqual(current.applications, merged)) {
            updates.applications = merged;
            hasChanges = true;
          }
        }

        // Onboarded Students
        if (studentsRes.status === 'fulfilled') {
          const sRaw = studentsRes.value;
          const students = Array.isArray(sRaw) ? sRaw : (sRaw?.students || sRaw?.data || sRaw?.records || []);
          if (Array.isArray(students) && students.length > 0) {
            const mapped = students.map((s) => mapStudentFromApi(s));
            const merged = deduplicateStudents([...(current.onboardedStudents || []), ...mapped]);
            if (!isDeepEqual(current.onboardedStudents, merged)) {
              updates.onboardedStudents = merged;
              hasChanges = true;
              merged.forEach((s) => {
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
        if (feesRes.status === 'fulfilled') {
          const fRaw = feesRes.value;
          const fees = Array.isArray(fRaw) ? fRaw : (fRaw?.fees || fRaw?.data || fRaw?.records || []);
          if (Array.isArray(fees) && fees.length > 0) {
            const mapped = fees.map(f => ({
              id: f.id,
              studentId: f.studentId || f.student_id || f.student_code,
              studentName: f.studentName || f.student_name,
              guardianName: f.guardianName || f.guardian_name,
              guardianEmail: f.guardianEmail || f.guardian_email,
              term: f.term || 'Term 1 · 2026',
              billedAmount: Number(f.billedAmount !== undefined ? f.billedAmount : f.billed_amount) || 0,
              paidAmount: Number(f.paidAmount !== undefined ? f.paidAmount : f.paid_amount) || 0,
              balance: Number(f.balance) || 0,
              status: f.status || 'Not Paid',
              dueDate: f.dueDate || f.due_date || '2026-09-15',
              paymentDate: f.paymentDate || f.payment_date
            }));
            const mergedFees = deduplicateFees(mergeByKey(current.studentFees || [], mapped, f => (f.studentName ? `${(f.studentName).toLowerCase().trim()}::${(f.term || '').toLowerCase().trim()}` : f.studentId || f.id)));
            if (!isDeepEqual(current.studentFees, mergedFees)) {
              updates.studentFees = mergedFees;
              updates.feeAccounts = mergedFees.map(f => ({
                id: `fee-acc-${f.studentId || f.id}`,
                child: f.studentName,
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

        // Staff & Teacher Directory (Merged with DB / Backend API)
        if (staffRes.status === 'fulfilled') {
          const sRaw = staffRes.value;
          const staff = Array.isArray(sRaw) ? sRaw : (sRaw?.staff || sRaw?.teachers || sRaw?.data || []);
          if (Array.isArray(staff) && staff.length > 0) {
            const mapped = staff.map(s => ({
              id: s.id || s.staffId || s.staff_id,
              staffId: s.staffId || s.staff_id || `STF-2026-${String(s.id).padStart(3, '0')}`,
              name: s.name || s.fullName || s.full_name,
              role: s.role || s.designation || 'Subject Teacher',
              subject: s.subject || 'General Education',
              classAssigned: formatClassToBasic(s.classAssigned || s.class_assigned || s.level || 'Basic 1'),
              email: s.email || s.contact_email,
              phone: s.phone || s.phone_number || s.contact_phone,
              status: s.status || (s.is_active === false ? 'Offboarded' : 'Active'),
              photo: s.photo || (s.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'),
              joinedDate: s.joinedDate || s.created_at || s.joined_date || new Date().toISOString().split('T')[0]
            }));
            const mergedStaff = mergeByKey(current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY, mapped, s => s.staffId || s.id || s.email || s.name);
            if (!isDeepEqual(current.teacherDirectory, mergedStaff)) {
              updates.teacherDirectory = mergedStaff;
              hasChanges = true;
            }
          }
        }

        // Defined Bills
        if (billsRes.status === 'fulfilled') {
          const bRaw = billsRes.value;
          const bills = Array.isArray(bRaw) ? bRaw : (bRaw?.bills || bRaw?.definitions || bRaw?.data || []);
          if (Array.isArray(bills) && bills.length > 0) {
            const mergedBills = mergeByKey(current.definedBills || [], bills, b => b.id || b.title || b.name);
            if (!isDeepEqual(current.definedBills, mergedBills)) {
              updates.definedBills = mergedBills;
              hasChanges = true;
            }
          }
        }

        // Payment Vouchers
        if (pvsRes.status === 'fulfilled') {
          const pRaw = pvsRes.value;
          const pvs = Array.isArray(pRaw) ? pRaw : (pRaw?.vouchers || pRaw?.paymentVouchers || pRaw?.data || []);
          if (Array.isArray(pvs) && pvs.length > 0) {
            const mapped = pvs.map(p => ({
              id: p.id,
              pvNo: p.pv_number || p.pvNo || `PV-${p.id}`,
              requisitionNo: p.requisition_no || p.requisitionNo,
              provider: p.payee_name || p.provider || 'Vendor',
              providerId: p.payee_id || p.providerId,
              description: p.description,
              qty: p.quantity || p.qty || 1,
              cost: p.unit_cost || p.cost || 0,
              total: p.total_amount || p.total || 0,
              datePrepared: p.date_prepared || p.datePrepared,
              valuedDate: p.date_prepared || p.valuedDate,
              auditRemarks: p.auditRemarks || p.pre_audited_by || 'Registered in system',
              status: p.status === 'PRE_AUDITED' ? 'Pre-Audited & Approved' : p.status || 'Pending Audit',
              ...(Array.isArray(p.items) && p.items.length > 0 ? {
                items: p.items.map((it, idx) => ({
                  id: it.id || `it-${p.id || p.pv_number}-${idx}`,
                  description: it.description || it.particulars,
                  provider: it.payee_name || it.provider || p.payee_name,
                  providerId: it.payee_id || it.providerId,
                  qty: Number(it.quantity || it.qty) || 1,
                  cost: Number(it.unit_cost || it.cost) || 0,
                  costPerItem: Number(it.unit_cost || it.costPerItem || it.cost) || 0,
                  total: Number(it.total_amount || it.total) || 0,
                  totalAmount: Number(it.total_amount || it.totalAmount || it.total) || 0,
                  status: it.status || 'Pending approval',
                }))
              } : {}),
              editedByHeadmaster: false,
              correctionsLog: []
            }));
            const mergedPVs = mergeByKey(current.paymentVouchers || [], mapped, p => p.pvNo || p.id);
            if (!isDeepEqual(current.paymentVouchers, mergedPVs)) {
              updates.paymentVouchers = mergedPVs;
              hasChanges = true;
            }
          }
        }

        // Semester & Exam Registrations
        if (semRegsRes.status === 'fulfilled' && Array.isArray(semRegsRes.value)) {
          if (!isDeepEqual(current.semesterRegistrations, semRegsRes.value)) {
            updates.semesterRegistrations = semRegsRes.value;
            hasChanges = true;
          }
        }
        if (examRegsRes.status === 'fulfilled' && Array.isArray(examRegsRes.value)) {
          if (!isDeepEqual(current.examRegistrations, examRegsRes.value)) {
            updates.examRegistrations = examRegsRes.value;
            hasChanges = true;
          }
        }

        // Service Providers
        if (providersRes?.status === 'fulfilled') {
          const raw = providersRes.value;
          const list = Array.isArray(raw) ? raw : (raw?.data || raw?.providers || raw?.records || []);
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map(p => ({
              id: String(p.id || p.provider_id),
              name: p.name || p.provider_name,
              address: p.address || 'Bogoso',
              email: p.email || '',
              phone: p.phone || p.telephone || ''
            }));
            const merged = mergeByKey(current.serviceProviders || [], mapped, p => p.id || p.name);
            if (!isDeepEqual(current.serviceProviders, merged)) {
              updates.serviceProviders = merged;
              hasChanges = true;
              try { localStorage.setItem('says_service_providers', JSON.stringify(merged)); } catch (_) {}
            }
          }
        }

        // Fold in Universal Cloud Hub updates if present
        if (cloudData) {
          if (Array.isArray(cloudData.onboardedStudents)) {
            const merged = deduplicateStudents([...(updates.onboardedStudents || current.onboardedStudents || []), ...cloudData.onboardedStudents]);
            if (!isDeepEqual(current.onboardedStudents, merged)) {
              updates.onboardedStudents = merged;
              hasChanges = true;
            }
          }
          if (Array.isArray(cloudData.teacherDirectory)) {
            const merged = mergeByKey(updates.teacherDirectory || current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY, cloudData.teacherDirectory, s => s.staffId || s.id || s.email || s.name);
            if (!isDeepEqual(current.teacherDirectory, merged)) {
              updates.teacherDirectory = merged;
              hasChanges = true;
            }
          }
          if (Array.isArray(cloudData.classLevels)) {
            const merged = Array.from(new Set([...(updates.classLevels || current.classLevels || DEFAULT_CLASS_LEVELS), ...cloudData.classLevels]));
            if (!isDeepEqual(current.classLevels, merged)) {
              updates.classLevels = merged;
              hasChanges = true;
            }
          }
          if (Array.isArray(cloudData.subjects)) {
            const merged = Array.from(new Set([...(updates.subjects || current.subjects || DEFAULT_SUBJECTS), ...cloudData.subjects]));
            if (!isDeepEqual(current.subjects, merged)) {
              updates.subjects = merged;
              hasChanges = true;
            }
          }
          if (Array.isArray(cloudData.studentFees)) {
            const merged = deduplicateFees(mergeByKey(updates.studentFees || current.studentFees || [], cloudData.studentFees, f => (f.studentName ? `${(f.studentName).toLowerCase().trim()}::${(f.term || '').toLowerCase().trim()}` : f.studentId || f.id)));
            if (!isDeepEqual(current.studentFees, merged)) {
              updates.studentFees = merged;
              hasChanges = true;
            }
          }
          if (Array.isArray(cloudData.serviceProviders) && cloudData.serviceProviders.length > 0) {
            const mergedProviders = mergeByKey(updates.serviceProviders || current.serviceProviders || DEFAULT_SERVICE_PROVIDERS, cloudData.serviceProviders, p => p.id || p.name);
            if (!isDeepEqual(current.serviceProviders, mergedProviders)) {
              updates.serviceProviders = mergedProviders;
              hasChanges = true;
              try { localStorage.setItem('says_service_providers', JSON.stringify(mergedProviders)); } catch (_) {}
            }
          }
        }

        const shouldClearLoading = !current.backendConnected || current.isLoadingBackend;

        // If no changes exist and already connected, return current directly!
        // This causes React to skip re-renders completely, ensuring 0% glitching during auto-refresh
        if (!hasChanges && !shouldClearLoading) {
          return current;
        }

        return {
          ...current,
          ...updates,
          backendConnected: true,
          isLoadingBackend: false
        };
      });

    } catch (err) {
      console.warn('Backend sync error:', err);
      setData(current => current.isLoadingBackend ? { ...current, isLoadingBackend: false } : current);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial silent load on mount
    refreshBackendData();

    // Auto-refresh when tab/window regains focus
    const handleFocus = () => {
      refreshBackendData();
    };
    window.addEventListener('focus', handleFocus);

    // Background auto-refresh every 5 seconds (5,000ms)
    // Runs silently in the background without UI flicker or glitching
    const autoRefreshInterval = setInterval(() => {
      refreshBackendData();
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(autoRefreshInterval);
    };
  }, [refreshBackendData]);

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
      guardianName: student.guardianName || student.guardian || student.fatherName || 'Parent/Guardian',
      guardianEmail: student.guardianEmail || student.email || student.fatherEmail || '',
      guardianPhone: student.guardianPhone || student.phone || student.fatherPhone || '',
      homeAddress: student.homeAddress || student.residentialAddress || 'Bogoso',
      dob: student.dob || student.dateOfBirth || '2015-01-01',
      gender: student.gender || student.sex || 'Not Specified',
    };

    const lockKey = studentIdentityKey(draft);
    const existingLock = onboardLocksRef.current.get(lockKey);
    if (existingLock) return existingLock;

    const run = (async () => {
      const existing = findMatchingStudent(dataRef.current.onboardedStudents || [], draft);
      const billed = billedAmountForLevel(draft.level);
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
      };

      let createdFromApi = null;
      const existingBackendId = existing?.id && !isSyntheticLocalId(existing.id) ? existing.id : null;
      try {
        if (existingBackendId) {
          createdFromApi = await api.updateStudent(existingBackendId, payload);
        } else {
          createdFromApi = await api.onboardStudent(payload);
        }
      } catch (e) {
        const msg = String(e?.message || e || '');
        if (/409|already|exists|duplicate/i.test(msg)) {
          try {
            const all = await api.getStudents();
            const list = Array.isArray(all) ? all : (all?.students || all?.data || []);
            createdFromApi = findMatchingStudent((list || []).map((s) => mapStudentFromApi(s)), draft);
          } catch (_) { /* keep local upsert */ }
        } else if (existingBackendId) {
          try {
            createdFromApi = await api.onboardStudent(payload);
          } catch (e2) {
            console.warn('Backend onboard student fallback:', e2);
          }
        } else {
          console.warn('Backend onboard student fallback:', e);
        }
      }

      const apiStudent = unwrapApiStudent(createdFromApi);
      const mappedApi = apiStudent ? mapStudentFromApi(apiStudent, { ...draft, ...(existing || {}) }) : null;
      const rosterCount = (dataRef.current.onboardedStudents || []).length + 1;
      const fallbackCode = existing?.studentId || draft.studentId || `REMALJ-${new Date().getFullYear()}-${String(rosterCount).padStart(3, '0')}`;
      const canonical = mapStudentFromApi(mappedApi || {}, {
        ...existing,
        ...draft,
        id: mappedApi?.id || existing?.id,
        studentId: mappedApi?.studentId || fallbackCode,
        studentEmail: mappedApi?.studentEmail || existing?.studentEmail || schoolEmailFromName(fullComputed),
        defaultPassword: mappedApi?.defaultPassword || existing?.defaultPassword || draft.defaultPassword
          || `StuPass#${String(mappedApi?.studentId || fallbackCode).replace(/REMALJ-/i, '')}`,
        rfidCardCode: mappedApi?.rfidCardCode || draft.rfidCardCode || existing?.rfidCardCode || `CARD-${String(rosterCount).padStart(3, '0')}`,
      });

      if (!canonical.id) canonical.id = crypto.randomUUID?.() || String(Date.now());
      if (!canonical.studentId) canonical.studentId = fallbackCode;
      if (!canonical.studentEmail) canonical.studentEmail = schoolEmailFromName(canonical.fullName);
      if (!canonical.defaultPassword) {
        canonical.defaultPassword = `StuPass#${String(canonical.studentId).replace(/REMALJ-/i, '')}`;
      }

      setData((current) => applyCanonicalStudentToState(current, canonical));
      refreshBackendData();
      return canonical;
    })();

    onboardLocksRef.current.set(lockKey, run);
    try {
      return await run;
    } finally {
      onboardLocksRef.current.delete(lockKey);
    }
  }, [refreshBackendData]);

  const lastAutoRefreshedAtRef = useRef(new Date().toLocaleTimeString());

  const sortedOnboardedStudents = useMemo(() => {
    return deduplicateStudents(data.onboardedStudents || []).sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));
  }, [data.onboardedStudents]);

  const sortedStudentFees = useMemo(() => {
    return deduplicateFees(data.studentFees || []).sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  }, [data.studentFees]);

  const value = useMemo(() => ({
    ...data,
    academicSettings: data.academicSettings || INITIAL_DATA.academicSettings,
    updateAcademicSettings: async (newSettings) => {
      try {
        await api.updateAcademicSettings(newSettings);
      } catch (e) {
        console.warn('Backend academic settings update fallback:', e);
      }
      setData((current) => ({
        ...current,
        academicSettings: { ...(current.academicSettings || INITIAL_DATA.academicSettings), ...newSettings }
      }));
    },
    onboardedStudents: sortedOnboardedStudents,
    studentFees: sortedStudentFees,
    refreshBackendData,
    lastAutoRefreshedAt: lastAutoRefreshedAtRef.current,
    saveTimetableEntry: async (entry) => {
      try {
        await api.createTimetableEntry(entry);
      } catch (e) {
        console.warn('Backend timetable create fallback:', e);
      }
      setData((current) => ({
        ...current,
        timetable: current.timetable.some((item) => item.id === entry.id)
          ? current.timetable.map((item) => item.id === entry.id ? entry : item)
          : [...current.timetable, { ...entry, id: entry.id || crypto.randomUUID?.() || String(Date.now()) }],
      }));
    },
    // Moderation actions apply locally first so a slow or offline backend never blocks the desk
    publishResult: (result) => {
      setData((current) => ({
        ...current,
        results: current.results.some((item) => item.subject === result.subject)
          ? current.results.map((item) => item.subject === result.subject ? { ...result, id: item.id, status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() } : item)
          : [...current.results, { ...result, id: crypto.randomUUID?.() || String(Date.now()), status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() }],
      }));
      api.recordResult(result).catch((e) => console.warn('Backend result record fallback:', e));
    },
    approveResult: (id, approvedBy) => {
      setData((current) => ({
        ...current,
        results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Approved', declineNote: null, approvedBy: approvedBy || item.approvedBy, approvedAt: new Date().toLocaleString() } : item),
      }));
      api.updateResultStatus(id, { status: 'Approved', approved_by: approvedBy })
        .catch((e) => console.warn('Backend result approve fallback:', e));
    },
    declineResult: (id, note) => {
      setData((current) => ({
        ...current,
        results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Declined', declineNote: note || 'Error detected in score breakdown by Academic Head.', declinedAt: new Date().toLocaleString() } : item),
      }));
      api.updateResultStatus(id, { status: 'Declined', decline_note: note })
        .catch((e) => console.warn('Backend result decline fallback:', e));
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
      const otherNames = (application.otherNames || '').trim();
      const learnerName = (application.firstName || application.surname || otherNames)
        ? `${application.firstName || ''} ${otherNames ? otherNames + ' ' : ''}${application.surname || ''}`.replace(/\s+/g, ' ').trim()
        : (application.learner || application.fullName || 'Applicant');
      const guardianName = application.fatherName || application.motherName || application.guardian || application.guardianName || 'Parent/Guardian';
      const contactEmail = application.fatherEmail || application.motherEmail || application.email || application.guardianEmail || `${(application.surname || 'parent').toLowerCase()}@remaljcarewell.edu.gh`;
      const contactPhone = application.fatherPhone || application.motherPhone || application.phone || application.guardianPhone || '024 111 2222';
      const applyingLevel = formatClassToBasic(application.applyingClass || application.level || 'Basic 1');
      const academicYear = application.academicYear || '2025/2026';
      const academicTerm = application.academicTerm || application.term || 'Term 1';

      try {
        await api.submitApplication({
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
        console.warn('Backend application submit fallback:', e);
      }

      setData((current) => {
        const appId = crypto.randomUUID?.() || String(Date.now());
        const classSection = application.officeFormAssigned || 'A';
        const homeAddress = application.residentialAddress || application.homeAddress || 'Bogoso';

        const newApp = {
          id: appId,
          ...application,
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
          status: 'Submitted',
          submittedAt: new Date().toLocaleString()
        };

        return {
          ...current,
          applications: [newApp, ...(current.applications || [])],
        };
      });
    },
    updateApplicationStatus: async (id, status) => {
      try {
        await api.updateApplicationStatus(id, { status });
      } catch (e) {
        console.warn('Backend application status fallback:', e);
      }
      setData((current) => {
        const targetApp = (current.applications || []).find((item) => item.id === id);
        let updatedMessages = current.messages || [];

        const updatedApplications = (current.applications || []).map((item) => {
          if (item.id !== id) return item;

          let defaultEmail = item.email || item.fatherEmail || item.motherEmail;
          if (!defaultEmail) {
            const cleanSurname = (item.surname || item.learner || 'parent').toLowerCase().replace(/[^a-z0-9]/g, '');
            defaultEmail = `parent.${cleanSurname}@remaljcarewell.edu.gh`;
          }
          const defaultPassword = item.defaultPassword || 'Carewell2026!';

          return {
            ...item,
            status,
            email: defaultEmail,
            defaultPassword,
            acceptedAt: (status === 'Accepted' || status === 'Enrolled') ? (item.acceptedAt || new Date().toLocaleString()) : item.acceptedAt,
          };
        });

        if ((status === 'Accepted' || status === 'Enrolled') && targetApp) {
          const learnerName = targetApp.learner || `${targetApp.firstName || ''} ${targetApp.surname || ''}`.trim() || 'Applicant';
          const guardianName = targetApp.guardian || targetApp.fatherName || targetApp.motherName || 'Parent/Guardian';
          const parentFirstName = (targetApp.fatherFirstName || targetApp.motherFirstName || targetApp.firstName || guardianName.split(' ')[0] || 'parent').toLowerCase().replace(/[^a-z0-9]/g, '');
          const parentSurname = (targetApp.surname || targetApp.fatherSurname || targetApp.motherSurname || targetApp.learner || 'carewell').toLowerCase().replace(/[^a-z0-9]/g, '');
          
          let contactEmail = targetApp.email || targetApp.fatherEmail || targetApp.motherEmail;
          if (!contactEmail || contactEmail.includes('@example.com')) {
            contactEmail = `${parentFirstName}.${parentSurname}@remaljcarewell.edu.gh`;
          }
          const defaultPassword = 'Carewell2026!';
          const parentPhone = targetApp.phone || targetApp.guardianPhone || targetApp.fatherPhone || targetApp.motherPhone || '024 111 2222';

          const welcomeMsg = {
            id: `msg-accept-${id}`,
            from: 'REMALJ Admissions Office',
            senderRole: 'Admin',
            to: guardianName,
            recipient: guardianName,
            recipientEmail: contactEmail,
            subject: `📱 SMS & Email Credentials: Child Application Accepted for ${learnerName}`,
            body: `📱 AUTOMATIC SMS & EMAIL DISPATCHED TO ${guardianName.toUpperCase()} (${parentPhone}):\n\nDear ${parentFirstName.toUpperCase()},\n\nWe are delighted to inform you that the admission application for ${learnerName} has been ACCEPTED by REMALJ Carewell Inspirational School!\n\nYour Default Account Credentials & School Access:\n• Institution: REMALJ Carewell Inspirational School (Bogoso-Anikoko)\n• Default Email: ${contactEmail}\n• Default Password: ${defaultPassword}\n• Portal Access: Direct Instant Access (No sign-in required at http://localhost:5173/#/parent)\n\nYou can access your portal at any time to monitor child progress, fees, and live bus tracking.`,
            sentAt: new Date().toLocaleString(),
          };

          if (!updatedMessages.some(m => m.id === `msg-accept-${id}`)) {
            updatedMessages = [welcomeMsg, ...updatedMessages];
          }
        }

        return {
          ...current,
          applications: updatedApplications,
          messages: updatedMessages,
        };
      });

      if (status === 'Enrolled') {
        const app = (dataRef.current.applications || []).find((item) => item.id === id);
        if (app) {
          const learnerName = (app.firstName || app.surname || app.otherNames)
            ? `${app.firstName || ''} ${app.otherNames ? app.otherNames + ' ' : ''}${app.surname || ''}`.replace(/\s+/g, ' ').trim()
            : (app.learner || app.fullName || 'Student');
          await performOnboardStudent({
            fullName: learnerName,
            firstName: app.firstName,
            otherNames: app.otherNames,
            surname: app.surname,
            dob: app.dob,
            gender: app.sex || app.gender,
            level: app.level || app.applyingClass,
            classSection: app.officeFormAssigned || app.classSection || app.subClass || 'A',
            guardianName: app.guardian || app.fatherName || app.motherName,
            guardianEmail: app.email || app.fatherEmail || app.guardianEmail,
            guardianPhone: app.phone || app.fatherPhone || app.guardianPhone,
            homeAddress: app.residentialAddress || app.homeAddress,
            rfidCardCode: app.officeStudentID || app.rfidCardCode,
          });
        }
      }
    },
    updateApplication: async (id, updatedForm) => {
      try {
        await api.updateApplication(id, updatedForm);
      } catch (e) {
        console.warn('Backend update application fallback:', e);
      }

      setData((current) => {
        const existingApp = (current.applications || []).find(a => a.id === id);
        if (!existingApp) return current;

        const learnerName = `${updatedForm.firstName || ''} ${updatedForm.surname || ''}`.trim() || updatedForm.learner || updatedForm.fullName || existingApp.learner;
        const guardianName = updatedForm.fatherName || updatedForm.motherName || updatedForm.guardian || updatedForm.guardianName || existingApp.guardian;
        const contactEmail = updatedForm.fatherEmail || updatedForm.email || updatedForm.guardianEmail || existingApp.email;
        const contactPhone = updatedForm.fatherPhone || updatedForm.motherPhone || updatedForm.phone || updatedForm.guardianPhone || existingApp.phone;
        const applyingLevel = updatedForm.applyingClass || updatedForm.level || existingApp.level || 'Basic 1';
        const classSection = updatedForm.classSection || updatedForm.subClass || updatedForm.class_section || existingApp.classSection || '';

        const updatedApplicationRecord = {
          ...existingApp,
          ...updatedForm,
          learner: learnerName,
          guardian: guardianName,
          email: contactEmail,
          phone: contactPhone,
          level: applyingLevel,
          applyingClass: applyingLevel,
          classSection: classSection,
          subClass: classSection,
          formData: {
            ...(existingApp.formData || {}),
            ...updatedForm,
            applyingClass: applyingLevel,
            classSection: classSection,
            subClass: classSection,
          },
          updatedAt: new Date().toLocaleString(),
        };

        const updatedApplications = (current.applications || []).map(app =>
          app.id === id ? updatedApplicationRecord : app
        );

        const updatedOnboardedStudents = (current.onboardedStudents || []).map(stu => {
          if (stu.id === id || stu.studentId === id || stu.fullName === existingApp.learner || stu.fullName === learnerName) {
            return {
              ...stu,
              fullName: learnerName,
              level: applyingLevel,
              guardianName: guardianName,
              guardianEmail: contactEmail,
              guardianPhone: contactPhone,
              homeAddress: updatedForm.residentialAddress || stu.homeAddress,
              dob: updatedForm.dob || stu.dob,
              gender: updatedForm.sex || stu.gender,
              passportPhoto: updatedForm.passportPhoto || stu.passportPhoto,
            };
          }
          return stu;
        });

        const updatedStudentFees = (current.studentFees || []).map(fee => {
          if (fee.studentName === existingApp.learner || fee.studentName === learnerName || fee.studentId === id) {
            return {
              ...fee,
              studentName: learnerName,
              guardianName: guardianName,
              guardianEmail: contactEmail,
            };
          }
          return fee;
        });

        const updatedFeeAccounts = (current.feeAccounts || []).map(acc => {
          if (acc.child === existingApp.learner || acc.child === learnerName) {
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
          onboardedStudents: updatedOnboardedStudents,
          studentFees: updatedStudentFees,
          feeAccounts: updatedFeeAccounts,
        };
      });
    },
    updateApplicationOfficeUse: async (id, officeData) => {
      let updatedApp = null;
      setData((current) => {
        const apps = (current.applications || []).map((item) => {
          if (item.id === id) {
            updatedApp = { ...item, ...officeData };
            return updatedApp;
          }
          return item;
        });
        return { ...current, applications: apps };
      });
      if (updatedApp) {
        try {
          await api.updateApplication(id, updatedApp);
        } catch (e) {
          console.warn('Backend update application office use fallback:', e);
        }
      }
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
      };
      try {
        if (backendId) {
          await api.updateStudent(backendId, payload);
        } else if (existing?.studentId) {
          await api.updateStudent(existing.studentId, payload);
        }
      } catch (e) {
        console.warn('Backend update student fallback:', e);
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
        return {
          ...current,
          onboardedStudents: deduplicateStudents(
            roster.map((s) => (studentsAreSamePerson(s, prev) ? merged : s))
          ),
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
            localStorage.setItem('registered_accounts', JSON.stringify(list));
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
    updateStudentAdmission: (id, updates) => setData((current) => ({
      ...current,
      applications: (current.applications || []).map((app) => app.id === id ? { ...app, ...updates } : app),
      onboardedStudents: (current.onboardedStudents || []).map((s) => (s.id === id || s.studentId === id) ? { ...s, ...updates } : s),
    })),
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
    saveScoreSheetEntry: (entry) => {
      const entryKey = scoreSheetEntryKey(entry);
      let persisted = null;

      setData((current) => {
        const existingResults = current.results || [];
        const existing = existingResults.find((r) => scoreSheetEntryKey(r) === entryKey);

        persisted = {
          ...entry,
          id: existing?.id || entry.id || `res-${Date.now()}`,
          entryKey,
          backendId: existing?.backendId,
          subject: entry.subject || 'General Subject',
          lecturer: entry.instructor || 'Subject Teacher',
          teacherNote: entry.teacherNote || '',
          status: 'Pending Approval',
          declineNote: null,
          approvedBy: null,
          submittedAt: existing?.submittedAt || new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
        };

        return {
          ...current,
          results: existing
            ? existingResults.map((r) => r.id === persisted.id ? { ...r, ...persisted } : r)
            : [persisted, ...existingResults],
        };
      });

      if (!persisted) return;
      const remoteId = persisted.backendId;
      const sync = remoteId
        ? api.updateScoreSheet(remoteId, persisted)
        : api.saveScoreSheet(persisted);
      sync
        .then((res) => {
          const newRemoteId = res?.id || res?._id;
          if (!newRemoteId || newRemoteId === remoteId) return;
          setData((latest) => ({
            ...latest,
            results: (latest.results || []).map((r) => r.id === persisted.id ? { ...r, backendId: newRemoteId } : r),
          }));
        })
        .catch((e) => console.warn('Backend score sheet save fallback:', e));
    },
    // Payment Recording with Robust Match Logic
    recordFeePayment: async ({ id, studentId, studentName, paidAmount, paymentDate, paymentMethod = 'Mobile Money', notes = '', receivingAccount = 'GCB Main Account' }) => {
      const lookupId = id || studentId || studentName;
      try {
        await api.recordFeePayment(lookupId, { paidAmount: Number(paidAmount), paymentMethod, paymentDate, notes });
      } catch (e) {
        console.warn('Backend fee payment fallback:', e);
      }

      setData((current) => {
        const addAmount = Number(paidAmount) || 0;
        const targetClean = String(lookupId || '').toLowerCase().trim();
        const sNameClean = String(studentName || '').toLowerCase().trim();
        const sIdClean = String(studentId || '').toLowerCase().trim();

        let targetFound = false;
        const updatedFees = (current.studentFees || []).map((fee) => {
          const feeName = (fee.studentName || '').toLowerCase().trim();
          const feeId = (fee.studentId || '').toLowerCase().trim();
          const recordId = (fee.id || '').toLowerCase().trim();

          const isMatch = (targetClean && (recordId === targetClean || feeId === targetClean || feeName === targetClean || feeName.includes(targetClean))) ||
            (sNameClean && (feeName === sNameClean || feeName.includes(sNameClean))) ||
            (sIdClean && feeId === sIdClean) ||
            (lookupId === 'all');

          if (!isMatch && targetFound) return fee;
          if (isMatch) targetFound = true;

          const newPaid = (fee.paidAmount || 0) + addAmount;
          const newBalance = Math.max(0, (fee.billedAmount || 0) - newPaid);
          const newStatus = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Balance Due' : 'Not Paid';

          return {
            ...fee,
            paidAmount: newPaid,
            balance: newBalance,
            status: newStatus,
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            lastPaymentMethod: paymentMethod,
            lastReceivingAccount: receivingAccount,
            lastNotes: notes,
          };
        });

        // If no existing fee entry was matched, create a new one so it's tracked
        if (!targetFound && (studentName || studentId || id)) {
          const sName = studentName || (id !== 'all' ? id : 'Student');
          const sId = studentId || `REMALJ-${Date.now().toString().slice(-3)}`;
          const defaultBilled = 4800;
          const newPaid = addAmount;
          const newBalance = Math.max(0, defaultBilled - newPaid);
          const newFee = {
            id: `fee-${Date.now()}`,
            studentId: sId,
            studentName: sName,
            guardianName: 'Parent / Guardian',
            guardianEmail: 'parent@remaljcarewell.edu.gh',
            term: 'Term 1 · 2026',
            billedAmount: defaultBilled,
            paidAmount: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? 'Paid' : 'Balance Due',
            dueDate: '2026-09-15',
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            lastPaymentMethod: paymentMethod,
            lastReceivingAccount: receivingAccount,
            lastNotes: notes,
          };
          updatedFees.unshift(newFee);
        }

        // Also update matching fee account for parent/student portal summaries
        const targetFee = updatedFees.find((f) =>
          (targetClean && ((f.id || '').toLowerCase() === targetClean || (f.studentId || '').toLowerCase() === targetClean || (f.studentName || '').toLowerCase().includes(targetClean))) ||
          (sNameClean && (f.studentName || '').toLowerCase().includes(sNameClean))
        );

        const updatedFeeAccounts = (current.feeAccounts || []).map((acc) => {
          const isMatch = targetFee ? acc.child === targetFee.studentName : (acc.child && acc.child.toLowerCase().includes(targetClean));
          if (!isMatch) return acc;
          const newPaid = (acc.paid || 0) + addAmount;
          const newBalance = Math.max(0, (acc.billed || 0) - newPaid);
          return {
            ...acc,
            paid: newPaid,
            status: newBalance <= 0 ? 'Paid' : 'Balance due',
          };
        });

        return {
          ...current,
          studentFees: updatedFees,
          feeAccounts: updatedFeeAccounts,
        };
      });
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
      try {
        await api.postAcademicBill({
          student_id: studentId,
          student_name: studentName,
          class_level: classLevel,
          items,
          total_amount: totalAmount,
          term,
        });
      } catch (e) {
        console.warn('Backend bill post fallback:', e);
      }
      setData((current) => {
      const amountToPost = Number(totalAmount) || 0;
      let targetStudents = [];
      if (Array.isArray(requestedStudents) && requestedStudents.length > 0) {
        targetStudents = requestedStudents.map((req) => (
          findMatchingStudent(current.onboardedStudents || [], req) || req
        )).filter((s) => s && (s.studentId || s.id || s.fullName || s.name));
      } else if (studentId) {
        targetStudents = (current.onboardedStudents || []).filter(s => s.studentId === studentId || s.id === studentId || s.fullName === studentName);
      } else if (studentName) {
        const n = String(studentName).toLowerCase().trim();
        targetStudents = (current.onboardedStudents || []).filter((s) => {
          const full = String(s.fullName || s.name || '').toLowerCase().trim();
          return full === n || (n && full.includes(n));
        });
        if (targetStudents.length === 0) {
          targetStudents = [{
            studentId: studentId || null,
            fullName: studentName,
            name: studentName,
            level: classLevel,
          }];
        }
      } else if (classLevel && classLevel !== 'All Classes') {
        const cleanClass = classLevel.toLowerCase();
        targetStudents = (current.onboardedStudents || []).filter(s => {
          const sLvl = (s.level || '').toLowerCase();
          return sLvl.includes(cleanClass) || cleanClass.includes(sLvl);
        });
      }

      if (targetStudents.length === 0) return current;

      const updatedFees = [...(current.studentFees || [])];
      const updatedFeeAccounts = [...(current.feeAccounts || [])];
      const updatedLedgerLogs = [...(current.ledgerLogs || [])];

      targetStudents.forEach(stu => {
        const feeIndex = updatedFees.findIndex(f => f.studentId === stu.studentId || f.studentName === stu.fullName);
        if (feeIndex >= 0) {
          const existing = updatedFees[feeIndex];
          const newBilled = (existing.billedAmount || 0) + amountToPost;
          const newBalance = Math.max(0, newBilled - (existing.paidAmount || 0));
          const newStatus = newBalance <= 0 ? 'Paid' : (existing.paidAmount || 0) > 0 ? 'Balance Due' : 'Not Paid';
          updatedFees[feeIndex] = {
            ...existing,
            billedAmount: newBilled,
            balance: newBalance,
            status: newStatus,
            lastBillPostedAt: new Date().toLocaleString(),
            itemsBreakdown: items || existing.itemsBreakdown,
            guardianName: stu.guardianName || existing.guardianName,
            guardianEmail: stu.guardianEmail || existing.guardianEmail,
          };
        } else {
          const newFee = {
            id: `fee-${stu.id || Date.now()}`,
            studentId: stu.studentId,
            studentName: stu.fullName,
            guardianName: stu.guardianName,
            guardianEmail: stu.guardianEmail || 'parent@remaljcarewell.edu.gh',
            term,
            billedAmount: amountToPost,
            paidAmount: 0,
            balance: amountToPost,
            status: 'Not Paid',
            dueDate: '2026-09-15',
            paymentDate: null,
            itemsBreakdown: items,
          };
          updatedFees.unshift(newFee);
        }

        const accIndex = updatedFeeAccounts.findIndex(a =>
          (stu.studentId && a.studentId === stu.studentId) || a.child === stu.fullName || a.child === stu.name
        );
        if (accIndex >= 0) {
          const existingAcc = updatedFeeAccounts[accIndex];
          const newBilled = (existingAcc.billed || 0) + amountToPost;
          const newPaid = existingAcc.paid || 0;
          updatedFeeAccounts[accIndex] = {
            ...existingAcc,
            billed: newBilled,
            status: (newBilled - newPaid) <= 0 ? 'Paid' : 'Balance due',
            guardianEmail: stu.guardianEmail || existingAcc.guardianEmail,
            studentId: stu.studentId || existingAcc.studentId,
          };
        } else {
          updatedFeeAccounts.unshift({
            id: `fee-acc-${stu.id || Date.now()}`,
            child: stu.fullName,
            studentId: stu.studentId,
            guardianEmail: stu.guardianEmail,
            school: 'REMALJ Carewell Inspirational School',
            term,
            billed: amountToPost,
            paid: 0,
            status: 'Not Paid',
          });
        }

        updatedLedgerLogs.unshift({
          id: `ledg-${Date.now()}-${stu.studentId}`,
          studentId: stu.studentId,
          studentName: stu.fullName,
          classLevel: stu.level || classLevel,
          transactionType: 'DEBIT (ACADEMIC BILL POSTING)',
          amount: amountToPost,
          description: `Term Academic Fee Bill Posted (${term}) - Total: GHS ${amountToPost.toFixed(2)}`,
          postedBy: 'Admin / Accounts Office',
          postedAt: new Date().toLocaleString(),
        });
      });

      return {
        ...current,
        studentFees: updatedFees,
        feeAccounts: updatedFeeAccounts,
        ledgerLogs: updatedLedgerLogs,
      };
    });
    },
    adjustStudentBill: async ({
      studentId,
      studentName,
      classLevel,
      targetYearGroup,
      adjustmentType = 'CREDIT',
      amount = 0,
      reason = 'Bill Ledger Adjustment',
      invoiceNo = '',
      items = null,
      postedBy = 'Mrs. Grace Accountant (Finance Office)'
    }) => {
      api.adjustStudentBill({
        studentId,
        studentName,
        classLevel,
        adjustmentType,
        amount,
        reason,
        invoiceNo,
        postedBy,
      }).catch((e) => console.warn('Backend bill adjust fallback:', e));
      setData((current) => {
      const adjAmount = Math.abs(Number(amount) || 0);
      const cleanClass = (classLevel || targetYearGroup || '').toLowerCase();
      const cleanStudentName = (studentName || '').toLowerCase();
      const cleanStudentId = String(studentId || '').toLowerCase();

      let targetStudents = [];

      if (cleanStudentId || cleanStudentName) {
        targetStudents = (current.onboardedStudents || []).filter(s =>
          (cleanStudentId && (String(s.studentId).toLowerCase() === cleanStudentId || String(s.id).toLowerCase() === cleanStudentId)) ||
          (cleanStudentName && (s.fullName || s.name || '').toLowerCase().includes(cleanStudentName))
        );
        if (targetStudents.length === 0) {
          const matchFee = (current.studentFees || []).find(f =>
            (cleanStudentId && (String(f.studentId).toLowerCase() === cleanStudentId || String(f.id).toLowerCase() === cleanStudentId)) ||
            (cleanStudentName && (f.studentName || '').toLowerCase().includes(cleanStudentName))
          );
          if (matchFee) {
            targetStudents = [{
              id: matchFee.id,
              studentId: matchFee.studentId || matchFee.id,
              fullName: matchFee.studentName,
              level: matchFee.classLevel || 'General',
              guardianName: matchFee.guardianName,
              guardianEmail: matchFee.guardianEmail
            }];
          }
        }
      } else if (cleanClass && cleanClass !== 'all classes' && cleanClass !== 'all') {
        targetStudents = (current.onboardedStudents || []).filter(s => {
          const sLvl = (s.level || '').toLowerCase();
          return sLvl.includes(cleanClass) || cleanClass.includes(sLvl) ||
                 (cleanClass.includes('jhs 1') && sLvl.includes('jhs 1')) ||
                 (cleanClass.includes('jhs 2') && sLvl.includes('jhs 2')) ||
                 (cleanClass.includes('jhs 3') && sLvl.includes('jhs 3')) ||
                 (cleanClass.includes('jhs') && sLvl.includes('jhs')) ||
                 (cleanClass.includes('creche') && (sLvl.includes('creche') || sLvl.includes('nursery'))) ||
                 (cleanClass.includes('nursery') && (sLvl.includes('nursery') || sLvl.includes('creche'))) ||
                 (cleanClass.includes('primary') && (sLvl.includes('primary') || sLvl.includes('grade')));
        });
      }

      if (targetStudents.length === 0 && (!cleanClass || cleanClass === 'all classes' || cleanClass === 'all')) {
        targetStudents = current.onboardedStudents || [];
      }

      const updatedFees = [...(current.studentFees || [])];
      const updatedFeeAccounts = [...(current.feeAccounts || [])];
      const updatedLedgerLogs = [...(current.ledgerLogs || [])];
      const nowStr = new Date().toLocaleString();

      const typeLower = (adjustmentType || '').toLowerCase();
      const isCreditType = ['credit', 'bulk discount / scholarship', 'waiver fee credit', 'discount', 'waiver', 'scholarship'].some(t => typeLower.includes(t));
      const isDebitType = ['debit', 'add special infrastructure levy', 'fine', 'penalty', 'surcharge', 'levy', 'add'].some(t => typeLower.includes(t));
      const isCancelType = ['cancel', 'cancellation', 'delete'].some(t => typeLower.includes(t));
      const isOverrideType = ['override', 'set', 'recalculate', 'post'].some(t => typeLower.includes(t));

      targetStudents.forEach(stu => {
        const feeIndex = updatedFees.findIndex(f => f.studentId === stu.studentId || f.studentName === stu.fullName || (stu.id && f.id === stu.id));
        
        let existingBilled = 0;
        let existingPaid = 0;
        let existingRecord = null;

        if (feeIndex >= 0) {
          existingRecord = updatedFees[feeIndex];
          existingBilled = Number(existingRecord.billedAmount || 0);
          existingPaid = Number(existingRecord.paidAmount || 0);
        }

        let newBilled = existingBilled;

        if (isCancelType) {
          newBilled = existingPaid;
        } else if (isCreditType) {
          newBilled = Math.max(0, existingBilled - adjAmount);
        } else if (isDebitType) {
          newBilled = existingBilled + adjAmount;
        } else if (isOverrideType) {
          newBilled = adjAmount;
        } else {
          newBilled = Math.max(0, existingBilled - adjAmount);
        }

        const newBalance = Math.max(0, newBilled - existingPaid);
        let newStatus = 'Not Paid';
        if (isCancelType && newBalance === 0) {
          newStatus = 'Cancelled';
        } else if (newBalance <= 0) {
          newStatus = 'Paid';
        } else if (existingPaid > 0) {
          newStatus = 'Balance Due';
        } else {
          newStatus = 'Not Paid';
        }

        const adjustmentRecord = {
          id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toLocaleDateString(),
          type: adjustmentType,
          amount: adjAmount,
          reason,
          invoiceNo,
          previousBilled: existingBilled,
          newBilled,
          postedBy
        };

        if (feeIndex >= 0) {
          updatedFees[feeIndex] = {
            ...existingRecord,
            billedAmount: newBilled,
            balance: newBalance,
            status: newStatus,
            lastAdjustedAt: nowStr,
            itemsBreakdown: items || existingRecord.itemsBreakdown,
            adjustmentHistory: [adjustmentRecord, ...(existingRecord.adjustmentHistory || [])]
          };
        } else {
          const newFee = {
            id: `fee-${stu.id || Date.now()}`,
            studentId: stu.studentId || `SID-${stu.id}`,
            studentName: stu.fullName || stu.name,
            guardianName: stu.guardianName || 'Parent',
            guardianEmail: stu.guardianEmail || 'parent@remaljcarewell.edu.gh',
            term: 'Term 1 · 2026',
            billedAmount: newBilled,
            paidAmount: 0,
            balance: newBalance,
            status: newStatus,
            dueDate: '2026-09-15',
            paymentDate: null,
            itemsBreakdown: items || [],
            lastAdjustedAt: nowStr,
            adjustmentHistory: [adjustmentRecord]
          };
          updatedFees.unshift(newFee);
        }

        const accIndex = updatedFeeAccounts.findIndex(a => a.child === (stu.fullName || stu.name));
        if (accIndex >= 0) {
          const existingAcc = updatedFeeAccounts[accIndex];
          const accPaid = Number(existingAcc.paid || 0);
          const accBalance = Math.max(0, newBilled - accPaid);
          updatedFeeAccounts[accIndex] = {
            ...existingAcc,
            billed: newBilled,
            status: accBalance <= 0 ? (isCancelType ? 'Cancelled' : 'Paid') : 'Balance due',
          };
        } else {
          updatedFeeAccounts.unshift({
            id: `fee-acc-${stu.id || Date.now()}`,
            child: stu.fullName || stu.name,
            school: 'REMALJ Carewell Inspirational School',
            term: 'Term 1 · 2026',
            billed: newBilled,
            paid: 0,
            status: newBalance <= 0 ? 'Paid' : 'Balance due',
          });
        }

        updatedLedgerLogs.unshift({
          id: `ledg-adj-${Date.now()}-${stu.studentId || Math.random()}`,
          studentId: stu.studentId || `SID-${stu.id}`,
          studentName: stu.fullName || stu.name,
          classLevel: stu.level || classLevel || targetYearGroup || 'General',
          transactionType: `BILL ADJUSTMENT (${adjustmentType.toUpperCase()})`,
          amount: adjAmount,
          previousBilled: existingBilled,
          newBilledAmount: newBilled,
          newBalance,
          description: `Bill Ledger Adjusted [${adjustmentType}]: ${reason}${invoiceNo ? ` (Ref: ${invoiceNo})` : ''}`,
          postedBy,
          postedAt: nowStr,
        });
      });

      return {
        ...current,
        studentFees: updatedFees,
        feeAccounts: updatedFeeAccounts,
        ledgerLogs: updatedLedgerLogs,
      };
    });
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
      }
    },
    broadcastOwingReminders: async (data = {}) => {
      try {
        return await api.broadcastOwingReminders({ sendSms: true, ...data });
      } catch (e) {
        console.warn('Broadcast owing reminders API warning:', e);
      }
    },
    sendDirectSms: async (data) => {
      try {
        return await api.sendDirectSms(data);
      } catch (e) {
        console.warn('Send direct SMS API warning:', e);
      }
    },
    getSmsBalance: async () => {
      try {
        return await api.getSmsBalance();
      } catch (e) {
        console.warn('Get SMS balance API warning:', e);
      }
    },
    // Staff Onboarding & Management Methods
    addStaffMember: async (staffData) => {
      let created = null;
      try {
        created = await api.createStaff({
          ...staffData,
          classAssigned: formatClassToBasic(staffData.classAssigned || 'Basic 1'),
          role: staffData.role || 'Subject Teacher',
          status: staffData.status || 'Active'
        });
      } catch (e) {
        console.warn('Backend staff create fallback:', e);
      }

      const createdPayload = (created && typeof created === 'object') ? (created.staff || created.data || created) : null;

      setData((current) => {
        const currentList = current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY;
        const staffId = staffData.staffId || `STF-2026-${String(currentList.length + 1).padStart(3, '0')}`;
        const email = staffData.email || `${(staffData.name || 'staff').toLowerCase().replace(/[^\w]/g, '.')}@remaljcarewell.edu.gh`;
        const defaultPassword = staffData.password || `StaffPass#${staffId}`;

        const newStaff = (createdPayload && createdPayload.name) ? {
          ...createdPayload,
          id: createdPayload.id || crypto.randomUUID?.() || String(Date.now()),
          staffId: createdPayload.staffId || staffId,
          name: createdPayload.name || staffData.name,
          classAssigned: formatClassToBasic(createdPayload.classAssigned || staffData.classAssigned || 'Basic 1'),
          role: createdPayload.role || staffData.role || 'Subject Teacher',
          teacherDesignation: staffData.teacherDesignation || createdPayload.teacherDesignation || createdPayload.teacher_designation,
          status: createdPayload.status || 'Active'
        } : {
          id: crypto.randomUUID?.() || String(Date.now()),
          staffId,
          name: staffData.name,
          subject: staffData.subject || 'General Education',
          classAssigned: formatClassToBasic(staffData.classAssigned || 'Basic 1'),
          email,
          phone: staffData.phone || '024 900 1100',
          role: staffData.role || 'Subject Teacher',
          teacherDesignation: staffData.teacherDesignation,
          status: staffData.status || 'Active',
          joinedDate: staffData.joinedDate || new Date().toISOString().split('T')[0],
          photo: staffData.photo || (staffData.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'),
          bio: staffData.bio || `${staffData.role || 'Teacher'} at REMALJ Carewell Inspirational School.`
        };

        try {
          const raw = localStorage.getItem('registered_accounts');
          const list = raw ? JSON.parse(raw) : {};
          list[email.toLowerCase()] = {
            id: newStaff.id,
            email: email.toLowerCase(),
            password: defaultPassword,
            fullName: staffData.name,
            role: staffData.teacherDesignation === 'class_teacher' ? 'class_teacher' : 'teacher',
            teacherDesignation: staffData.teacherDesignation,
            staffId,
            phone: staffData.phone
          };
          localStorage.setItem('registered_accounts', JSON.stringify(list));
        } catch (e) {}

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
        teacherDirectory: (current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY).map((t) => (t.id === id || t.staffId === id) ? { ...t, ...sanitizedUpdates } : t)
      }));
    },
    offboardStaffMember: async (id) => {
      await api.offboardStaff(id);
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY).map((t) => (t.id === id || t.staffId === id) ? { ...t, status: 'Offboarded' } : t)
      }));
    },
    reactivateStaffMember: async (id) => {
      await api.reactivateStaff(id);
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY).map((t) => (t.id === id || t.staffId === id) ? { ...t, status: 'Active' } : t)
      }));
    },
    deleteStaffMember: async (id) => {
      try {
        await api.deleteStaff(id);
      } catch (e) {
        console.warn('Backend staff delete fallback:', e);
      }
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || DEFAULT_TEACHER_DIRECTORY).filter((t) => t.id !== id && t.staffId !== id)
      }));
    },
    // Dynamic Classes & Subjects Methods
    addClassLevel: async (newClass) => {
      if (!newClass) return;
      const formatted = formatClassToBasic(newClass.trim());
      try {
        await api.createCatalogEntry('classes', formatted);
      } catch (e) {
        console.warn('Backend class catalog fallback:', e);
      }
      setData((current) => {
        const existing = current.classLevels || DEFAULT_CLASS_LEVELS;
        if (existing.includes(formatted)) return current;
        return {
          ...current,
          classLevels: [...existing, formatted]
        };
      });
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
      let backendId = null;
      try {
        const res = await api.createExamRegistration(regData);
        backendId = res?.id || res?._id || res?.data?.id || null;
      } catch (e) {
        console.warn('[ExamReg] Backend registration failed, saving locally:', e?.message || e);
      }
      setData((current) => {
        const existing = current.examRegistrations || [];
        const newReg = {
          id: backendId || `exam-reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          registeredAt: new Date().toISOString().split('T')[0],
          registeredBy: 'Academic Head / Admin',
          status: 'Registered - Hall Pass Valid',
          ...regData,
          // Ensure both naming conventions present for the roster UI
          studentId:    regData.studentId   || regData.student_id,
          studentName:  regData.studentName || regData.student_name,
          classLevel:   regData.classLevel  || regData.class_level,
          academicYear: regData.academicYear|| regData.academic_year,
          examType:     regData.examType    || regData.exam_type,
          indexNumber:  regData.indexNumber || regData.index_number,
          examCenter:   regData.examCenter  || regData.exam_center,
        };
        return {
          ...current,
          examRegistrations: [newReg, ...existing]
        };
      });
    },

    registerClassExams: async (classRegData) => {
      try {
        if (Array.isArray(classRegData.students)) {
          for (const stu of classRegData.students) {
            await api.createExamRegistration({
              studentId: stu.studentId,
              studentName: stu.studentName,
              classLevel: classRegData.classLevel,
              academicYear: classRegData.academicYear,
              term: classRegData.term,
              examType: classRegData.examType,
              indexNumber: stu.indexNumber,
              examCenter: classRegData.examCenter,
              subjects: classRegData.subjects,
              registeredBy: 'Academic Head / Admin'
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Backend class exams reg fallback:', e);
      }
      setData((current) => {
        const existing = current.examRegistrations || [];
        const newRegs = (classRegData.students || []).map((stu, idx) => ({
          id: `exam-reg-${Date.now()}-${idx}`,
          studentId: stu.studentId,
          studentName: stu.studentName,
          classLevel: classRegData.classLevel,
          academicYear: classRegData.academicYear,
          term: classRegData.term,
          examType: classRegData.examType,
          indexNumber: stu.indexNumber || `EXAM-${classRegData.academicYear.substring(0, 4)}-${classRegData.classLevel.replace(/\s+/g, '').toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
          examCenter: classRegData.examCenter || 'Main Examination Hall A',
          subjects: classRegData.subjects || [],
          registeredAt: new Date().toISOString().split('T')[0],
          registeredBy: 'Academic Head / Admin',
          status: 'Registered - Hall Pass Valid'
        }));
        return {
          ...current,
          examRegistrations: [...newRegs, ...existing]
        };
      });
    },
    cancelExamRegistration: async (regId) => {
      try {
        await api.deleteExamRegistration(regId);
      } catch (e) {
        console.warn('Backend exam reg cancel fallback:', e);
      }
      setData((current) => ({
        ...current,
        examRegistrations: (current.examRegistrations || []).filter(r => r.id !== regId && r.indexNumber !== regId)
      }));
    },
    // Payment Voucher (PV) Management Methods
    addPaymentVoucher: async (pvData) => {
      try {
        await api.createPaymentVoucher({
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
        });
      } catch (e) {
        console.warn('Backend PV create fallback:', e);
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const existingNotifs = current.pvNotifications || [];
        const pvNo = pvData.pvNo || `PV-2026-${String(existing.length + 100).padStart(3, '0')}`;
        const newPV = {
          id: `pv-${Date.now()}`,
          pvNo,
          requisitionNo: pvData.requisitionNo || `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
          provider: pvData.provider || 'General Vendor',
          providerId: pvData.providerId || 'VEN-001',
          department: pvData.department || 'Administration',
          paymentMode: pvData.paymentMode || pvData.payment_mode || 'Cash',
          description: pvData.description || 'Expenditure Voucher',
          qty: Number(pvData.qty) || 1,
          cost: Number(pvData.cost || pvData.costPerItem) || 0,
          total: (Number(pvData.qty) || 1) * (Number(pvData.cost || pvData.costPerItem) || 0),
          datePrepared: pvData.datePrepared || new Date().toISOString().split('T')[0],
          valuedDate: pvData.valuedDate || new Date().toISOString().split('T')[0],
          auditRemarks: pvData.auditRemarks || 'Created in system.',
          status: pvData.status || 'Pending Audit',
          editedByHeadmaster: false,
          correctionsLog: [],
          items: pvData.items || [],
          grandTotal: pvData.grandTotal || 0,
          academicYear: pvData.academicYear,
          academicTerm: pvData.academicTerm,
          submittedBy: pvData.submittedBy || 'Sub-Admin',
        };
        // Push a head-admin notification
        const newNotif = {
          id: `notif-pv-${Date.now()}`,
          pvNo,
          provider: newPV.provider,
          grandTotal: newPV.grandTotal || newPV.total,
          description: newPV.description,
          submittedBy: newPV.submittedBy,
          submittedAt: new Date().toLocaleString(),
          read: false,
        };
        return {
          ...current,
          paymentVouchers: [newPV, ...existing],
          pvNotifications: [newNotif, ...existingNotifs],
        };
      });
    },
    // Service Providers CRUD with DB & Local Storage Persistence
    createServiceProvider: async (providerData) => {
      let created = null;
      try {
        if (api.createServiceProvider) {
          const res = await api.createServiceProvider(providerData);
          if (res && typeof res === 'object') {
            created = {
              id: String(res.id || res.provider_id || providerData.id),
              name: res.name || providerData.name,
              address: res.address || providerData.address,
              email: res.email || providerData.email,
              phone: res.phone || providerData.phone || providerData.telephone
            };
          }
        }
      } catch (e) {
        console.warn('Backend create service provider fallback:', e);
      }
      const itemToSave = created || {
        ...providerData,
        id: String(providerData.id || Date.now()),
        address: providerData.address || 'Bogoso',
        phone: providerData.phone || providerData.telephone || ''
      };

      setData((current) => {
        const list = current.serviceProviders || DEFAULT_SERVICE_PROVIDERS;
        const next = [itemToSave, ...list.filter(p => p.id !== itemToSave.id && p.name !== itemToSave.name)];
        try { localStorage.setItem('says_service_providers', JSON.stringify(next)); } catch (_) {}
        // Broadcast across tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const ch = new BroadcastChannel('rcis_portal_data_sync');
            ch.postMessage({ type: 'NEW_SERVICE_PROVIDER', provider: itemToSave });
            ch.close();
          } catch (_) {}
        }
        return {
          ...current,
          serviceProviders: next
        };
      });

      // Real-time Cloud Hub Push for immediate delivery across all devices
      if (cloudSync.pushServiceProvider) {
        cloudSync.pushServiceProvider(itemToSave);
      }
      return itemToSave;
    },
    updateServiceProvider: async (id, providerData) => {
      try {
        if (api.updateServiceProvider) {
          await api.updateServiceProvider(id, providerData);
        }
      } catch (e) {
        console.warn('Backend update service provider fallback:', e);
      }
      setData((current) => {
        const list = current.serviceProviders || DEFAULT_SERVICE_PROVIDERS;
        const next = list.map(p => p.id === id ? { ...p, ...providerData } : p);
        try { localStorage.setItem('says_service_providers', JSON.stringify(next)); } catch (_) {}
        if (cloudSync.pushServiceProvider) {
          const updated = next.find(p => p.id === id);
          if (updated) cloudSync.pushServiceProvider(updated);
        }
        return { ...current, serviceProviders: next };
      });
    },
    deleteServiceProvider: async (id) => {
      try {
        if (api.deleteServiceProvider) {
          await api.deleteServiceProvider(id);
        }
      } catch (e) {
        console.warn('Backend delete service provider fallback:', e);
      }
      setData((current) => {
        const list = current.serviceProviders || DEFAULT_SERVICE_PROVIDERS;
        const next = list.filter(p => p.id !== id);
        try { localStorage.setItem('says_service_providers', JSON.stringify(next)); } catch (_) {}
        return { ...current, serviceProviders: next };
      });
    },
    // Alias so SubmitPVRequest can call createPaymentVoucher too
    createPaymentVoucher: async (pvData) => {
      // 1. Try to persist to backend
      try {
        await api.createPaymentVoucher({
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
          academic_year: pvData.academicYear,
          academic_term: pvData.academicTerm,
          status: 'Pending Audit',
          submitted_by: pvData.submittedBy || 'Sub-Admin',
        });
        console.log('[PV] Saved to backend ✅', pvData.pvNo);
      } catch (e) {
        console.warn('[PV] Backend offline — saving locally:', e.message);
      }

      // 2. Always update local state + create notification
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const existingNotifs = current.pvNotifications || [];
        const pvNo = pvData.pvNo || `PV-2026-${String(existing.length + 100).padStart(3, '0')}`;
        const grandTotal = Number(pvData.grandTotal || pvData.total || pvData.cost) || 0;
        const newPV = {
          id: `pv-${Date.now()}`,
          pvNo,
          requisitionNo: pvData.requisitionNo || `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
          provider: pvData.provider || 'General Vendor',
          providerId: pvData.providerId || 'VEN-001',
          description: pvData.description || 'Expenditure Voucher',
          qty: Number(pvData.qty) || 1,
          cost: Number(pvData.cost || pvData.costPerItem) || 0,
          total: grandTotal,
          grandTotal,
          datePrepared: pvData.datePrepared || new Date().toISOString().split('T')[0],
          valuedDate: pvData.valuedDate || new Date().toISOString().split('T')[0],
          auditRemarks: pvData.auditRemarks || 'Submitted by Sub-Admin. Pending pre-audit approval.',
          status: pvData.status || 'Pending Audit',
          editedByHeadmaster: false,
          correctionsLog: [],
          items: pvData.items || [],
          academicYear: pvData.academicYear,
          academicTerm: pvData.academicTerm,
          submittedBy: pvData.submittedBy || 'Sub-Admin / Accounts Officer',
        };
        const newNotif = {
          id: `notif-pv-${Date.now()}`,
          pvNo,
          provider: newPV.provider,
          grandTotal,
          description: newPV.description,
          submittedBy: newPV.submittedBy,
          submittedAt: new Date().toLocaleString(),
          read: false,
        };
        console.log('[PV] Notification queued for Head Admin 🔔', newNotif);

        // 3. Broadcast to other tabs via BroadcastChannel
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const ch = new BroadcastChannel('rcis_portal_data_sync');
            ch.postMessage({ type: 'PV_SUBMITTED', pvNo, notif: newNotif });
            ch.close();
          }
        } catch (_) {}

        // 4. Also fire a window event for same-tab AdminPortal to react
        try {
          window.dispatchEvent(new CustomEvent('rcis_pv_submitted', {
            detail: { pvNo, notif: newNotif }
          }));
        } catch (_) {}

        return {
          ...current,
          paymentVouchers: [newPV, ...existing],
          pvNotifications: [newNotif, ...existingNotifs],
        };
      });
    },

    // Notification management
    markAllPVNotificationsRead: () => setData((current) => {
      const notifs = current.pvNotifications || [];
      const allKeys = notifs.map(n => String(n.pvNo || n.id || '').toLowerCase().trim());
      try {
        const storedRead = JSON.parse(localStorage.getItem('says_read_pv_notifs') || '[]');
        const combined = Array.from(new Set([...storedRead, ...allKeys]));
        localStorage.setItem('says_read_pv_notifs', JSON.stringify(combined));
      } catch (_) {}
      return {
        ...current,
        pvNotifications: notifs.map(n => ({ ...n, read: true }))
      };
    }),
    clearPVNotifications: () => setData((current) => {
      const notifs = current.pvNotifications || [];
      const allKeys = notifs.map(n => String(n.pvNo || n.id || '').toLowerCase().trim());
      const pvs = current.paymentVouchers || [];
      const pendingKeys = pvs
        .filter(p => {
          const s = (p.status || '').toLowerCase().trim();
          return s.includes('pending') || s === 'draft' || !s;
        })
        .map(p => String(p.pvNo || p.id || '').toLowerCase().trim());

      try {
        const storedCleared = JSON.parse(localStorage.getItem('says_cleared_pv_notifs') || '[]');
        const combined = Array.from(new Set([...storedCleared, ...allKeys, ...pendingKeys]));
        localStorage.setItem('says_cleared_pv_notifs', JSON.stringify(combined));
      } catch (_) {}
      return {
        ...current,
        pvNotifications: []
      };
    }),
    markPVNotificationRead: (idOrPvNo) => setData((current) => {
      const key = String(idOrPvNo).toLowerCase().trim();
      try {
        const storedRead = JSON.parse(localStorage.getItem('says_read_pv_notifs') || '[]');
        if (!storedRead.includes(key)) {
          storedRead.push(key);
          localStorage.setItem('says_read_pv_notifs', JSON.stringify(storedRead));
        }
      } catch (_) {}
      return {
        ...current,
        pvNotifications: (current.pvNotifications || []).map(n => {
          const nKey = String(n.pvNo || n.id || '').toLowerCase().trim();
          return (n.id === idOrPvNo || nKey === key) ? { ...n, read: true } : n;
        })
      };
    }),
    updatePaymentVoucher: async (pvNo, updatedFields, editorRole = 'Headmaster / Pre-Auditor') => {
      try {
        await api.correctPaymentVoucher(pvNo, {
          reason: `Voucher details corrected by ${editorRole} prior to approval`,
          changes: updatedFields
        });
      } catch (e) {
        console.warn('Backend PV correction fallback:', e);
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const updated = existing.map(p => {
          if (p.pvNo.toLowerCase() === String(pvNo).toLowerCase() || p.id === pvNo) {
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
    approvePaymentVoucher: async (pvNo, actionChoice, remarks, updatedFields = null, auditorName = 'Headmaster / Pre-Auditor') => {
      // 1. Resolve UUID id for backend endpoint
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let targetUuid = null;

      const currentVouchers = data.paymentVouchers || [];
      const existingVoucher = currentVouchers.find(p =>
        (p.pvNo && String(p.pvNo).toLowerCase() === String(pvNo).toLowerCase()) ||
        (p.id && String(p.id).toLowerCase() === String(pvNo).toLowerCase())
      );

      if (existingVoucher?.id && uuidRegex.test(existingVoucher.id)) {
        targetUuid = existingVoucher.id;
      } else if (uuidRegex.test(pvNo)) {
        targetUuid = pvNo;
      }

      // If still not a UUID, query backend vouchers to match by pv_number
      if (!targetUuid) {
        try {
          const remoteList = await api.getPaymentVouchers();
          if (Array.isArray(remoteList)) {
            const remoteMatch = remoteList.find(r =>
              String(r.pv_number || '').toLowerCase() === String(pvNo).toLowerCase() ||
              String(r.id || '').toLowerCase() === String(pvNo).toLowerCase()
            );
            if (remoteMatch?.id && uuidRegex.test(remoteMatch.id)) {
              targetUuid = remoteMatch.id;
            }
          }
        } catch (_) {}
      }

      // 2. Map frontend action choice to valid backend status enum
      // Permitted by FastAPI: 'DRAFT', 'PRE_AUDITED', 'APPROVED', 'DISBURSED', 'REJECTED'
      let backendStatus = 'APPROVED';
      const lower = String(actionChoice || '').toLowerCase();
      if (lower.includes('valid') || lower.includes('approv')) {
        backendStatus = 'APPROVED';
      } else if (lower.includes('declin') || lower.includes('reject') || lower.includes('cancel') || lower.includes('non-accrual')) {
        backendStatus = 'REJECTED';
      } else if (lower.includes('postpon') || lower.includes('draft') || lower.includes('pending')) {
        backendStatus = 'DRAFT';
      }

      // 3. Dispatch to backend API
      if (targetUuid) {
        try {
          if (backendStatus === 'APPROVED') {
            try {
              await api.preAuditPaymentVoucher(targetUuid, {
                decision: 'APPROVED',
                audit_notes: remarks || 'Pre-audited & verified by Headmaster.'
              });
            } catch (e1) {
              console.warn('Pre-audit call note:', e1.message);
            }
            try {
              await api.approvePaymentVoucher(targetUuid, {
                approval_notes: remarks || 'Approved for disbursement by Headmaster.'
              });
            } catch (e2) {
              console.warn('Approve call note:', e2.message);
            }
          } else {
            await api.updatePaymentVoucherStatus(targetUuid, {
              status: backendStatus,
              notes: remarks || undefined,
              comments: remarks || undefined,
              rejectionReason: backendStatus === 'REJECTED' ? (remarks || 'Declined during pre-audit') : undefined
            });
          }
        } catch (e) {
          console.warn('Backend PV status update fallback:', e);
        }
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const statusText = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
        const updated = existing.map(p => {
          if (p.pvNo.toLowerCase() === String(pvNo).toLowerCase() || p.id === pvNo) {
            const mergedItems = Array.isArray(updatedFields?.items) ? updatedFields.items : (p.items || []);
            const qtyVal = Number(updatedFields?.qty !== undefined ? updatedFields.qty : p.qty) || 1;
            const costVal = Number(updatedFields?.cost !== undefined ? updatedFields.cost : (updatedFields?.costPerItem !== undefined ? updatedFields.costPerItem : (p.cost || 0))) || 0;
            const payable = Array.isArray(mergedItems) && mergedItems.length > 0
              ? mergedItems
                  .filter((i) => /valid|approv|pre-audit/i.test(String(i.status || '')))
                  .reduce((acc, i) => acc + (Number(i.totalAmount || i.total || 0) || 0), 0)
              : (qtyVal * costVal);
            const isEdited = !!updatedFields || p.editedByHeadmaster;
            const mixedStatus = Array.isArray(mergedItems) && mergedItems.length > 1
              ? (() => {
                  const statuses = mergedItems.map((i) => String(i.status || '').toLowerCase());
                  const allVal = statuses.every((s) => s.includes('valid') || s.includes('approv'));
                  const allDec = statuses.every((s) => s.includes('declin') || s.includes('reject') || s.includes('cancel'));
                  if (allVal) return 'Validated';
                  if (allDec) return 'Declined';
                  if (statuses.some((s) => s.includes('valid') || s.includes('approv'))) return 'Partially Approved';
                  return statusText;
                })()
              : statusText;
            return {
              ...p,
              ...(updatedFields || {}),
              items: mergedItems,
              qty: qtyVal,
              cost: costVal,
              total: payable,
              payableTotal: payable,
              status: mixedStatus,
              auditRemarks: remarks || p.auditRemarks,
              approvedBy: auditorName,
              approvedAt: new Date().toLocaleString(),
              editedByHeadmaster: isEdited,
            };
          }
          return p;
        });
        const updatedNotifs = (current.pvNotifications || []).map(n =>
          (n.pvNo && String(n.pvNo).toLowerCase() === String(pvNo).toLowerCase())
            ? { ...n, read: true, status: statusText }
            : n
        );
        return {
          ...current,
          paymentVouchers: updated,
          pvNotifications: updatedNotifs
        };
      });
    },
    disbursePaymentVoucher: async (pvNo, paymentDetails = {}, disburserName = 'Head Admin / Headmaster') => {
      // 1. Resolve UUID id for backend endpoint
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let targetUuid = null;

      const currentVouchers = data.paymentVouchers || [];
      const existingVoucher = currentVouchers.find(p =>
        (p.pvNo && String(p.pvNo).toLowerCase() === String(pvNo).toLowerCase()) ||
        (p.id && String(p.id).toLowerCase() === String(pvNo).toLowerCase())
      );

      if (existingVoucher?.id && uuidRegex.test(existingVoucher.id)) {
        targetUuid = existingVoucher.id;
      } else if (uuidRegex.test(pvNo)) {
        targetUuid = pvNo;
      }

      if (!targetUuid) {
        try {
          const remoteList = await api.getPaymentVouchers();
          if (Array.isArray(remoteList)) {
            const remoteMatch = remoteList.find(r =>
              String(r.pv_number || '').toLowerCase() === String(pvNo).toLowerCase() ||
              String(r.id || '').toLowerCase() === String(pvNo).toLowerCase()
            );
            if (remoteMatch?.id && uuidRegex.test(remoteMatch.id)) {
              targetUuid = remoteMatch.id;
            }
          }
        } catch (_) {}
      }

      // 2. Dispatch to backend API
      if (targetUuid) {
        try {
          await api.disbursePaymentVoucher(targetUuid, {
            payment_method: paymentDetails.paymentMethod || 'Bank Transfer',
            account_number: paymentDetails.accountNumber || '',
            reference_number: paymentDetails.referenceNumber || '',
            disbursement_notes: paymentDetails.notes || 'Disbursed and paid by Head Admin.'
          });
        } catch (e) {
          console.warn('Backend disburse voucher call:', e);
          try {
            await api.updatePaymentVoucherStatus(targetUuid, {
              status: 'DISBURSED',
              notes: paymentDetails.notes || 'Disbursed by Head Admin'
            });
          } catch (e2) {}
        }
      }

      // 3. Update local state and localStorage
      const paymentDate = paymentDetails.paymentDate || new Date().toISOString().split('T')[0];
      const settlementRecord = {
        status: 'DISBURSED',
        disbursedAt: new Date().toLocaleString(),
        disbursedBy: disburserName,
        paymentDate,
        paymentMethod: paymentDetails.paymentMethod || 'Bank Transfer',
        paymentSourceAccount: paymentDetails.sourceAccount || 'School Operations Account',
        disbursementReference: paymentDetails.referenceNumber || `TXN-${Date.now().toString().slice(-6)}`,
        disbursementNotes: paymentDetails.notes || 'Payment processed & disbursed.',
      };

      setData((current) => {
        const existing = current.paymentVouchers || [];
        const updated = existing.map(p => {
          if (p.pvNo?.toLowerCase() === String(pvNo).toLowerCase() || p.id === pvNo) {
            return {
              ...p,
              ...settlementRecord
            };
          }
          return p;
        });

        try {
          const q = JSON.parse(localStorage.getItem('official_pv_queue') || '[]');
          if (Array.isArray(q)) {
            const updatedQ = q.map(p =>
              (p.pvNo?.toLowerCase() === String(pvNo).toLowerCase() || p.id === pvNo)
                ? { ...p, ...settlementRecord }
                : p
            );
            localStorage.setItem('official_pv_queue', JSON.stringify(updatedQ));
          }
        } catch (_) {}

        return {
          ...current,
          paymentVouchers: updated
        };
      });

      return true;
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
  }), [data, refreshBackendData, performOnboardStudent]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}

export const usePortalStore = usePortalData;
export const usePortalContext = usePortalData;
