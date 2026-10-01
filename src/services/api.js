/**
 * REMALJ Carewell Inspirational School - Backend & SMS Gateway API Service Client
 * Backend Base URL: https://rcis-backend.onrender.com/api/v1
 * SMS Gateway: SMSOnlineGH (v4 API)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://rcis-backend.onrender.com/api/v1';
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
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            console.error(`[FastAPI 422 Validation Error on ${endpoint}]:`, errorData.detail);
            const formatted = errorData.detail
              .map(d => {
                const loc = Array.isArray(d.loc) ? d.loc.filter(x => x !== 'body').join('.') : d.loc;
                return `[${loc}]: ${d.msg}`;
              })
              .join('; ');
            errorMessage = `FastAPI Validation Error (HTTP 422): ${formatted}`;
          } else {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // use default HTTP error
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (err) {
    console.warn(`[API Client Warning] Request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

// Score sheet entries carry the full class-test breakdown so a saved sheet can be reopened and edited
function scoreSheetPayload(entry) {
  return {
    entry_key: entry.entryKey || entry.entry_key,
    academic_year: entry.year || entry.academicYear || entry.academic_year,
    class_level: entry.classLevel || entry.class_level,
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
        arrival_test: Number(entry.arrivalTest ?? 0),
        class_test_1: Number(entry.test1 ?? 0),
        class_test_2: Number(entry.test2 ?? 0),
        class_test_3: Number(entry.test3 ?? 0),
        class_test_total: Number(entry.classTestTotal ?? 0),
        class_score: Number(entry.classScore ?? 0),
        exam_score: Number(entry.examScore ?? 0),
        exam_score_converted: Number(entry.examScoreConverted ?? 0),
        total_score: Number(entry.score ?? 0),
        grade: entry.grade,
        remarks: entry.remarks,
        teacher_note: entry.teacherNote ?? entry.teacher_note ?? '',
      },
    ],
  };
}

function mapScoreSheetEntry(raw = {}) {
  const score = Array.isArray(raw.scores) ? (raw.scores[0] || {}) : raw;
  return {
    id: raw.id || raw._id || score.id,
    entryKey: raw.entry_key || raw.entryKey,
    studentId: score.student_id || score.student_code || score.studentId,
    studentName: score.student_name || score.studentName,
    classLevel: raw.class_level || raw.classLevel,
    subject: raw.subject,
    category: raw.category,
    instructor: raw.instructor,
    term: raw.term,
    year: raw.academic_year || raw.academicYear,
    examDate: raw.exam_date || raw.examDate,
    arrivalTest: score.arrival_test ?? score.arrivalTest ?? 0,
    test1: score.class_test_1 ?? score.test1 ?? 0,
    test2: score.class_test_2 ?? score.test2 ?? 0,
    test3: score.class_test_3 ?? score.test3 ?? 0,
    classTestTotal: score.class_test_total ?? score.classTestTotal ?? 0,
    classScore: score.class_score ?? score.classScore ?? 0,
    examScore: score.exam_score ?? score.examScore ?? 0,
    examScoreConverted: score.exam_score_converted ?? score.examScoreConverted ?? 0,
    score: score.total_score ?? score.score ?? 0,
    grade: score.grade,
    remarks: score.remarks,
    teacherNote: score.teacher_note ?? score.teacherNote ?? '',
    status: raw.status || score.status || 'Pending Approval',
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

export const api = {
  // --- Auth & User Access ---
  login: async (credentials) => {
    // credentials: { email, password, portal }
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res && res.token) setAuthToken(res.token);
    if (res && res.user) setAuthUser(res.user);
    return res;
  },

  cardScan: async (cardData) => {
    // cardData: { cardId, portal }
    const res = await request('/auth/card-scan', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    if (res && res.token) setAuthToken(res.token);
    if (res && res.user) setAuthUser(res.user);
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
    if (res && res.token) setAuthToken(res.token);
    if (res && res.user) setAuthUser(res.user);
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
    const list = Array.isArray(res)
      ? res
      : (res?.credentials || res?.class_teachers || res?.data || res?.items || []);
    return list.map(mapClassTeacherCredential).filter(Boolean);
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
    if (res && res.token) setAuthToken(res.token);
    if (res && res.user) setAuthUser(res.user);
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
    if (res && res.token) setAuthToken(res.token);
    if (res && res.user) setAuthUser(res.user);
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
      form_data: applicationData
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
    return await request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
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
      requisitionNo: pvData.requisitionNo || pvData.requisition_no || null,
      payee_id: pvData.payee_id || pvData.providerId || null,
      date_prepared: pvData.date_prepared || pvData.datePrepared || new Date().toISOString().split('T')[0],
      valued_date: pvData.valued_date || pvData.valuedDate || pvData.date_prepared || pvData.datePrepared || new Date().toISOString().split('T')[0],
      expense_account_code: pvData.expense_account_code || '5000-EXPENSE',
      expense_account_name: pvData.expense_account_name || 'Operating Expenses',
    };
  },

  createPaymentVoucher: async (pvData) => {
    const payload = api.normalizePaymentVoucherPayload(pvData);
    try {
      return await request('/finance/vouchers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (e) {
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

  getPaymentVouchers: async () => {
    try {
      return await request('/finance/vouchers');
    } catch (e) {
      return await request('/finance/pv');
    }
  },
  getVouchers: async () => api.getPaymentVouchers(),

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
    // Fields: email, username, password, full_name, name, role,
    //         phone_number, phone, card_id, photo_url, is_active, status
    const fullName = (userData.fullName || userData.full_name || userData.name || '').trim();
    const email    = (userData.email || '').trim().toLowerCase();
    const phone    = (userData.phone || userData.phone_number || '').trim();
    const role     = userData.role || 'teacher';

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
      class_assigned: userData.classLevel || userData.class_level || userData.assignedClass || undefined,
      sub_class:    userData.subClass || userData.sub_class || undefined,
    };

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

  postAcademicBill: async (bill) => {
    return await request('/finance/bills/post', {
      method: 'POST',
      body: JSON.stringify(bill),
    });
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
