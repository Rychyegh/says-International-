import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'remalj-portal-live-data-v1';

const INITIAL_DATA = {
  timetable: [
    { id: 'math-mon', day: 'Monday', time: '08:00 AM', subject: 'Pure Mathematics', room: 'Room 402', lecturer: 'Prof. Mensah' },
    { id: 'physics-tue', day: 'Tuesday', time: '10:30 AM', subject: 'Physics Lab', room: 'Science Block 1', lecturer: 'Mr. Boateng' },
    { id: 'english-wed', day: 'Wednesday', time: '08:00 AM', subject: 'Literature in English', room: 'Auditorium B', lecturer: 'Dr. Anane' },
    { id: 'ict-mon', day: 'Monday', time: '01:00 PM', subject: 'ICT Project', room: 'Lab 2', lecturer: 'Ms. Mensah' },
    { id: 'english-tue', day: 'Tuesday', time: '01:00 PM', subject: 'English Essay', room: 'Room 204', lecturer: 'Mrs. Adjei' },
    { id: 'math-wed', day: 'Wednesday', time: '01:00 PM', subject: 'Mathematics', room: 'Room 402', lecturer: 'Prof. Mensah' },
  ],
  results: [
    { id: 'math', subject: 'Pure Mathematics', score: 91, grade: 'A', lecturer: 'Prof. Mensah', status: 'Approved', declineNote: null, updatedAt: '20 Aug 2026' },
    { id: 'physics', subject: 'Physics', score: 86, grade: 'A-', lecturer: 'Mr. Boateng', status: 'Pending Approval', declineNote: null, updatedAt: '21 Aug 2026' },
    { id: 'english', subject: 'Literature in English', score: 48, grade: 'F', lecturer: 'Dr. Anane', status: 'Declined', declineNote: 'Calculation Error: Exam mark mismatch on section B total. Please re-check and resubmit.', updatedAt: '22 Aug 2026' },
  ],
  courses: ['Pure Mathematics', 'Physics', 'Literature in English'],
  reportRequests: [],
  publishedReports: [],
  incidents: [
    { id: 'case-001', category: 'Safeguarding', person: 'Student A', severity: 'Restricted', status: 'Under review', loggedAt: '20 Aug 2026, 08:35' },
    { id: 'case-002', category: 'Health & welfare', person: 'Student B', severity: 'Confidential', status: 'Follow-up due', loggedAt: '19 Aug 2026, 14:10' },
  ],
  assetTasks: [
    { id: 'asset-001', asset: 'Bus 01', task: 'Quarterly safety inspection', owner: 'Transport lead', status: 'Scheduled', due: '23 Aug 2026' },
    { id: 'asset-002', asset: 'ICT Lab 2', task: 'Replace projector lamp', owner: 'Facilities', status: 'In progress', due: '22 Aug 2026' },
  ],
  documentation: [
    { id: 'doc-001', title: 'System architecture and integration register', owner: 'ICT Administration', status: 'Current', updatedAt: '15 Aug 2026' },
    { id: 'doc-002', title: 'Backup and disaster recovery runbook', owner: 'ICT Administration', status: 'Review due', updatedAt: '01 Aug 2026' },
    { id: 'doc-003', title: 'Safeguarding access-control procedure', owner: 'Designated Safeguarding Lead', status: 'Current', updatedAt: '18 Aug 2026' },
  ],
  acceptanceChecks: [
    { id: 'functional', label: 'Functional workflows verified', done: true },
    { id: 'roles', label: 'Role and access testing completed', done: false },
    { id: 'migration', label: 'Data migration validation completed', done: false },
    { id: 'recovery', label: 'Backup and recovery test evidenced', done: false },
    { id: 'training', label: 'Training and competency checks recorded', done: false },
  ],
  academicCalendar: [
    { id: 'cal-001', title: 'Term 1 resumes', start: '2026-09-08', end: '2026-09-08', type: 'Resumption' },
    { id: 'cal-002', title: 'Mid-term vacation', start: '2026-10-23', end: '2026-10-30', type: 'Vacation' },
    { id: 'cal-003', title: 'End-of-term examinations', start: '2026-11-23', end: '2026-12-04', type: 'Assessment' },
  ],
  feeAccounts: [
    { id: 'fee-benjamin', child: 'Benjamin Edwards', school: 'REMALJ Carewell Inspirational School', term: 'Term 1 · 2026', billed: 4800, paid: 4800, status: 'Paid' },
    { id: 'fee-adwoa', child: 'Adwoa Edwards', school: 'REMALJ Carewell Inspirational School', term: 'Term 1 · 2026', billed: 4800, paid: 3200, status: 'Balance due' },
  ],
  messages: [
    { id: 'message-001', from: 'Mr. Samuel Amponsah', senderRole: 'Staff', to: 'Parents', recipient: 'Mrs. Angela Edwards', subject: 'Academic update', body: 'Term results will be published after moderation.', sentAt: '20 Aug 2026, 09:15' },
  ],
  assignments: [
    { id: 'assignment-001', title: 'Advanced Calculus Thesis', instructions: 'Submit the completed problem set with working.', audience: 'SH2 Class Group', due: '2026-10-24', author: 'Mr. Samuel Amponsah', status: 'Published' },
  ],
  applications: [
    { id: 'app-001', learner: 'Akosua Agyeman', guardian: 'Mr. Kwesi Agyeman', email: 'kwesi.agyeman@example.com', phone: '024 000 0000', level: 'JHS 1', status: 'Documents review', submittedAt: '20 Aug 2026, 09:00' },
  ],
  serviceRecords: [
    { id: 'service-001', module: 'Smart identity & pickup', person: 'Benjamin Edwards', detail: 'Pickup card verified for Mrs. Angela Edwards', status: 'Approved', recordedAt: '20 Aug 2026, 08:20' },
    { id: 'service-002', module: 'FACU health & welfare', person: 'Adwoa Edwards', detail: 'First-aid follow-up scheduled', status: 'Follow-up', recordedAt: '19 Aug 2026, 14:10' },
  ],
  profiles: {
    teacher: { name: 'Mr. Samuel Amponsah', photo: '' },
    parent: { name: 'Mrs. Angela Edwards', photo: '' },
    student: { name: 'Kwame Edwards', photo: '' },
    admin: { name: 'Mr. John Admin', photo: '' },
    accountant: { name: 'Mrs. Grace Accountant', photo: '' },
  },
  onboardedStudents: [
    { id: 'stu-001', studentId: 'REMALJ-2026-001', rfidCardCode: '0009841234', fullName: 'Benjamin Edwards', dob: '2015-03-12', gender: 'Male', level: 'Grade 4', classSection: 'Section B', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', guardianPhone: '024 111 2222', homeAddress: 'Bogoso, Anikoko', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'benjamin.edwards@remaljcarewell.edu.gh' },
    { id: 'stu-002', studentId: 'REMALJ-2026-002', rfidCardCode: '0014298132', fullName: 'Adwoa Edwards', dob: '2014-07-22', gender: 'Female', level: 'Primary 5', classSection: 'Primary 5A', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', guardianPhone: '024 111 2222', homeAddress: 'Bogoso, Anikoko', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'adwoa.edwards@remaljcarewell.edu.gh' },
    { id: 'stu-003', studentId: 'REMALJ-2026-041', rfidCardCode: '0008431920', fullName: 'Abena Mensah', dob: '2013-02-05', gender: 'Female', level: 'JHS 3', classSection: '3A', guardianName: 'Mr. Kofi Mensah', guardianEmail: 'kofi.mensah@example.com', guardianPhone: '024 333 4444', homeAddress: 'Tarkwa', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'abena.mensah@remaljcarewell.edu.gh' },
    { id: 'stu-004', studentId: 'REMALJ-2026-112', rfidCardCode: '10485721', fullName: 'Kwame Asante', dob: '2013-05-18', gender: 'Male', level: 'JHS 3', classSection: '3A', guardianName: 'Mrs. Ama Asante', guardianEmail: 'ama.asante@example.com', guardianPhone: '024 555 6666', homeAddress: 'Prestea', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'kwame.asante@remaljcarewell.edu.gh' },
    { id: 'stu-005', studentId: 'REMALJ-2026-088', rfidCardCode: '82930419', fullName: 'Efua Darko', dob: '2014-11-30', gender: 'Female', level: 'JHS 2', classSection: '2B', guardianName: 'Mr. Yaw Darko', guardianEmail: 'yaw.darko@example.com', guardianPhone: '024 777 8888', homeAddress: 'Bogoso', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'efua.darko@remaljcarewell.edu.gh' },
  ],
  teacherDirectory: [
    { id: 'tch-001', staffId: 'STF-2026-001', name: 'Mr. Samuel Amponsah', subject: 'Pure Mathematics', classAssigned: 'SH2', email: 's.amponsah@remaljcarewell.edu.gh', phone: '024 900 1100', photo: '👨‍🏫', role: 'Senior Tutor & Form Master', status: 'Active', bio: '12 years teaching experience. BSc Mathematics, University of Ghana.' },
    { id: 'tch-002', staffId: 'STF-2026-002', name: 'Prof. Mensah', subject: 'Mathematics', classAssigned: 'Grade 4', email: 'prof.mensah@remaljcarewell.edu.gh', phone: '024 900 1101', photo: '👨‍🏫', role: 'Mathematics Department Head', status: 'Active', bio: 'PhD Mathematics Education. Passionate about early numeracy.' },
    { id: 'tch-003', staffId: 'STF-2026-003', name: 'Mr. Boateng', subject: 'Physics / Science', classAssigned: 'SHS & Primary', email: 'k.boateng@remaljcarewell.edu.gh', phone: '024 900 1102', photo: '👨‍🔬', role: 'Science Department Head', status: 'Active', bio: 'BSc Physics. Head of Science Department.' },
    { id: 'tch-004', staffId: 'STF-2026-004', name: 'Dr. Anane', subject: 'Literature in English', classAssigned: 'SHS', email: 'dr.anane@remaljcarewell.edu.gh', phone: '024 900 1103', photo: '👩‍🏫', role: 'Languages Senior Lecturer', status: 'Active', bio: 'PhD English Literature. Author of two textbooks.' },
    { id: 'tch-005', staffId: 'STF-2026-005', name: 'Ms. Mensah', subject: 'ICT / Computing', classAssigned: 'All Levels', email: 'm.mensah@remaljcarewell.edu.gh', phone: '024 900 1104', photo: '👩‍💻', role: 'ICT Administrator', status: 'Active', bio: 'BSc Computer Science. Cisco and Microsoft certified instructor.' },
    { id: 'tch-006', staffId: 'STF-2026-006', name: 'Mrs. Adjei', subject: 'English Language', classAssigned: 'JHS 2', email: 'a.adjei@remaljcarewell.edu.gh', phone: '024 900 1105', photo: '👩‍🏫', role: 'Languages Department Head', status: 'Active', bio: 'MA English Language. Head of Languages Department.' },
    { id: 'tch-007', staffId: 'STF-2026-007', name: 'Ms. Sarah Mensah', subject: 'Social Studies', classAssigned: 'Grade 4', email: 's.mensah@remaljcarewell.edu.gh', phone: '024 900 1106', photo: '👩‍🏫', role: 'Subject Teacher', status: 'Active', bio: 'BA Social Sciences. 8 years teaching experience.' },
    { id: 'tch-008', staffId: 'STF-2026-008', name: 'Mr. Kofi Appiah', subject: 'Mathematics', classAssigned: 'Grade 4', email: 'k.appiah@remaljcarewell.edu.gh', phone: '024 900 1107', photo: '👨‍🏫', role: 'Form Tutor', status: 'Active', bio: 'BEd Mathematics. Form tutor for Grade 4 Section B.' },
  ],
  studentFees: [
    { id: 'fee-stu-001', studentId: 'REMALJ-2026-001', studentName: 'Benjamin Edwards', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', term: 'Term 1 · 2026', billedAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', dueDate: '2026-09-15', paymentDate: '2026-09-01' },
    { id: 'fee-stu-002', studentId: 'REMALJ-2026-002', studentName: 'Adwoa Edwards', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', term: 'Term 1 · 2026', billedAmount: 4800, paidAmount: 3200, balance: 1600, status: 'Balance Due', dueDate: '2026-09-15', paymentDate: '2026-09-05' },
    { id: 'fee-stu-003', studentId: 'REMALJ-2026-041', studentName: 'Abena Mensah', guardianName: 'Mr. Kofi Mensah', guardianEmail: 'kofi.mensah@example.com', term: 'Term 1 · 2026', billedAmount: 5200, paidAmount: 5200, balance: 0, status: 'Paid', dueDate: '2026-09-15', paymentDate: '2026-08-30' },
    { id: 'fee-stu-004', studentId: 'REMALJ-2026-112', studentName: 'Kwame Asante', guardianName: 'Mrs. Ama Asante', guardianEmail: 'ama.asante@example.com', term: 'Term 1 · 2026', billedAmount: 5200, paidAmount: 2000, balance: 3200, status: 'Balance Due', dueDate: '2026-09-15', paymentDate: '2026-09-10' },
    { id: 'fee-stu-005', studentId: 'REMALJ-2026-088', studentName: 'Efua Darko', guardianName: 'Mr. Yaw Darko', guardianEmail: 'yaw.darko@example.com', term: 'Term 1 · 2026', billedAmount: 4900, paidAmount: 0, balance: 4900, status: 'Not Paid', dueDate: '2026-09-15', paymentDate: null },
  ],
  accountantMessages: [
    { id: 'acc-msg-001', from: 'Mrs. Grace Accountant', senderRole: 'Accountant', to: 'Mrs. Ama Asante', recipientEmail: 'ama.asante@example.com', studentName: 'Kwame Asante', subject: 'Outstanding Fees Reminder', body: 'Dear Mrs. Asante, this is a friendly reminder that Kwame has an outstanding balance of GHS 3,200 for Term 1. Please arrange payment by 30th September to avoid late fees. Thank you.', sentAt: '25 Aug 2026, 10:30 AM', status: 'Sent' },
    { id: 'acc-msg-002', from: 'Mrs. Grace Accountant', senderRole: 'Accountant', to: 'Mr. Yaw Darko', recipientEmail: 'yaw.darko@example.com', studentName: 'Efua Darko', subject: 'Urgent: Fee Payment Required', body: 'Dear Mr. Darko, Efua\'s school fees for Term 1 (GHS 4,900) are currently outstanding. Please contact the accounts office to discuss payment arrangements. We appreciate your prompt attention to this matter.', sentAt: '26 Aug 2026, 09:15 AM', status: 'Sent' },
  ],
  busRoutes: [
    { id: 'A', name: 'Bus 01 – Bogoso Route', color: '#16a34a', stops: ['School Grounds', 'Anikoko Junction', 'Bogoso Market', 'Post Office'], driverName: 'Mr. Kweku Mensah', driverPhone: '024 444 5555', currentLat: 6.409, currentLng: -1.952, speed: '38 km/h', status: 'On Route' },
    { id: 'B', name: 'Bus 02 – Tarkwa Route', color: '#2563eb', stops: ['School Grounds', 'Tamso Junction', 'Tarkwa Main Station', 'University Roundabout'], driverName: 'Mr. Emmanuel Darko', driverPhone: '024 555 6666', currentLat: 6.415, currentLng: -1.96, speed: '45 km/h', status: 'On Route' }
  ],
  theme: 'light',
  backendConnected: false,
};

const PortalDataContext = createContext(null);

function readData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
  } catch {
    return INITIAL_DATA;
  }
}

export function PortalDataProvider({ children }) {
  const [data, setData] = useState(readData);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.theme || 'light';
  }, [data.theme]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) setData(JSON.parse(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Sync with live backend API endpoints on mount & token availability
  const refreshBackendData = useCallback(async () => {
    try {
      // 1. Bus Routes
      try {
        const routesRes = await api.getBusRoutes();
        if (routesRes && routesRes.routes) {
          setData(current => ({ ...current, busRoutes: routesRes.routes, backendConnected: true }));
        }
      } catch (e) { /* fallback to local */ }

      // 2. Timetable
      try {
        const timetables = await api.getTimetables();
        if (Array.isArray(timetables) && timetables.length > 0) {
          const mapped = timetables.map(t => ({
            id: t.id,
            day: t.day,
            time: `${t.start_time}${t.end_time ? ' - ' + t.end_time : ''}`,
            subject: t.subject,
            room: t.room,
            lecturer: t.lecturer_name,
            classLevel: t.class_level
          }));
          setData(current => ({ ...current, timetable: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 3. Results
      try {
        const results = await api.getResults();
        if (Array.isArray(results) && results.length > 0) {
          const mapped = results.map(r => ({
            id: r.id,
            subject: r.subject,
            score: r.score,
            grade: r.grade,
            lecturer: r.lecturer,
            updatedAt: r.updated_at
          }));
          setData(current => ({ ...current, results: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 4. Report Requests
      try {
        const reports = await api.getReportRequests();
        if (Array.isArray(reports) && reports.length > 0) {
          const mapped = reports.map(r => ({
            id: r.id,
            child: r.child_name,
            semester: r.semester,
            note: r.note,
            status: r.status,
            fileName: r.file_name,
            fileUrl: r.file_url,
            requestedAt: r.requested_at,
            uploadedAt: r.uploaded_at
          }));
          setData(current => ({ ...current, reportRequests: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 5. Incidents
      try {
        const incidents = await api.getIncidents();
        if (Array.isArray(incidents) && incidents.length > 0) {
          const mapped = incidents.map(i => ({
            id: i.id,
            category: i.category,
            person: i.person,
            severity: i.severity,
            status: i.status,
            loggedAt: i.logged_at
          }));
          setData(current => ({ ...current, incidents: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 6. Asset Tasks
      try {
        const tasks = await api.getAssetTasks();
        if (Array.isArray(tasks) && tasks.length > 0) {
          const mapped = tasks.map(t => ({
            id: t.id,
            asset: t.asset,
            task: t.task,
            owner: t.owner,
            status: t.status,
            due: t.due_date
          }));
          setData(current => ({ ...current, assetTasks: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 7. Messages
      try {
        const msgs = await api.getMessages();
        if (Array.isArray(msgs) && msgs.length > 0) {
          const mapped = msgs.map(m => ({
            id: m.id,
            from: m.sender_name,
            senderRole: m.sender_role,
            to: m.recipient_role,
            recipient: m.recipient_name,
            subject: m.subject,
            body: m.body,
            sentAt: m.sent_at
          }));
          setData(current => ({ ...current, messages: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 8. Assignments
      try {
        const assignments = await api.getAssignments();
        if (Array.isArray(assignments) && assignments.length > 0) {
          const mapped = assignments.map(a => ({
            id: a.id,
            title: a.title,
            instructions: a.instructions,
            audience: a.audience,
            due: a.due_date,
            author: a.author_name,
            status: a.status
          }));
          setData(current => ({ ...current, assignments: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 9. Admissions Applications
      try {
        const apps = await api.getApplications();
        if (Array.isArray(apps) && apps.length > 0) {
          const mapped = apps.map(a => ({
            id: a.id,
            learner: a.learner_name,
            guardian: a.guardian_name,
            email: a.contact_email,
            phone: a.contact_phone,
            level: a.applying_level,
            status: a.status,
            submittedAt: a.submitted_at,
            office_use_notes: a.office_use_notes
          }));
          setData(current => ({ ...current, applications: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 10. Onboarded Students
      try {
        const students = await api.getStudents();
        if (Array.isArray(students) && students.length > 0) {
          const mapped = students.map(s => ({
            id: s.id,
            studentId: s.student_code || s.id,
            fullName: s.full_name,
            dob: s.dob,
            gender: s.gender,
            level: s.class_level,
            classSection: s.class_section || 'A',
            guardianName: s.guardian_name,
            guardianEmail: s.guardian_email,
            guardianPhone: s.guardian_phone,
            homeAddress: s.home_address,
            enrollmentDate: s.enrollment_date || new Date().toISOString().split('T')[0],
            status: s.status || 'Active',
            studentEmail: s.student_email
          }));
          setData(current => ({ ...current, onboardedStudents: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

      // 11. Fees
      try {
        const fees = await api.getFees();
        if (Array.isArray(fees) && fees.length > 0) {
          const mapped = fees.map(f => ({
            id: f.id,
            studentId: f.student_id || f.student_code,
            studentName: f.student_name,
            guardianName: f.guardian_name,
            guardianEmail: f.guardian_email,
            term: f.term || 'Term 1 · 2026',
            billedAmount: f.billed_amount,
            paidAmount: f.paid_amount,
            balance: f.balance,
            status: f.status,
            dueDate: f.due_date,
            paymentDate: f.payment_date
          }));
          setData(current => ({ ...current, studentFees: mapped, backendConnected: true }));
        }
      } catch (e) { /* fallback */ }

    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  const value = useMemo(() => ({
    ...data,
    refreshBackendData,
    saveTimetableEntry: (entry) => setData((current) => ({
      ...current,
      timetable: current.timetable.some((item) => item.id === entry.id)
        ? current.timetable.map((item) => item.id === entry.id ? entry : item)
        : [...current.timetable, { ...entry, id: crypto.randomUUID?.() || String(Date.now()) }],
    })),
    publishResult: (result) => setData((current) => ({
      ...current,
      results: current.results.some((item) => item.subject === result.subject)
        ? current.results.map((item) => item.subject === result.subject ? { ...result, id: item.id, status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() } : item)
        : [...current.results, { ...result, id: crypto.randomUUID?.() || String(Date.now()), status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() }],
    })),
    approveResult: (id) => setData((current) => ({
      ...current,
      results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Approved', declineNote: null, approvedAt: new Date().toLocaleString() } : item),
    })),
    declineResult: (id, note) => setData((current) => ({
      ...current,
      results: (current.results || []).map((item) => item.id === id ? { ...item, status: 'Declined', declineNote: note || 'Error detected in score breakdown by Academic Head.', declinedAt: new Date().toLocaleString() } : item),
    })),
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
      try {
        await api.submitApplication({
          learner_name: application.learner || application.fullName,
          guardian_name: application.guardian || application.guardianName,
          contact_email: application.email || application.guardianEmail,
          contact_phone: application.phone || application.guardianPhone,
          applying_level: application.level || 'JHS 1',
          form_data: application
        });
      } catch (e) {
        console.warn('Backend application submit fallback:', e);
      }
      setData((current) => ({
        ...current,
        applications: [{ id: crypto.randomUUID?.() || String(Date.now()), ...application, status: 'Submitted', submittedAt: new Date().toLocaleString() }, ...(current.applications || [])],
      }));
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
    updateApplicationOfficeUse: (id, officeData) => setData((current) => ({
      ...current,
      applications: (current.applications || []).map((item) => item.id === id ? { ...item, ...officeData } : item),
    })),
    deleteApplication: (id) => setData((current) => ({
      ...current,
      applications: (current.applications || []).filter((item) => item.id !== id),
    })),
    addServiceRecord: ({ module, person, detail, status }) => setData((current) => ({
      ...current,
      serviceRecords: [{ id: crypto.randomUUID?.() || String(Date.now()), module, person, detail, status, recordedAt: new Date().toLocaleString() }, ...(current.serviceRecords || [])],
    })),
    updateProfile: (portal, updates) => setData((current) => ({ ...current, profiles: { ...current.profiles, [portal]: { ...current.profiles[portal], ...updates } } })),
    setTheme: (theme) => setData((current) => ({ ...current, theme })),
    onboardStudent: async (student) => {
      try {
        await api.onboardStudent({
          fullName: student.fullName,
          dob: student.dob,
          gender: student.gender,
          level: student.level,
          classSection: student.classSection || 'A',
          guardianName: student.guardianName,
          guardianEmail: student.guardianEmail,
          guardianPhone: student.guardianPhone,
          homeAddress: student.homeAddress,
          initialBilledAmount: student.level.includes('JHS') ? 5200 : student.level.includes('SHS') ? 5800 : 4800,
          term: 'Term 1 · 2026'
        });
      } catch (e) {
        console.warn('Backend onboard student fallback:', e);
      }

      setData((current) => {
        const studentId = `REMALJ-${new Date().getFullYear()}-${String((current.onboardedStudents || []).length + 1).padStart(3, '0')}`;
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
          studentEmail: `${student.fullName.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`,
        };
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
      onboardedStudents: (current.onboardedStudents || []).map((s) => s.id === id ? { ...s, ...updates } : s),
    })),
    deleteOnboardedStudent: (id) => setData((current) => ({
      ...current,
      onboardedStudents: (current.onboardedStudents || []).filter((s) => s.id !== id),
    })),
    recordFeePayment: async ({ id, paidAmount, paymentDate, paymentMethod = 'Mobile Money', notes = '' }) => {
      try {
        await api.recordFeePayment(id, { paidAmount: Number(paidAmount), paymentMethod, paymentDate, notes });
      } catch (e) {
        console.warn('Backend fee payment fallback:', e);
      }

      setData((current) => {
        const updatedFees = (current.studentFees || []).map((fee) => {
          if (fee.id !== id) return fee;
          const addAmount = Number(paidAmount) || 0;
          const newPaid = fee.paidAmount + addAmount;
          const newBalance = Math.max(0, fee.billedAmount - newPaid);
          const newStatus = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Balance Due' : 'Not Paid';
          return {
            ...fee,
            paidAmount: newPaid,
            balance: newBalance,
            status: newStatus,
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            lastPaymentMethod: paymentMethod,
            lastNotes: notes,
          };
        });
        const targetFee = (current.studentFees || []).find((f) => f.id === id);
        const updatedFeeAccounts = (current.feeAccounts || []).map((acc) => {
          if (!targetFee || acc.child !== targetFee.studentName) return acc;
          const addAmount = Number(paidAmount) || 0;
          const newPaid = acc.paid + addAmount;
          const newBalance = Math.max(0, acc.billed - newPaid);
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
    addStaffMember: (staffData) => setData((current) => {
      const currentList = current.teacherDirectory || [];
      const staffId = staffData.staffId || `STF-2026-${String(currentList.length + 1).padStart(3, '0')}`;
      const newStaff = {
        id: crypto.randomUUID?.() || String(Date.now()),
        staffId,
        name: staffData.name,
        subject: staffData.subject || 'General Education',
        classAssigned: staffData.classAssigned || 'Grade 4',
        email: staffData.email || `${(staffData.name || 'staff').toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`,
        phone: staffData.phone || '024 900 1100',
        role: staffData.role || 'Subject Teacher',
        status: staffData.status || 'Active',
        joinedDate: staffData.joinedDate || new Date().toISOString().split('T')[0],
        photo: staffData.photo || (staffData.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'),
        bio: staffData.bio || `${staffData.role || 'Teacher'} at REMALJ Carewell Inspirational School.`
      };
      return {
        ...current,
        teacherDirectory: [newStaff, ...currentList]
      };
    }),
    updateStaffMember: (id, updates) => setData((current) => ({
      ...current,
      teacherDirectory: (current.teacherDirectory || []).map((t) => (t.id === id || t.staffId === id) ? { ...t, ...updates } : t)
    })),
    offboardStaffMember: (id) => setData((current) => ({
      ...current,
      teacherDirectory: (current.teacherDirectory || []).map((t) => (t.id === id || t.staffId === id) ? { ...t, status: 'Offboarded' } : t)
    })),
    deleteStaffMember: (id) => setData((current) => ({
      ...current,
      teacherDirectory: (current.teacherDirectory || []).filter((t) => t.id !== id && t.staffId !== id)
    })),
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
  }), [data, refreshBackendData]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}
