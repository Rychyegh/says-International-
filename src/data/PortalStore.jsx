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
  },
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
    addServiceRecord: ({ module, person, detail, status }) => setData((current) => ({
      ...current,
      serviceRecords: [{ id: crypto.randomUUID?.() || String(Date.now()), module, person, detail, status, recordedAt: new Date().toLocaleString() }, ...(current.serviceRecords || [])],
    })),
    updateProfile: (portal, updates) => setData((current) => ({ ...current, profiles: { ...current.profiles, [portal]: { ...current.profiles[portal], ...updates } } })),
    setTheme: (theme) => setData((current) => ({ ...current, theme })),
  }), [data]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) throw new Error('usePortalData must be used inside PortalDataProvider');
  return context;
}
