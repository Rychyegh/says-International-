import { findGradeEntry, gradeMarks, gradeRollStats } from '../../lib/gradeRoll';
import { catalogNames } from '../../lib/catalogNames';
import { teacherAssignedClasses, studentInAssignedClass } from '../../lib/teacherClassAssignments';
import { reportClass } from '../../lib/terminalReportRecords';
import ViewportModal from '../Modal/ViewportModal';
import { SCHOOL_GRADING_BANDS, proficiencyGrade, proficiencyRemark } from '../../lib/schoolGrading';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Download, Plus, Save, CheckCircle2 } from 'lucide-react';
import { usePortalData, hasRecordedClassScore, hasRecordedExamScore, MISSING_SCORE, resultsForStudent } from '../../data/PortalStore';
import { getAuthUser, getUserFullName, isClassTeacherAccount, enrichTeacherSession } from '../../services/api';
import { downloadPublishedReport } from '../../data/reportDownload';
import RegisterForExamsForm from '../RegisterForExams/RegisterForExamsForm';
import AcademicSettingsManager from './AcademicSettingsManager';
import { getMappedSubClasses } from '../../data/classStructure';
import './AcademicViews.css';
import { PublishedTimetable } from './Timetable';

const COURSE_CATALOGUE = ['Pure Mathematics', 'Physics', 'Literature in English', 'ICT Project', 'Chemistry', 'Economics', 'Government', 'Biology'];

const blankResult = { subject: 'Pure Mathematics', score: 0, grade: '9', lecturer: '' };

