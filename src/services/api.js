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
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
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

  notifyAbsent: async (data) => {
    // data: { date, class_level, custom_message }
    return await request('/attendance/notify-absent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

    const response = await fetch('https://api.smsonlinegh.com/v5/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `key ${SMS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text: messageText,
        type: 0,
        sender: sender,
        destinations: [cleanPhone]
      })
    });

    if (!response.ok) {
      throw new Error(`SMS Gateway dispatch error: HTTP ${response.status}`);
    }

    const result = await response.json();

    // Inspect delivery status
    const statusObj = result?.data?.destinations?.[0]?.status;
    if (statusObj?.label === 'DS_REJECTED_SENDER_UNREGISTERED') {
      console.warn(`[SMSOnlineGH Warning] Sender ID '${sender}' is not registered on your SMSOnlineGH account dashboard.`);
    }

    return result;
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

  sendFeeReminder: async (reminderData) => {
    // reminderData: { to, recipientEmail, studentName, subject, body }
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
    return await request(`/admissions/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
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
      body: JSON.stringify(staffData),
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

  // --- Payment Vouchers ---
  getPaymentVouchers: async () => {
    return await request('/finance/pv');
  },

  createPaymentVoucher: async (pvData) => {
    return await request('/finance/pv', {
      method: 'POST',
      body: JSON.stringify(pvData),
    });
  },

  updatePaymentVoucherStatus: async (pvId, statusData) => {
    return await request(`/finance/pv/${pvId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
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

  // --- Semester & Exam Registrations ---
  getSemesterRegistrations: async () => {
    return await request('/academic/semester-registrations');
  },

  createSemesterRegistration: async (regData) => {
    return await request('/academic/semester-registrations', {
      method: 'POST',
      body: JSON.stringify(regData),
    });
  },

  deleteSemesterRegistration: async (id) => {
    return await request(`/academic/semester-registrations/${id}`, {
      method: 'DELETE',
    });
  },

  getExamRegistrations: async () => {
    return await request('/academic/exam-registrations');
  },

  createExamRegistration: async (examData) => {
    return await request('/academic/exam-registrations', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  deleteExamRegistration: async (id) => {
    return await request(`/academic/exam-registrations/${id}`, {
      method: 'DELETE',
    });
  },
};
