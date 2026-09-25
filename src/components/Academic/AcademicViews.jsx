import React, { useMemo, useState } from 'react';
import { Download, Plus, Save, CheckCircle2, User, Users, FileCheck, Search, Trash2, Printer } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { downloadPublishedReport } from '../../data/reportDownload';
import RegisterForExamsForm from '../RegisterForExams/RegisterForExamsForm';
import AcademicSettingsManager from './AcademicSettingsManager';
import './AcademicViews.css';

const COURSE_CATALOGUE = ['Pure Mathematics', 'Physics', 'Literature in English', 'ICT Project', 'Chemistry', 'Economics', 'Government', 'Biology'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const blankTimetable = { day: 'Monday', time: '08:00 AM', subject: '', room: '', lecturer: 'Mr. Samuel Amponsah' };
const blankResult = { subject: 'Pure Mathematics', score: 0, grade: 'A', lecturer: 'Mr. Samuel Amponsah' };

export function LecturerSchedule() {
  const { timetable, saveTimetableEntry } = usePortalData();
  const [entry, setEntry] = useState(blankTimetable);
  const [notice, setNotice] = useState('');
  const update = (key) => (event) => setEntry((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (!entry.subject.trim() || !entry.room.trim()) return;
    saveTimetableEntry(entry);
    setNotice(`${entry.subject} is now visible in the student timetable.`);
    setEntry(blankTimetable);
  };
  return <div className="academic-view animate-fade-up">
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
  </div>;
}

export function LecturerGrades() {
  const { results, publishResult } = usePortalData();
  const [result, setResult] = useState(blankResult);
  const [notice, setNotice] = useState('');
  const update = (key) => (event) => setResult((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const score = Number(result.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    publishResult({ ...result, score, status: 'Pending Approval', declineNote: null, updatedAt: new Date().toLocaleString() });
    setNotice(`Result for ${result.subject} submitted successfully! Pending Academic Head approval.`);
    setTimeout(() => setNotice(''), 5000);
  };
  return <div className="academic-view animate-fade-up">
    <div className="page-header">
      <h1 className="page-header__title">Publish & Submit Academic Results 📝</h1>
      <p className="page-header__subtitle">Results submitted by teachers require Academic Head approval before appearing on student transcripts.</p>
    </div>
    <div className="academic-layout">
      <section className="panel">
        <div className="panel__header">
          <h2 className="panel__title">Submitted Result Sheet & Approval Status</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Approval Status</th>
              <th>Action / Notes</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.id || item.subject} style={{ background: item.status === 'Declined' ? '#fff1f2' : 'transparent' }}>
                <td><strong>{item.subject}</strong></td>
                <td><span style={{ fontWeight: 800 }}>{item.score}%</span></td>
                <td><span className="status-pill status-pill--success">{item.grade}</span></td>
                <td>
                  {item.status === 'Approved' ? (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                      🟢 Approved by Academic Head
                    </span>
                  ) : item.status === 'Declined' ? (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}>
                      🔴 DECLINED (Needs Correction)
                    </span>
                  ) : (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>
                      🟡 Pending Academic Head Review
                    </span>
                  )}
                </td>
                <td>
                  {item.status === 'Declined' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, background: '#fecaca', padding: '6px 10px', borderRadius: 6, borderLeft: '4px solid #dc2626' }}>
                        <strong>Error Note from Academic Head:</strong> {item.declineNote || 'Correction required.'}
                      </div>
                      <button
                        onClick={() => setResult({ subject: item.subject, score: item.score, grade: item.grade, lecturer: item.lecturer || 'Mr. Samuel Amponsah' })}
                        style={{ padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
                      >
                        ✏️ Edit & Resubmit Corrected Result
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Submitted: {item.updatedAt}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form className="panel academic-form" onSubmit={submit}>
        <div className="panel__header">
          <h2 className="panel__title"><Save size={16}/> Submit Course Result</h2>
        </div>
        <div className="panel__body">
          <label>Course<select value={result.subject} onChange={update('subject')}>{COURSE_CATALOGUE.map((course) => <option key={course}>{course}</option>)}</select></label>
          <label>Score (%)<input type="number" min="0" max="100" value={result.score} onChange={update('score')} required /></label>
          <label>Grade<select value={result.grade} onChange={update('grade')}>{['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'F'].map((grade) => <option key={grade}>{grade}</option>)}</select></label>
          <button className="academic-button" type="submit"><Save size={15}/> Submit to Academic Head</button>
          {notice && <p className="academic-success"><CheckCircle2 size={15}/>{notice}</p>}
        </div>
      </form>
    </div>
  </div>;
}

export function StudentTimetable() {
  const { timetable } = usePortalData();
  const grouped = useMemo(() => DAYS.map((day) => ({ day, entries: timetable.filter((item) => item.day === day) })), [timetable]);
  return <div className="academic-view animate-fade-up"><div className="page-header"><h1 className="page-header__title">My timetable</h1><p className="page-header__subtitle">Updates from your lecturers appear here automatically.</p></div><div className="timetable-grid">{grouped.map(({ day, entries }) => <section className="panel timetable-day" key={day}><div className="panel__header"><h2 className="panel__title">{day}</h2></div><div className="panel__body">{entries.length ? entries.map((item) => <div className="student-class" key={item.id}><strong>{item.time}</strong><span>{item.subject}</span><small>{item.room} · {item.lecturer}</small></div>) : <p className="empty-state">No classes scheduled.</p>}</div></section>)}</div></div>;
}

export function StudentResults() {
  const { results, publishedReports } = usePortalData();
  const download = () => {
    const rows = [['Course', 'Score', 'Grade', 'Lecturer', 'Published'], ...results.map((item) => [item.subject, `${item.score}%`, item.grade, item.lecturer, item.updatedAt])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'Kwame-Edwards-results.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="academic-view animate-fade-up"><div className="page-header"><h1 className="page-header__title">My results</h1><p className="page-header__subtitle">Download your current result sheet directly to this computer. Lecturer-uploaded semester files are shared here and with the relevant parent report request.</p></div>{publishedReports.length > 0 && <section className="panel" style={{ marginBottom: 18 }}><div className="panel__header"><h2 className="panel__title">Lecturer-uploaded semester reports</h2></div><div className="course-list">{publishedReports.map((report) => <div className="course-row" key={report.id}><span><strong>{report.semester}</strong><small>{report.fileName} · uploaded {report.uploadedAt}</small></span><button className="academic-button" onClick={() => downloadPublishedReport(report)}><Download size={15}/> Download uploaded file</button></div>)}</div></section>}<section className="panel"><div className="panel__header"><h2 className="panel__title">Term 1 result sheet</h2><button className="academic-button" onClick={download}><Download size={15}/> Download CSV</button></div><table className="data-table"><thead><tr><th>Course</th><th>Score</th><th>Grade</th><th>Lecturer</th><th>Last updated</th></tr></thead><tbody>{results.map((item) => <tr key={item.id || item.subject}><td>{item.subject}</td><td>{item.score}%</td><td><span className="status-pill status-pill--success">{item.grade}</span></td><td>{item.lecturer}</td><td>{item.updatedAt}</td></tr>)}</tbody></table></section></div>;
}

export function ExamRegistration() {
  return <RegisterForExamsForm />;
}

export function CourseRegistration() {
  return <RegisterForExamsForm />;
}
function LegacyExamRegistration() {
  const classLevelsList = [
    'Kindergarten 1 & 2',
    'Basic One',
    'Basic 2 & 3',
    'Grade 4',
    'Primary 5',
    'Upper Primary (Basic 4 - 6)',
    'JHS 1',
    'JHS 2',
    'JHS 3',
    'SHS 1',
    'SHS 2',
    'SHS 3'
  ];

  const targetClassStudents = useMemo(() => {
    if (selectedClass === 'All Classes') return onboardedStudents;
    return onboardedStudents.filter(s =>
      (s.level || '').toLowerCase().includes(selectedClass.toLowerCase()) ||
      selectedClass.toLowerCase().includes((s.level || '').toLowerCase())
    );
  }, [onboardedStudents, selectedClass]);

  const handleSingleRegisterSubmit = (e) => {
    e.preventDefault();
    const foundStu = onboardedStudents.find(s => s.id === selectedStudentId || s.studentId === selectedStudentId);
    const stuName = foundStu ? foundStu.fullName : customStudentName.trim();
    const stuId = foundStu ? foundStu.studentId : (selectedStudentId || `STU-${Date.now()}`);

    if (!stuName) {
      alert('Please select a student or enter a student name.');
      return;
    }

    if (registerClassSemester) {
      registerClassSemester({
        studentId: stuId,
        studentName: stuName,
        classLevel: foundStu ? foundStu.level : selectedClass,
        academicYear,
        term: examTerm,
        subject: selectedSubject,
        examType
      });
      setNotice(`✅ Successfully registered student ${stuName} (${stuId}) for ${examTerm}!`);
      setSelectedStudentId('');
      setCustomStudentName('');
      setTimeout(() => setNotice(''), 6000);
    }
  };

  const handleClassRegisterSubmit = (e) => {
    e.preventDefault();
    if (registerClassSemester) {
      registerClassSemester({
        classLevel: selectedClass,
        academicYear,
        term: examTerm,
        subject: selectedSubject,
        examType
      });
      const count = targetClassStudents.length > 0 ? targetClassStudents.length : onboardedStudents.length;
      setNotice(`⚡ Successfully registered ${count} students in ${selectedClass} for ${examTerm}!`);
      setTimeout(() => setNotice(''), 7000);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return semesterRegistrations.filter(reg => {
      const matchesSearch = !searchQuery ||
        (reg.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.term || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = filterClass === 'All' ||
        (reg.classLevel || '').toLowerCase().includes(filterClass.toLowerCase());

      return matchesSearch && matchesClass;
    });
  }, [semesterRegistrations, searchQuery, filterClass]);

  const exportCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Class Level', 'Exam Session / Term', 'Subject Scope', 'Status', 'Date Registered'];
    const rows = filteredRegistrations.map(r => [
      r.studentId || '',
      r.studentName || '',
      r.classLevel || '',
      r.term || '',
      r.subject || 'All Subjects',
      r.status || 'Registered',
      r.registeredAt || ''
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Official_Exam_Candidate_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="academic-view animate-fade-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-header__title">Academic Exam & Semester Registration 📝</h1>
          <p className="page-header__subtitle">
            Register individual students or entire class rosters for upcoming end-of-term examinations, BECE/WASSCE mocks, and course assessments.
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setRegMode('single')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              background: regMode === 'single' ? '#0f172a' : 'transparent',
              color: regMode === 'single' ? '#ffffff' : '#64748b'
            }}
          >
            👤 Register Single Student
          </button>
          <button
            type="button"
            onClick={() => setRegMode('class')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              background: regMode === 'class' ? '#166534' : 'transparent',
              color: regMode === 'class' ? '#ffffff' : '#64748b'
            }}
          >
            👥 Register Whole Class
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: 10, fontWeight: 800, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {/* Registration Control Panel */}
      <div className="panel" style={{ marginBottom: 24, padding: 24, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div className="panel__header" style={{ marginBottom: 16 }}>
          <h2 className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
            {regMode === 'single' ? <User size={18} color="#0284c7" /> : <Users size={18} color="#166534" />}
            {regMode === 'single' ? 'Individual Student Exam Registration' : 'Bulk Class Exam Registration'}
          </h2>
        </div>

        {regMode === 'single' ? (
          <form onSubmit={handleSingleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Select Enrolled Student:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                >
                  <option value="">-- Choose Student from Roster --</option>
                  {onboardedStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentId} · {s.level})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedStudentId && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                    Or Enter Student Full Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Benjamin Edwards"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Exam Session / Term:
                </label>
                <select
                  value={examTerm}
                  onChange={(e) => setExamTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                >
                  <option>Term 1 End-of-Term Examinations</option>
                  <option>Term 1 Mid-Term Assessment</option>
                  <option>Term 2 Final Examinations</option>
                  <option>BECE Mock Examinations</option>
                  <option>WASSCE Examinations</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Subject / Course Scope:
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                >
                  <option>All Core & Elective Subjects</option>
                  {COURSE_CATALOGUE.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 24px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8,
                fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              ⚡ Register Student for Exams
            </button>
          </form>
        ) : (
          <form onSubmit={handleClassRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Select Target Class Level:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, color: '#166534' }}
                >
                  {classLevelsList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Exam Session / Term:
                </label>
                <select
                  value={examTerm}
                  onChange={(e) => setExamTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                >
                  <option>Term 1 End-of-Term Examinations</option>
                  <option>Term 1 Mid-Term Assessment</option>
                  <option>Term 2 Final Examinations</option>
                  <option>BECE Mock Examinations</option>
                  <option>WASSCE Examinations</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Subject / Course Scope:
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                >
                  <option>All Core & Elective Subjects</option>
                  {COURSE_CATALOGUE.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                📋 CLASS ROSTER SUMMARY:
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#14532d' }}>
                {targetClassStudents.length} enrolled students in {selectedClass} ready for bulk exam registration
              </span>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 24px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: 8,
                fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              ⚡ Register Entire Class ({selectedClass}) for Exams
            </button>
          </form>
        )}
      </div>

      {/* Registered Candidates Register & Roll Call Table */}
      <section className="panel" style={{ padding: 24, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="panel__title" style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              Registered Exam Candidates Register ({filteredRegistrations.length})
            </h2>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Official roll call list of students registered for exams</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportCSV}
              style={{ padding: '6px 14px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
            >
              📥 Export Candidate Roll Call (CSV)
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '6px 14px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}
            >
              🖨️ Print Candidate Register
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search candidate by student name, ID or term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
          />

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700 }}
          >
            <option value="All">Filter by Class: All</option>
            {classLevelsList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px' }}>Student Name & ID</th>
                <th style={{ padding: '10px 12px' }}>Class Level</th>
                <th style={{ padding: '10px 12px' }}>Exam Session / Term</th>
                <th style={{ padding: '10px 12px' }}>Subject Scope</th>
                <th style={{ padding: '10px 12px' }}>Registration Status</th>
                <th style={{ padding: '10px 12px' }}>Registered On</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                    No registered exam candidates found. Use the registration panel above to register a single student or an entire class for exams.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <strong>{reg.studentName}</strong>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{reg.studentId}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{reg.classLevel}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{reg.term}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{reg.subject || 'All Registered Subjects'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                        ✅ Registered for Exams
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{reg.registeredAt || 'Today'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (deleteSemesterRegistration) deleteSemesterRegistration(reg.id);
                        }}
                        style={{ padding: '3px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
                        title="Unregister candidate from exams"
                      >
                        Unregister
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
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

