import React, { useMemo, useState } from 'react';
import { Download, Plus, Save, CheckCircle2 } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { getUserFullName } from '../../services/api';
import { downloadPublishedReport } from '../../data/reportDownload';
import RegisterForExamsForm from '../RegisterForExams/RegisterForExamsForm';
import AcademicSettingsManager from './AcademicSettingsManager';
import './AcademicViews.css';

const COURSE_CATALOGUE = ['Pure Mathematics', 'Physics', 'Literature in English', 'ICT Project', 'Chemistry', 'Economics', 'Government', 'Biology'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const blankTimetable = { day: 'Monday', time: '08:00 AM', subject: '', room: '', lecturer: '' };
const blankResult = { subject: 'Pure Mathematics', score: 0, grade: 'A', lecturer: '' };

export function LecturerSchedule() {
  const { timetable, saveTimetableEntry } = usePortalData();
  const lecturerName = getUserFullName() || 'Staff';
  const [entry, setEntry] = useState({ ...blankTimetable, lecturer: lecturerName });
  const [notice, setNotice] = useState('');
  const update = (key) => (event) => setEntry((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (!entry.subject.trim() || !entry.room.trim()) return;
    saveTimetableEntry(entry);
    setNotice(`${entry.subject} is now visible in the student timetable.`);
    setEntry({ ...blankTimetable, lecturer: lecturerName });
  };
  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header"><h1 className="page-header__title">Manage timetable</h1><p className="page-header__subtitle">Publish a class change and students will see it immediately on this device.</p></div>
      <div className="academic-layout"><section className="panel"><div className="panel__header"><h2 className="panel__title">Published classes</h2></div><div className="schedule-list">
        {timetable.map((item) => <div className="schedule-row" key={item.id}><strong>{item.day} · {item.time}</strong><span>{item.subject}</span><small>{item.room} · {item.lecturer}</small></div>)}
      </div></section>
      <form className="panel academic-form" onSubmit={submit}><div className="panel__header"><h2 className="panel__title"><Plus size={16}/> Add or update a class</h2></div><div className="panel__body">
        <label>Day<select value={entry.day} onChange={update('day')}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
        <label>Start time<input value={entry.time} onChange={update('time')} placeholder="e.g. 10:30 AM" required /></label>
        <label>Course<input value={entry.subject} onChange={update('subject')} placeholder="Course name" required /></label>
        <label>Room<input value={entry.room} onChange={update('room')} placeholder="e.g. Science Block 1" required /></label>
        <button className="academic-button" type="submit"><Save size={15}/> Publish timetable change</button>
        {notice && <p className="academic-success"><CheckCircle2 size={15}/>{notice}</p>}
      </div></form></div>
    </div>
  );
}

export const SCHOOL_CLASSES = [
  'Basic 1',
  'Basic 2',
  'Basic 3',
  'Basic 4',
  'Basic 5',
  'Basic 6',
  'Basic 7',
  'Basic 8',
  'Basic 9',
  'Kindergarten 1',
  'Kindergarten 2',
  'Nursery 1',
  'Nursery 2',
  'Creche'
];

export const SCHOOL_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Integrated Science',
  'Social Studies',
  'ICT',
  'French',
  'Religious & Moral Education (RME)',
  'Creative Arts',
  'Ghanaian Language',
  'Physical Education'
];

