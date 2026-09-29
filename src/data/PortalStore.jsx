import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'remalj-portal-live-data-v3';

const INITIAL_DATA = {
  timetable: [],
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
  studentFees: [],
  accountantMessages: [],
  busRoutes: [],
  definedBills: [],
  semesterRegistrations: [],
  examRegistrations: [],
  paymentVouchers: [],
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
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DATA;
    const parsed = JSON.parse(saved);
    return {
      ...INITIAL_DATA,
      ...parsed,
      academicSettings: {
        ...INITIAL_DATA.academicSettings,
        ...(parsed.academicSettings || {})
      }
    };
  } catch {
    return INITIAL_DATA;
  }
}

export function PortalDataProvider({ children }) {
  const [data, setData] = useState(readData);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('rcis_portal_data_sync');
        channel.postMessage({ type: 'DATA_UPDATE', payload: data });
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
          setData(JSON.parse(event.newValue));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', sync);

    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('rcis_portal_data_sync');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'DATA_UPDATE' && event.data.payload) {
            setData(current => ({
              ...current,
              ...event.data.payload
            }));
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', sync);
      if (channel) channel.close();
    };
  }, []);

  // Sync strictly with live backend API endpoints on mount
  const refreshBackendData = useCallback(async () => {
    try {
      // 1. Bus Routes
      try {
        const routesRes = await api.getBusRoutes();
        if (Array.isArray(routesRes)) {
          setData(current => ({ ...current, busRoutes: routesRes, backendConnected: true }));
        } else if (routesRes && Array.isArray(routesRes.routes)) {
          setData(current => ({ ...current, busRoutes: routesRes.routes, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 2. Timetable
      try {
        const timetables = await api.getTimetables();
        if (Array.isArray(timetables)) {
          const mapped = timetables.map(t => ({
            id: t.id,
            day: t.day,
            time: t.time || `${t.start_time || ''}${t.end_time ? ' - ' + t.end_time : ''}`,
            subject: t.subject,
            room: t.room,
            lecturer: t.lecturer || t.lecturer_name,
            classLevel: t.class_level || t.classLevel
          }));
          setData(current => ({ ...current, timetable: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 3. Results
      try {
        const results = await api.getResults();
        if (Array.isArray(results)) {
          const mapped = results.map(r => ({
            id: r.id,
            studentId: r.student_id || r.studentId,
            studentName: r.student_name || r.studentName,
            subject: r.subject,
            score: r.score,
            grade: r.grade,
            lecturer: r.lecturer,
            status: r.status || 'Approved',
            declineNote: r.decline_note || r.declineNote,
            updatedAt: r.updated_at || r.updatedAt
          }));
          setData(current => ({ ...current, results: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 4. Report Requests
      try {
        const reports = await api.getReportRequests();
        if (Array.isArray(reports)) {
          const mapped = reports.map(r => ({
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
          setData(current => ({ ...current, reportRequests: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 5. Incidents
      try {
        const incidents = await api.getIncidents();
        if (Array.isArray(incidents)) {
          const mapped = incidents.map(i => ({
            id: i.id,
            category: i.category,
            person: i.person,
            severity: i.severity,
            status: i.status,
            loggedAt: i.logged_at || i.loggedAt
          }));
          setData(current => ({ ...current, incidents: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 6. Asset Tasks
      try {
        const tasks = await api.getAssetTasks();
        if (Array.isArray(tasks)) {
          const mapped = tasks.map(t => ({
            id: t.id,
            asset: t.asset,
            task: t.task,
            owner: t.owner,
            status: t.status,
            due: t.due_date || t.due
          }));
          setData(current => ({ ...current, assetTasks: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 7. Messages
      try {
        const msgs = await api.getMessages();
        if (Array.isArray(msgs)) {
          const mapped = msgs.map(m => ({
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
          setData(current => ({ ...current, messages: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 8. Assignments
      try {
        const assignments = await api.getAssignments();
        if (Array.isArray(assignments)) {
          const mapped = assignments.map(a => ({
            id: a.id,
            title: a.title,
            instructions: a.instructions,
            audience: a.audience,
            due: a.due || a.due_date,
            author: a.author || a.author_name,
            status: a.status
          }));
          setData(current => ({ ...current, assignments: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 9. Admissions Applications
      try {
        const apps = await api.getApplications();
        if (Array.isArray(apps)) {
          const mapped = apps.map(a => ({
            id: a.id,
            learner: a.learner || a.learner_name,
            guardian: a.guardian || a.guardian_name,
            email: a.email || a.contact_email,
            phone: a.phone || a.contact_phone,
            level: a.level || a.applying_level,
            status: a.status,
            submittedAt: a.submittedAt || a.submitted_at,
            office_use_notes: a.office_use_notes,
            ...(a.formData || a.form_data || {})
          }));
          setData(current => ({ ...current, applications: mapped, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 10. Onboarded Students
      try {
        const students = await api.getStudents();
        if (Array.isArray(students)) {
          const mapped = students.map(s => ({
            id: s.id,
            studentId: s.studentId || s.student_id_code || s.student_code || s.id,
            rfidCardCode: s.rfidCardCode || s.rfid_card_code,
            fullName: s.fullName || s.full_name,
            dob: s.dob,
            gender: s.gender,
            level: s.level || s.class_level,
            classSection: s.classSection || s.class_section || 'A',
            guardianName: s.guardianName || s.guardian_name,
            guardianEmail: s.guardianEmail || s.guardian_email,
            guardianPhone: s.guardianPhone || s.guardian_phone,
            homeAddress: s.homeAddress || s.home_address,
            enrollmentDate: s.enrollmentDate || s.enrollment_date || new Date().toISOString().split('T')[0],
            status: s.status || 'Active',
            studentEmail: s.studentEmail || s.student_email,
            defaultPassword: s.defaultPassword || s.default_password
          }));
          setData(current => {
            const currentList = current.onboardedStudents || [];
            const mergedMap = new Map();
            currentList.forEach(s => {
              const k = (s.studentId || s.id || s.fullName || '').toLowerCase().trim();
              if (k) mergedMap.set(k, s);
            });
            mapped.forEach(s => {
              const k = (s.studentId || s.id || s.fullName || '').toLowerCase().trim();
              if (k) {
                const prev = mergedMap.get(k) || {};
                mergedMap.set(k, { ...prev, ...s });
              }
            });
            const merged = Array.from(mergedMap.values());
            return {
              ...current,
              onboardedStudents: merged.length > 0 ? merged : mapped,
              backendConnected: true
            };
          });
        }
      } catch (e) { /* silent */ }

      // 11. Fees
      try {
        const fees = await api.getFees();
        if (Array.isArray(fees)) {
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
          const mappedAccounts = mapped.map(f => ({
            id: `fee-acc-${f.studentId || f.id}`,
            child: f.studentName,
            school: 'REMALJ Carewell Inspirational School',
            term: f.term,
            billed: f.billedAmount,
            paid: f.paidAmount,
            status: f.status
          }));
          setData(current => {
            const curFees = current.studentFees || [];
            const feeMap = new Map();
            curFees.forEach(f => {
              const k = (f.studentId || f.id || f.studentName || '').toLowerCase().trim();
              if (k) feeMap.set(k, f);
            });
            mapped.forEach(f => {
              const k = (f.studentId || f.id || f.studentName || '').toLowerCase().trim();
              if (k) {
                const prev = feeMap.get(k) || {};
                feeMap.set(k, { ...prev, ...f });
              }
            });
            const mergedFees = Array.from(feeMap.values());
            return {
              ...current,
              studentFees: mergedFees.length > 0 ? mergedFees : mapped,
              feeAccounts: mappedAccounts.length > 0 ? mappedAccounts : current.feeAccounts,
              backendConnected: true
            };
          });
        }
      } catch (e) { /* silent */ }

      // 12. Staff & Teacher Directory
      try {
        const staff = await api.getStaff();
        if (Array.isArray(staff)) {
          setData(current => {
            const curStaff = current.teacherDirectory || [];
            const staffMap = new Map();
            curStaff.forEach(s => {
              const k = (s.staffId || s.id || s.email || s.name || '').toLowerCase().trim();
              if (k) staffMap.set(k, s);
            });
            staff.forEach(s => {
              const k = (s.staffId || s.id || s.email || s.name || '').toLowerCase().trim();
              if (k) {
                const prev = staffMap.get(k) || {};
                staffMap.set(k, { ...prev, ...s });
              }
            });
            const mergedStaff = Array.from(staffMap.values());
            return {
              ...current,
              teacherDirectory: mergedStaff.length > 0 ? mergedStaff : staff,
              backendConnected: true
            };
          });
        }
      } catch (e) { /* silent */ }

      // 13. Defined Bills
      try {
        const bills = await api.getDefinedBills();
        if (Array.isArray(bills)) {
          setData(current => {
            const curBills = current.definedBills || [];
            const billMap = new Map();
            curBills.forEach(b => {
              const k = (b.id || b.title || b.name || '').toLowerCase().trim();
              if (k) billMap.set(k, b);
            });
            bills.forEach(b => {
              const k = (b.id || b.title || b.name || '').toLowerCase().trim();
              if (k) {
                const prev = billMap.get(k) || {};
                billMap.set(k, { ...prev, ...b });
              }
            });
            const mergedBills = Array.from(billMap.values());
            return {
              ...current,
              definedBills: mergedBills.length > 0 ? mergedBills : bills,
              backendConnected: true
            };
          });
        }
      } catch (e) { /* silent */ }

      // 14. Payment Vouchers
      try {
        const pvs = await api.getPaymentVouchers();
        if (Array.isArray(pvs)) {
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
            editedByHeadmaster: false,
            correctionsLog: []
          }));
          setData(current => {
            const curPVs = current.paymentVouchers || [];
            const pvMap = new Map();
            curPVs.forEach(p => {
              const k = (p.pvNo || p.id || '').toLowerCase().trim();
              if (k) pvMap.set(k, p);
            });
            mapped.forEach(p => {
              const k = (p.pvNo || p.id || '').toLowerCase().trim();
              if (k) {
                const prev = pvMap.get(k) || {};
                pvMap.set(k, { ...prev, ...p });
              }
            });
            const mergedPVs = Array.from(pvMap.values());
            return {
              ...current,
              paymentVouchers: mergedPVs.length > 0 ? mergedPVs : mapped,
              backendConnected: true
            };
          });
        }
      } catch (e) { /* silent */ }

      // 15. Semester Registrations
      try {
        const semRegs = await api.getSemesterRegistrations();
        if (Array.isArray(semRegs)) {
          setData(current => ({ ...current, semesterRegistrations: semRegs, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      // 16. Exam Registrations
      try {
        const examRegs = await api.getExamRegistrations();
        if (Array.isArray(examRegs)) {
          setData(current => ({ ...current, examRegistrations: examRegs, backendConnected: true }));
        }
      } catch (e) { /* silent */ }

      setData(current => ({ ...current, isLoadingBackend: false, backendConnected: true }));

    } catch (err) {
      console.warn('Backend sync error:', err);
      setData(current => ({ ...current, isLoadingBackend: false }));
    }
  }, []);

  useEffect(() => {
    refreshBackendData();

    // Auto-refresh when tab/window regains focus
    const handleFocus = () => {
      refreshBackendData();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic polling every 8 seconds to synchronize creations from other head admin sessions
    const pollInterval = setInterval(() => {
      refreshBackendData();
    }, 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [refreshBackendData]);

  const sortedOnboardedStudents = useMemo(() => {
    return [...(data.onboardedStudents || [])].sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));
  }, [data.onboardedStudents]);

  const sortedStudentFees = useMemo(() => {
    return [...(data.studentFees || [])].sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  }, [data.studentFees]);

  const value = useMemo(() => ({
    ...data,
    academicSettings: data.academicSettings || INITIAL_DATA.academicSettings,
    updateAcademicSettings: (newSettings) => setData((current) => ({
      ...current,
      academicSettings: { ...(current.academicSettings || INITIAL_DATA.academicSettings), ...newSettings }
    })),
    onboardedStudents: sortedOnboardedStudents,
    studentFees: sortedStudentFees,
    refreshBackendData,
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
    publishResult: async (result) => {
      try {
        await api.recordResult(result);
      } catch (e) {
        console.warn('Backend result record fallback:', e);
      }
      setData((current) => ({
        ...current,
        results: current.results.some((item) => item.subject === result.subject)
          ? current.results.map((item) => item.subject === result.subject ? { ...result, id: item.id, status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() } : item)
          : [...current.results, { ...result, id: crypto.randomUUID?.() || String(Date.now()), status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() }],
      }));
    },
    approveResult: async (id) => {
      try {
        await api.updateResultStatus(id, { status: 'Approved' });
      } catch (e) {
        console.warn('Backend result approve fallback:', e);
      }
      setData((current) => ({
        ...current,
        results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Approved', declineNote: null, approvedAt: new Date().toLocaleString() } : item),
      }));
    },
    declineResult: async (id, note) => {
      try {
        await api.updateResultStatus(id, { status: 'Declined', decline_note: note });
      } catch (e) {
        console.warn('Backend result decline fallback:', e);
      }
      setData((current) => ({
        ...current,
        results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Declined', declineNote: note || 'Error detected in score breakdown by Academic Head.', declinedAt: new Date().toLocaleString() } : item),
      }));
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
    addAssetTask: ({ asset, task, owner, due }) => setData((current) => ({
      ...current,
      assetTasks: [{ id: crypto.randomUUID?.() || String(Date.now()), asset, task, owner, due, status: 'Scheduled' }, ...current.assetTasks],
    })),
    addDocumentationRecord: ({ title, owner }) => setData((current) => ({
      ...current,
      documentation: [{ id: crypto.randomUUID?.() || String(Date.now()), title, owner, status: 'Current', updatedAt: new Date().toLocaleDateString() }, ...current.documentation],
    })),
    toggleAcceptanceCheck: (id) => setData((current) => ({
      ...current,
      acceptanceChecks: current.acceptanceChecks.map((item) => item.id === id ? { ...item, done: !item.done } : item),
    })),
    publishAcademicDate: ({ title, start, end, type }) => setData((current) => ({
      ...current,
      academicCalendar: [{ id: crypto.randomUUID?.() || String(Date.now()), title, start, end: end || start, type }, ...current.academicCalendar],
    })),
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
        assignments: [{ id: crypto.randomUUID?.() || String(Date.now()), title, instructions, audience, due, author: 'Mr. Samuel Amponsah', status: 'Published' }, ...current.assignments],
      }));
    },
    submitApplication: async (application) => {
      const learnerName = `${application.firstName || ''} ${application.surname || ''}`.trim() || application.learner || application.fullName || 'Applicant';
      const guardianName = application.fatherName || application.motherName || application.guardian || application.guardianName || 'Parent/Guardian';
      const contactEmail = application.fatherEmail || application.motherEmail || application.email || application.guardianEmail || `${(application.surname || 'parent').toLowerCase()}@remaljcarewell.edu.gh`;
      const contactPhone = application.fatherPhone || application.motherPhone || application.phone || application.guardianPhone || '024 111 2222';
      const applyingLevel = application.applyingClass || application.level || 'JHS 1';

      try {
        await api.submitApplication({
          learner_name: learnerName,
          guardian_name: guardianName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          applying_level: applyingLevel,
          form_data: application
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
          guardian: guardianName,
          email: contactEmail,
          phone: contactPhone,
          level: applyingLevel,
          status: 'Submitted',
          submittedAt: new Date().toLocaleString()
        };

        const studentCount = (current.onboardedStudents || []).length + 1;
        const studentId = `REMALJ-${new Date().getFullYear()}-${String(studentCount).padStart(3, '0')}`;
        const newStudent = {
          id: appId,
          studentId,
          rfidCardCode: application.rfidCardCode || `CARD-${String(studentCount).padStart(3, '0')}`,
          fullName: learnerName,
          dob: application.dob || '2015-01-01',
          gender: application.sex || application.gender || 'Male',
          level: applyingLevel,
          classSection,
          guardianName,
          guardianEmail: contactEmail,
          guardianPhone: contactPhone,
          homeAddress,
          passportPhoto: application.passportPhoto || null,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          studentEmail: `${learnerName.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`,
          defaultPassword: `StuPass#${studentId.replace('REMALJ-', '')}`,
        };

        const defaultBilled = applyingLevel.includes('JHS') ? 5200 : applyingLevel.includes('SHS') ? 5800 : 4800;
        const newFee = {
          id: `fee-${appId}`,
          studentId,
          studentName: learnerName,
          guardianName,
          guardianEmail: contactEmail,
          term: 'Term 1 · 2026',
          billedAmount: defaultBilled,
          paidAmount: 0,
          balance: defaultBilled,
          status: 'Not Paid',
          dueDate: '2026-09-15',
          paymentDate: null
        };

        const newFeeAccount = {
          id: `fee-acc-${appId}`,
          child: learnerName,
          school: 'REMALJ Carewell Inspirational School',
          term: 'Term 1 · 2026',
          billed: defaultBilled,
          paid: 0,
          status: 'Not Paid'
        };

        return {
          ...current,
          applications: [newApp, ...(current.applications || [])],
          onboardedStudents: [newStudent, ...(current.onboardedStudents || [])],
          studentFees: [newFee, ...(current.studentFees || [])],
          feeAccounts: [newFeeAccount, ...(current.feeAccounts || [])],
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
        const applyingLevel = updatedForm.applyingClass || updatedForm.level || existingApp.level || 'JHS 1';

        const updatedApplicationRecord = {
          ...existingApp,
          ...updatedForm,
          learner: learnerName,
          guardian: guardianName,
          email: contactEmail,
          phone: contactPhone,
          level: applyingLevel,
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
    updateApplicationOfficeUse: (id, officeData) => setData((current) => ({
      ...current,
      applications: (current.applications || []).map((item) => item.id === id ? { ...item, ...officeData } : item),
    })),
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
    addServiceRecord: ({ module, person, detail, status }) => setData((current) => ({
      ...current,
      serviceRecords: [{ id: crypto.randomUUID?.() || String(Date.now()), module, person, detail, status, recordedAt: new Date().toLocaleString() }, ...(current.serviceRecords || [])],
    })),
    addSecurityAlert: ({ portal, targetAccount, reason, severity = 'Medium', device }) => setData((current) => ({
      ...current,
      securityAlerts: [
        {
          id: `sec-${Date.now()}`,
          portal: portal || 'portal',
          targetAccount: targetAccount || 'Unknown Target Account',
          ipAddress: '197.251.14.82 (Bogoso Web Network)',
          attemptedAt: new Date().toLocaleString(),
          reason: reason || 'Unauthorized login attempt detected',
          severity: severity,
          status: 'Unresolved',
          device: device || (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Web Device')
        },
        ...(current.securityAlerts || [])
      ]
    })),
    resolveSecurityAlert: (id) => setData((current) => ({
      ...current,
      securityAlerts: (current.securityAlerts || []).map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a)
    })),
    deleteSecurityAlert: (id) => setData((current) => ({
      ...current,
      securityAlerts: (current.securityAlerts || []).filter(a => a.id !== id)
    })),
    updateProfile: (portal, updates) => setData((current) => ({ ...current, profiles: { ...current.profiles, [portal]: { ...current.profiles[portal], ...updates } } })),
    setTheme: (theme) => setData((current) => ({ ...current, theme })),
    onboardStudent: async (student) => {
      try {
        await api.onboardStudent({
          fullName: student.fullName,
          full_name: student.fullName,
          name: student.fullName,
          dob: student.dob || '2015-01-01',
          gender: student.gender || 'Not Specified',
          level: student.level || 'Grade 1',
          class_level: student.level || 'Grade 1',
          classSection: student.classSection || 'A',
          class_section: student.classSection || 'A',
          guardianName: student.guardianName,
          guardian_name: student.guardianName,
          guardianEmail: student.guardianEmail,
          guardian_email: student.guardianEmail,
          guardianPhone: student.guardianPhone,
          guardian_phone: student.guardianPhone,
          homeAddress: student.homeAddress || 'Bogoso',
          home_address: student.homeAddress || 'Bogoso',
          initialBilledAmount: (student.level || '').includes('JHS') ? 5200 : (student.level || '').includes('SHS') ? 5800 : 4800,
          initial_billed_amount: (student.level || '').includes('JHS') ? 5200 : (student.level || '').includes('SHS') ? 5800 : 4800,
          term: 'Term 1 · 2026'
        });
      } catch (e) {
        console.warn('Backend onboard student fallback:', e);
      }

      setData((current) => {
        const studentId = `REMALJ-${new Date().getFullYear()}-${String((current.onboardedStudents || []).length + 1).padStart(3, '0')}`;
        const studentEmail = `${student.fullName.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`;
        const defaultPassword = student.defaultPassword || `StuPass#${studentId.replace('REMALJ-', '')}`;
        const parentPassword = student.parentPassword || 'ParentPass2026!';

        const newStudent = {
          id: crypto.randomUUID?.() || String(Date.now()),
          studentId,
          rfidCardCode: student.rfidCardCode || `CARD-${String((current.onboardedStudents || []).length + 1).padStart(3, '0')}`,
          fullName: student.fullName,
          dob: student.dob,
          gender: student.gender,
          level: student.level,
          classSection: student.classSection || 'A',
          guardianName: student.guardianName,
          guardianEmail: student.guardianEmail,
          guardianPhone: student.guardianPhone,
          homeAddress: student.homeAddress,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          studentEmail,
          defaultPassword,
        };

        // Sync credentials into registered_accounts for student and parent
        try {
          const raw = localStorage.getItem('registered_accounts');
          const list = raw ? JSON.parse(raw) : {};
          list[studentEmail.toLowerCase()] = {
            id: `usr_${studentId}`,
            studentId,
            email: studentEmail,
            password: defaultPassword,
            fullName: student.fullName,
            role: 'student'
          };
          list[studentId.toLowerCase()] = {
            id: `usr_${studentId}`,
            studentId,
            email: studentEmail,
            password: defaultPassword,
            fullName: student.fullName,
            role: 'student'
          };
          if (student.guardianEmail) {
            list[student.guardianEmail.toLowerCase()] = {
              id: `usr_parent_${studentId}`,
              email: student.guardianEmail,
              phone: student.guardianPhone,
              password: parentPassword,
              fullName: student.guardianName || `Parent of ${student.fullName}`,
              role: 'parent'
            };
          }
          localStorage.setItem('registered_accounts', JSON.stringify(list));
        } catch (e) {}

        const defaultBilled = student.level.includes('JHS') ? 5200 : student.level.includes('SHS') ? 5800 : 4800;
        const newFee = {
          id: `fee-${newStudent.id}`,
          studentId,
          studentName: student.fullName,
          guardianName: student.guardianName,
          guardianEmail: student.guardianEmail,
          term: 'Term 1 · 2026',
          billedAmount: defaultBilled,
          paidAmount: 0,
          balance: defaultBilled,
          status: 'Not Paid',
          dueDate: '2026-09-15',
          paymentDate: null
        };
        const newFeeAccount = {
          id: `fee-acc-${newStudent.id}`,
          child: student.fullName,
          school: 'REMALJ Carewell Inspirational School',
          term: 'Term 1 · 2026',
          billed: defaultBilled,
          paid: 0,
          status: 'Not Paid'
        };
        return {
          ...current,
          onboardedStudents: [newStudent, ...(current.onboardedStudents || [])],
          studentFees: [newFee, ...(current.studentFees || [])],
          feeAccounts: [newFeeAccount, ...(current.feeAccounts || [])],
        };
      });
    },
    onboardStudentsBulk: async (studentsArray) => {
      if (!Array.isArray(studentsArray) || studentsArray.length === 0) return [];

      const onboardedResults = [];

      for (const student of studentsArray) {
        try {
          await api.onboardStudent({
            fullName: student.fullName,
            dob: student.dob || '2014-01-01',
            gender: student.gender || 'Not Specified',
            level: student.level || 'Grade 4',
            classSection: student.classSection || 'A',
            guardianName: student.guardianName || 'Guardian',
            guardianEmail: student.guardianEmail || 'parent@remaljcarewell.edu.gh',
            guardianPhone: student.guardianPhone || '0541769621',
            homeAddress: student.homeAddress || 'Bogoso',
            initialBilledAmount: (student.level || '').includes('JHS') ? 5200 : (student.level || '').includes('SHS') ? 5800 : 4800,
            term: 'Term 1 · 2026'
          }).catch(() => {});
        } catch (e) {}
      }

      setData((current) => {
        let currentCount = (current.onboardedStudents || []).length;
        const newStudents = [];
        const newFees = [];
        const newAccounts = [];

        studentsArray.forEach((student, idx) => {
          currentCount++;
          const studentId = `REMALJ-${new Date().getFullYear()}-${String(currentCount).padStart(3, '0')}`;
          const id = `stu-bulk-${Date.now()}-${idx}`;

          const newStudent = {
            id,
            studentId,
            fullName: student.fullName,
            dob: student.dob || '2014-01-01',
            gender: student.gender || 'Male',
            level: student.level || 'Grade 4',
            classSection: student.classSection || 'A',
            guardianName: student.guardianName || 'Guardian',
            guardianEmail: student.guardianEmail || 'parent@remaljcarewell.edu.gh',
            guardianPhone: student.guardianPhone || '054 176 9621',
            homeAddress: student.homeAddress || 'Bogoso',
            enrollmentDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            studentEmail: `${(student.fullName || 'student').toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`,
          };

          const defaultBilled = (student.level || '').includes('JHS') ? 5200 : (student.level || '').includes('SHS') ? 5800 : 4800;
          const newFee = {
            id: `fee-${id}`,
            studentId,
            studentName: student.fullName,
            guardianName: student.guardianName,
            guardianEmail: student.guardianEmail || 'parent@remaljcarewell.edu.gh',
            term: 'Term 1 · 2026',
            billedAmount: defaultBilled,
            paidAmount: 0,
            balance: defaultBilled,
            status: 'Not Paid',
            dueDate: '2026-09-15',
            paymentDate: null
          };

          const newFeeAccount = {
            id: `fee-acc-${id}`,
            child: student.fullName,
            school: 'REMALJ Carewell Inspirational School',
            term: 'Term 1 · 2026',
            billed: defaultBilled,
            paid: 0,
            status: 'Not Paid'
          };

          newStudents.push(newStudent);
          newFees.push(newFee);
          newAccounts.push(newFeeAccount);
          onboardedResults.push(newStudent);
        });

        return {
          ...current,
          onboardedStudents: [...newStudents, ...(current.onboardedStudents || [])],
          studentFees: [...newFees, ...(current.studentFees || [])],
          feeAccounts: [...newAccounts, ...(current.feeAccounts || [])],
        };
      });

      return onboardedResults;
    },
    updateOnboardedStudent: (id, updates) => setData((current) => ({
      ...current,
      onboardedStudents: (current.onboardedStudents || []).map((s) => (s.id === id || s.studentId === id) ? { ...s, ...updates } : s),
    })),
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
    // Score Sheet Entry Persistence
    saveScoreSheetEntry: (entry) => setData((current) => {
      const existingResults = current.results || [];
      const newResult = {
        id: entry.id || `res-${Date.now()}`,
        studentId: entry.studentId,
        studentName: entry.studentName,
        subject: entry.subject || 'General Subject',
        score: entry.score,
        grade: entry.grade,
        remarks: entry.remarks,
        classLevel: entry.classLevel,
        term: entry.term,
        year: entry.year,
        lecturer: entry.instructor || 'Subject Teacher',
        status: 'Approved',
        updatedAt: new Date().toLocaleDateString()
      };
      const updated = existingResults.some(r => r.id === newResult.id || (r.subject === newResult.subject && r.studentName === newResult.studentName))
        ? existingResults.map(r => (r.id === newResult.id || (r.subject === newResult.subject && r.studentName === newResult.studentName)) ? { ...r, ...newResult } : r)
        : [newResult, ...existingResults];
      return { ...current, results: updated };
    }),
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
    postAcademicBill: ({ studentId, studentName, classLevel, items, totalAmount, term = 'Term 1 · 2026' }) => setData((current) => {
      const amountToPost = Number(totalAmount) || 0;
      let targetStudents = [];
      if (studentId) {
        targetStudents = (current.onboardedStudents || []).filter(s => s.studentId === studentId || s.id === studentId || s.fullName === studentName);
      } else if (classLevel && classLevel !== 'All Classes') {
        const cleanClass = classLevel.toLowerCase();
        targetStudents = (current.onboardedStudents || []).filter(s => {
          const sLvl = (s.level || '').toLowerCase();
          return sLvl.includes(cleanClass) || cleanClass.includes(sLvl) ||
                 (cleanClass.includes('jhs') && sLvl.includes('jhs')) ||
                 (cleanClass.includes('nursery') && (sLvl.includes('nursery') || sLvl.includes('creche'))) ||
                 (cleanClass.includes('basic') && sLvl.includes('basic')) ||
                 (cleanClass.includes('primary') && (sLvl.includes('primary') || sLvl.includes('grade')));
        });
      }

      if (targetStudents.length === 0) {
        targetStudents = current.onboardedStudents || [];
      }

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

        const accIndex = updatedFeeAccounts.findIndex(a => a.child === stu.fullName);
        if (accIndex >= 0) {
          const existingAcc = updatedFeeAccounts[accIndex];
          const newBilled = (existingAcc.billed || 0) + amountToPost;
          const newPaid = existingAcc.paid || 0;
          updatedFeeAccounts[accIndex] = {
            ...existingAcc,
            billed: newBilled,
            status: (newBilled - newPaid) <= 0 ? 'Paid' : 'Balance due',
          };
        } else {
          updatedFeeAccounts.unshift({
            id: `fee-acc-${stu.id || Date.now()}`,
            child: stu.fullName,
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
    }),
    adjustStudentBill: ({
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
    }) => setData((current) => {
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
    }),
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
        return await api.notifyAbsent(data);
      } catch (e) {
        console.warn('Notify absent API warning:', e);
      }
    },
    // Staff Onboarding & Management Methods
    addStaffMember: async (staffData) => {
      let created = null;
      try {
        created = await api.createStaff(staffData);
      } catch (e) {
        console.warn('Backend staff create fallback:', e);
      }

      setData((current) => {
        const currentList = current.teacherDirectory || [];
        const staffId = staffData.staffId || `STF-2026-${String(currentList.length + 1).padStart(3, '0')}`;
        const email = staffData.email || `${(staffData.name || 'staff').toLowerCase().replace(/[^\w]/g, '.')}@remaljcarewell.edu.gh`;
        const defaultPassword = staffData.password || `StaffPass#${staffId}`;

        const newStaff = created || {
          id: crypto.randomUUID?.() || String(Date.now()),
          staffId,
          name: staffData.name,
          subject: staffData.subject || 'General Education',
          classAssigned: staffData.classAssigned || 'Grade 4',
          email,
          phone: staffData.phone || '024 900 1100',
          role: staffData.role || 'Subject Teacher',
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
            role: 'teacher',
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
      try {
        await api.updateStaff(id, updates);
      } catch (e) {
        console.warn('Backend staff update fallback:', e);
      }
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || []).map((t) => (t.id === id || t.staffId === id) ? { ...t, ...updates } : t)
      }));
    },
    offboardStaffMember: (id) => setData((current) => ({
      ...current,
      teacherDirectory: (current.teacherDirectory || []).map((t) => (t.id === id || t.staffId === id) ? { ...t, status: 'Offboarded' } : t)
    })),
    deleteStaffMember: async (id) => {
      try {
        await api.deleteStaff(id);
      } catch (e) {
        console.warn('Backend staff delete fallback:', e);
      }
      setData((current) => ({
        ...current,
        teacherDirectory: (current.teacherDirectory || []).filter((t) => t.id !== id && t.staffId !== id)
      }));
    },
    // Dynamic Classes & Subjects Methods
    addClassLevel: (newClass) => {
      if (!newClass) return;
      setData((current) => {
        const existing = current.classLevels || [
          'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
          'JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3'
        ];
        if (existing.includes(newClass.trim())) return current;
        return {
          ...current,
          classLevels: [...existing, newClass.trim()]
        };
      });
    },
    addSubject: (newSubject) => {
      if (!newSubject) return;
      setData((current) => {
        const existing = current.subjects || [
          'Pure Mathematics', 'Mathematics', 'Physics', 'Science / Physics',
          'Literature in English', 'English Language', 'ICT / Computing',
          'Social Studies', 'French', 'Religious & Moral Education'
        ];
        if (existing.includes(newSubject.trim())) return current;
        return {
          ...current,
          subjects: [...existing, newSubject.trim()]
        };
      });
    },
    // Examination Candidate Registration Methods
    registerIndividualExam: async (regData) => {
      try {
        await api.createExamRegistration(regData);
      } catch (e) {
        console.warn('Backend exam reg fallback:', e);
      }
      setData((current) => {
        const existing = current.examRegistrations || [];
        const newReg = {
          id: `exam-reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          registeredAt: new Date().toISOString().split('T')[0],
          registeredBy: 'Academic Head / Admin',
          status: 'Registered - Hall Pass Valid',
          ...regData
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
          requisition_no: pvData.requisitionNo,
          payee_name: pvData.provider,
          payee_id: pvData.providerId,
          department: pvData.department || 'Administration',
          description: pvData.description,
          quantity: Number(pvData.qty) || 1,
          unit_cost: Number(pvData.cost || pvData.costPerItem) || 0,
          total_amount: (Number(pvData.qty) || 1) * (Number(pvData.cost || pvData.costPerItem) || 0),
          date_prepared: pvData.datePrepared
        });
      } catch (e) {
        console.warn('Backend PV create fallback:', e);
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const newPV = {
          id: `pv-${Date.now()}`,
          pvNo: pvData.pvNo || `PV-2026-${String(existing.length + 100).padStart(3, '0')}`,
          requisitionNo: pvData.requisitionNo || `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
          provider: pvData.provider || 'General Vendor',
          providerId: pvData.providerId || 'VEN-001',
          description: pvData.description || 'Expenditure Voucher',
          qty: Number(pvData.qty) || 1,
          cost: Number(pvData.cost || pvData.costPerItem) || 0,
          total: (Number(pvData.qty) || 1) * (Number(pvData.cost || pvData.costPerItem) || 0),
          datePrepared: pvData.datePrepared || new Date().toISOString().split('T')[0],
          valuedDate: pvData.valuedDate || new Date().toISOString().split('T')[0],
          auditRemarks: pvData.auditRemarks || 'Created in system.',
          status: pvData.status || 'Pending Audit',
          editedByHeadmaster: false,
          correctionsLog: []
        };
        return {
          ...current,
          paymentVouchers: [newPV, ...existing]
        };
      });
    },
    updatePaymentVoucher: (pvNo, updatedFields, editorRole = 'Headmaster / Pre-Auditor') => setData((current) => {
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
    }),
    approvePaymentVoucher: async (pvNo, actionChoice, remarks, updatedFields = null, auditorName = 'Headmaster / Pre-Auditor') => {
      try {
        await api.updatePaymentVoucherStatus(pvNo, {
          status: actionChoice === 'Pre-audit Approve PV' ? 'PRE_AUDITED' : 'APPROVED',
          auditor_name: auditorName
        });
      } catch (e) {
        console.warn('Backend PV status update fallback:', e);
      }
      setData((current) => {
        const existing = current.paymentVouchers || [];
        const statusText = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
        const updated = existing.map(p => {
          if (p.pvNo.toLowerCase() === String(pvNo).toLowerCase() || p.id === pvNo) {
            const qtyVal = Number(updatedFields?.qty !== undefined ? updatedFields.qty : p.qty) || 1;
            const costVal = Number(updatedFields?.cost !== undefined ? updatedFields.cost : (updatedFields?.costPerItem !== undefined ? updatedFields.costPerItem : (p.cost || 0))) || 0;
            const newTotal = qtyVal * costVal;
            const isEdited = !!updatedFields || p.editedByHeadmaster;
            return {
              ...p,
              ...(updatedFields || {}),
              qty: qtyVal,
              cost: costVal,
              total: newTotal,
              status: statusText,
              auditRemarks: remarks || p.auditRemarks,
              approvedBy: auditorName,
              approvedAt: new Date().toLocaleString(),
              editedByHeadmaster: isEdited,
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
    adminSetUserPassword: async ({ identifier, email, studentId, staffId, newPassword, role = 'student', fullName = '', adminName = 'System Administrator' }) => {
      const targetId = identifier || email || studentId || staffId;
      if (!targetId || !newPassword) return false;
      const cleanId = String(targetId).toLowerCase().trim();

      try {
        await api.adminSetUserPassword({
          identifier: cleanId,
          newPassword,
          role,
          fullName,
          adminName
        });
      } catch (e) {
        console.warn('Backend admin set password API call fallback:', e);
      }

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
      } catch (e) {}

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
  }), [data, refreshBackendData]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}

export const usePortalStore = usePortalData;
export const usePortalContext = usePortalData;
