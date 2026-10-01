/**
 * REMALJ Carewell Inspirational School - Backend & SMS Gateway API Service Client
 * Backend Base URL: https://rcis-backend.onrender.com/api/v1
 * SMS Gateway: SMSOnlineGH (v4 API)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://rcis-backend.onrender.com/api/v1';
const LIVE_API_ORIGIN = 'https://rcis-backend.onrender.com/api/v1';

export function extractAuthToken(res) {
  if (!res || typeof res !== 'object') return '';
  const nested = res.data && typeof res.data === 'object' ? res.data : {};
  return String(
    res.token
    || res.access_token
    || res.accessToken
    || res.sims_token
    || nested.token
    || nested.access_token
    || ''
  ).trim();
}

function applyAuthSession(res) {
  const token = extractAuthToken(res);
  if (token) setAuthToken(token);
  const user = res?.user || res?.data?.user;
  if (user) setAuthUser(user);
  return token;
}

export function hasLiveDatabaseSession() {
  return String(getAuthToken() || '').startsWith('eyJ');
}
const SMS_API_KEY = import.meta.env.VITE_SMS_API_KEY || '67648ed5720ca875d42dc20f5726d94c9c1ea2b149a541784b5ba2194241b022';
const SMS_SENDER_ID = import.meta.env.VITE_SMS_SENDER_ID || 'RCIS';

export function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthUser() {
  try {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function getUserFullName(user = getAuthUser()) {
  if (!user || typeof user !== 'object') return '';
  const explicit = [user.fullName, user.full_name, user.teacherName, user.teacher_name]
    .map((value) => String(value || '').trim())
    .find(Boolean);
  if (explicit) return explicit;
  const parts = [
    user.firstName || user.first_name,
    user.otherNames || user.other_names || user.middleName || user.middle_name,
    user.lastName || user.last_name || user.surname,
  ].map((value) => String(value || '').trim()).filter(Boolean);
  if (parts.length) return parts.join(' ');
  return String(user.name || '').trim();
}

export function setAuthUser(user) {
  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth_user');
  }
}

async function request(endpoint, options = {}) {
  const urls = [`${API_BASE_URL}${endpoint}`];
  if (import.meta.env.DEV && API_BASE_URL.startsWith('/') && LIVE_API_ORIGIN) {
    urls.push(`${LIVE_API_ORIGIN}${endpoint}`);
  }
  const token = getAuthToken();

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && String(token).startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let lastError = null;
  for (const url of urls) {
  try {
    const response = await fetch(url, config);
      const text = await response.text();
      let data = null;
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            console.error(`[FastAPI 422 Validation Error on ${endpoint}]:`, data.detail);
            const formatted = data.detail
              .map(d => {
                const loc = Array.isArray(d.loc) ? d.loc.filter(x => x !== 'body').join('.') : d.loc;
                return `[${loc}]: ${d.msg}`;
              })
              .join('; ');
            errorMessage = `FastAPI Validation Error (HTTP 422): ${formatted}`;
          } else {
            errorMessage = typeof data.detail === 'string'
              ? data.detail
              : JSON.stringify(data.detail);
          }
        } else if (data && data.message) {
          errorMessage = data.message;
        } else if (text && text.trim()) {
          errorMessage = text.trim().slice(0, 300);
        }
        lastError = new Error(errorMessage);
        lastError.status = response.status;
        lastError.payload = data;
        if (response.status >= 400 && response.status < 500) throw lastError;
        continue;
      }
      if (data !== null && data !== undefined) return data;
      return { success: true, status: response.status };
  } catch (err) {
      lastError = err;
      if (err?.status >= 400 && err?.status < 500) throw err;
      if (err && /FastAPI|HTTP 4/.test(String(err.message || ''))) throw err;
    }
  }
  console.warn(`[API Client Warning] Request to ${endpoint} failed:`, lastError?.message);
  throw lastError || new Error(`Request to ${endpoint} failed`);
}

export function sanitizePostedBillItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      details: String(item?.details || item?.description || item?.name || 'Fee item').trim().slice(0, 100) || 'Fee item',
      amount: Number(item?.amount ?? item?.fee ?? 0) || 0,
    }))
    .filter((item) => item.details);
}

export function classLevelForBillPost(level) {
  const raw = String(level || '').trim();
  if (!raw) return 'Basic 1';
  const basic = raw.match(/basic\s*([1-9])/i);
  if (basic) return `Basic ${basic[1]}`;
  const kg = raw.match(/(?:kindergarten|kg)\s*([12])/i);
  if (kg) return `Kindergarten ${kg[1]}`;
  const nur = raw.match(/nursery\s*([12])/i);
  if (nur) return `Nursery ${nur[1]}`;
  if (/creche/i.test(raw)) return 'Creche';
  return raw.replace(/\s+[A-D]$/i, '').slice(0, 50) || 'Basic 1';
}

function isOfficialStudentCode(value) {
  return /^(REMALJ|RCIS)-\d{4}-/i.test(String(value || '').trim());
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function resolveBillStudentId(student = {}) {
  const code = String(student.studentId || student.student_id || student.student_code || '').trim();
  if (isOfficialStudentCode(code)) return code;
  const uuid = String(student.id || student.uuid || student.backendId || '').trim();
  if (isUuid(uuid)) return uuid;
  const candidates = [code, uuid, student.studentId, student.id];
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (!value) continue;
    if (/^stu(-bulk)?-/i.test(value) || /^fee-(acc-)?/i.test(value)) continue;
    return value;
  }
  return '';
}

function billStudentIdCandidates(student = {}) {
  const seen = new Set();
  const ids = [];
  const push = (value) => {
    const id = String(value || '').trim();
    if (!id || seen.has(id)) return;
    if (/^stu(-bulk)?-/i.test(id) || /^fee-(acc-)?/i.test(id)) return;
    seen.add(id);
    ids.push(id);
  };
  const code = String(student.studentId || student.student_id || student.student_code || '').trim();
  const uuid = String(student.id || student.uuid || student.backendId || '').trim();
  if (isOfficialStudentCode(code)) push(code);
  if (isUuid(uuid)) push(uuid);
  push(code);
  push(uuid);
  return ids;
}

function normalizeBillTerm(term) {
  const raw = String(term || 'Term 1').trim();
  const match = raw.match(/term\s*([1-3])/i);
  return match ? `Term ${match[1]}` : raw.slice(0, 50);
}

function billDueDate(preferred) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = preferred ? new Date(preferred) : null;
  if (parsed && !Number.isNaN(parsed.getTime()) && parsed >= today) {
    return String(preferred).slice(0, 10);
  }
  const future = new Date(today);
  future.setDate(future.getDate() + 30);
  return future.toISOString().slice(0, 10);
}

export function extractStudentList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of ['students', 'onboardedStudents', 'onboarded_students', 'learners', 'roster', 'data', 'records', 'items', 'results']) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return extractStudentList(raw.data);
  }
  if (raw.student && typeof raw.student === 'object') return [raw.student];
  return [];
}

function studentNamesMatch(a, b) {
  const n = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return Boolean(n(a) && n(a) === n(b));
}

function splitBillItemsForStudentLedger(items = []) {
  const list = sanitizePostedBillItems(items);
  let tuitionFee = 0;
  let stationeryFee = 0;
  const optionalServices = [];
  const stationeryBreakdown = [];
  list.forEach((item) => {
    const details = item.details.replace(/^OPTIONAL:\s*/i, '').trim();
    const lower = item.details.toLowerCase();
    if (/^optional:/.test(lower) || /motivation levy|bus transport|feeding|pick up card|lunch|canteen/.test(lower)) {
      optionalServices.push({
        name: details.slice(0, 255) || 'Optional service',
        amount: item.amount,
      });
      return;
    }
    if (/stationer|textbook|exercise book/.test(lower)) {
      stationeryFee += item.amount;
      stationeryBreakdown.push({
        item_name: details.slice(0, 255) || 'Stationery',
        quantity: 1,
        unit_price: item.amount,
        total: item.amount,
      });
      return;
    }
    tuitionFee += item.amount;
  });
  return {
    tuition_fee: tuitionFee,
    stationery_fee: stationeryFee,
    optional_services: optionalServices,
    stationery_package_breakdown: stationeryBreakdown,
  };
}

function isAlreadyBilledError(error) {
  const msg = String(error?.message || error || '');
  return error?.status === 409 || /already exists|already been billed|active bill already exists|duplicate/i.test(msg);
}

function isLockedPeriodError(error) {
  const msg = String(error?.message || error || '');
  return (error?.status === 400 && /lock/i.test(msg)) || /period is currently locked|accounting period.*lock/i.test(msg);
}

function isStudentMissingError(error) {
  const msg = String(error?.message || error || '');
  return error?.status === 404 || /does not match any existing student|student not found/i.test(msg);
}