export function LecturerSchedule() {
  return <PublishedTimetable />;
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

export function LecturerGrades({ initialTarget, onOpenScoreSheet, assignedClasses: suppliedClasses }) {
  const { results, publishResult, onboardedStudents, academicSettings, teacherDirectory, timetable, teachingAssignments, subjects = [] } = usePortalData();
  const authUser = enrichTeacherSession(getAuthUser() || {});
  const lecturerName = getUserFullName(authUser) || authUser?.name || 'Staff';

  // Determine assigned classes for this teacher
  const assignedClasses = suppliedClasses || teacherAssignedClasses({user:authUser,assignments:teachingAssignments || [],directory:teacherDirectory || []});
  const teacherAssignedClass = assignedClasses[0] || '';
  const assignedTarget = target => {
    const key=value=>String(value || '').replace(/\s+/g,'').toLowerCase();
    const section=target?.subClass || reportClass(target?.classLevel).section;
    return assignedClasses.find(cls=>key(cls)===key(section)) || assignedClasses.find(cls=>key(reportClass(cls).level)===key(reportClass(target?.classLevel).level)) || teacherAssignedClass;
  };
  const isClassTeacher = isClassTeacherAccount(authUser);

  const [selectedClass, setSelectedClass] = useState(() => assignedTarget(initialTarget) || '');
  const [selectedSubClass, setSelectedSubClass] = useState(() => initialTarget?.subClass || 'All');
  const [selectedSubject, setSelectedSubject] = useState(() => initialTarget?.subject || 'Mathematics');
  const periodTouched=useRef({year:Boolean(initialTarget?.year),term:Boolean(initialTarget?.term)});
  const [selectedTerm, setSelectedTerm] = useState(() => initialTarget?.term || academicSettings?.academicTerm || 'Term 3');
  const [selectedYear, setSelectedYear] = useState(() => initialTarget?.year || academicSettings?.academicYear || '2025/2026');
  useEffect(()=>{
    if (academicSettings?.academicYear && !periodTouched.current.year) setSelectedYear(academicSettings.academicYear);
    if (academicSettings?.academicTerm && !periodTouched.current.term) setSelectedTerm(academicSettings.academicTerm);
  },[academicSettings?.academicYear,academicSettings?.academicTerm]);
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
    if (initialTarget.classLevel) setSelectedClass(assignedTarget(initialTarget));
    if (initialTarget.subClass) setSelectedSubClass(initialTarget.subClass);
    if (initialTarget.subject) setSelectedSubject(initialTarget.subject);
    if (initialTarget.term) {periodTouched.current.term=true;setSelectedTerm(initialTarget.term);}
    if (initialTarget.year) {periodTouched.current.year=true;setSelectedYear(initialTarget.year);}
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

  const assignedKey = JSON.stringify(assignedClasses);
  useEffect(()=>{
    if (!assignedClasses.includes(selectedClass)) {setSelectedClass(assignedTarget(initialTarget) || '');setSelectedSubClass('All');}
  },[assignedKey,selectedClass]);
  const availableSubClasses = useMemo(() => {
    const section=reportClass(selectedClass).section;
    return section ? ['All',section] : ['All', ...getMappedSubClasses(selectedClass)];
  }, [selectedClass]);
  const studentsInClass = useMemo(() => {
    if (!assignedClasses.includes(selectedClass)) return [];
    return (onboardedStudents || []).filter(s=>studentInAssignedClass(s,selectedClass) &&
      (selectedSubClass==='All' || studentInAssignedClass(s,selectedSubClass)));
  }, [onboardedStudents, selectedClass, selectedSubClass, assignedKey]);

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

      const entry = findGradeEntry(resultsForStudent(results || [], student),{subject:selectedSubject,term:selectedTerm,year:selectedYear,classLevel:selectedClass});
      const {hasClass,hasExam,classScore,examScore,totalScore,hasScore}=gradeMarks(entry,academicSettings);

      return {
        index: index + 1,
        student,
        studentId: student.studentId || student.id || MISSING_SCORE,
        studentName: student.fullName || student.name || 'Student',
        subClass: student.classSection || student.subClass || reportClass(selectedClass).section || 'Not recorded',
        subject: entry?.subject || selectedSubject,
        hasScore,
        hasClass,
        hasExam,
        classScore,
        examScore,
        totalScore,
        grade: proficiencyGrade(totalScore),
        remarks: totalScore != null ? proficiencyRemark(totalScore) : (hasClass ? 'Class score recorded' : MISSING_SCORE),
        status: entry?.status || (hasScore ? 'Class Score Recorded' : 'Not Entered'),
        declineNote: entry?.declineNote,
        entry
      };
    });
  }, [filteredStudents, results, selectedSubject, selectedTerm, selectedYear, selectedClass, academicSettings]);

  // Each metric uses the same displayed rows; class-only saves count as entered.
  const stats = useMemo(()=>gradeRollStats(studentGradeRows,MISSING_SCORE),[studentGradeRows]);

  const updateManualResult = (key) => (event) => setResult((current) => ({ ...current, [key]: event.target.value }));

  const submitManual = (event) => {
    event.preventDefault();
    const score = Number(result.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    publishResult({ ...result, score, grade: proficiencyGrade(score), remarks: proficiencyRemark(score), status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() });
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
              onClick={() => onOpenScoreSheet({ classLevel: reportClass(selectedClass).level, subClass: selectedSubClass !== 'All' ? selectedSubClass : (reportClass(selectedClass).section || undefined), subject: selectedSubject })}
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

          {['head_admin','sub_admin'].includes(authUser.role) && <button
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
            <Plus size={14} /> School-wide Grading Settings
          </button>}
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

        {!assignedClasses.length && <p>No classes are assigned to this teacher. Ask the administrator to update the teaching assignments.</p>}
        {/* Class Pills / Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
          {assignedClasses.map((cls) => {
            const isSelected = selectedClass === cls;
            const count = (onboardedStudents || []).filter(s => studentInAssignedClass(s,cls)).length;

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
            {[...new Set([...catalogNames(subjects),...SCHOOL_SUBJECTS,...(results || []).map(r=>r.subject).filter(Boolean)])].map((sub) => (
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
            onChange={(e) => {periodTouched.current.term=true;setSelectedTerm(e.target.value);}}
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
            onChange={(e) => {periodTouched.current.year=true;setSelectedYear(e.target.value);}}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
          >
            {[...new Set([selectedYear,academicSettings?.academicYear,...(results || []).map(r=>r.year || r.academicYear)].filter(Boolean))].sort().reverse().map(year=><option key={year}>{year}</option>)}
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
          <div style={{ fontSize: 18, fontWeight: 900, color: '#047857', marginTop: 2 }}>{stats.avgTotal === MISSING_SCORE ? MISSING_SCORE : `${stats.avgTotal}%`}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Highest Score</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#9333ea', marginTop: 2 }}>{stats.topScore === MISSING_SCORE ? MISSING_SCORE : `${stats.topScore}%`}</div>
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
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{MISSING_SCORE}</span>
                        )}
                      </td>

                      {/* Exam Score (/50) */}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#9a3412', background: isHighlighted ? '#fef3c7' : '#fff7ed' }}>
                        {row.examScore != null ? (
                          <span>{Number(row.examScore).toFixed(1)} / 50</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{MISSING_SCORE}</span>
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
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{MISSING_SCORE}</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 900,
                          background: row.grade === '1' ? '#dcfce7' : (row.grade === '9' ? '#fee2e2' : '#f1f5f9'),
                          color: row.grade === '1' ? '#166534' : (row.grade === '9' ? '#dc2626' : '#334155')
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
                        ) : row.status === 'Pending Approval' ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>
                            🟡 Pending exam
                          </span>
                        ) : row.hasClass ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: '#dbeafe', color: '#1e40af' }}>
                            Class recorded
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8' }}>
                            {MISSING_SCORE}
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
                              classLevel: reportClass(selectedClass).level,
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
      {showManualSubmitModal && ['head_admin','sub_admin'].includes(authUser.role) && <AcademicSettingsManager gradingOnly onClose={() => setShowManualSubmitModal(false)} />}
    </div>
  );
}

