import React, { useMemo, useState } from 'react';
import { Download, Plus, Save, CheckCircle2 } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { downloadPublishedReport } from '../../data/reportDownload';
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
    publishResult({ ...result, score, updatedAt: new Date().toLocaleString() });
    setNotice(`Result for ${result.subject} has been published for students to download.`);
  };
  return <div className="academic-view animate-fade-up">
    <div className="page-header"><h1 className="page-header__title">Publish results</h1><p className="page-header__subtitle">Results published here appear in the student result centre immediately.</p></div>
    <div className="academic-layout"><section className="panel"><div className="panel__header"><h2 className="panel__title">Current result sheet</h2></div><table className="data-table"><thead><tr><th>Course</th><th>Score</th><th>Grade</th><th>Published</th></tr></thead><tbody>{results.map((item) => <tr key={item.id || item.subject}><td>{item.subject}</td><td>{item.score}%</td><td><span className="status-pill status-pill--success">{item.grade}</span></td><td>{item.updatedAt}</td></tr>)}</tbody></table></section>
    <form className="panel academic-form" onSubmit={submit}><div className="panel__header"><h2 className="panel__title"><Save size={16}/> Publish result</h2></div><div className="panel__body">
      <label>Course<select value={result.subject} onChange={update('subject')}>{COURSE_CATALOGUE.map((course) => <option key={course}>{course}</option>)}</select></label>
      <label>Score<input type="number" min="0" max="100" value={result.score} onChange={update('score')} required /></label>
      <label>Grade<select value={result.grade} onChange={update('grade')}>{['A', 'A-', 'B+', 'B', 'C+', 'C', 'D'].map((grade) => <option key={grade}>{grade}</option>)}</select></label>
      <button className="academic-button" type="submit"><Save size={15}/> Publish for students</button>
      {notice && <p className="academic-success"><CheckCircle2 size={15}/>{notice}</p>}
    </div></form></div>
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

export function CourseRegistration() {
  const { courses, registerCourse } = usePortalData();
  const [notice, setNotice] = useState('');
  const toggle = (course) => { registerCourse(course); setNotice(`${course} has been added to your registered courses.`); };
  return <div className="academic-view animate-fade-up"><div className="page-header"><h1 className="page-header__title">Course registration</h1><p className="page-header__subtitle">Select electives for this term. Your registration is saved on this device.</p></div><section className="panel"><div className="panel__header"><h2 className="panel__title">Available courses</h2><span className="status-pill status-pill--info">{courses.length} registered</span></div><div className="course-list">{COURSE_CATALOGUE.map((course) => { const registered = courses.includes(course); return <div className="course-row" key={course}><span><strong>{course}</strong><small>{registered ? 'Registered for Term 1' : 'Available elective'}</small></span><button className={registered ? 'academic-button academic-button--muted' : 'academic-button'} disabled={registered} onClick={() => toggle(course)}>{registered ? <><CheckCircle2 size={15}/> Registered</> : <><Plus size={15}/> Register</>}</button></div>; })}</div>{notice && <p className="academic-success course-notice"><CheckCircle2 size={15}/>{notice}</p>}</section></div>;
}