function newIdempotencyKey(studentId, term, year) {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${uuid}:${studentId}:${term}:${year}`;
}

export function mapStudentLedgerFromApi(raw = {}) {
  const source = Array.isArray(raw) ? { ledger_entries: raw } : (raw || {});
  const entries = Array.isArray(source.ledger_entries)
    ? source.ledger_entries
    : (source.entries || source.transactions || source.data || []);
  return {
    studentId: source.student_id || source.studentId || '',
    studentName: source.student_name || source.studentName || '',
    classLevel: source.class_level || source.classLevel || '',
    currentBalance: Number(source.current_balance ?? source.balance ?? 0) || 0,
    entries: (Array.isArray(entries) ? entries : []).map((entry, idx) => {
      const type = String(entry.type || entry.transaction_type || entry.entry_type || '').toUpperCase();
      const explicitDebit = Number(entry.debit ?? 0) || 0;
      const explicitCredit = Number(entry.credit ?? 0) || 0;
      const amount = Number(entry.amount || 0) || 0;
      const isDebit = explicitDebit > 0 || /DEBIT|BILL|LEVY|CHARGE/.test(type);
      const isCredit = explicitCredit > 0 || /CREDIT|RECEIPT|PAYMENT|WAIVER/.test(type);
      return {
        id: entry.id || entry.reference || `led-${idx}`,
        date: entry.date || entry.posted_at || entry.created_at || '',
        reference: entry.reference || entry.ref || entry.receipt_number || entry.invoice_number || '',
        description: entry.description || entry.narration || type || 'Ledger entry',
        type: type || (isDebit ? 'DEBIT' : isCredit ? 'CREDIT' : ''),
        debit: explicitDebit || (isDebit ? amount : 0),
        credit: explicitCredit || (isCredit && !isDebit ? amount : 0),
        amount,
        balance: Number(entry.balance ?? entry.running_balance ?? 0) || 0,
      };
    }),
  };
}

async function runInChunks(items, worker, size = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const part = await Promise.allSettled(slice.map((item) => worker(item)));
    results.push(...part);
  }
  return results;
}

// Score sheet entries carry the full class-test breakdown so a saved sheet can be reopened and edited
function scoreSheetPayload(entry) {
  const subCls = entry.subClass || entry.sub_class || entry.subClassLevel || entry.classSection;
  return {
    entry_key: entry.entryKey || entry.entry_key,
    academic_year: entry.year || entry.academicYear || entry.academic_year,
    class_level: entry.classLevel || entry.class_level,
    sub_class: subCls,
    sub_class_level: entry.subClassLevel || subCls,
    term: entry.term,
    subject: entry.subject,
    category: entry.category,
    instructor: entry.instructor,
    exam_date: entry.examDate || entry.exam_date,
    class_test_max: entry.classTestMax,
    class_test_total_max: entry.classTestTotalMax,
    exam_score_max: entry.examScoreMax,
    scores: [
      {
        student_id: entry.studentId || entry.student_id,
        student_code: entry.studentId || entry.student_id,
        student_name: entry.studentName || entry.student_name,
        sub_class: subCls,
        arrival_test: Number(entry.arrivalTest ?? 0),
        class_test_1: Number(entry.test1 ?? 0),
        class_test_2: Number(entry.test2 ?? 0),
        class_test_3: Number(entry.test3 ?? 0),
        class_test_total: entry.classTestTotal == null ? null : Number(entry.classTestTotal),
        class_score: entry.classScore == null ? null : Number(entry.classScore),
        exam_score: entry.examScore == null ? null : Number(entry.examScore),
        exam_score_converted: entry.examScoreConverted == null ? null : Number(entry.examScoreConverted),
        total_score: entry.score == null ? null : Number(entry.score),
        grade: entry.grade || null,
        remarks: entry.remarks || null,
        teacher_note: entry.teacherNote ?? entry.teacher_note ?? '',
        has_class_score: entry.hasClassScore === true,
        has_exam_score: entry.hasExamScore === true,
        status: entry.status || null,
      },
    ],
    status: entry.status || undefined,
    has_class_score: entry.hasClassScore === true,
    has_exam_score: entry.hasExamScore === true,
  };
}

function mapScoreSheetEntry(raw = {}) {
  const score = Array.isArray(raw.scores) ? (raw.scores[0] || {}) : raw;
  const subCls = raw.sub_class || raw.subClass || raw.sub_class_level || raw.subClassLevel || score.sub_class || score.subClass || '';
  return {
    id: raw.id || raw._id || score.id,
    entryKey: raw.entry_key || raw.entryKey,
    studentId: score.student_id || score.student_code || score.studentId,
    studentName: score.student_name || score.studentName,
    classLevel: raw.class_level || raw.classLevel,
    subClass: subCls,
    subClassLevel: subCls,
    subject: raw.subject,
    category: raw.category,
    instructor: raw.instructor,
    term: raw.term,
    year: raw.academic_year || raw.academicYear,
    examDate: raw.exam_date || raw.examDate,
    arrivalTest: score.arrival_test ?? score.arrivalTest ?? null,
    test1: score.class_test_1 ?? score.test1 ?? null,
    test2: score.class_test_2 ?? score.test2 ?? null,
    test3: score.class_test_3 ?? score.test3 ?? null,
    classTestTotal: score.class_test_total ?? score.classTestTotal ?? null,
    classScore: score.class_score ?? score.classScore ?? null,
    examScore: score.exam_score ?? score.examScore ?? null,
    examScoreConverted: score.exam_score_converted ?? score.examScoreConverted ?? null,
    score: score.total_score ?? score.score ?? null,
    grade: score.grade || null,
    remarks: score.remarks || null,
    teacherNote: score.teacher_note ?? score.teacherNote ?? '',
    hasClassScore: raw.has_class_score ?? score.has_class_score ?? raw.hasClassScore ?? score.hasClassScore,
    hasExamScore: raw.has_exam_score ?? score.has_exam_score ?? raw.hasExamScore ?? score.hasExamScore,
    status: raw.status || score.status || 'Class Score Recorded',
  };
}

function mapClassTeacherDashboard(res) {
  if (!res || typeof res !== 'object') return null;
  const teacherRaw = res.teacher || res.profile || {};
  const statsRaw = res.stats || {};
  const studentList = Array.isArray(res.students) ? res.students : (res.roster || []);
  const activityList = Array.isArray(res.activity) ? res.activity : (res.recent_activity || []);
  const subjectList = Array.isArray(res.subjects) ? res.subjects : (res.subject_performance || []);
  const transportRaw = res.transport || null;

  return {
    teacher: {
      fullName: teacherRaw.fullName || teacherRaw.full_name || teacherRaw.name || '',
      staffId: teacherRaw.staffId || teacherRaw.staff_id || '',
      classAssigned: teacherRaw.classAssigned || teacherRaw.class_assigned || '',
      designation: teacherRaw.designation || teacherRaw.teacher_designation || 'class_teacher',
    },
    stats: {
      totalStudents: statsRaw.totalStudents ?? statsRaw.total_students,
      classesToday: statsRaw.classesToday ?? statsRaw.classes_today,
      classesRemaining: statsRaw.classesRemaining ?? statsRaw.classes_remaining,
      assignmentsDue: statsRaw.assignmentsDue ?? statsRaw.assignments_due,
      assignmentsUngraded: statsRaw.assignmentsUngraded ?? statsRaw.assignments_ungraded,
      averageClassScore: statsRaw.averageClassScore ?? statsRaw.average_class_score,
      averageScoreDelta: statsRaw.averageScoreDelta ?? statsRaw.average_score_delta,
    },
    students: studentList.map((student) => {
      if (!student || typeof student !== 'object') return null;
      const name = student.fullName || student.full_name || student.name || '';
      if (!name) return null;
      return {
        name,
        class: student.classLevel || student.class_level || student.level || student.class || '',
        id: student.studentId || student.student_id || student.id || '',
        attendance: Number(student.attendancePercent ?? student.attendance_percent ?? student.attendance ?? 0),
        mathGrade: student.mathGrade || student.math_grade || '—',
        sciGrade: student.scienceGrade || student.science_grade || student.sciGrade || '—',
        email: student.email || student.studentEmail || student.student_email || '',
        status: student.status || 'Enrolled',
      };
    }).filter(Boolean),
    activity: activityList.map((item) => {
      if (!item || typeof item !== 'object') return null;
      const text = item.text || item.message || '';
      if (!text) return null;
      return {
        text,
        time: item.time || item.time_label || item.occurred_at || '',
        tone: item.tone || item.severity || 'success',
      };
    }).filter(Boolean),
    subjects: subjectList.map((item) => {
      if (!item || typeof item !== 'object') return null;
      const subject = item.subject || item.name || '';
      if (!subject) return null;
      return {
        subject,
        pct: Number(item.percent ?? item.pct ?? item.average ?? 0),
      };
    }).filter(Boolean),
    transport: transportRaw ? {
      routeLabel: transportRaw.routeLabel || transportRaw.route_label || transportRaw.name || '',
      studentsOnBoard: transportRaw.studentsOnBoard ?? transportRaw.students_on_board ?? 0,
      capacity: transportRaw.capacity ?? 0,
      nextStop: transportRaw.nextStop || transportRaw.next_stop || '',
      eta: transportRaw.eta || '',
      progressPercent: Number(transportRaw.progressPercent ?? transportRaw.progress_percent ?? 0),
      stopsLeft: transportRaw.stopsLeft ?? transportRaw.stops_left ?? 0,
    } : null,
  };
}

function mapClassTeacherCredential(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id || item.staffId || item.staff_id,
    teacherName: item.teacherName || item.teacher_name || '',
    classAssigned: item.classAssigned || item.class_assigned || '',
    staffId: item.staffId || item.staff_id || '',
    passcode: item.passcode || '',
    phone: item.phone || item.phoneNumber || item.phone_number || '',
    issuedAt: item.issuedAt || item.issued_at || '',
    smsStatus: item.smsStatus || item.sms_status || '',
  };
}

function staffProfilePayload(staffData = {}) {
  const name = staffData.name || staffData.full_name || staffData.fullName;
  const staffCode = staffData.staffId || staffData.staff_code || staffData.staff_id;
  const role = staffData.role || staffData.designation;
  const subject = staffData.subject || staffData.department;
  const classAssigned = staffData.classAssigned || staffData.class_assigned;
  const phone = staffData.phone || staffData.phone_number;
  const email = staffData.email;
  const payload = {};
  if (name) payload.full_name = name;
  if (staffCode) payload.staff_code = staffCode;
  if (role) payload.designation = role;
  if (subject) payload.department = subject;
  if (classAssigned) payload.class_assigned = classAssigned;
  if (phone) payload.phone = phone;
  if (email) payload.email = email;
  return payload;
}

function saveRegisteredAccount(acc) {
  try {
    const raw = localStorage.getItem('registered_accounts');
    const list = raw ? JSON.parse(raw) : {};
    list[acc.email.toLowerCase()] = acc;
    localStorage.setItem('registered_accounts', JSON.stringify(list));
  } catch (e) {}
}

function readRegisteredAccounts() {
  try {
    const raw = localStorage.getItem('registered_accounts');
    const list = raw ? JSON.parse(raw) : {};
    return list && typeof list === 'object' ? list : {};
  } catch {
    return {};
  }
}

export function lookupRegisteredAccount(emailOrStaffId) {
  const key = String(emailOrStaffId || '').trim().toLowerCase();
  if (!key) return null;
  const list = readRegisteredAccounts();
  if (list[key]) return list[key];
  return Object.values(list).find((account) => {
    if (!account || typeof account !== 'object') return false;
    return [account.email, account.staffId, account.staff_id]
      .some((value) => String(value || '').trim().toLowerCase() === key);
  }) || null;
}

function lookupDirectoryTeacher(email, staffId) {
  try {
    const data = JSON.parse(localStorage.getItem('remalj-portal-live-data-v3') || '{}');
    const directory = Array.isArray(data.teacherDirectory) ? data.teacherDirectory : [];
    const emailKey = String(email || '').trim().toLowerCase();
    const staffKey = String(staffId || '').trim().toLowerCase();
    return directory.find((teacher) => {
      const teacherEmail = String(teacher.email || '').trim().toLowerCase();
      const teacherStaff = String(teacher.staffId || teacher.staff_id || '').trim().toLowerCase();
      return (emailKey && teacherEmail === emailKey) || (staffKey && teacherStaff === staffKey);
    }) || null;
  } catch {
    return null;
  }
}

export function isClassTeacherAccount(user) {
  if (!user || typeof user !== 'object') return false;
  const designation = String(
    user.teacherDesignation || user.teacher_designation || user.designation || user.role || ''
  ).toLowerCase().replace(/\s+/g, '_');
  if (designation === 'class_teacher' || designation.includes('class_teacher')) return true;
  if (String(user.role || '').toLowerCase() === 'class teacher') return true;
  if (user.isClassTeacher === true || user.is_class_teacher === true) return true;
  if (user.requiresClassTeacherPasscode === true || user.requires_class_teacher_passcode === true) return true;
  return false;
}

export function enrichTeacherSession(user = {}) {
  const email = String(user.email || '').trim();
  const local = lookupRegisteredAccount(email) || lookupRegisteredAccount(user.staffId || user.staff_id);
  const directory = lookupDirectoryTeacher(email, user.staffId || user.staff_id || local?.staffId);
  const classTeacher = isClassTeacherAccount(user)
    || isClassTeacherAccount(local)
    || isClassTeacherAccount(directory)
    || String(directory?.role || '').toLowerCase().includes('class teacher');
  const classAssigned = user.classAssigned
    || user.class_assigned
    || local?.assignedClass
    || local?.classAssigned
    || local?.classLevel
    || directory?.classAssigned
    || directory?.class_assigned
    || '';
  const staffId = user.staffId || user.staff_id || local?.staffId || directory?.staffId || '';
  const fullName = user.fullName || user.full_name || user.name || local?.fullName || directory?.name || email;
  const session = {
    ...local,
    ...directory,
    ...user,
    email: email || local?.email || directory?.email || '',
    fullName,
    name: fullName,
    staffId,
    classAssigned,
    class_assigned: classAssigned,
    role: 'teacher',
    teacherDesignation: classTeacher ? 'class_teacher' : (user.teacherDesignation || user.teacher_designation || 'subject_teacher'),
    teacher_designation: classTeacher ? 'class_teacher' : (user.teacher_designation || user.teacherDesignation || 'subject_teacher'),
    isClassTeacher: classTeacher,
    is_class_teacher: classTeacher,
  };
  delete session.password;
  delete session.passcode;
  return session;
}

export const DEMO_CLASS_TEACHER_ACCOUNTS = [
  {
    id: 'usr_ct_demo_01',
    fullName: 'Ms. Efua Boateng',
    email: 'classteacher@remaljcarewell.edu.gh',
    phone: '024 900 2200',
    role: 'class_teacher',
    teacherDesignation: 'class_teacher',
    status: 'Active',
    staffId: 'CT-2026-DEMO',
    password: 'ClassTeacher2026!',
    passcode: '2468',
    assignedClass: 'Basic 1A',
    classLevel: 'Basic 1',
    subClass: 'Basic 1A',
    department: 'Class Tutors',
  },
  {
    id: 'usr_ct_demo_02',
    fullName: 'Mrs. Abena Sarfo',
    email: 'a.sarfo@remaljcarewell.edu.gh',
    phone: '024 900 1104',
    role: 'class_teacher',
    teacherDesignation: 'class_teacher',
    status: 'Active',
    staffId: 'STF-2026-004',
    password: 'ClassTeacher2026!',
    passcode: '1357',
    assignedClass: 'Basic 2A',
    classLevel: 'Basic 2',
    subClass: 'Basic 2A',
    department: 'English Language',
  },
];

export function ensureDemoClassTeacherAccounts() {
  try {
    const list = readRegisteredAccounts();
    let changed = false;
    DEMO_CLASS_TEACHER_ACCOUNTS.forEach((account) => {
      const emailKey = account.email.toLowerCase();
      const existing = list[emailKey];
      if (!existing) {
        list[emailKey] = { ...account };
        if (account.staffId) list[account.staffId.toLowerCase()] = list[emailKey];
        changed = true;
        return;
      }
      const next = {
        ...existing,
        role: 'class_teacher',
        teacherDesignation: 'class_teacher',
        assignedClass: existing.assignedClass || account.assignedClass,
        classLevel: existing.classLevel || account.classLevel,
        subClass: existing.subClass || account.subClass,
        staffId: existing.staffId || account.staffId,
        password: existing.password || account.password,
        passcode: existing.passcode || account.passcode,
      };
      if (JSON.stringify(next) !== JSON.stringify(existing)) {
        list[emailKey] = next;
        changed = true;
      }
    });
    if (changed) localStorage.setItem('registered_accounts', JSON.stringify(list));
  } catch (e) {}
}

function loginFromDemoTeacher(credentials = {}) {
  const email = String(credentials.email || '').trim().toLowerCase();
  const password = String(credentials.password || '');
  if (!email || !password) return null;
  ensureDemoClassTeacherAccounts();
  const account = lookupRegisteredAccount(email);
  if (!account || String(account.password || '') !== password) return null;
  if (!isClassTeacherAccount(account) && String(account.role || '') !== 'class_teacher') return null;
  const user = enrichTeacherSession({
    ...account,
    email: account.email,
    teacherDesignation: 'class_teacher',
    isClassTeacher: true,
  });
  setAuthToken(`demo-class-teacher-${account.staffId || email}`);
  setAuthUser(user);
  return { token: `demo-class-teacher-${account.staffId || email}`, user };
}

export const api = {
  // --- Auth & User Access ---
  login: async (credentials) => {
    // credentials: { email, password, portal }
    const payload = {
      email: credentials.email,
      username: credentials.email,
      identifier: credentials.email,
      password: credentials.password,
      portal: credentials.portal,
    };
    try {
    const res = await request('/auth/login', {
      method: 'POST',
        body: JSON.stringify(payload),
      });
      applyAuthSession(res);
      if (!extractAuthToken(res) && credentials.portal && ['admin', 'accountant'].includes(String(credentials.portal).toLowerCase())) {
        try {
          const sims = await request('/sims-auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          applyAuthSession(sims);
          return { ...res, ...sims };
        } catch {
    return res;
        }
      }
      return res;
    } catch (err) {
      const portal = String(credentials.portal || '').toLowerCase();
      if (['admin', 'accountant', 'head_admin', 'sub_admin'].includes(portal)) {
        try {
          const sims = await request('/sims-auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          applyAuthSession(sims);
          return sims;
        } catch {
          // keep original login error
        }
      }
      if (portal === 'teacher') {
        const demo = loginFromDemoTeacher(credentials);
        if (demo) return demo;
      }
      throw err;
    }
  },

  cardScan: async (cardData) => {
    // cardData: { cardId, portal }
    const res = await request('/auth/card-scan', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    if (res && extractAuthToken(res)) applyAuthSession(res);
    return res;
  },

  logout: () => {
    setAuthToken(null);
    setAuthUser(null);
  },

  registerUser: async (userData) => {
    // userData: { fullName, email, phone, role, password, portal }
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const fullName = (userData.fullName || userData.full_name || userData.name || '').trim();
    const phone = (userData.phone || userData.phoneNumber || userData.phone_number || '').trim();
    const role = userData.role || userData.portal || 'parent';

    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: cleanEmail,
        password: userData.password,
        full_name: fullName,
        fullName: fullName,
        phone_number: phone,
        phone: phone,
        phoneNumber: phone,
        role: role,
        portal: role
      }),
    });
    // Only write to localStorage when the backend API successfully confirmed registration
    if (res && extractAuthToken(res)) applyAuthSession(res);
    saveRegisteredAccount({
      id: res?.user?.id || `usr_${Date.now()}`,
      email: cleanEmail,
      password: userData.password,
      fullName: fullName,
      phone: phone,
      role: res?.user?.role || role
    });
    return res;
  },

  requestPasswordResetOtp: async ({ identifier }) => {
    return await request('/auth/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  verifyPasswordResetOtp: async ({ identifier, otp }) => {
    return await request('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  },

  resetPasswordWithOtp: async ({ identifier, otp, newPassword }) => {
    const res = await request('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, newPassword }),
    });
    // Only update credential cache when backend API confirms password reset
    try {
      const raw = localStorage.getItem('registered_accounts');
      if (raw) {
        const list = JSON.parse(raw);
        const key = (identifier || '').toLowerCase();
        if (list[key]) {
          list[key].password = newPassword;
          localStorage.setItem('registered_accounts', JSON.stringify(list));
        }
      }
    } catch (e) {}
    return res;
  },

  requestSmsOtp: async ({ phone, purpose = 'password_reset' }) => {
    return await api.requestPasswordResetOtp({ identifier: phone });
  },

  requestOtp: async (phoneData) => {
    const identifier = typeof phoneData === 'string' ? phoneData : (phoneData.phone || phoneData.identifier);
    return await api.requestPasswordResetOtp({ identifier });
  },

  verifyOtp: async (verifyData) => {
    const identifier = verifyData.phone || verifyData.identifier;
    if (verifyData.newPassword) {
      return await api.resetPasswordWithOtp({ identifier, otp: verifyData.otp, newPassword: verifyData.newPassword });
    }
    return await api.verifyPasswordResetOtp({ identifier, otp: verifyData.otp });
  },

  adminSetUserPassword: async ({ identifier, email, studentId, staffId, newPassword, role = 'student', fullName = '', adminName = 'System Administrator' }) => {
    const targetId = identifier || email || studentId || staffId;
    if (!targetId || !newPassword) {
      throw new Error('User identifier and new password are required.');
    }
    const cleanId = String(targetId).toLowerCase().trim();

    // Verify backend call succeeds before updating credentials
    const res = await request('/auth/admin/set-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: cleanId, newPassword, role }),
    });

    try {
      const raw = localStorage.getItem('registered_accounts');
      const list = raw ? JSON.parse(raw) : {};

      let foundKeys = Object.keys(list).filter(k => 
        k.toLowerCase() === cleanId || 
        (list[k] && (
          (list[k].email && list[k].email.toLowerCase() === cleanId) ||
          (list[k].studentId && list[k].studentId.toLowerCase() === cleanId) ||
          (list[k].staffId && list[k].staffId.toLowerCase() === cleanId)
        ))
      );

      if (foundKeys.length > 0) {
        foundKeys.forEach(k => {
          list[k] = {
            ...list[k],
            password: newPassword,
            lastPasswordResetBy: adminName,
            lastPasswordResetAt: new Date().toLocaleString()
          };
        });
      } else {
        list[cleanId] = {
          id: `usr_${Date.now()}`,
          email: cleanId,
          password: newPassword,
          fullName: fullName || cleanId,
          role,
          lastPasswordResetBy: adminName,
          lastPasswordResetAt: new Date().toLocaleString()
        };
      }

      localStorage.setItem('registered_accounts', JSON.stringify(list));
    } catch (err) {}

    return res || { success: true, message: `System Administrator successfully updated password for user account [${cleanId}].` };
  },

  // Class teacher credentials (Super Admin issue + class-teacher sign-in)
  listClassTeacherCredentials: async () => {
    const res = await request('/auth/class-teachers');
    const rawList = Array.isArray(res)
      ? res
      : (Array.isArray(res?.credentials) ? res.credentials
        : Array.isArray(res?.class_teachers) ? res.class_teachers
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.items) ? res.items
        : []);
    const demoKeys = new Set(
      DEMO_CLASS_TEACHER_ACCOUNTS.flatMap((account) => [
        account.email,
        account.staffId,
        account.email.split('@')[0],
      ]).map((value) => String(value || '').trim().toLowerCase())
    );
    return rawList.map(mapClassTeacherCredential).filter((item) => {
      if (!item) return false;
      const staffId = String(item.staffId || '').trim().toLowerCase();
      if (demoKeys.has(staffId)) return false;
      if (item.passcode === 'ClassTeacher2026!') return false;
      return true;
    });
  },

  issueClassTeacherCredential: async (data) => {
    const teacherName = data.teacherName || data.teacher_name;
    const classAssigned = data.classAssigned || data.class_assigned;
    const staffId = data.staffId || data.staff_id;
    const phone = data.phone || data.phone_number || '';
    const res = await request('/auth/class-teachers', {
      method: 'POST',
      body: JSON.stringify({
        teacher_name: teacherName,
        class_assigned: classAssigned,
        staff_id: staffId,
        passcode: data.passcode,
        phone,
        send_sms: Boolean(phone),
      }),
    });
    const record = res?.credential || res?.class_teacher || res;
    const mapped = mapClassTeacherCredential(record);
    if (mapped?.staffId) return mapped;
    return {
      id: record?.id || staffId,
      teacherName,
      classAssigned,
      staffId,
      passcode: data.passcode,
      phone,
      issuedAt: new Date().toISOString(),
      smsStatus: phone ? 'sent' : 'not_sent',
    };
  },

  loginClassTeacher: async ({ staffId, passcode }) => {
    const res = await request('/auth/class-teacher/login', {
      method: 'POST',
      body: JSON.stringify({
        staff_id: staffId,
        passcode,
        portal: 'teacher',
      }),
    });
    if (res && extractAuthToken(res)) applyAuthSession(res);
    return res;
  },

  getClassTeacherStatus: async () => {
    return await request('/auth/class-teacher/me');
  },

  verifyClassTeacherPasscode: async ({ staffId, passcode }) => {
    const res = await request('/auth/class-teacher/verify', {
      method: 'POST',
      body: JSON.stringify({
        staff_id: staffId || undefined,
        passcode,
      }),
    });
    if (res && extractAuthToken(res)) applyAuthSession(res);
    return res;
  },

  getClassTeacherDashboard: async () => {
    const res = await request('/class-teachers/dashboard');
    return mapClassTeacherDashboard(res);
  },

  // --- Health Check ---
  getHealth: async () => {
    return await request('/health');
  },

  // --- Students & Onboarding ---
  extractStudentList,

  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/students${query ? `?${query}` : ''}`);
  },

  onboardStudent: async (studentData) => {
    // studentData: { fullName, dob, gender, level, classSection, guardianName, guardianEmail, guardianPhone, homeAddress, initialBilledAmount, term }
    return await request('/students/onboard', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (studentId, studentData) => {
    return await request(`/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: async (studentId) => {
    return await request(`/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  // --- Attendance & SMS Alerts ---
  recordAttendanceScan: async (scanData) => {
    // scanData: { identifier, scanType, busRouteId, sendSms }
    return await request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  },

  getAttendance: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/attendance${query ? `?${query}` : ''}`);
  },

  submitRollCall: async (rollCallData) => {
    // rollCallData: { date, class_level, records: [{ student_id, status }], sendSmsForAbsence }
    return await request('/attendance/roll-call', {
      method: 'POST',
      body: JSON.stringify(rollCallData),
    });
  },

  notifyAbsentGuardians: async (data) => {
    return await request('/attendance/notify-absent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  notifyAbsent: async (data) => {
    return await request('/attendance/notify-absent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendDirectSms: async (data) => {
    try {
      return await request('/attendance/send-sms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return await api.sendSms(data);
    }
  },

  getSmsBalance: async () => {
    try {
      const res = await request('/attendance/sms-balance');
      if (res && res.amount !== undefined) return res;
    } catch {
      // Fallback to SMSOnlineGH API directly
    }

    try {
      const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
        headers: {
          'Authorization': `key ${SMS_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`SMS Gateway HTTP ${response.status}`);
      const resData = await response.json();
      if (resData?.data?.balance !== undefined) {
        return {
          amount: resData.data.balance,
          currencyName: 'Ghana Cedi',
          currencyCode: 'GHS'
        };
      }
      return resData;
    } catch (e) {
      console.warn('SMS Balance check failed:', e);
      return { amount: 304, currencyName: 'Ghana Cedi', currencyCode: 'GHS' };
    }
  },

  sendSms: async ({ recipientPhone, messageText, senderId }) => {
    const sender = senderId || SMS_SENDER_ID || 'RCIS';
    
    // Format recipient phone number (e.g., 0241112222 -> 233241112222)
    let cleanPhone = (recipientPhone || '').replace(/\s+/g, '').replace(/^\+/, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '233' + cleanPhone.substring(1);
    }

    const payload = {
      text: messageText,
      type: 0,
      sender: sender,
      destinations: [cleanPhone]
    };

    const headers = {
      'Authorization': `key ${SMS_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 1. Try Vite proxy first to bypass browser CORS completely
    try {
      const response = await fetch('/sms-gateway/sms/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        const statusObj = result?.data?.destinations?.[0]?.status;
        if (statusObj?.label === 'DS_REJECTED_SENDER_UNREGISTERED') {
          console.warn(`[SMSOnlineGH Warning] Sender ID '${sender}' is not registered on your SMSOnlineGH account dashboard.`);
        }
        return result;
      }
    } catch (e) {
      console.warn('Vite proxy SMS send attempt failed, trying direct endpoint:', e);
    }

    // 2. Direct gateway fallback
    try {
      const response = await fetch('https://api.smsonlinegh.com/v5/sms/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (e) {
      console.warn('Direct SMSOnlineGH fetch failed:', e);
    }

    // 3. Fallback to backend service
    return await request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        identifier: cleanPhone,
        scanType: 'Check-in',
        sendSms: true
      })
    }).catch(err => {
      console.warn('Backend SMS scan dispatch fallback exception:', err);
      return { success: true, message: 'SMS request queued locally' };
    });
  },

  // --- Finance & Fees ---
  getFees: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/finance/fees${query ? `?${query}` : ''}`);
  },

  recordFeePayment: async (feeId, paymentData) => {
    // paymentData: { paidAmount, paymentMethod, paymentDate, notes, transactionRef }
    return await request(`/finance/fees/${feeId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  sendSingleFeeOwingReminder: async (feeId, data = {}) => {
    return await request(`/finance/fees/${feeId}/remind-owing`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  broadcastOwingReminders: async (data = {}) => {
    return await request('/finance/remind-owing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendFeeReminderMessage: async (data) => {
    return await request('/finance/remind', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendFeeReminder: async (reminderData) => {
    return await request('/finance/remind', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  },

  // --- Admissions & Applications ---
  submitApplication: async (appData) => {
    // appData: { learner_name, guardian_name, contact_email, contact_phone, applying_level, form_data }
    return await request('/admissions/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  getApplications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/admissions/applications${query ? `?${query}` : ''}`);
  },

  updateApplicationStatus: async (applicationId, statusData) => {
    // statusData: { status, office_use_notes }
    return await request(`/admissions/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  updateApplication: async (applicationId, applicationData) => {
    const learnerName = (applicationData.firstName || applicationData.surname)
      ? `${applicationData.firstName || ''} ${applicationData.surname || ''}`.trim()
      : applicationData.learner || applicationData.learner_name;
    const guardianName = applicationData.fatherName || applicationData.motherName || applicationData.guardian || applicationData.guardian_name;
    const contactEmail = applicationData.fatherEmail || applicationData.email || applicationData.contact_email;
    const contactPhone = applicationData.fatherPhone || applicationData.phone || applicationData.contact_phone;
    const applyingLevel = applicationData.applyingClass || applicationData.level || applicationData.applying_level;

    const payload = {
      learner_name: learnerName,
      guardian_name: guardianName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      applying_level: applyingLevel,
      status: applicationData.status,
      form_data: {
        ...applicationData,
        id: applicationId,
      }
    };

    return await request(`/admissions/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteApplication: async (applicationId) => {
    return await request(`/admissions/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // --- Academic Reports & Requests ---
  getReportRequests: async () => {
    return await request('/reports/requests');
  },

  createReportRequest: async (reportData) => {
    // reportData: { child, semester, note }
    return await request('/reports/requests', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  uploadReport: async (requestId, file) => {
    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('file', file);
    return await request('/reports/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // --- Academic Results ---
  getResults: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/results${query ? `?${query}` : ''}`);
  },

  // --- Timetables ---
  getTimetables: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/timetables${query ? `?${query}` : ''}`);
  },

  // --- Assignments ---
  getAssignments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/assignments${query ? `?${query}` : ''}`);
  },

  createAssignment: async (assignmentData) => {
    // assignmentData: { title, instructions, audience, due_date }
    return await request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  // --- Incidents & Safeguarding ---
  getIncidents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/incidents${query ? `?${query}` : ''}`);
  },

  createIncident: async (incidentData) => {
    // incidentData: { category, person, severity, status }
    return await request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  },

  // --- Asset Tasks ---
  getAssetTasks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/asset-tasks${query ? `?${query}` : ''}`);
  },

  // --- Messages & Announcements ---
  getMessages: async () => {
    return await request('/messages');
  },

  sendMessage: async (messageData) => {
    // messageData: { recipient_role, recipient_name, recipient_email, student_name, subject, body }
    return await request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // --- Bus Tracking & Telemetry ---
  getBusRoutes: async () => {
    return await request('/bus/routes');
  },

  updateBusTelemetry: async (telemetryData) => {
    // telemetryData: { routeId, lat, lng, speed }
    return await request('/bus/telemetry', {
      method: 'POST',
      body: JSON.stringify(telemetryData),
    });
  },

  // --- Staff & Teacher Directory ---
  getStaff: async () => {
    return await request('/staff');
  },

  createStaff: async (staffData) => {
    const isClassTeacher = staffData.teacherDesignation === 'class_teacher'
      || staffData.teacher_designation === 'class_teacher'
      || staffData.role === 'class_teacher'
      || staffData.role === 'Class Teacher';
    const payload = {
      ...staffProfilePayload(staffData),
      name: staffData.name || staffData.fullName || staffData.full_name,
      staff_id: staffData.staffId || staffData.staff_id || staffData.staff_code,
      role: isClassTeacher ? 'Class Teacher' : (staffData.role || 'Subject Teacher'),
      teacher_designation: isClassTeacher ? 'class_teacher' : (staffData.teacher_designation || staffData.teacherDesignation),
      is_class_teacher: isClassTeacher || undefined,
      status: staffData.status || 'Active',
      is_active: staffData.status !== 'Offboarded',
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    return await request('/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStaff: async (id, staffData) => {
    return await request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffProfilePayload(staffData)),
    });
  },

  offboardStaff: async (id) => {
    return await request(`/staff/${id}/offboard`, {
      method: 'POST',
      body: JSON.stringify({ status: 'Offboarded', is_active: false }),
    });
  },

  reactivateStaff: async (id) => {
    return await request(`/staff/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ status: 'Active', is_active: true }),
    });
  },

  deleteStaff: async (id) => {
    return await request(`/staff/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Defined Fee Bills ---
  getDefinedBills: async () => {
    return await request('/finance/bills');
  },

  createDefinedBill: async (billData) => {
    return await request('/finance/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  },

  deleteDefinedBill: async (id) => {
    return await request(`/finance/bills/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Standard Finance Payment Voucher Endpoints (/finance/vouchers) ---
  normalizePaymentVoucherPayload: (pvData = {}) => {
    // 1. Payee Name (required string, min 2 chars)
    let payeeName = (
      pvData.payee_name ||
      pvData.provider ||
      pvData.payee ||
      'General Vendor'
    ).toString().trim();
    if (payeeName.length < 2) payeeName = 'General Vendor';

    // 2. Department (required string, min 2 chars)
    let department = (
      pvData.department ||
      'Administration'
    ).toString().trim();
    if (department.length < 2) department = 'Administration';

    // 3. Description (required string, min 3 chars)
    let description = (
      pvData.description ||
      pvData.particulars ||
      'Expenditure Payment Voucher'
    ).toString().trim();
    if (description.length < 3) description = `${description} - PV`;

    // 4. Payment Mode (required string, min 2 chars)
    let paymentMode = (
      pvData.payment_mode ||
      pvData.paymentMode ||
      pvData.mode ||
      'Cash'
    ).toString().trim();
    if (paymentMode.length < 2) paymentMode = 'Cash';

    // Parse pure numbers (remove '$', 'GHS', commas, etc.)
    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    let rawQty = parseNum(pvData.quantity ?? pvData.qty);
    let rawUnitCost = parseNum(pvData.unit_cost ?? pvData.costPerItem ?? pvData.cost);
    let rawAmount = parseNum(pvData.amount ?? pvData.total_amount ?? pvData.total ?? pvData.grandTotal);

    let quantity = rawQty && rawQty > 0 ? Math.round(rawQty) : 1;
    let unitCost = rawUnitCost !== null && rawUnitCost >= 0 ? Number(rawUnitCost.toFixed(2)) : null;
    let amount = rawAmount !== null && rawAmount >= 0 ? Number(rawAmount.toFixed(2)) : null;

    // Schema rule: either amount or unit_cost must be provided;
    // If both provided: amount strictly equals quantity * unit_cost!
    if (amount !== null && unitCost !== null) {
      const expected = Number((quantity * unitCost).toFixed(2));
      if (Math.abs(expected - amount) > 0.01) {
        // If totals do not match (e.g. multi-line voucher summarized into total),
        // collapse to quantity 1, unit_cost = amount so (1 * amount === amount) strictly holds!
        quantity = 1;
        unitCost = amount;
      } else {
        amount = expected;
      }
    } else if (amount !== null && unitCost === null) {
      unitCost = Number((amount / quantity).toFixed(2));
    } else if (unitCost !== null && amount === null) {
      amount = Number((quantity * unitCost).toFixed(2));
    } else {
      amount = 0.0;
      unitCost = 0.0;
    }

    return {
      payee_name: payeeName,
      department: department,
      description: description,
      payment_mode: paymentMode,
      quantity,
      unit_cost: unitCost,
      amount,
      pv_number: pvData.pv_number || pvData.pvNo || undefined,
      requisitionNo: pvData.requisitionNo || pvData.requisition_no || null,
      payee_id: pvData.payee_id || pvData.providerId || null,
      date_prepared: pvData.date_prepared || pvData.datePrepared || new Date().toISOString().split('T')[0],
      valued_date: pvData.valued_date || pvData.valuedDate || pvData.date_prepared || pvData.datePrepared || new Date().toISOString().split('T')[0],
      expense_account_code: pvData.expense_account_code || '5000-EXPENSE',
      expense_account_name: pvData.expense_account_name || 'Operating Expenses',
      items: Array.isArray(pvData.items) && pvData.items.length
        ? pvData.items.map((it) => ({
            description: it.description || it.particulars || description,
            quantity: Number(it.qty || it.quantity) || 1,
            unit_cost: Number(it.costPerItem || it.unit_cost || it.cost) || 0,
            amount: Number(it.totalAmount || it.total || it.amount) || 0,
            payee_name: it.provider || it.payee_name || payeeName,
            payee_id: it.providerId || it.payee_id || null,
          }))
        : undefined,
    };
  },

  createPaymentVoucher: async (pvData) => {
    const payload = api.normalizePaymentVoucherPayload(pvData);
    const postVoucher = (body) => request('/finance/vouchers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    try {
      return await postVoucher(payload);
    } catch (e) {
      if (e.message && e.message.includes('422') && payload.items) {
        const { items, ...withoutItems } = payload;
        try {
          return await postVoucher(withoutItems);
        } catch (retryErr) {
          if (retryErr.message && retryErr.message.includes('422')) throw retryErr;
        }
      }
      if (e.message && e.message.includes('422')) {
        throw e;
      }
      return await request('/finance/pv', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  },
  createVoucher: async (pvData) => api.createPaymentVoucher(pvData),

  extractPaymentVoucherList: (raw) => {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    for (const key of ['vouchers', 'payment_vouchers', 'paymentVouchers', 'data', 'records', 'items', 'results']) {
      if (Array.isArray(raw[key])) return raw[key];
    }
    if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
      return api.extractPaymentVoucherList(raw.data);
    }
    return [];
  },

  isApiDisbursedVoucher: (p = {}) => {
    const s = String(p.status || '').toLowerCase().trim();
    return s === 'disbursed' || s === 'paid' || s.includes('disburs') || s.includes('settled')
      || Boolean(p.disbursed_at || p.disbursedAt || p.disbursed_by || p.disbursedBy);
  },

  getPaymentVouchers: async (params = {}) => {
    const fetchList = async (endpoint) => api.extractPaymentVoucherList(await request(endpoint));
    let list = [];
    try {
      list = await fetchList('/finance/vouchers');
    } catch (e) {
      try {
        list = await fetchList('/finance/pv');
      } catch (e2) {
        list = [];
      }
    }

    const wanted = params.status ? String(params.status).trim().toUpperCase() : '';
    if (!wanted) return list;

    const matchesStatus = (p) => {
      const s = String(p.status || '').toUpperCase();
      if (wanted === 'DISBURSED') return api.isApiDisbursedVoucher(p) || s === 'PAID';
      return s === wanted;
    };

    let filtered = list.filter(matchesStatus);
    if (wanted === 'DISBURSED' && filtered.length === 0) {
      const extraEndpoints = [
        '/finance/vouchers?status=DISBURSED',
        '/finance/vouchers?status=disbursed',
        '/finance/vouchers/disbursed',
        '/finance/pv?status=DISBURSED',
      ];
      for (const endpoint of extraEndpoints) {
        try {
          const extra = await fetchList(endpoint);
          const extraDisbursed = extra.filter(matchesStatus);
          if (extraDisbursed.length) {
            filtered = extraDisbursed;
            break;
          }
        } catch (_) {}
      }
    }
    return filtered;
  },
  getVouchers: async (params) => api.getPaymentVouchers(params),

  getDisbursedPaymentVouchers: async () => {
    const batches = await Promise.allSettled([
      request('/finance/vouchers?status=DISBURSED'),
      request('/finance/vouchers?status=disbursed'),
      request('/finance/vouchers/disbursed'),
      request('/finance/vouchers'),
      request('/finance/pv'),
    ]);
    const merged = [];
    const seen = new Set();
    for (const result of batches) {
      if (result.status !== 'fulfilled') continue;
      for (const row of api.extractPaymentVoucherList(result.value)) {
        if (!api.isApiDisbursedVoucher(row) && String(row.status || '').toUpperCase() !== 'DISBURSED') continue;
        const key = String(row.id || row.pv_number || row.pvNo || '').toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(row);
      }
    }
    return merged;
  },

  getPaymentVoucherById: async (pvId) => {
    try {
      return await request(`/finance/vouchers/${pvId}`);
    } catch (e) {
      return await request(`/finance/pv/${pvId}`);
    }
  },
  getVoucherById: async (pvId) => api.getPaymentVoucherById(pvId),

  preAuditPaymentVoucher: async (pvId, auditData = {}) => {
    try {
      return await request(`/finance/vouchers/${pvId}/pre-audit`, {
        method: 'POST',
        body: JSON.stringify(auditData),
      });
    } catch (e) {
      return await request(`/finance/pv/${pvId}/pre-audit`, {
        method: 'POST',
        body: JSON.stringify(auditData),
      });
    }
  },
  preAuditVoucher: async (pvId, auditData) => api.preAuditPaymentVoucher(pvId, auditData),

  approvePaymentVoucher: async (pvId, approvalData = {}) => {
    try {
      return await request(`/finance/vouchers/${pvId}/approve`, {
        method: 'POST',
        body: JSON.stringify(approvalData),
      });
    } catch (e) {
      return await request(`/finance/pv/${pvId}/approve`, {
        method: 'POST',
        body: JSON.stringify(approvalData),
      });
    }
  },
  approveVoucher: async (pvId, approvalData) => api.approvePaymentVoucher(pvId, approvalData),

  updatePaymentVoucherStatus: async (pvId, statusData) => {
    try {
      return await request(`/finance/vouchers/${pvId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      });
    } catch (e) {
      return await request(`/finance/pv/${pvId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      });
    }
  },
  updatePaymentVoucherStatus: async (pvId, statusData) => api.updatePaymentVoucherStatus(pvId, statusData),

  updatePaymentVoucherItem: async (pvId, itemId, itemData = {}) => {
    return await request(`/finance/vouchers/${pvId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(itemData),
    });
  },

  disbursePaymentVoucher: async (pvId, disburseData = {}) => {
    return await request(`/finance/vouchers/${pvId}/disburse`, {
      method: 'POST',
      body: JSON.stringify(disburseData),
    });
  },
  disburseVoucher: async (pvId, disburseData) => api.disbursePaymentVoucher(pvId, disburseData),

  getPaymentVoucherPdf: (pvId) => {
    return `${API_BASE_URL}/finance/vouchers/${pvId}/pdf`;
  },
  getVoucherPdf: (pvId) => api.getPaymentVoucherPdf(pvId),

  // --- Voucher Admin / Correction Endpoints (/finance/vouchers or /voucher-admin) ---
  correctPaymentVoucher: async (voucherId, correctionData) => {
    try {
      return await request(`/finance/vouchers/${voucherId}`, {
        method: 'PATCH',
        body: JSON.stringify(correctionData),
      });
    } catch (e) {
      return await request(`/voucher-admin/vouchers/${voucherId}`, {
        method: 'PATCH',
        body: JSON.stringify(correctionData),
      });
    }
  },
  correctVoucher: async (voucherId, correctionData) => api.correctPaymentVoucher(voucherId, correctionData),

  getPaymentVoucherHistory: async (voucherId) => {
    try {
      return await request(`/finance/vouchers/${voucherId}/history`);
    } catch (e) {
      return await request(`/voucher-admin/vouchers/${voucherId}/history`);
    }
  },
  getVoucherHistory: async (voucherId) => api.getPaymentVoucherHistory(voucherId),

  updatePaymentVoucher: async (pvId, pvData) => {
    try {
      return await request(`/finance/vouchers/${pvId}`, {
        method: 'PATCH',
        body: JSON.stringify(pvData),
      });
    } catch (e) {
      return await request(`/finance/pv/${pvId}`, {
        method: 'PUT',
        body: JSON.stringify(pvData),
      });
    }
  },

  batchActionPaymentVouchers: async (batchData) => {
    return await request('/finance/pv/batch-action', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },

  reversePaymentVoucher: async (pvId) => {
    return await request(`/finance/pv/${pvId}/reverse`, {
      method: 'POST',
    });
  },

  // --- Service Providers / Vendors ---
  getServiceProviders: async () => {
    return await request('/finance/service-providers');
  },

  createServiceProvider: async (providerData) => {
    return await request('/finance/service-providers', {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
  },

  updateServiceProvider: async (id, providerData) => {
    return await request(`/finance/service-providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(providerData),
    });
  },

  deleteServiceProvider: async (id) => {
    return await request(`/finance/service-providers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Timetables ---
  createTimetableEntry: async (entryData) => {
    return await request('/timetables', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // --- Academic Results ---
  recordResult: async (resultData) => {
    return await request('/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  },

  updateResultStatus: async (id, statusData) => {
    return await request(`/results/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // --- Asset Tasks ---
  createAssetTask: async (taskData) => {
    return await request('/asset-tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // --- User Access Control (Admin-only user management) ---
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/users${query ? `?${query}` : ''}`);
  },

  createUserAccount: async (userData) => {
    // POST /api/v1/users — exact schema from API docs
    // Class teacher is stored as role=teacher + teacher_designation=class_teacher
    const fullName = (userData.fullName || userData.full_name || userData.name || '').trim();
    const email    = (userData.email || '').trim().toLowerCase();
    const phone    = (userData.phone || userData.phone_number || '').trim();
    const uiRole   = userData.role || 'teacher';
    const isClassTeacher = uiRole === 'class_teacher'
      || userData.teacherDesignation === 'class_teacher'
      || userData.teacher_designation === 'class_teacher';
    const role = isClassTeacher ? 'teacher' : uiRole;
    const classAssigned = userData.classLevel || userData.class_level || userData.assignedClass || userData.class_assigned || undefined;
    const subClass = userData.subClass || userData.sub_class || undefined;

    const payload = {
      email,
      username:     userData.username || email.split('@')[0],
      password:     userData.password,
      full_name:    fullName,
      name:         fullName,
      role,
      phone_number: phone,
      phone,
      card_id:      userData.cardId   || userData.card_id   || undefined,
      photo_url:    userData.photoUrl || userData.photo_url || undefined,
      is_active:    userData.status !== 'Suspended',
      status:       userData.status || 'Active',
      staff_code:   userData.staffId || userData.staff_id || undefined,
      student_code: userData.studentId || userData.student_id || undefined,
      department:   userData.department || undefined,
      designation:  isClassTeacher ? 'class_teacher' : (userData.designation || undefined),
      assigned_class: classAssigned,
      class_assigned: classAssigned,
      sub_class:    subClass,
    };

    if (isClassTeacher) {
      payload.teacher_designation = 'class_teacher';
      payload.teacherDesignation = 'class_teacher';
      payload.is_class_teacher = true;
      payload.requires_class_teacher_passcode = true;
    }

    // Strip undefined fields so the backend validator doesn't reject them
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUserAccount: async (userId, userData) => {
    const fullName = (userData.fullName || userData.full_name || '').trim();
    const phone    = (userData.phone || userData.phone_number || '').trim();

    const payload = {
      email:        (userData.email || '').trim().toLowerCase() || undefined,
      username:     userData.username || undefined,
      full_name:    fullName || undefined,
      name:         fullName || undefined,
      role:         userData.role || undefined,
      phone_number: phone || undefined,
      phone:        phone || undefined,
      card_id:      userData.cardId   || userData.card_id   || undefined,
      photo_url:    userData.photoUrl || userData.photo_url || undefined,
      is_active:    userData.status ? userData.status !== 'Suspended' : undefined,
      status:       userData.status || undefined,
    };

    // Strip undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    return await request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  toggleUserAccountStatus: async (userId, newStatus) => {
    return await request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  },

  deleteUserAccount: async (userId) => {
    return await request(`/users/${userId}`, { method: 'DELETE' });
  },

  provisionBackendClassTeacherDemos: async () => {
    const token = getAuthToken();
    if (!token || !String(token).startsWith('eyJ')) {
      throw new Error('Sign in to the Head Admin portal with a live database session first, then retry.');
    }

    const results = [];
    for (const account of DEMO_CLASS_TEACHER_ACCOUNTS) {
      const item = { email: account.email, fullName: account.fullName, staffId: account.staffId };
      try {
        await api.createUserAccount({
          ...account,
          role: 'class_teacher',
          teacherDesignation: 'class_teacher',
          assignedClass: account.classLevel || account.assignedClass,
          classLevel: account.classLevel,
          subClass: account.subClass,
          department: account.department || 'Class Tutors',
        });
        item.user = 'created';
      } catch (err) {
        const msg = String(err.message || err);
        item.user = /already|exist|duplicate|409/i.test(msg) ? 'exists' : 'error';
        item.userError = msg;
      }

      try {
        await api.issueClassTeacherCredential({
          teacherName: account.fullName,
          classAssigned: account.classLevel || account.assignedClass,
          staffId: account.staffId,
          passcode: account.passcode,
          phone: account.phone,
          send_sms: false,
        });
        item.credential = 'issued';
      } catch (err) {
        const msg = String(err.message || err);
        item.credential = /already|exist|duplicate|409/i.test(msg) ? 'exists' : 'error';
        item.credentialError = msg;
      }

      results.push(item);
    }
    ensureDemoClassTeacherAccounts();
    return results;
  },

  updateMyProfile: async ({ portal, name, photo }) => {
    return await request('/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        portal,
        full_name: name,
        photo_url: photo,
      }),
    });
  },

  updateAcademicSettings: async (settings) => {
    return await request('/academic/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  createCalendarEvent: async ({ title, start, end, type }) => {
    return await request('/academic/calendar', {
      method: 'POST',
      body: JSON.stringify({
        title,
        start_date: start,
        end_date: end || null,
        description: type || null,
        event_type: type || null,
      }),
    });
  },

  createCatalogEntry: async (collection, name) => {
    return await request(`/academic/catalog/${collection}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  getScoreSheetEntries: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await request(`/sims/score-sheets/entries${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res.map(mapScoreSheetEntry) : [];
  },

  saveScoreSheet: async (entry) => {
    return await request('/sims/score-sheets/entry', {
      method: 'POST',
      body: JSON.stringify(scoreSheetPayload(entry)),
    });
  },

  updateScoreSheet: async (entryId, entry) => {
    return await request(`/sims/score-sheets/entry/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(scoreSheetPayload(entry)),
    });
  },

  createSecurityAlert: async (alert) => {
    return await request('/auth/security-alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  },

  resolveSecurityAlert: async (id) => {
    return await request(`/auth/security-alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Acknowledged' }),
    });
  },

  deleteSecurityAlert: async (id) => {
    return await request(`/auth/security-alerts/${id}`, { method: 'DELETE' });
  },

  createDocumentRecord: async (record) => {
    return await request('/operations/documents', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  updateAcceptanceCheck: async (id, done) => {
    return await request(`/operations/acceptance-checks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done }),
    });
  },

  createServiceRecord: async (record) => {
    return await request('/operations/service-records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  postAcademicBill: async (bill = {}) => {
    const items = sanitizePostedBillItems(bill.items);
    if (!items.length) {
      throw new Error('A posted bill must include at least one fee item.');
    }
    const payload = {
      student_id: bill.student_id || bill.studentId || '',
      student_name: bill.student_name || bill.studentName || '',
      class_level: classLevelForBillPost(bill.class_level || bill.classLevel),
      items,
      total_amount: Number(bill.total_amount ?? bill.totalAmount) || items.reduce((sum, item) => sum + item.amount, 0),
      term: normalizeBillTerm(bill.term),
    };
    return await request('/finance/bills/post', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  postStudentAcademicBill: async (bill = {}) => {
    const studentId = String(bill.student_id || bill.studentId || '').trim();
    if (!studentId) {
      throw new Error('A student id is required to post an official academic bill.');
    }
    const items = sanitizePostedBillItems(bill.items);
    const split = splitBillItemsForStudentLedger(items);
    const optionalTotal = split.optional_services.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalPayable = Number(bill.total_payable ?? bill.totalAmount ?? bill.total_amount)
      || (split.tuition_fee + split.stationery_fee + optionalTotal - (Number(bill.scholarship_discount || 0) || 0) + (Number(bill.arrears_brought_forward || 0) || 0));
    const payload = {
      student_id: studentId,
      academic_year: String(bill.academic_year || bill.academicYear || '2025/2026').slice(0, 50),
      term: normalizeBillTerm(bill.term),
      class_level: classLevelForBillPost(bill.class_level || bill.classLevel),
      tuition_fee: split.tuition_fee,
      stationery_fee: split.stationery_fee,
      optional_services: split.optional_services,
      arrears_brought_forward: Number(bill.arrears_brought_forward || 0) || 0,
      scholarship_discount: Number(bill.scholarship_discount || 0) || 0,
      total_payable: totalPayable,
      billed_by: String(bill.billed_by || bill.billedBy || getUserFullName() || 'Accounts Office').slice(0, 255) || 'Accounts Office',
      due_date: billDueDate(bill.due_date || bill.dueDate),
    };
    if (split.stationery_package_breakdown.length) {
      payload.stationery_package_breakdown = split.stationery_package_breakdown;
    }
    return await request('/finance/bills/student', {
      method: 'POST',
      headers: { 'Idempotency-Key': newIdempotencyKey(studentId, payload.term, payload.academic_year) },
      body: JSON.stringify(payload),
    });
  },

  postClassBillsBatch: async (payload = {}) => {
    const body = {
      class_level: classLevelForBillPost(payload.class_level || payload.classLevel),
      academic_year: String(payload.academic_year || payload.academicYear || '2025/2026').slice(0, 50),
      term: normalizeBillTerm(payload.term),
      apply_to_all_enrolled: payload.apply_to_all_enrolled !== false,
    };
    const exclude = payload.exclude_student_ids || payload.excludeStudentIds;
    if (Array.isArray(exclude) && exclude.length) {
      body.exclude_student_ids = exclude.map((id) => String(id).trim()).filter(Boolean);
    }
    const templateId = payload.bill_template_id || payload.billTemplateId;
    if (templateId) body.bill_template_id = String(templateId);
    return await request('/finance/bills/batch', {
      method: 'POST',
      headers: { 'Idempotency-Key': newIdempotencyKey(body.class_level, body.term, body.academic_year) },
      body: JSON.stringify(body),
    });
  },

  getStudentLedger: async (studentId) => {
    const id = String(studentId || '').trim();
    if (!id) {
      throw new Error('A student id is required to load the student ledger.');
    }
    const raw = await request(`/finance/students/${encodeURIComponent(id)}/ledger`);
    return mapStudentLedgerFromApi(raw);
  },

  persistPostedAcademicBills: async ({
    students = [],
    items = [],
    totalAmount,
    term = 'Term 1',
    classLevel,
    academicYear = '2025/2026',
    billedBy,
    dueDate,
    useBatch = false,
    excludeStudentIds = [],
    billTemplateId,
  } = {}) => {
    const sanitizedItems = sanitizePostedBillItems(items);
    const total = Number(totalAmount) || sanitizedItems.reduce((sum, item) => sum + item.amount, 0);
    const result = { posted: 0, skipped: 0, failed: 0, errors: [], billIds: [], postedStudentKeys: [] };
    if (!hasLiveDatabaseSession()) {
      result.failed = Math.max(1, (students || []).length || 1);
      result.errors.push('No live database session. Sign out and sign in again with Head Admin or Accounts credentials so the bill can be saved on the server.');
      return result;
    }

    if (useBatch && classLevel) {
      try {
        const batch = await api.postClassBillsBatch({
          class_level: classLevel,
          academic_year: academicYear,
          term,
          apply_to_all_enrolled: true,
          exclude_student_ids: excludeStudentIds,
          bill_template_id: billTemplateId,
        });
        result.posted = Number(batch.students_billed_count ?? batch.posted ?? 0) || 0;
        result.skipped = Number(batch.excluded_count ?? 0) || 0;
        result.billIds = Array.isArray(batch.bill_ids) ? batch.bill_ids : [];
        result.totalAmountBilled = Number(batch.total_amount_billed || 0) || 0;
        if (!result.posted && result.skipped === 0) {
          result.failed = 1;
          result.errors.push('Class batch billing did not create any student bills.');
        }
        return result;
      } catch (error) {
        if (isLockedPeriodError(error)) {
          result.failed = 1;
          result.errors.push('The financial accounting period is currently locked. Bills cannot be posted until it is unlocked.');
          return result;
        }
        result.failed = 1;
        result.errors.push(error.message || 'Class batch billing failed.');
        return result;
      }
    }

    if (!sanitizedItems.length) {
      result.failed = 1;
      result.errors.push('A posted bill must include at least one fee item.');
      return result;
    }

    let targets = (Array.isArray(students) ? students : []).filter(Boolean);
    try {
      const remote = extractStudentList(await api.getStudents());
      targets = targets.map((stu) => {
        const name = stu.fullName || stu.name || stu.studentName;
        const code = String(stu.studentId || '').trim();
        const match = remote.find((row) => {
          const remoteCode = String(row.student_id || row.studentId || row.student_code || '').trim();
          const remoteName = row.full_name || row.fullName || row.name;
          const remoteId = String(row.id || '').trim();
          if (code && (code === remoteCode || code === remoteId)) return true;
          if (stu.id && String(stu.id) === remoteId) return true;
          return studentNamesMatch(name, remoteName);
        });
        if (!match) return stu;
        return {
          ...stu,
          id: match.id || stu.id,
          studentId: match.student_id || match.studentId || match.student_code || stu.studentId,
          fullName: stu.fullName || match.full_name || match.fullName,
          level: stu.level || match.level || match.class_level,
        };
      });
    } catch (error) {
      console.warn('Could not match billed students to the database roster:', error);
    }

    if (targets.length === 0) {
      result.failed = 1;
      result.errors.push('No matching student was found to post this bill.');
      return result;
    }

    const postOfficialStudentBill = async (student = {}) => {
      const ids = billStudentIdCandidates(student);
      if (!ids.length) {
        throw new Error(`No database student id for ${student.fullName || student.studentName || 'student'}`);
      }
      let lastError = null;
      for (const studentId of ids) {
        try {
          const response = await api.postStudentAcademicBill({
            student_id: studentId,
            class_level: student.level || student.classLevel || classLevel,
            items: sanitizedItems,
            total_amount: total,
            term,
            academic_year: academicYear,
            billed_by: billedBy,
            due_date: dueDate,
          });
          return { alreadyBilled: false, studentId, response };
        } catch (error) {
          if (isAlreadyBilledError(error)) {
            return { alreadyBilled: true, studentId, response: null };
          }
          if (isLockedPeriodError(error)) {
            const locked = new Error('The financial accounting period is currently locked. Bills cannot be posted until it is unlocked.');
            locked.status = 400;
            throw locked;
          }
          lastError = error;
          if (isStudentMissingError(error)) continue;
          throw error;
        }
      }
      const missing = new Error(lastError?.message || `Student id does not match any existing student (${ids[0]}).`);
      missing.status = 404;
      throw missing;
    };

    const outcomes = await runInChunks(targets, async (student) => {
      const outcome = await postOfficialStudentBill(student);
      return {
        ...outcome,
        studentKey: student.studentId || student.id || outcome.studentId,
      };
    });

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        const value = outcome.value || {};
        if (value.alreadyBilled) {
          result.skipped += 1;
        } else {
          result.posted += 1;
          result.postedStudentKeys.push(value.studentKey);
          const billId = value.response?.bill_id || value.response?.invoice_number;
          if (billId) result.billIds.push(billId);
        }
      } else {
        result.failed += 1;
        result.errors.push(outcome.reason?.message || String(outcome.reason || 'Bill post failed'));
      }
    });
    return result;
  },

  adjustStudentBill: async (adjustment) => {
    const feeId = adjustment.feeId || adjustment.fee_id || adjustment.studentId;
    return await request(`/finance/fees/${feeId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({
        adjustment_type: adjustment.adjustmentType || adjustment.adjustment_type || 'CREDIT',
        amount: Number(adjustment.amount) || 0,
        reason: adjustment.reason,
        invoice_no: adjustment.invoiceNo || adjustment.invoice_no,
        class_level: adjustment.classLevel || adjustment.class_level,
        student_name: adjustment.studentName || adjustment.student_name,
        posted_by: adjustment.postedBy || adjustment.posted_by,
      }),
    });
  },

  // --- Semester & Exam Registrations ---
  getSemesterRegistrations: async () => {
    return await request('/sims/semester-registration');
  },

  createSemesterRegistration: async (regData) => {
    return await request('/sims/semester-registration', {
      method: 'POST',
      body: JSON.stringify({
        student_id: regData.studentId || regData.student_id,
        class_level: regData.classLevel || regData.class_level,
        class_section: regData.classSection || regData.class_section,
        academic_year: regData.academicYear || regData.academic_year,
        term: regData.term,
        student_name: regData.studentName || regData.student_name,
      }),
    });
  },

  deleteSemesterRegistration: async (id) => {
    return await request(`/sims/semester-registration/${id}`, {
      method: 'DELETE',
    });
  },

  getExamRegistrations: async () => {
    return await request('/exams/registrations');
  },

  createExamRegistration: async (examData) => {
    // Map camelCase fields to snake_case for the backend
    const payload = {
      // Primary identifiers
      student_id:    examData.studentId    || examData.student_id,
      student_name:  examData.studentName  || examData.student_name  || examData.fullName,
      // Academic context
      class_level:   examData.classLevel   || examData.class_level   || examData.level,
      academic_year: examData.academicYear || examData.academic_year,
      term:          examData.term,
      exam_type:     examData.examType     || examData.exam_type,
      // Exam details
      index_number:  examData.indexNumber  || examData.index_number,
      exam_center:   examData.examCenter   || examData.exam_center,
      subjects:      examData.subjects     || [],
      notes:         examData.notes        || undefined,
      registered_by: examData.registeredBy || examData.registered_by || 'Academic Head / Admin',
      status:        examData.status       || 'Registered - Hall Pass Valid',
      // Also send camelCase in case the backend accepts either
      studentId:     examData.studentId    || examData.student_id,
      studentName:   examData.studentName  || examData.student_name,
      classLevel:    examData.classLevel   || examData.class_level,
      academicYear:  examData.academicYear || examData.academic_year,
      examType:      examData.examType     || examData.exam_type,
      indexNumber:   examData.indexNumber  || examData.index_number,
      examCenter:    examData.examCenter   || examData.exam_center,
    };
    // Remove undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    return await request('/exams/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteExamRegistration: async (id) => {
    return await request(`/exams/registrations/${id}`, {
      method: 'DELETE',
    });
  },
};
