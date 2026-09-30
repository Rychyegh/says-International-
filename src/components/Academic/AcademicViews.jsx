import React, { useMemo, useState } from 'react';
import { Download, Plus, Save, CheckCircle2 } from 'lucide-react';
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
  return (
    <div className="academic-view animate-fade-up">
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
