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
  Sparkles
} from 'lucide-react';

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

const CLASS_LEVELS = [
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JHS 1',
  'JHS 2',
  'JHS 3',
  'SHS 1',
  'SHS 2',
  'SHS 3'
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
  const { academicSettings, onboardedStudents, examRegistrations, registerIndividualExam, registerClassExams, cancelExamRegistration } = usePortalData();

  const allStudents = propStudents || onboardedStudents || [];
  const currentRegistrations = examRegistrations || [];

  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'bulk' | 'roster'

  // Individual Registration State
  const [indivSearch, setIndivSearch] = useState('');
  const [indivSort, setIndivSort] = useState('AZ'); // 'AZ' | 'ZA' | 'Class'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [indivYear, setIndivYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [indivTerm, setIndivTerm] = useState(academicSettings?.academicTerm || 'Term 1');
  const [indivExamType, setIndivExamType] = useState(EXAM_TYPES[0]);
  const [indivCenter, setIndivCenter] = useState(EXAM_CENTERS[0]);
  const [indivIndexNum, setIndivIndexNum] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(DEFAULT_SUBJECTS.slice(0, 6));
  const [indivNotes, setIndivNotes] = useState('');

  const filteredAllStudents = React.useMemo(() => {
    let list = [...(allStudents || [])];
    if (indivSearch.trim()) {
      const q = indivSearch.toLowerCase();
      list = list.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.studentId || s.id || '').toLowerCase().includes(q) ||
        (s.level || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (indivSort === 'ZA') return (b.fullName || b.name || '').localeCompare(a.fullName || a.name || '');
      if (indivSort === 'Class') return (a.level || '').localeCompare(b.level || '') || (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
      return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
    });
    return list;
  }, [allStudents, indivSearch, indivSort]);

  // Bulk Registration State
  const [bulkClass, setBulkClass] = useState('JHS 3');
  const [bulkYear, setBulkYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [bulkTerm, setBulkTerm] = useState(academicSettings?.academicTerm || 'Term 1');
  const [bulkExamType, setBulkExamType] = useState(EXAM_TYPES[0]);
  const [bulkCenter, setBulkCenter] = useState(EXAM_CENTERS[0]);
  const [bulkSubjects, setBulkSubjects] = useState(DEFAULT_SUBJECTS.slice(0, 6));
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

  // Submit Individual Registration
  const handleIndividualSubmit = (e) => {
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
      studentId: stu.studentId || stu.id,
      studentName: stu.fullName,
      classLevel: stu.level || 'General',
      academicYear: indivYear,
      term: indivTerm,
      examType: indivExamType,
      indexNumber: indivIndexNum || `EXAM-${Date.now()}`,
      examCenter: indivCenter,
      subjects: selectedSubjects,
      notes: indivNotes
    };

    if (registerIndividualExam) {
      registerIndividualExam(regData);
    }

    setNotice(`✅ Candidate ${stu.fullName} (${regData.indexNumber}) successfully registered for ${indivExamType}!`);
    setTimeout(() => setNotice(''), 6000);
    setSelectedStudentId('');
    setIndivNotes('');
  };

  // Bulk Class Students
  const classStudents = allStudents.filter(s => (s.level || '').toLowerCase().trim() === bulkClass.toLowerCase().trim());

  // Submit Bulk Class Registration
  const handleBulkSubmit = (e) => {
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
      return {
        studentId: stu.studentId || stu.id,
        studentName: stu.fullName,
        indexNumber: `${bulkPrefix}${cleanLevel}-${numStr}`
      };
    });

    if (registerClassExams) {
      registerClassExams({
        classLevel: bulkClass,
        academicYear: bulkYear,
        term: bulkTerm,
        examType: bulkExamType,
        examCenter: bulkCenter,
        subjects: bulkSubjects,
        students: studentsToRegister
      });
    }

    setNotice(`🚀 Bulk Exam Registration completed for ${studentsToRegister.length} candidates in ${bulkClass}! Index Numbers issued.`);
    setTimeout(() => setNotice(''), 6000);
    setActiveTab('roster');
  };

  // Filtered Roster
  const filteredRoster = currentRegistrations.filter(r => {
    const matchesClass = rosterClassFilter === 'All' || (r.classLevel || '').toLowerCase() === rosterClassFilter.toLowerCase();
    const matchesSearch = !rosterSearch || 
      (r.studentName || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.indexNumber || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.studentId || '').toLowerCase().includes(rosterSearch.toLowerCase());
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                5. Pick Student Candidate ({filteredAllStudents.length} Available)
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={indivSort}
                  onChange={(e) => setIndivSort(e.target.value)}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #0284c7', background: '#1e293b', color: '#38bdf8', fontWeight: 800 }}
                >
                  <option value="AZ">Sort: Name A-Z</option>
                  <option value="ZA">Sort: Name Z-A</option>
                  <option value="Class">Sort: Class / Level</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="🔍 Search candidate by name, ID, or class..."
              value={indivSearch}
              onChange={(e) => setIndivSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, marginBottom: 8 }}
            />
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentPick(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #0284c7', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700 }}
            >
              <option value="">-- Choose Student Candidate from Register --</option>
              {filteredAllStudents.map((s) => (
                <option key={s.id || s.studentId} value={s.id || s.studentId}>
                  {s.fullName} ({s.studentId}) — Class: {s.level || 'Unassigned'}
                </option>
              ))}
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

          {/* Subject Checkboxes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                6. Select Subjects for Candidate Examination ({selectedSubjects.length} Selected)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelectedSubjects([...DEFAULT_SUBJECTS])} style={{ background: '#0369a1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Select All Subjects
                </button>
                <button type="button" onClick={() => setSelectedSubjects([])} style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {DEFAULT_SUBJECTS.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <label key={sub} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
                    border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                    borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#ffffff' : '#cbd5e1', transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleIndivSubject(sub)}
                      style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                    />
                    <span>{sub}</span>
                  </label>
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

          {/* Class Subjects Grid */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                Subjects for Class {bulkClass} Examination ({bulkSubjects.length} Selected)
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {DEFAULT_SUBJECTS.map((sub) => {
                const isSelected = bulkSubjects.includes(sub);
                return (
                  <label key={sub} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
                    border: `1px solid ${isSelected ? '#0284c7' : '#334155'}`,
                    borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#ffffff' : '#cbd5e1'
                  }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBulkSubject(sub)}
                      style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                    />
                    <span>{sub}</span>
                  </label>
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
                      filteredRoster.forEach(r => cancelExamRegistration(r.id || r.indexNumber || r.studentId));
                      setNotice(`🗑️ Deleted ${filteredRoster.length} candidate examination registrations for ${targetName}.`);
                      setTimeout(() => setNotice(''), 5000);
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
                onClick={() => window.print()}
                style={{
                  padding: '10px 16px', background: '#0369a1', color: '#fff', border: 'none',
                  borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
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
                    <th style={{ padding: '10px 14px' }}>Student ID</th>
                    <th style={{ padding: '10px 14px' }}>Class Level</th>
                    <th style={{ padding: '10px 14px' }}>Exam Category / Hall</th>
                    <th style={{ padding: '10px 14px' }}>Registered Subjects</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((r) => (
                    <tr key={r.id || r.indexNumber} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 900, color: '#38bdf8' }}>{r.indexNumber}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#fff' }}>{r.studentName}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{r.studentId}</td>
                      <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 700 }}>{r.classLevel}</td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                        <div>{r.examType}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>🏢 {r.examCenter}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#0284c7', color: '#fff', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                          {(r.subjects || []).length} Subjects Registered
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
                                cancelExamRegistration(r.id || r.indexNumber || r.studentId);
                                setNotice(`🗑️ Candidate ${r.studentName} (${r.indexNumber}) deleted from examination registration.`);
                                setTimeout(() => setNotice(''), 5000);
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRINTABLE HALL PASS ADMIT CARD MODAL ── */}
      {printingPass && (
        <div
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
        </div>
      )}
    </div>
  );
}