export function StudentTimetable() {
  return <PublishedTimetable />;
}

export function StudentResults() {
  const { results, publishedReports, onboardedStudents } = usePortalData();
  const authUser = getAuthUser() || {};
  const me = (onboardedStudents || []).find((s) => {
    const sid = String(s.studentId || s.id || '').toLowerCase();
    const email = String(s.email || '').toLowerCase();
    const name = String(s.fullName || s.name || '').toLowerCase();
    return (authUser.studentId && sid === String(authUser.studentId).toLowerCase())
      || (authUser.email && email && email === String(authUser.email).toLowerCase())
      || (authUser.fullName && name && name === String(authUser.fullName).toLowerCase());
  }) || { studentId: authUser.studentId, fullName: authUser.fullName || authUser.name, email: authUser.email };
  const myResults = resultsForStudent(results, me);
  const download = () => {
    const rows = [['Course', 'Class score', 'Exam score', 'Total', 'Grade', 'Lecturer', 'Published'], ...myResults.map((item) => [
      item.subject,
      hasRecordedClassScore(item) ? item.classScore : MISSING_SCORE,
      hasRecordedExamScore(item) ? (item.examScoreConverted ?? item.examScore) : MISSING_SCORE,
      (hasRecordedClassScore(item) && hasRecordedExamScore(item)) ? `${item.score}%` : MISSING_SCORE,
      (hasRecordedClassScore(item) && hasRecordedExamScore(item)) ? item.grade : MISSING_SCORE,
      item.lecturer,
      item.updatedAt,
    ])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? MISSING_SCORE).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${me.fullName || 'student'}-results.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header"><h1 className="page-header__title">My results</h1><p className="page-header__subtitle">Only your recorded scores appear here. Subjects without a class or exam score show N/A until the subject teacher submits them.</p></div>
      {publishedReports.length > 0 && <section className="panel" style={{ marginBottom: 18 }}><div className="panel__header"><h2 className="panel__title">Lecturer-uploaded semester reports</h2></div><div className="course-list">{publishedReports.map((report) => <div className="course-row" key={report.id}><span><strong>{report.semester}</strong><small>{report.fileName} · uploaded {report.uploadedAt}</small></span><button className="academic-button" onClick={() => downloadPublishedReport(report)}><Download size={15}/> Download uploaded file</button></div>)}</div></section>}
      <section className="panel"><div className="panel__header"><h2 className="panel__title">Term result sheet</h2><button className="academic-button" onClick={download}><Download size={15}/> Download CSV</button></div><table className="data-table"><thead><tr><th>Course</th><th>Class</th><th>Exam</th><th>Total</th><th>Grade</th><th>Lecturer</th><th>Last updated</th></tr></thead><tbody>{myResults.length === 0 ? <tr><td colSpan={7} style={{ color: '#94a3b8' }}>{MISSING_SCORE}</td></tr> : myResults.map((item) => {
        const classOk = hasRecordedClassScore(item);
        const examOk = hasRecordedExamScore(item);
        const complete = classOk && examOk;
        return (
          <tr key={item.id || item.subject}>
            <td>{item.subject}</td>
            <td>{classOk ? item.classScore : MISSING_SCORE}</td>
            <td>{examOk ? (item.examScoreConverted ?? item.examScore) : MISSING_SCORE}</td>
            <td>{complete ? `${item.score}%` : MISSING_SCORE}</td>
            <td><span className="status-pill status-pill--success">{complete ? item.grade : MISSING_SCORE}</span></td>
            <td>{item.lecturer || MISSING_SCORE}</td>
            <td>{item.updatedAt || MISSING_SCORE}</td>
          </tr>
        );
      })}</tbody></table></section>
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
