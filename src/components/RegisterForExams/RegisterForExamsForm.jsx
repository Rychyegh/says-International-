import ViewportModal from '../Modal/ViewportModal';
import React, { useState } from 'react';
import { usePortalData } from '../../data/PortalStore';
import {
  FileCheck,
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Building2,
  BookOpen,
  Award,
  AlertCircle,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Trash2
} from 'lucide-react';
import { CLASS_LEVELS, ALL_SUB_CLASSES, getMappedSubClasses, formatDetailedClass } from '../../data/classStructure';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Integrated Science',
  'Social Studies',
  'ICT / Computing',
  'Religious & Moral Education',
  'Ghanaian Language (Fante)',
  'French',
  'BDT / Pre-Technical Skills',
  'Physical Education'
];

const EXAM_TYPES = [
  'End-of-Term Final Examination',
  'Mid-Term Mock Assessment',
  'BECE National Examination Mock',
  'Creche Terminal Developmental Evaluation',
  'Special Placement Assessment'
];

const EXAM_CENTERS = [
  'Main Examination Hall A',
  'Auditorium Hall B',
  'Science Block 1 (Lab A)',
  'ICT Lab 1',
  'Creche Activity Center',
  'Junior High Pavilion'
];

export default function RegisterForExamsForm({ setM, students: propStudents }) {
  const {
    academicSettings,
    onboardedStudents,
    examRegistrations,
    registerIndividualExam,
    registerClassExams,
    cancelExamRegistration,
    subjects: catalogSubjects,
    teachingAssignments,
    addSubject: saveSubjectToDb
  } = usePortalData();

  const allStudents = propStudents || onboardedStudents || [];
  const currentRegistrations = examRegistrations || [];

  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'bulk' | 'roster'
  const [isPrintingRoster, setIsPrintingRoster] = useState(false);

  // Individual Registration State
  const [indivSearch, setIndivSearch] = useState('');
  const [indivSort, setIndivSort] = useState('AZ'); // 'AZ' | 'ZA' | 'Class'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [indivYear, setIndivYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [indivTerm, setIndivTerm] = useState(academicSettings?.academicTerm || 'Term 1');
  const [indivExamType, setIndivExamType] = useState(EXAM_TYPES[0]);
  const [indivCenter, setIndivCenter] = useState(EXAM_CENTERS[0]);
  const [indivIndexNum, setIndivIndexNum] = useState('');
  const [indivNotes, setIndivNotes] = useState('');

  // Student picker filters
  const [indivClassFilter, setIndivClassFilter] = useState('All');
  const [indivSubClassFilter, setIndivSubClassFilter] = useState('All');
  const [indivGenderFilter, setIndivGenderFilter] = useState('All');
  const [indivRegFilter, setIndivRegFilter] = useState('All'); // 'All' | 'Not Registered' | 'Registered'

  // ── Subject Pool ─────────────────────────────────────────────────────────
  // Pull subjects from the database (catalog subjects and subjects added/assigned on the staff and classes page)
  const SUBJECTS_STORAGE_KEY = 'rcis_exam_subjects_pool';

  const loadPersistedSubjects = () => {
    try {
      const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          return saved;
        }
      }
    } catch (e) {}
    return [];
  };

  // Dynamically compute subjects pulled directly from DB (classes & staff catalog + teaching assignments)
  const dbSubjects = React.useMemo(() => {
    const listFromCatalog = (catalogSubjects || []).map((subject) => String(subject || '').trim()).filter(Boolean);
    const listFromAssignments = (teachingAssignments || [])
      .flatMap((t) => (Array.isArray(t?.subjects) ? t.subjects : [t?.subject, t?.department]))
      .map((s) => String(s || '').trim())
      .filter(Boolean);
    const persisted = loadPersistedSubjects();
    return Array.from(new Set([...listFromCatalog, ...listFromAssignments, ...persisted, ...DEFAULT_SUBJECTS]));
  }, [catalogSubjects, teachingAssignments]);

  const [allSubjects, setAllSubjects] = useState(dbSubjects);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  React.useEffect(() => {
    setAllSubjects((current) => {
      const merged = Array.from(new Set([...current, ...dbSubjects]));
      return merged.length === current.length ? current : merged;
    });
  }, [dbSubjects]);

  // Persist pool to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(allSubjects));
    } catch (e) {}
  }, [allSubjects]);

  // Start with all subjects pre-selected for individual
  const [selectedSubjects, setSelectedSubjects] = useState(dbSubjects);

  const filteredAllStudents = React.useMemo(() => {
    let list = [...(allStudents || [])];

    // Text search (name / ID / class)
    if (indivSearch.trim()) {
      const q = indivSearch.toLowerCase();
      list = list.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.studentId || s.id || '').toLowerCase().includes(q) ||
        (s.level || '').toLowerCase().includes(q)
      );
    }

    // Class / level filter
    if (indivClassFilter !== 'All') {
      list = list.filter(s => (s.level || '').toLowerCase().trim() === indivClassFilter.toLowerCase().trim());
    }

    // Sub-class / Section filter
    if (indivSubClassFilter !== 'All') {
      const subQ = indivSubClassFilter.toLowerCase().trim();
      const cleanSubQ = subQ.replace('section ', '').replace('stream ', '').trim();
      list = list.filter(s => {
        const sec = (s.classSection || s.section || s.subClass || s.sub_class || s.stream || s.class_section || '').toLowerCase().trim();
        if (!sec) return false;
        return sec === subQ || sec === cleanSubQ || sec.includes(cleanSubQ) || subQ.includes(sec);
      });
    }

    // Gender filter
    if (indivGenderFilter !== 'All') {
      list = list.filter(s => (s.gender || '').toLowerCase() === indivGenderFilter.toLowerCase());
    }

    // Registration status filter
    if (indivRegFilter === 'Not Registered') {
      const regIds = new Set(currentRegistrations.map(r => r.studentId));
      list = list.filter(s => !regIds.has(s.studentId || s.id));
    } else if (indivRegFilter === 'Registered') {
      const regIds = new Set(currentRegistrations.map(r => r.studentId));
      list = list.filter(s => regIds.has(s.studentId || s.id));
    }

    // Sort
    list.sort((a, b) => {
      if (indivSort === 'ZA') return (b.fullName || b.name || '').localeCompare(a.fullName || a.name || '');
      if (indivSort === 'Class') return (a.level || '').localeCompare(b.level || '') || (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
      return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
    });
    return list;
  }, [allStudents, indivSearch, indivSort, indivClassFilter, indivSubClassFilter, indivGenderFilter, indivRegFilter, currentRegistrations]);

  // Bulk Registration State
  const [bulkClass, setBulkClass] = useState('JHS 3');
  const [bulkYear, setBulkYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [bulkTerm, setBulkTerm] = useState(academicSettings?.academicTerm || 'Term 1');
  const [bulkExamType, setBulkExamType] = useState(EXAM_TYPES[0]);
  const [bulkCenter, setBulkCenter] = useState(EXAM_CENTERS[0]);
  // Bulk starts with all subjects pre-selected
  const [bulkSubjects, setBulkSubjects] = useState(loadPersistedSubjects);
  const [bulkPrefix, setBulkPrefix] = useState('EXAM-2026-');
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);

  // Roster Filter State
  const [rosterClassFilter, setRosterClassFilter] = useState('All');
  const [rosterSearch, setRosterSearch] = useState('');
  const [printingPass, setPrintingPass] = useState(null);

  // Success Notice
  const [notice, setNotice] = useState('');

  // Auto-generate index number when student is picked
  const handleStudentPick = (stuId) => {
    setSelectedStudentId(stuId);
    const stu = allStudents.find(s => s.id === stuId || s.studentId === stuId);
    if (stu) {
      const cleanLevel = (stu.level || 'JHS3').replace(/\s+/g, '').toUpperCase();
      const numPart = stu.studentId ? stu.studentId.split('-').pop() : String(Math.floor(Math.random() * 900 + 100));
      setIndivIndexNum(`EXAM-2026-${cleanLevel}-${numPart}`);
    }
  };

  // Toggle Subject selection
  const toggleIndivSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const toggleBulkSubject = (sub) => {
    if (bulkSubjects.includes(sub)) {
      setBulkSubjects(bulkSubjects.filter(s => s !== sub));
    } else {
      setBulkSubjects([...bulkSubjects, sub]);
    }
  };

  // Add a new subject to the shared pool and database
  const addSubjectToPool = (forBulk = false) => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    if (allSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      alert('This subject already exists in the list.');
      return;
    }
    const updated = [...allSubjects, trimmed];
    setAllSubjects(updated);
    if (saveSubjectToDb) {
      saveSubjectToDb(trimmed);
    }
    // Auto-select the new subject in whichever tab added it
    if (forBulk) {
      setBulkSubjects(prev => [...prev, trimmed]);
    } else {
      setSelectedSubjects(prev => [...prev, trimmed]);
    }
    setNewSubjectInput('');
  };

  // Remove a subject from the pool entirely (and deselect it)
  const removeSubjectFromPool = (sub) => {
    setAllSubjects(prev => prev.filter(s => s !== sub));
    setSelectedSubjects(prev => prev.filter(s => s !== sub));
    setBulkSubjects(prev => prev.filter(s => s !== sub));
  };

  // Submit Individual Registration
  const handleIndividualSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStudentId) {
      alert('Please select a student to register.');
      return;
    }
    const stu = allStudents.find(s => s.id === selectedStudentId || s.studentId === selectedStudentId);
    if (!stu) {
      alert('Student record not found.');
      return;
    }
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject for examination.');
      return;
    }

    const regData = {
      studentUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stu.id) ? stu.id : (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stu.studentId) ? stu.studentId : ''),
      studentId: stu.studentId || stu.id,
      studentName: stu.fullName,
      classLevel: stu.level || 'General',
      subClass: stu.classSection || stu.subClass || stu.section || (stu.level ? formatDetailedClass(stu.level, stu.classSection) : '') || '',
      gender: stu.gender || stu.sex || '',
      academicYear: indivYear,
      term: indivTerm,
      examType: indivExamType,
      indexNumber: indivIndexNum || `EXAM-${Date.now()}`,
      examCenter: indivCenter,
      subjects: selectedSubjects,
      notes: indivNotes
    };

    try {
      if (registerIndividualExam) await registerIndividualExam(regData);
    } catch (err) {
      setNotice(err?.message || 'The database did not save this exam registration.');
      return;
    }

    setNotice(`Candidate ${stu.fullName} (${regData.indexNumber}) was registered in the database for ${indivExamType}.`);
    setTimeout(() => setNotice(''), 6000);
    setSelectedStudentId('');
    setIndivNotes('');
  };

  // Bulk Class Students
  const classStudents = allStudents.filter(s => (s.level || '').toLowerCase().trim() === bulkClass.toLowerCase().trim());

  // Submit Bulk Class Registration
  const handleBulkSubmit = async (e) => {
    if (e) e.preventDefault();
    if (classStudents.length === 0) {
      alert(`No enrolled students found in class ${bulkClass}.`);
      return;
    }
    if (bulkSubjects.length === 0) {
      alert('Please select at least one examination subject for the class.');
      return;
    }

    const studentsToRegister = classStudents.map((stu, idx) => {
      const cleanLevel = (bulkClass || 'CLASS').replace(/\s+/g, '').toUpperCase();
      const numStr = String(idx + 1).padStart(3, '0');
      const studentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stu.id)
        ? stu.id
        : (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stu.studentId) ? stu.studentId : '');
      return {
        id: studentUuid,
        studentUuid,
        studentId: stu.studentId || stu.id,
        studentName: stu.fullName,
        subClass: stu.classSection || stu.subClass || stu.section || (stu.level ? formatDetailedClass(stu.level, stu.classSection) : '') || '',
        gender: stu.gender || stu.sex || '',
        indexNumber: `${bulkPrefix}${cleanLevel}-${numStr}`
      };
    });

    try {
      if (registerClassExams) {
        await registerClassExams({
          classLevel: bulkClass,
          academicYear: bulkYear,
          term: bulkTerm,
          examType: bulkExamType,
          examCenter: bulkCenter,
          subjects: bulkSubjects,
          students: studentsToRegister
        });
      }
    } catch (err) {
      setNotice(err?.message || 'The database did not save this class exam registration.');
      return;
    }

    setNotice(`Registered ${studentsToRegister.length} candidates in ${bulkClass} in the database.`);
    setTimeout(() => setNotice(''), 6000);
    setActiveTab('roster');
  };

  // Filtered Roster
  const filteredRoster = currentRegistrations.filter(r => {
    const stu = (allStudents || []).find(s =>
      (s.id && (s.id === r.studentUuid || s.id === r.studentId)) ||
      (s.studentId && (s.studentId === r.studentId || s.studentId === r.studentUuid)) ||
      (s.fullName && r.studentName && s.fullName.toLowerCase().trim() === r.studentName.toLowerCase().trim())
    );
    const candidateSubClass = r.subClass || stu?.classSection || stu?.subClass || stu?.section || (r.classLevel ? formatDetailedClass(r.classLevel, stu?.classSection) : '') || r.classLevel || '';
    const rawGender = r.gender || stu?.gender || stu?.sex || '';

    const matchesClass = rosterClassFilter === 'All' ||
      (r.classLevel || '').toLowerCase() === rosterClassFilter.toLowerCase() ||
      candidateSubClass.toLowerCase() === rosterClassFilter.toLowerCase();

    const matchesSearch = !rosterSearch || 
      (r.studentName || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.indexNumber || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.studentId || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      candidateSubClass.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      rawGender.toLowerCase().includes(rosterSearch.toLowerCase());

    return matchesClass && matchesSearch;
  });

  return (
    <div style={{ background: '#0f172a', borderRadius: 14, color: '#f8fafc', padding: 22, border: '1px solid #334155' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, borderBottom: '2px solid #334155', paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', padding: '6px 10px', borderRadius: 8, color: '#fff' }}>
              <FileCheck size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#ffffff' }}>
              Examination Candidate Registration Terminal
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Academic Head Control Board · Register individual candidates or bulk-register entire classes for terminal examinations & issue official hall passes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: '#1e293b', border: '1px solid #0284c7', color: '#38bdf8', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} /> Academic Head Authorized
          </span>
          <span style={{ background: '#0369a1', color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20 }}>
            {currentRegistrations.length} Registered Candidates
          </span>
        </div>
      </div>

      {/* Success Notice Banner */}
      {notice && (
        <div style={{ background: '#064e3b', border: '1px solid #10b981', color: '#a7f3d0', padding: '12px 18px', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 13 }}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, borderBottom: '1px solid #334155', paddingBottom: 12, overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('individual')}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: activeTab === 'individual' ? '#0284c7' : '#1e293b',
            color: activeTab === 'individual' ? '#fff' : '#cbd5e1',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <UserCheck size={16} /> Individual Candidate Registration
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: activeTab === 'bulk' ? '#0284c7' : '#1e293b',
            color: activeTab === 'bulk' ? '#fff' : '#cbd5e1',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Users size={16} /> Bulk Class Exam Registration
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: activeTab === 'roster' ? '#0284c7' : '#1e293b',
            color: activeTab === 'roster' ? '#fff' : '#cbd5e1',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <BookOpen size={16} /> Exam Roster & Admit Passes ({currentRegistrations.length})
        </button>
      </div>

      {/* ── TAB 1: INDIVIDUAL STUDENT REGISTRATION ── */}
      {activeTab === 'individual' && (
        <form onSubmit={handleIndividualSubmit} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={18} /> Register Single Candidate for Examination
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                1. Select Academic Year
              </label>
              <select
                value={indivYear}
                onChange={(e) => setIndivYear(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                <option value="2023/2024">2023/2024 Academic Session</option>
                <option value="2024/2025">2024/2025 Academic Session</option>
                <option value="2025/2026">2025/2026 Academic Session</option>
                <option value="2026/2027">2026/2027 Academic Session</option>
                <option value="2027/2028">2027/2028 Academic Session</option>
                <option value="2028/2029">2028/2029 Academic Session</option>
                <option value="2029/2030">2029/2030 Academic Session</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                2. Select Academic Term
              </label>
              <select
                value={indivTerm}
                onChange={(e) => setIndivTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                <option value="Term 1">Term 1 Examinations</option>
                <option value="Term 2">Term 2 Examinations</option>
                <option value="Term 3">Term 3 Examinations</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                3. Examination Category / Type
              </label>
              <select
                value={indivExamType}
                onChange={(e) => setIndivExamType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                4. Allocated Examination Hall / Center
              </label>
              <select
                value={indivCenter}
                onChange={(e) => setIndivCenter(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                {EXAM_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Student Picker */}
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', marginBottom: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                5. Pick Student Candidate
                <span style={{ marginLeft: 8, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 20 }}>
                  {filteredAllStudents.length} of {allStudents.length}
                </span>
              </label>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
              {/* Text search */}
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by name, student ID, or class..."
                  value={indivSearch}
                  onChange={(e) => setIndivSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Class / Level filter */}
              <select
                value={indivClassFilter}
                onChange={(e) => {
                  setIndivClassFilter(e.target.value);
                  setIndivSubClassFilter('All');
                }}
                style={{ padding: '9px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}
              >
                <option value="All">All Classes</option>
                {CLASS_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>

              {/* Sub-Class / Section filter */}
              <select
                value={indivSubClassFilter}
                onChange={(e) => setIndivSubClassFilter(e.target.value)}
                style={{ padding: '9px 10px', background: '#1e293b', border: '1px solid #0284c7', borderRadius: 8, color: '#38bdf8', fontSize: 12, fontWeight: 700 }}
              >
                <option value="All">All Sub-Classes</option>
                {(indivClassFilter === 'All' ? ALL_SUB_CLASSES : getMappedSubClasses(indivClassFilter)).map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>

              {/* Gender filter */}
              <select
                value={indivGenderFilter}
                onChange={(e) => setIndivGenderFilter(e.target.value)}
                style={{ padding: '9px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              {/* Registration status filter */}
              <select
                value={indivRegFilter}
                onChange={(e) => setIndivRegFilter(e.target.value)}
                style={{ padding: '9px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}
              >
                <option value="All">All Students</option>
                <option value="Not Registered">Not Yet Registered</option>
                <option value="Registered">Already Registered</option>
              </select>

              {/* Sort */}
              <select
                value={indivSort}
                onChange={(e) => setIndivSort(e.target.value)}
                style={{ padding: '9px 10px', background: '#1e293b', border: '1px solid #0284c7', borderRadius: 8, color: '#38bdf8', fontSize: 12, fontWeight: 800 }}
              >
                <option value="AZ">Sort: A → Z</option>
                <option value="ZA">Sort: Z → A</option>
                <option value="Class">Sort: Class</option>
              </select>

              {/* Clear filters */}
              {(indivClassFilter !== 'All' || indivSubClassFilter !== 'All' || indivGenderFilter !== 'All' || indivRegFilter !== 'All' || indivSearch) && (
                <button
                  type="button"
                  onClick={() => { setIndivClassFilter('All'); setIndivSubClassFilter('All'); setIndivGenderFilter('All'); setIndivRegFilter('All'); setIndivSearch(''); }}
                  style={{ padding: '9px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>

            {/* Dropdown select */}
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentPick(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #0284c7', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700 }}
            >
              <option value="">-- Choose Student Candidate from Filtered List ({filteredAllStudents.length}) --</option>
              {filteredAllStudents.map((s) => {
                const isReg = currentRegistrations.some(r => r.studentId === (s.studentId || s.id));
                return (
                  <option key={s.id || s.studentId} value={s.id || s.studentId}>
                    {isReg ? '✓ ' : ''}{s.fullName} ({s.studentId}) — {s.level || 'Unassigned'}{s.gender ? ` · ${s.gender}` : ''}
                  </option>
                );
              })}
            </select>

            {/* Selected Student Card */}
            {selectedStudentId && (() => {
              const s = allStudents.find(stu => stu.id === selectedStudentId || stu.studentId === selectedStudentId);
              if (!s) return null;
              return (
                <div style={{ marginTop: 14, background: '#1e293b', padding: 14, borderRadius: 8, border: '1px solid #0369a1', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>
                    {s.fullName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>{s.fullName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Student ID: <strong style={{ color: '#38bdf8' }}>{s.studentId}</strong> | Class: <strong style={{ color: '#38bdf8' }}>{s.level || 'N/A'}</strong> | Guardian: {s.guardianName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', marginBottom: 4 }}>
                      Exam Index Number:
                    </label>
                    <input
                      type="text"
                      value={indivIndexNum}
                      onChange={(e) => setIndivIndexNum(e.target.value)}
                      style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontSize: 13, fontWeight: 900, textAlign: 'center' }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Subject Checkboxes — Individual */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                6. Select Subjects for Candidate Examination ({selectedSubjects.length} Selected)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelectedSubjects([...allSubjects])} style={{ background: '#0369a1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Select All
                </button>
                <button type="button" onClick={() => setSelectedSubjects([])} style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>
            </div>

            {/* Add new subject row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Type a new subject name and press Add…"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubjectToPool(false); } }}
                style={{ flex: 1, padding: '9px 12px', background: '#0f172a', border: '1px solid #0284c7', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => addSubjectToPool(false)}
                style={{ padding: '9px 16px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Subject
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {allSubjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <div
                    key={sub}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 12px',
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
                      border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    onClick={() => toggleIndivSubject(sub)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleIndivSubject(sub)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 16, height: 16, accentColor: '#0284c7', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: isSelected ? 800 : 500, color: isSelected ? '#ffffff' : '#cbd5e1' }}>{sub}</span>
                    <button
                      type="button"
                      title="Remove this subject from the list"
                      onClick={(e) => { e.stopPropagation(); removeSubjectFromPool(sub); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, lineHeight: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
              Special Examination Accommodations / Academic Head Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Extra time accommodation granted / Left-handed desk required / Medical pass..."
              value={indivNotes}
              onChange={(e) => setIndivNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            <ShieldCheck size={18} /> Confirm Candidate Examination Registration
          </button>
        </form>
      )}

      {/* ── TAB 2: BULK CLASS EXAM REGISTRATION ── */}
      {activeTab === 'bulk' && (
        <form onSubmit={handleBulkSubmit} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} /> Bulk Register Entire Class for Examination
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                1. Target Class Level
              </label>
              <select
                value={bulkClass}
                onChange={(e) => setBulkClass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #0284c7', borderRadius: 8, color: '#38bdf8', fontSize: 14, fontWeight: 900 }}
              >
                {CLASS_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                2. Academic Session Year
              </label>
              <select
                value={bulkYear}
                onChange={(e) => setBulkYear(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                <option value="2023/2024">2023/2024 Academic Session</option>
                <option value="2024/2025">2024/2025 Academic Session</option>
                <option value="2025/2026">2025/2026 Academic Session</option>
                <option value="2026/2027">2026/2027 Academic Session</option>
                <option value="2027/2028">2027/2028 Academic Session</option>
                <option value="2028/2029">2028/2029 Academic Session</option>
                <option value="2029/2030">2029/2030 Academic Session</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                3. Academic Term
              </label>
              <select
                value={bulkTerm}
                onChange={(e) => setBulkTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                <option value="Term 1">Term 1 Examinations</option>
                <option value="Term 2">Term 2 Examinations</option>
                <option value="Term 3">Term 3 Examinations</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                4. Examination Center / Hall
              </label>
              <select
                value={bulkCenter}
                onChange={(e) => setBulkCenter(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
              >
                {EXAM_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Bulk Class Enrolled Roster Preview */}
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8' }}>
                Enrolled Students in Class {bulkClass} ({classStudents.length} Students)
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Auto-assigned Index Prefix: <strong style={{ color: '#38bdf8' }}>{bulkPrefix}{bulkClass.replace(/\s+/g,'').toUpperCase()}-XXX</strong>
              </div>
            </div>

            {classStudents.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '1px dashed #334155', borderRadius: 8 }}>
                ⚠️ No students currently registered in class <strong>{bulkClass}</strong>. Select another class level above or onboard students.
              </div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Student Name</th>
                      <th style={{ padding: '8px 12px' }}>Student ID</th>
                      <th style={{ padding: '8px 12px' }}>Assigned Index Number</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Exam Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, idx) => {
                      const cleanLevel = (bulkClass || 'CLASS').replace(/\s+/g, '').toUpperCase();
                      const generatedIndex = `${bulkPrefix}${cleanLevel}-${String(idx + 1).padStart(3, '0')}`;
                      const isAlreadyReg = currentRegistrations.some(r => r.studentId === (s.studentId || s.id));
                      return (
                        <tr key={s.id || s.studentId} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#fff' }}>{s.fullName}</td>
                          <td style={{ padding: '8px 12px', color: '#38bdf8' }}>{s.studentId}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#a7f3d0' }}>{generatedIndex}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            {isAlreadyReg ? (
                              <span style={{ background: '#064e3b', color: '#a7f3d0', padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800 }}>Registered</span>
                            ) : (
                              <span style={{ background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800 }}>Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Class Subjects Grid — Bulk */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                Subjects for Class {bulkClass} Examination ({bulkSubjects.length} Selected)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setBulkSubjects([...allSubjects])} style={{ background: '#0369a1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Select All
                </button>
                <button type="button" onClick={() => setBulkSubjects([])} style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>
            </div>

            {/* Add new subject row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Type a new subject name and press Add…"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubjectToPool(true); } }}
                style={{ flex: 1, padding: '9px 12px', background: '#0f172a', border: '1px solid #0284c7', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => addSubjectToPool(true)}
                style={{ padding: '9px 16px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Subject
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {allSubjects.map((sub) => {
                const isSelected = bulkSubjects.includes(sub);
                return (
                  <div
                    key={sub}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 12px',
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
                      border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    onClick={() => toggleBulkSubject(sub)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBulkSubject(sub)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 16, height: 16, accentColor: '#0284c7', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: isSelected ? 800 : 500, color: isSelected ? '#ffffff' : '#cbd5e1' }}>{sub}</span>
                    <button
                      type="button"
                      title="Remove this subject from the list"
                      onClick={(e) => { e.stopPropagation(); removeSubjectFromPool(sub); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, lineHeight: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={classStudents.length === 0}
            style={{
              width: '100%', padding: '14px',
              background: classStudents.length === 0 ? '#334155' : 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15,
              cursor: classStudents.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Users size={18} /> Execute Bulk Exam Registration for Class {bulkClass} ({classStudents.length} Students)
          </button>
        </form>
      )}

      {/* ── TAB 3: ROSTER & PRINTABLE HALL PASSES ── */}
      {activeTab === 'roster' && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search registered candidate by name, student ID, or index number..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#fff', fontSize: 13 }}
                />
              </div>

              <select
                value={rosterClassFilter}
                onChange={(e) => setRosterClassFilter(e.target.value)}
                style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#38bdf8', fontSize: 13, fontWeight: 800 }}
              >
                <option value="All">All Class Levels</option>
                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {filteredRoster.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const targetName = rosterClassFilter === 'All' ? 'ALL classes' : `class ${rosterClassFilter}`;
                    if (window.confirm(`⚠️ Are you sure you want to DELETE ALL ${filteredRoster.length} exam candidate registrations for ${targetName}?`)) {
                      Promise.all(filteredRoster.map((item) => cancelExamRegistration(item.id || item.indexNumber || item.studentId)))
                        .then(() => {
                          setNotice(`Deleted ${filteredRoster.length} candidate examination registrations for ${targetName}.`);
                          setTimeout(() => setNotice(''), 5000);
                        })
                        .catch((err) => setNotice(err?.message || 'The database did not delete these exam registrations.'));
                    }
                  }}
                  style={{
                    padding: '10px 16px', background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444',
                    borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Trash2 size={15} /> Delete {rosterClassFilter === 'All' ? 'All' : rosterClassFilter} Exam Candidates ({filteredRoster.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPrintingRoster(true)}
                style={{
                  padding: '10px 16px', background: '#0369a1', color: '#fff', border: 'none',
                  borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(3, 105, 161, 0.3)'
                }}
              >
                <Printer size={15} /> Print Complete Examination Roster
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredRoster.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '1px dashed #334155', borderRadius: 8 }}>
              📋 No registered examination candidates found matching your filter criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '10px 14px' }}>Candidate Index #</th>
                    <th style={{ padding: '10px 14px' }}>Student Full Name</th>
                    <th style={{ padding: '10px 14px' }}>Sub Class Level</th>
                    <th style={{ padding: '10px 14px' }}>Gender</th>
                    <th style={{ padding: '10px 14px' }}>Exam Category / Hall</th>
                    <th style={{ padding: '10px 14px' }}>Registered Subjects</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((r) => {
                    const stu = (allStudents || []).find(s =>
                      (s.id && (s.id === r.studentUuid || s.id === r.studentId)) ||
                      (s.studentId && (s.studentId === r.studentId || s.studentId === r.studentUuid)) ||
                      (s.fullName && r.studentName && s.fullName.toLowerCase().trim() === r.studentName.toLowerCase().trim())
                    );
                    const candidateSubClass = r.subClass || stu?.classSection || stu?.subClass || stu?.section || (r.classLevel ? formatDetailedClass(r.classLevel, stu?.classSection) : '') || r.classLevel || '—';
                    const rawGender = r.gender || stu?.gender || stu?.sex || '—';
                    const isFemale = String(rawGender).toLowerCase().startsWith('f') || String(rawGender).toLowerCase() === 'girl';
                    const genderText = rawGender !== '—' ? (isFemale ? 'Female' : 'Male') : '—';

                    return (
                      <tr key={r.id || r.indexNumber} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 900, color: '#38bdf8' }}>{r.indexNumber}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#fff' }}>
                          <div>{r.studentName}</div>
                          {r.studentId && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>ID: {r.studentId}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 700 }}>
                          <span style={{ background: '#1e293b', border: '1px solid #475569', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                            {candidateSubClass}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                          <span style={{
                            background: genderText === 'Female' ? 'rgba(236, 72, 153, 0.15)' : (genderText === 'Male' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b'),
                            color: genderText === 'Female' ? '#f472b6' : (genderText === 'Male' ? '#38bdf8' : '#94a3b8'),
                            border: `1px solid ${genderText === 'Female' ? 'rgba(236, 72, 153, 0.3)' : (genderText === 'Male' ? 'rgba(56, 189, 248, 0.3)' : '#475569')}`,
                            padding: '2px 8px', borderRadius: 6, fontSize: 11.5
                          }}>
                            {genderText}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                          <div>{r.examType}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>🏢 {r.examCenter}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: 12, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', display: 'inline-block' }} title={(r.subjects || []).join(', ')}>
                            {(r.subjects || []).length} {(r.subjects || []).length === 1 ? 'Subject' : 'Subjects'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setPrintingPass(r)}
                              style={{
                                padding: '5px 10px', background: '#166534', color: '#a7f3d0',
                                border: '1px solid #22c55e', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Printer size={12} /> Hall Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`⚠️ Are you sure you want to DELETE candidate registration for ${r.studentName} (${r.indexNumber}) from examinations?\nThis will remove their candidate index number, subjects, and admit pass.`)) {
                                  Promise.resolve(cancelExamRegistration(r.id || r.indexNumber || r.studentId))
                                    .then(() => {
                                      setNotice(`Deleted ${r.studentName} (${r.indexNumber}) from examination registration.`);
                                      setTimeout(() => setNotice(''), 5000);
                                    })
                                    .catch((err) => setNotice(err?.message || 'The database did not delete this exam registration.'));
                                }
                              }}
                              style={{
                                padding: '5px 10px', background: '#991b1b', color: '#fca5a5',
                                border: '1px solid #ef4444', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                              title="Delete candidate from exam registration"
                            >
                              <Trash2 size={12} /> Delete from Exams
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRINTABLE HALL PASS ADMIT CARD MODAL ── */}
      {printingPass && (
        <ViewportModal
          onClick={(e) => { if (e.target === e.currentTarget) setPrintingPass(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#ffffff', color: '#0f172a', width: 680, maxWidth: '95vw',
            borderRadius: 14, padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '3px solid #0284c7', position: 'relative'
          }}>
            <button
              onClick={() => setPrintingPass(null)}
              style={{ position: 'absolute', right: 16, top: 16, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, fontWeight: 900, cursor: 'pointer' }}
            >
              ✕
            </button>

            {/* School Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #0284c7', paddingBottom: 14, marginBottom: 16 }}>
              <img src="/remalj-carewell-logo.jpg" alt="Logo" style={{ height: 50, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0369a1', letterSpacing: '0.02em' }}>
                  REMALJ CAREWELL INSPIRATIONAL SCHOOL
                </h2>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  OFFICIAL EXAMINATION ADMIT CARD & HALL PASS
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Academic Session {printingPass.academicYear} · {printingPass.term}
                </div>
              </div>
            </div>

            {/* Candidate Info Grid */}
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 11 }}>CANDIDATE FULL NAME</div>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#0f172a' }}>{printingPass.studentName}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11 }}>ALLOCATED EXAM INDEX NUMBER</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#0284c7' }}>{printingPass.indexNumber}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11 }}>CLASS / LEVEL</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{printingPass.classLevel}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11 }}>EXAMINATION HALL / CENTER</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{printingPass.examCenter}</div>
              </div>
            </div>

            {/* Registered Subjects List */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', marginBottom: 6 }}>
                REGISTERED EXAMINATION SUBJECTS ({(printingPass.subjects || []).length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
                {(printingPass.subjects || []).map((sub, idx) => (
                  <div key={sub} style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 4, fontWeight: 700, borderLeft: '3px solid #0284c7' }}>
                    {idx + 1}. {sub}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Authorization Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>SECURITY VERIFICATION BARCODE</div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 900, letterSpacing: '2px', color: '#0f172a' }}>
                  *{printingPass.indexNumber}*
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textDecoration: 'underline' }}>
                  Mr. Samuel Amponsah
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>Head of Academic Board Signature</div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none',
                  borderRadius: 8, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Printer size={15} /> Print Official Admit Card
              </button>
            </div>
          </div>
        </ViewportModal>
      )}

      {/* ── PRINTABLE COMPLETE EXAMINATION ROSTER (DEDICATED 1 PAGE PER STUDENT) ── */}
      {isPrintingRoster && (
        <ViewportModal
          onClick={(e) => { if (e.target === e.currentTarget) setIsPrintingRoster(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            overflowY: 'auto', padding: '24px 14px'
          }}
        >
          {/* Floating Action Header Bar */}
          <div className="no-print" style={{
            position: 'sticky', top: 0, zIndex: 10000, background: '#1e293b',
            border: '1px solid #475569', borderRadius: 12, padding: '14px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', maxWidth: 840, marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Printer size={20} color="#38bdf8" /> Official Complete Examination Roster
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {filteredRoster.length} Candidates · Dedicated 1 Page Per Student with Full Subject Details
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none',
                  borderRadius: 8, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                <Printer size={16} /> Print Roster ({filteredRoster.length} Pages)
              </button>
              <button
                type="button"
                onClick={() => setIsPrintingRoster(false)}
                style={{
                  padding: '10px 16px', background: '#334155', color: '#cbd5e1', border: 'none',
                  borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Printable Roster Container */}
          <div className="exam-roster-printable" style={{ width: '100%', maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 28 }}>
            {filteredRoster.map((r, idx) => {
              const stu = (allStudents || []).find(s =>
                (s.id && (s.id === r.studentUuid || s.id === r.studentId)) ||
                (s.studentId && (s.studentId === r.studentId || s.studentId === r.studentUuid)) ||
                (s.fullName && r.studentName && s.fullName.toLowerCase().trim() === r.studentName.toLowerCase().trim())
              );
              const candidateSubClass = r.subClass || stu?.classSection || stu?.subClass || stu?.section || (r.classLevel ? formatDetailedClass(r.classLevel, stu?.classSection) : '') || r.classLevel || '—';
              const rawGender = r.gender || stu?.gender || stu?.sex || '—';
              const isFemale = String(rawGender).toLowerCase().startsWith('f') || String(rawGender).toLowerCase() === 'girl';
              const genderText = rawGender !== '—' ? (isFemale ? 'Female' : 'Male') : '—';

              return (
                <div
                  key={r.id || r.indexNumber || idx}
                  className="exam-roster-student-page"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    borderRadius: 8,
                    padding: '30px 36px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    border: '2px solid #0284c7',
                    pageBreakAfter: 'always',
                    breakAfter: 'page',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '275mm',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Top Header & Crest */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2.5px solid #0284c7', paddingBottom: 14, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img src="/remalj-carewell-logo.jpg" alt="Logo" style={{ height: 58, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                        <div>
                          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0369a1', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                            REMALJ CAREWELL INSPIRATIONAL SCHOOL
                          </h1>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2, letterSpacing: '0.01em' }}>
                            OFFICIAL CANDIDATE EXAMINATION DOSSIER & INDIVIDUAL ROSTER
                          </div>
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
                            Bogoso Main Campus · P.O. Box 112, Western Region · Academic Session {r.academicYear || academicSettings?.academicYear || '2025/2026'} · {r.term || academicSettings?.academicTerm || 'Term 1'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ background: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          OFFICIAL CANDIDATE
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4, fontWeight: 700 }}>
                          Candidate {idx + 1} of {filteredRoster.length}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Identity Dossier Box */}
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 18, display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 100px', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                        <div>
                          <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>CANDIDATE FULL NAME</div>
                          <div style={{ fontWeight: 900, fontSize: 15.5, color: '#0f172a' }}>{r.studentName}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>ALLOCATED EXAM INDEX NUMBER</div>
                          <div style={{ fontWeight: 900, fontSize: 15, color: '#0284c7', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{r.indexNumber}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>STUDENT SYSTEM ID</div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>{r.studentId || '—'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                        <div style={{ display: 'flex', gap: 18 }}>
                          <div>
                            <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>CLASS LEVEL</div>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>{r.classLevel}</div>
                          </div>
                          <div>
                            <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>SUB CLASS LEVEL</div>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0369a1' }}>{candidateSubClass}</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>GENDER</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{genderText}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>EXAM CENTER & HALL</div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>🏢 {r.examCenter} ({r.examType})</div>
                        </div>
                      </div>

                      {/* Photo Placeholder */}
                      <div style={{ border: '2px dashed #94a3b8', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 6, background: '#f1f5f9' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>AFFIX PASSPORT PHOTO</div>
                        <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>35mm × 45mm</div>
                      </div>
                    </div>

                    {/* Registered Subjects Detailed Table */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          Registered Examination Subjects ({(r.subjects || []).length} Subjects Total)
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                          ✓ Confirmed Official Candidate
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                        <thead>
                          <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px', width: 32, border: '1px solid #0284c7', textAlign: 'center' }}>#</th>
                            <th style={{ padding: '8px 10px', border: '1px solid #0284c7' }}>Subject Name & Examination Paper</th>
                            <th style={{ padding: '8px 10px', width: 150, border: '1px solid #0284c7' }}>Designated Hall</th>
                            <th style={{ padding: '8px 10px', width: 140, border: '1px solid #0284c7' }}>Candidate Signature</th>
                            <th style={{ padding: '8px 10px', width: 130, border: '1px solid #0284c7' }}>Invigilator Initials</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.subjects || []).map((sub, sIdx) => (
                            <tr key={sub} style={{ background: sIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0369a1', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                {sIdx + 1}
                              </td>
                              <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0f172a', border: '1px solid #e2e8f0' }}>
                                {sub}
                              </td>
                              <td style={{ padding: '7px 10px', color: '#475569', border: '1px solid #e2e8f0', fontSize: 11 }}>
                                {r.examCenter}
                              </td>
                              <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', color: '#cbd5e1' }}>
                                ____________________
                              </td>
                              <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', color: '#cbd5e1' }}>
                                ____________________
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Examination Regulations */}
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px dashed #cbd5e1', fontSize: 10.5, color: '#475569', marginBottom: 14 }}>
                      <strong style={{ color: '#0f172a' }}>Examination Regulations & Instructions:</strong>
                      <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        <li>Candidates must be seated in the examination hall at least 15 minutes prior to commencement.</li>
                        <li>No mobile phones, smart watches, or unauthorized materials are permitted inside the examination hall.</li>
                        <li>This official dossier must be presented for invigilation alongside the active student ID card.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Footer & Endorsements */}
                  <div style={{ borderTop: '2px solid #0284c7', paddingTop: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14, alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>SECURITY VERIFICATION BARCODE</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, letterSpacing: '2px', color: '#0f172a', marginTop: 2 }}>
                          *{r.indexNumber}*
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                          Issued by Academic Board & Examinations Secretariat
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ height: 26 }}></div>
                        <div style={{ borderTop: '1px solid #0f172a', paddingTop: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1' }}>Candidate Signature</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>I certify my registered subjects</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', fontStyle: 'italic' }}>Mr. Samuel Amponsah</span>
                        </div>
                        <div style={{ borderTop: '1px solid #0f172a', paddingTop: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Head of Academic Board</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>Controller of Examinations</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 6, borderTop: '1px dotted #e2e8f0', fontSize: 9.5, color: '#94a3b8' }}>
                      <span>REMALJ Carewell Inspirational School — Official Examination Roster System</span>
                      <span>Page {idx + 1} of {filteredRoster.length} · Dedicated Student Examination Dossier</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ViewportModal>
      )}
    </div>
  );
}