export function LecturerGrades({ initialTarget, onOpenScoreSheet }) {
  const { results, publishResult, onboardedStudents, academicSettings, teacherDirectory, timetable } = usePortalData();
  const authUser = getAuthUser();
  const lecturerName = getUserFullName() || authUser?.name || 'Staff';

  // Determine assigned classes for this teacher
  const teacherAssignedClass = authUser?.classAssigned || authUser?.class_assigned || '';
  const isClassTeacher = authUser?.teacherDesignation === 'class_teacher' || authUser?.teacher_designation === 'class_teacher';

  const [selectedClass, setSelectedClass] = useState(() => initialTarget?.classLevel || teacherAssignedClass || 'Basic 1');
  const [selectedSubClass, setSelectedSubClass] = useState(() => initialTarget?.subClass || 'All');
  const [selectedSubject, setSelectedSubject] = useState(() => initialTarget?.subject || 'Mathematics');
  const [selectedTerm, setSelectedTerm] = useState(() => initialTarget?.term || academicSettings?.academicTerm || 'Term 3');
  const [selectedYear, setSelectedYear] = useState(() => initialTarget?.year || academicSettings?.academicYear || '2025/2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStudentId, setHighlightedStudentId] = useState(initialTarget?.studentId || null);
  const [targetNotice, setTargetNotice] = useState(null);

  // Manual single result submission fallback
  const [result, setResult] = useState({ ...blankResult, lecturer: lecturerName });
  const [notice, setNotice] = useState('');
  const [showManualSubmitModal, setShowManualSubmitModal] = useState(false);

  const studentRowRefs = useRef({});

  // Sync when initialTarget arrives (e.g. from "View Test Roll" in ScoreSheetEntryForm)
  useEffect(() => {
    if (!initialTarget) return;
    if (initialTarget.classLevel) setSelectedClass(initialTarget.classLevel);
    if (initialTarget.subClass) setSelectedSubClass(initialTarget.subClass);
    if (initialTarget.subject) setSelectedSubject(initialTarget.subject);
    if (initialTarget.term) setSelectedTerm(initialTarget.term);
    if (initialTarget.year) setSelectedYear(initialTarget.year);
    if (initialTarget.studentId) {
      setHighlightedStudentId(initialTarget.studentId);
      setTargetNotice(
        `🎯 Showing Test Roll for student "${initialTarget.studentName || initialTarget.studentId}" in ${initialTarget.classLevel} (${initialTarget.subClass || 'Section'}) · ${initialTarget.subject || 'All Subjects'}`
      );
      setTimeout(() => {
        const el = studentRowRefs.current[initialTarget.studentId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  }, [initialTarget]);

  // Subclasses for active class
  const availableSubClasses = useMemo(() => {
    return ['All', ...getMappedSubClasses(selectedClass)];
  }, [selectedClass]);

  // Students belonging to the active class and subclass
  const studentsInClass = useMemo(() => {
    return (onboardedStudents || []).filter((s) => {
      const sCls = (s.level || s.classLevel || s.class || '').trim().toLowerCase();
      const targetCls = selectedClass.toLowerCase().trim();
      const classMatch = sCls === targetCls || sCls.includes(targetCls) || targetCls.includes(sCls);
      if (!classMatch) return false;

      if (selectedSubClass && selectedSubClass !== 'All') {
        const sSub = (s.classSection || s.subClass || s.section || '').trim().toLowerCase();
        const targetSub = selectedSubClass.toLowerCase().trim();
        return sSub === targetSub || sSub.includes(targetSub) || targetSub.includes(sSub);
      }
      return true;
    });
  }, [onboardedStudents, selectedClass, selectedSubClass]);

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsInClass;
    const q = searchQuery.toLowerCase().trim();
    return studentsInClass.filter((s) => {
      const name = (s.fullName || s.name || '').toLowerCase();
      const sid = String(s.studentId || s.id || '').toLowerCase();
      return name.includes(q) || sid.includes(q);
    });
  }, [studentsInClass, searchQuery]);

  // Compute grade records for each student
  const studentGradeRows = useMemo(() => {
    return filteredStudents.map((student, index) => {
      const sid = String(student.studentId || student.id || '').toLowerCase().trim();
      const sname = (student.fullName || student.name || '').toLowerCase().trim();

      // Find matching score in results
      const entry = (results || []).find((r) => {
        const rSid = String(r.studentId || '').toLowerCase().trim();
        const rName = String(r.studentName || '').toLowerCase().trim();
        const matchStudent = (sid && rSid && sid === rSid) || (sname && rName && sname === rName);
        if (!matchStudent) return false;

        if (selectedSubject && selectedSubject !== 'All Subjects') {
          const rSubj = String(r.subject || '').toLowerCase().trim();
          if (!rSubj.includes(selectedSubject.toLowerCase().trim())) return false;
        }
        if (selectedTerm && r.term && r.term !== selectedTerm) return false;
        return true;
      });

      const hasScore = Boolean(entry);
      const classScore = entry
        ? (entry.classScore != null ? Number(entry.classScore) : (entry.classTestTotal != null ? (Number(entry.classTestTotal) / 400) * 50 : null))
        : null;
      const examScore = entry
        ? (entry.examScoreConverted != null ? Number(entry.examScoreConverted) : (entry.examScore != null ? (Number(entry.examScore) / 100) * 50 : null))
        : null;
      const totalScore = entry
        ? (entry.score != null ? Number(entry.score) : ((classScore ?? 0) + (examScore ?? 0)))
        : null;

      return {
        index: index + 1,
        student,
        studentId: student.studentId || student.id || 'N/A',
        studentName: student.fullName || student.name || 'Student',
        subClass: student.classSection || student.subClass || `${selectedClass}A`,
        subject: entry?.subject || selectedSubject,
        hasScore,
        classScore,
        examScore,
        totalScore,
        grade: entry?.grade || (hasScore ? 'Pass' : '-'),
        remarks: entry?.remarks || (hasScore ? 'Recorded' : 'Pending Entry'),
        status: entry?.status || (hasScore ? 'Pending Review' : 'Not Entered'),
        declineNote: entry?.declineNote,
        entry
      };
    });
  }, [filteredStudents, results, selectedSubject, selectedTerm, selectedClass]);

  // Statistics
  const stats = useMemo(() => {
    const scored = studentGradeRows.filter((r) => r.hasScore && r.totalScore != null);
    const totalCount = studentGradeRows.length;
    const scoredCount = scored.length;
    const avgClass = scored.length > 0 ? (scored.reduce((acc, r) => acc + (r.classScore || 0), 0) / scored.length).toFixed(1) : '0.0';
    const avgExam = scored.length > 0 ? (scored.reduce((acc, r) => acc + (r.examScore || 0), 0) / scored.length).toFixed(1) : '0.0';
    const avgTotal = scored.length > 0 ? (scored.reduce((acc, r) => acc + (r.totalScore || 0), 0) / scored.length).toFixed(1) : '0.0';
    const topScore = scored.length > 0 ? Math.max(...scored.map(r => r.totalScore || 0)).toFixed(1) : '0.0';

    return { totalCount, scoredCount, avgClass, avgExam, avgTotal, topScore };
  }, [studentGradeRows]);

  const updateManualResult = (key) => (event) => setResult((current) => ({ ...current, [key]: event.target.value }));

  const submitManual = (event) => {
    event.preventDefault();
    const score = Number(result.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    publishResult({ ...result, score, status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() });
    setNotice(`Result for ${result.subject} submitted successfully! Pending Academic Head approval.`);
    setShowManualSubmitModal(false);
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div className="academic-view animate-fade-up" style={{ paddingBottom: 40 }}>
      {/* Target Notice Banner from "View Test Roll" */}
      {targetNotice && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1.5px solid #d97706',
          color: '#92400e',
          padding: '12px 18px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 800 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span>{targetNotice}</span>
          </div>
          <button
            onClick={() => {
              setTargetNotice(null);
              setHighlightedStudentId(null);
            }}
            style={{
              padding: '4px 10px',
              background: '#b45309',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Subject Teacher Class Grades & Test Roll</span>
            <span style={{ fontSize: 12, background: '#0284c7', color: '#fff', padding: '3px 10px', borderRadius: 12, fontWeight: 800 }}>
              SIMS Roll
            </span>
          </h1>
          <p className="page-header__subtitle">
            View each class you teach and student continuous assessment (/50), examination score (/50), and overall total (/100).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            🖨️ Print Test Roll
          </button>

          {onOpenScoreSheet && (
            <button
              type="button"
              onClick={() => onOpenScoreSheet({ classLevel: selectedClass, subClass: selectedSubClass !== 'All' ? selectedSubClass : undefined, subject: selectedSubject })}
              style={{
                padding: '8px 16px',
                background: '#0f3a4b',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(15, 58, 75, 0.2)'
              }}
            >
              📝 Score Sheet Entry Form
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualSubmitModal(prev => !prev)}
            style={{
              padding: '8px 14px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Plus size={14} /> Single Course Result Submission
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontWeight: 800, fontSize: 13, border: '1px solid #86efac' }}>
          ✅ {notice}
        </div>
      )}

      {/* CLASS SELECTION BAR FOR SUBJECT TEACHERS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏫 Select Class Taught by {lecturerName}:</span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
            Click any class below to inspect its student test roll
          </span>
        </div>

        {/* Class Pills / Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
          {SCHOOL_CLASSES.map((cls) => {
            const isSelected = selectedClass === cls;
            const count = (onboardedStudents || []).filter(s => (s.level || s.classLevel || s.class || '').trim().toLowerCase().includes(cls.toLowerCase())).length;

            return (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  setSelectedClass(cls);
                  setSelectedSubClass('All');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: isSelected ? '#0284c7' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cls}</span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontWeight: 900
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & CONTROL BAR (Sub-Class, Subject, Term, Year, Search) */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12,
        alignItems: 'end'
      }}>
        {/* Sub-Class Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Sub-Class / Section
          </label>
          <select
            value={selectedSubClass}
            onChange={(e) => setSelectedSubClass(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          >
            {availableSubClasses.map((sc) => (
              <option key={sc} value={sc}>{sc === 'All' ? `All Sections (${selectedClass})` : sc}</option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, color: '#0f3a4b' }}
          >
            <option value="All Subjects">All Subjects</option>
            {SCHOOL_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Term Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Academic Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Academic Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
            <option value="2026/2027">2026/2027</option>
          </select>
        </div>

        {/* Search Student Input */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Search Student
          </label>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
          />
        </div>
      </div>

      {/* SUMMARY STATS TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Students in {selectedClass}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f3a4b', marginTop: 2 }}>{stats.totalCount}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Scores Entered</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: stats.scoredCount === stats.totalCount && stats.totalCount > 0 ? '#166534' : '#d97706', marginTop: 2 }}>
            {stats.scoredCount} / {stats.totalCount}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Avg Class Score (/50)</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>{stats.avgClass}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Avg Exam Score (/50)</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#4f46e5', marginTop: 2 }}>{stats.avgExam}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class Avg Total (/100)</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#047857', marginTop: 2 }}>{stats.avgTotal}%</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Highest Score</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#9333ea', marginTop: 2 }}>{stats.topScore}%</div>
        </div>
      </div>

      {/* GRADES TABLE */}
      <section className="panel" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
        <div className="panel__header" style={{ background: '#0f3a4b', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="panel__title" style={{ color: '#fff', fontSize: 14, fontWeight: 900, margin: 0 }}>
              📋 Official Class Grade Roll — {selectedClass} {selectedSubClass !== 'All' ? `(${selectedSubClass})` : ''} · {selectedSubject}
            </h2>
            <div style={{ fontSize: 11, color: '#bae6fd', marginTop: 2 }}>
              Term: {selectedTerm} · Academic Year: {selectedYear} · Total Students: {studentGradeRows.length}
            </div>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: 12, fontWeight: 800 }}>
            {selectedSubject}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#0f3a4b', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', width: 35 }}>#</th>
                <th style={{ padding: '8px 10px' }}>Student ID</th>
                <th style={{ padding: '8px 10px' }}>Student Full Name</th>
                <th style={{ padding: '8px 10px' }}>Sub-Class</th>
                <th style={{ padding: '8px 10px' }}>Subject</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', background: '#fef3c7', color: '#92400e' }}>Class Score (/50)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', background: '#fed7aa', color: '#9a3412' }}>Exam Score (/50)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', background: '#dbeafe', color: '#1e40af' }}>Total Score (/100)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Grade</th>
                <th style={{ padding: '8px 10px' }}>Remarks</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Approval Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentGradeRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No students found in {selectedClass} {selectedSubClass !== 'All' ? `(${selectedSubClass})` : ''}.
                  </td>
                </tr>
              ) : (
                studentGradeRows.map((row) => {
                  const isHighlighted = highlightedStudentId && (
                    String(row.studentId).toLowerCase() === String(highlightedStudentId).toLowerCase() ||
                    String(row.student.id).toLowerCase() === String(highlightedStudentId).toLowerCase()
                  );

                  return (
                    <tr
                      key={row.studentId || row.index}
                      ref={(el) => {
                        if (row.studentId) studentRowRefs.current[row.studentId] = el;
                        if (row.student?.id) studentRowRefs.current[row.student.id] = el;
                      }}
                      style={{
                        background: isHighlighted ? '#fef3c7' : (row.index % 2 === 0 ? '#ffffff' : '#f8fafc'),
                        borderLeft: isHighlighted ? '4px solid #f59e0b' : 'none',
                        boxShadow: isHighlighted ? 'inset 0 0 6px rgba(245, 158, 11, 0.3)' : 'none',
                        transition: 'background 0.3s ease'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#64748b' }}>{row.index}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>
                        {row.studentId}
                        {isHighlighted && (
                          <div style={{ fontSize: 9.5, color: '#d97706', fontWeight: 900, marginTop: 1 }}>
                            🎯 TARGET FROM ROLL
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f172a' }}>
                        {row.studentName}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#475569' }}>
                        {row.subClass}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#0369a1', fontWeight: 700 }}>
                        {row.subject}
                      </td>

                      {/* Class Score (/50) */}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#92400e', background: isHighlighted ? '#fef3c7' : '#fffbeb' }}>
                        {row.classScore != null ? (
                          <span>{Number(row.classScore).toFixed(1)} / 50</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>- / 50</span>
                        )}
                      </td>

                      {/* Exam Score (/50) */}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#9a3412', background: isHighlighted ? '#fef3c7' : '#fff7ed' }}>
                        {row.examScore != null ? (
                          <span>{Number(row.examScore).toFixed(1)} / 50</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>- / 50</span>
                        )}
                      </td>

                      {/* Total Score (/100) */}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#1e40af', background: isHighlighted ? '#fde68a' : '#eff6ff' }}>
                        {row.totalScore != null ? (
                          <span style={{
                            padding: '2px 8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: 4,
                            fontWeight: 900
                          }}>
                            {Number(row.totalScore).toFixed(1)} / 100
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>- / 100</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 900,
                          background: row.grade === 'A' || row.grade === 'A+' ? '#dcfce7' : (row.grade === 'F' ? '#fee2e2' : '#f1f5f9'),
                          color: row.grade === 'A' || row.grade === 'A+' ? '#166534' : (row.grade === 'F' ? '#dc2626' : '#334155')
                        }}>
                          {row.grade}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td style={{ padding: '8px 10px', fontSize: 11, color: '#475569', fontWeight: 600 }}>
                        {row.remarks}
                      </td>

                      {/* Approval Status */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {row.status === 'Approved' ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                            🟢 Approved
                          </span>
                        ) : row.status === 'Declined' ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}>
                            🔴 Declined
                          </span>
                        ) : row.hasScore ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>
                            🟡 Pending
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8' }}>
                            ⚪ Not Entered
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {onOpenScoreSheet ? (
                          <button
                            type="button"
                            onClick={() => onOpenScoreSheet({
                              student: row.student,
                              studentId: row.studentId,
                              studentName: row.studentName,
                              classLevel: selectedClass,
                              subClass: row.subClass,
                              subject: row.subject
                            })}
                            style={{
                              padding: '3px 8px',
                              background: row.hasScore ? '#e0f2fe' : '#0284c7',
                              color: row.hasScore ? '#0369a1' : '#fff',
                              border: '1px solid #bae6fd',
                              borderRadius: 4,
                              fontSize: 10.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title={row.hasScore ? 'Edit student scores in score sheet' : 'Enter student scores'}
                          >
                            {row.hasScore ? '✏️ Edit Score' : '+ Enter Score'}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 10 }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* OPTIONAL MANUAL RESULT SUBMISSION MODAL */}
      {showManualSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 450, width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f3a4b' }}>
                📝 Submit Course Result to Academic Head
              </h3>
              <button
                type="button"
                onClick={() => setShowManualSubmitModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitManual}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0f3a4b' }}>
                  Course / Subject:
                  <select value={result.subject} onChange={updateManualResult('subject')} style={{ width: '100%', padding: 7, borderRadius: 4, border: '1px solid #cbd5e1', marginTop: 4 }}>
                    {COURSE_CATALOGUE.map((course) => <option key={course}>{course}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0f3a4b' }}>
                  Score (%):
                  <input type="number" min="0" max="100" value={result.score} onChange={updateManualResult('score')} required style={{ width: '100%', padding: 7, borderRadius: 4, border: '1px solid #cbd5e1', marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0f3a4b' }}>
                  Grade:
                  <select value={result.grade} onChange={updateManualResult('grade')} style={{ width: '100%', padding: 7, borderRadius: 4, border: '1px solid #cbd5e1', marginTop: 4 }}>
                    {['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'F'].map((grade) => <option key={grade}>{grade}</option>)}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" onClick={() => setShowManualSubmitModal(false)} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}>
                    Submit Result
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const DEFAULT_SCHEDULE_ROWS = [
  {
    time: '08:00 AM',
    Monday: { subject: 'Pure Mathematics', room: 'Room 402', teacher: 'Prof. Mensah' },
    Tuesday: null,
    Wednesday: { subject: 'Literature in English', room: 'Auditorium B', teacher: 'Dr. Anane' },
    Thursday: { subject: 'Integrated Science', room: 'Science Block 1', teacher: 'Mr. Boateng' },
    Friday: { subject: 'Pure Mathematics', room: 'Room 402', teacher: 'Prof. Mensah' },
  },
  {
    time: '10:30 AM',
    Monday: null,
    Tuesday: { subject: 'Physics Lab', room: 'Science Block 1', teacher: 'Mr. Boateng' },
    Wednesday: null,
    Thursday: { subject: 'Social Studies', room: 'Room 204', teacher: 'Mrs. Adjei' },
    Friday: { subject: 'French Language', room: 'Room 301', teacher: 'Mme. Koffi' },
  },
  {
    time: '01:00 PM',
    Monday: { subject: 'ICT Project', room: 'Lab 2', teacher: 'Ms. Mensah' },
    Tuesday: { subject: 'English Essay', room: 'Room 204', teacher: 'Mrs. Adjei' },
    Wednesday: { subject: 'Mathematics', room: 'Room 402', teacher: 'Prof. Mensah' },
    Thursday: { subject: 'ICT Project', room: 'Lab 2', teacher: 'Ms. Mensah' },
    Friday: { subject: 'English Essay', room: 'Auditorium B', teacher: 'Dr. Anane' },
  },
];

export function StudentTimetable() {
  const { timetable } = usePortalData();
  const [dayView, setDayView] = useState('Mon - Wed'); // 'Mon - Wed' | 'Thu - Fri' | 'Full Week'

  // Map custom timetable entries if added via portal store
  const scheduleRows = useMemo(() => {
    return DEFAULT_SCHEDULE_ROWS.map((row) => {
      const updatedRow = { ...row };
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day) => {
        const found = (timetable || []).find((t) => t.day === day && t.time === row.time);
        if (found) {
          updatedRow[day] = {
            subject: found.subject,
            room: found.room || 'Main Hall',
            teacher: found.lecturer || 'Faculty Staff',
          };
        }
      });
      return updatedRow;
    });
  }, [timetable]);

  const activeDays = useMemo(() => {
    if (dayView === 'Thu - Fri') return ['Thursday', 'Friday'];
    if (dayView === 'Full Week') return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return ['Monday', 'Tuesday', 'Wednesday'];
  }, [dayView]);

  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="page-header__eyebrow" style={{ color: '#c8703a' }}>
            <span style={{ background: '#fff1e8', padding: '2px 10px', borderRadius: 99, border: '1px solid #e8c4a8' }}>
              Academic Schedule — Senior High II
            </span>
          </p>
          <h1 className="page-header__title">My Timetable 📅</h1>
          <p className="page-header__subtitle">
            Daily scheduled lectures, classroom locations, and subject instructors.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className="academic-button" 
            style={{ background: '#5e2d0e', color: '#fff', fontSize: 12, padding: '7px 14px', borderRadius: 6 }}
            onClick={() => window.print()}
          >
            🖨️ Print Timetable
          </button>
        </div>
      </div>

      <div className="schedule-matrix-panel">
        <div className="schedule-matrix-header">
          <h2 className="schedule-matrix-title">
            <span>Weekly Class Schedule</span>
          </h2>
          <div className="schedule-matrix-controls">
            <button 
              className={`schedule-tab-btn ${dayView === 'Mon - Wed' ? 'active' : ''}`}
              onClick={() => setDayView('Mon - Wed')}
            >
              Monday – Wednesday
            </button>
            <button 
              className={`schedule-tab-btn ${dayView === 'Thu - Fri' ? 'active' : ''}`}
              onClick={() => setDayView('Thu - Fri')}
            >
              Thursday – Friday
            </button>
            <button 
              className={`schedule-tab-btn ${dayView === 'Full Week' ? 'active' : ''}`}
              onClick={() => setDayView('Full Week')}
            >
              All Days (Mon – Fri)
            </button>
          </div>
        </div>

        <div className="schedule-table-wrap">
          <table className="schedule-matrix-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>TIME</th>
                {activeDays.map((day) => (
                  <th key={day}>{day.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row) => (
                <tr key={row.time}>
                  <td className="time-col">{row.time}</td>
                  {activeDays.map((day) => {
                    const c = row[day];
                    return (
                      <td key={day}>
                        {c ? (
                          <div className="schedule-class-card">
                            <div className="schedule-class-card__title">{c.subject}</div>
                            <div className="schedule-class-card__subtitle">{c.room} • {c.teacher}</div>
                          </div>
                        ) : (
                          <span className="schedule-empty-dash">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StudentResults() {
  const { results, publishedReports } = usePortalData();
  const download = () => {
    const rows = [['Course', 'Score', 'Grade', 'Lecturer', 'Published'], ...results.map((item) => [item.subject, `${item.score}%`, item.grade, item.lecturer, item.updatedAt])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'Kwame-Edwards-results.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header"><h1 className="page-header__title">My results</h1><p className="page-header__subtitle">Download your current result sheet directly to this computer. Lecturer-uploaded semester files are shared here and with the relevant parent report request.</p></div>
      {publishedReports.length > 0 && <section className="panel" style={{ marginBottom: 18 }}><div className="panel__header"><h2 className="panel__title">Lecturer-uploaded semester reports</h2></div><div className="course-list">{publishedReports.map((report) => <div className="course-row" key={report.id}><span><strong>{report.semester}</strong><small>{report.fileName} · uploaded {report.uploadedAt}</small></span><button className="academic-button" onClick={() => downloadPublishedReport(report)}><Download size={15}/> Download uploaded file</button></div>)}</div></section>}
      <section className="panel"><div className="panel__header"><h2 className="panel__title">Term 1 result sheet</h2><button className="academic-button" onClick={download}><Download size={15}/> Download CSV</button></div><table className="data-table"><thead><tr><th>Course</th><th>Score</th><th>Grade</th><th>Lecturer</th><th>Last updated</th></tr></thead><tbody>{results.map((item) => <tr key={item.id || item.subject}><td>{item.subject}</td><td>{item.score}%</td><td><span className="status-pill status-pill--success">{item.grade}</span></td><td>{item.lecturer}</td><td>{item.updatedAt}</td></tr>)}</tbody></table></section>
    </div>
  );
}

export function ExamRegistration() {
  return <RegisterForExamsForm />;
}

export function CourseRegistration() {
  return <RegisterForExamsForm />;
}

export function AcademicSettingsView() {
  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header">
        <h1 className="page-header__title">Global Academic Settings ⚙️</h1>
        <p className="page-header__subtitle">
          Configure active academic year, active term, continuous assessment & exam weights, grading scale, and institution details. All changes synchronize live across all portals and score sheets.
        </p>
      </div>
      <AcademicSettingsManager inline={true} />
    </div>
  );
}
