import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
    { id: 'math', subject: 'Pure Mathematics', score: 91, grade: 'A', lecturer: 'Prof. Mensah', updatedAt: 'Not yet updated' },
    { id: 'physics', subject: 'Physics', score: 86, grade: 'A-', lecturer: 'Mr. Boateng', updatedAt: 'Not yet updated' },
    { id: 'english', subject: 'Literature in English', score: 88, grade: 'A-', lecturer: 'Dr. Anane', updatedAt: 'Not yet updated' },
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
    { id: 'stu-001', studentId: 'REMALJ-2026-001', fullName: 'Benjamin Edwards', dob: '2015-03-12', gender: 'Male', level: 'Grade 4', classSection: 'Section B', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', guardianPhone: '024 111 2222', homeAddress: 'Bogoso, Anikoko', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'benjamin.edwards@remaljcarewell.edu.gh' },
    { id: 'stu-002', studentId: 'REMALJ-2026-002', fullName: 'Adwoa Edwards', dob: '2014-07-22', gender: 'Female', level: 'Primary 5', classSection: 'Primary 5A', guardianName: 'Mrs. Angela Edwards', guardianEmail: 'parent@remaljcarewell.edu.gh', guardianPhone: '024 111 2222', homeAddress: 'Bogoso, Anikoko', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'adwoa.edwards@remaljcarewell.edu.gh' },
    { id: 'stu-003', studentId: 'REMALJ-2026-041', fullName: 'Abena Mensah', dob: '2013-02-05', gender: 'Female', level: 'JHS 3', classSection: '3A', guardianName: 'Mr. Kofi Mensah', guardianEmail: 'kofi.mensah@example.com', guardianPhone: '024 333 4444', homeAddress: 'Tarkwa', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'abena.mensah@remaljcarewell.edu.gh' },
    { id: 'stu-004', studentId: 'REMALJ-2026-112', fullName: 'Kwame Asante', dob: '2013-05-18', gender: 'Male', level: 'JHS 3', classSection: '3A', guardianName: 'Mrs. Ama Asante', guardianEmail: 'ama.asante@example.com', guardianPhone: '024 555 6666', homeAddress: 'Prestea', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'kwame.asante@remaljcarewell.edu.gh' },
    { id: 'stu-005', studentId: 'REMALJ-2026-088', fullName: 'Efua Darko', dob: '2014-11-30', gender: 'Female', level: 'JHS 2', classSection: '2B', guardianName: 'Mr. Yaw Darko', guardianEmail: 'yaw.darko@example.com', guardianPhone: '024 777 8888', homeAddress: 'Bogoso', enrollmentDate: '2026-09-01', status: 'Active', studentEmail: 'efua.darko@remaljcarewell.edu.gh' },
  ],
  teacherDirectory: [
    { id: 'tch-001', name: 'Mr. Samuel Amponsah', subject: 'Pure Mathematics', classAssigned: 'SH2', email: 's.amponsah@remaljcarewell.edu.gh', phone: '024 900 1100', photo: '👨‍🏫', bio: '12 years teaching experience. BSc Mathematics, University of Ghana.' },
    { id: 'tch-002', name: 'Prof. Mensah', subject: 'Mathematics', classAssigned: 'Grade 4', email: 'prof.mensah@remaljcarewell.edu.gh', phone: '024 900 1101', photo: '👨‍🏫', bio: 'PhD Mathematics Education. Passionate about early numeracy.' },
    { id: 'tch-003', name: 'Mr. Boateng', subject: 'Physics / Science', classAssigned: 'SHS & Primary', email: 'k.boateng@remaljcarewell.edu.gh', phone: '024 900 1102', photo: '👨‍🔬', bio: 'BSc Physics. Head of Science Department.' },
    { id: 'tch-004', name: 'Dr. Anane', subject: 'Literature in English', classAssigned: 'SHS', email: 'dr.anane@remaljcarewell.edu.gh', phone: '024 900 1103', photo: '👩‍🏫', bio: 'PhD English Literature. Author of two textbooks.' },
    { id: 'tch-005', name: 'Ms. Mensah', subject: 'ICT / Computing', classAssigned: 'All Levels', email: 'm.mensah@remaljcarewell.edu.gh', phone: '024 900 1104', photo: '👩‍💻', bio: 'BSc Computer Science. Cisco and Microsoft certified instructor.' },
    { id: 'tch-006', name: 'Mrs. Adjei', subject: 'English Language', classAssigned: 'JHS 2', email: 'a.adjei@remaljcarewell.edu.gh', phone: '024 900 1105', photo: '👩‍🏫', bio: 'MA English Language. Head of Languages Department.' },
    { id: 'tch-007', name: 'Ms. Sarah Mensah', subject: 'Social Studies', classAssigned: 'Grade 4', email: 's.mensah@remaljcarewell.edu.gh', phone: '024 900 1106', photo: '👩‍🏫', bio: 'BA Social Sciences. 8 years teaching experience.' },
    { id: 'tch-008', name: 'Mr. Kofi Appiah', subject: 'Mathematics', classAssigned: 'Grade 4', email: 'k.appiah@remaljcarewell.edu.gh', phone: '024 900 1107', photo: '👨‍🏫', bio: 'BEd Mathematics. Form tutor for Grade 4 Section B.' },
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
  theme: 'light',
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

  const value = useMemo(() => ({
    ...data,
    saveTimetableEntry: (entry) => setData((current) => ({
      ...current,
      timetable: current.timetable.some((item) => item.id === entry.id)
        ? current.timetable.map((item) => item.id === entry.id ? entry : item)
        : [...current.timetable, { ...entry, id: crypto.randomUUID?.() || String(Date.now()) }],
    })),
    publishResult: (result) => setData((current) => ({
      ...current,
      results: current.results.some((item) => item.subject === result.subject)
        ? current.results.map((item) => item.subject === result.subject ? { ...result, id: item.id } : item)
        : [...current.results, { ...result, id: crypto.randomUUID?.() || String(Date.now()) }],
    })),
    registerCourse: (course) => setData((current) => ({
      ...current,
      courses: current.courses.includes(course) ? current.courses : [...current.courses, course],
    })),
    requestReport: ({ child, semester, note }) => setData((current) => ({
      ...current,
      reportRequests: [{ id: crypto.randomUUID?.() || String(Date.now()), child, semester, note, status: 'Requested', requestedAt: new Date().toLocaleString() }, ...current.reportRequests],
    })),
    uploadRequestedReport: ({ id, fileName, fileData, fileType }) => setData((current) => {
      const request = current.reportRequests.find((item) => item.id === id);
      if (!request) return current;
      const uploadedAt = new Date().toLocaleString();
      const published = { id, child: request.child, semester: request.semester, fileName, fileData, fileType, uploadedAt };
      return {
        ...current,
        reportRequests: current.reportRequests.map((item) => item.id === id ? { ...item, status: 'Available', fileName, uploadedAt } : item),
        publishedReports: [published, ...current.publishedReports.filter((item) => item.id !== id)],
      };
    }),
    logIncident: ({ category, person, severity }) => setData((current) => ({
      ...current,
      incidents: [{ id: crypto.randomUUID?.() || String(Date.now()), category, person, severity, status: 'Open', loggedAt: new Date().toLocaleString() }, ...current.incidents],
    })),
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
    sendMessage: ({ from, senderRole, to, recipient, subject, body }) => setData((current) => ({
      ...current,
      messages: [{ id: crypto.randomUUID?.() || String(Date.now()), from, senderRole, to, recipient, subject, body, sentAt: new Date().toLocaleString() }, ...current.messages],
    })),
    publishAssignment: ({ title, instructions, audience, due }) => setData((current) => ({
      ...current,
      assignments: [{ id: crypto.randomUUID?.() || String(Date.now()), title, instructions, audience, due, author: 'Mr. Samuel Amponsah', status: 'Published' }, ...current.assignments],
    })),
    submitApplication: (application) => setData((current) => ({
      ...current,
      applications: [{ id: crypto.randomUUID?.() || String(Date.now()), ...application, status: 'Submitted', submittedAt: new Date().toLocaleString() }, ...(current.applications || [])],
    })),
    updateApplicationStatus: (id, status) => setData((current) => ({
      ...current,
      applications: (current.applications || []).map((item) => item.id === id ? { ...item, status } : item),
    })),
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
    onboardStudent: (student) => setData((current) => {
      const studentId = `REMALJ-${new Date().getFullYear()}-${String((current.onboardedStudents || []).length + 1).padStart(3, '0')}`;
      const newStudent = {
        id: crypto.randomUUID?.() || String(Date.now()),
        studentId,
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
    }),
    updateOnboardedStudent: (id, updates) => setData((current) => ({
      ...current,
      onboardedStudents: (current.onboardedStudents || []).map((s) => s.id === id ? { ...s, ...updates } : s),
    })),
    deleteOnboardedStudent: (id) => setData((current) => ({
      ...current,
      onboardedStudents: (current.onboardedStudents || []).filter((s) => s.id !== id),
    })),
    recordFeePayment: ({ id, paidAmount, paymentDate, paymentMethod = 'Mobile Money', notes = '' }) => setData((current) => {
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
    }),
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
    sendAccountantMessage: (msg) => setData((current) => ({
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
    })),
  }), [data]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}
