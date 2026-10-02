import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { SCHOOL_DAYS, timetableErrors } from '../../lib/timetableRules';
import './AcademicViews.css';

const blank = () => ({ day: 'Monday', start_time: '08:00', end_time: '09:00', class_id: '', teacher_id: '', subject_id: '', room_id: '' });
const failure = error => /404|not found|405/i.test(error.message) ? 'Timetable publishing is not available on the backend yet. Please contact the school administrator.' : error.message;
const label = (catalogs, key, id) => catalogs[key]?.find(item => item.id === id)?.name || id;

export function TimetableManager() {
  const [workspace, setWorkspace] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entry, setEntry] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const accept = saved => { setWorkspace(saved); setEntries(saved.entries); };
  const run = async action => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (err) { setError(failure(err)); }
    finally { lock.current = false; setBusy(false); }
  };
  const reload = () => run(async () => { accept(await api.getTimetableWorkspace()); setEntry(blank()); setEditing(null); });
  useEffect(() => { reload(); }, []);
  const dirty = workspace && JSON.stringify(entries) !== JSON.stringify(workspace.entries);
  const errors = timetableErrors(entries);
  const change = e => setEntry(current => ({ ...current, [e.target.name]: e.target.value }));
  const add = event => {
    event.preventDefault();
    const next = editing == null ? [...entries, entry] : entries.map((item, index) => index === editing ? entry : item);
    const problems = timetableErrors(next);
    if (problems.length) { setError(problems.join(' ')); return; }
    setEntries(next); setEntry(blank()); setEditing(null); setError(''); setNotice('Lesson added to the draft. Save to database, then publish.');
  };
  return <div className="academic-view">
    <div className="page-header"><h1 className="page-header__title">Timetable planning & publishing</h1><p>Head of academics: prepare the weekly timetable for the active academic term. Save the draft before publishing.</p></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <button className="academic-button" disabled={busy} onClick={reload}>Reload saved timetable{dirty ? ' (discard local edits)' : ''}</button>
    {!workspace && <p>{busy ? 'Loading timetable…' : 'No timetable workspace loaded.'}</p>}
    {workspace && <>
      <p>{workspace.academic_year} · {workspace.term} · {workspace.timezone || 'Africa/Accra'} · Revision {workspace.revision}</p>
      {!workspace.can_manage && <p>Only the head of academics or an explicitly authorised delegate can edit this timetable.</p>}
      {workspace.can_manage && <form className="panel academic-form" onSubmit={add}><fieldset disabled={busy} className="panel__body">
        <legend>{editing == null ? 'Add lesson' : 'Edit lesson'}</legend>
        {[['class_id', 'classes', 'Class / section'], ['subject_id', 'subjects', 'Subject'], ['teacher_id', 'teachers', 'Teacher'], ['room_id', 'rooms', 'Room']].map(([key, catalog, title]) => <label key={key} htmlFor={`timetable-${key}`}>{title}<select id={`timetable-${key}`} aria-label={title} required name={key} value={entry[key]} onChange={change}><option value="">Select {title.toLowerCase()}</option>{workspace.catalogs[catalog].map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}
        <label>Day<select name="day" value={entry.day} onChange={change}>{SCHOOL_DAYS.map(day => <option key={day}>{day}</option>)}</select></label>
        <label>Start time<input required type="time" name="start_time" value={entry.start_time} onChange={change}/></label>
        <label>End time<input required type="time" name="end_time" value={entry.end_time} onChange={change}/></label>
        <button className="academic-button" type="submit">{editing == null ? 'Add to draft' : 'Update draft lesson'}</button>
        {editing != null && <button type="button" onClick={() => { setEditing(null); setEntry(blank()); }}>Cancel edit</button>}
      </fieldset></form>}
      <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr>{['Day / time', 'Class', 'Subject', 'Teacher', 'Room', 'Actions'].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>
        {entries.map((item, index) => <tr key={item.id || index}><td>{item.day} {item.start_time}–{item.end_time}</td>{[['classes', 'class_id'], ['subjects', 'subject_id'], ['teachers', 'teacher_id'], ['rooms', 'room_id']].map(([catalog, key]) => <td key={key}>{label(workspace.catalogs, catalog, item[key])}</td>)}<td>{workspace.can_manage && <><button disabled={busy || editing != null} onClick={() => { setEditing(index); setEntry({ ...item }); }}>Edit</button> <button disabled={busy || editing != null} onClick={() => setEntries(current => current.filter((_, i) => i !== index))}>Remove from draft</button></>}</td></tr>)}
        {!entries.length && <tr><td colSpan={6}>No lessons in this draft.</td></tr>}
      </tbody></table></div>
      {workspace.can_manage && workspace.can_publish !== true && <p>You can prepare and save drafts. Publication requires an authorised publisher.</p>}
      {errors.length > 0 && <p role="alert">{errors.join(' ')}</p>}
      {(workspace.can_manage || workspace.can_publish === true) && <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {workspace.can_manage && <button className="academic-button" disabled={busy || !dirty || errors.length > 0 || editing != null} onClick={() => run(async () => { accept(await api.saveTimetableDraft({ ...workspace, entries })); setNotice('Draft saved to the database. Published schedules are unchanged until you publish.'); })}>Save draft to database</button>}
        {workspace.can_publish === true && <button className="academic-button" disabled={busy || dirty || errors.length > 0 || editing != null || workspace.published_revision === workspace.revision} onClick={() => run(async () => { accept(await api.publishTimetable(workspace)); setNotice('Published. Students, teachers, class teachers and linked parents can now see their relevant lessons.'); })}>Publish saved timetable</button>}
      </div>}
    </>}
  </div>;
}

export function PublishedTimetable({ studentId, parent = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    setData(null); setError('');
    if (parent && !studentId) { setLoading(false); return; }
    const load = async () => {
      if (inFlight) return;
      inFlight = true; setLoading(true);
      try { const next = await api.getPublishedTimetable(studentId); if (active) { setData(next); setError(''); } }
      catch (err) { if (active) { setError(failure(err)); setData(null); } }
      finally { inFlight = false; if (active) setLoading(false); }
    };
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('focus', load);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', load); };
  }, [studentId, parent, reload]);
  const entries = [...(data?.entries || [])].sort((a, b) => SCHOOL_DAYS.indexOf(a.day) - SCHOOL_DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time));
  return <div className="academic-view"><div className="page-header"><h1 className="page-header__title">Published timetable</h1><p>Lessons for your assigned classes and teaching responsibilities.{data && ` ${data.academic_year || ''} · ${data.term || ''} · ${data.timezone || 'Africa/Accra'}`}</p></div>
    <button className="academic-button" disabled={loading} onClick={() => setReload(value => value + 1)}>Refresh timetable</button>
    {error && <p role="alert" className="form-error">{error}</p>}
    {loading && <p role="status">Loading timetable…</p>}
    {parent && !studentId && <p>Select a linked child to view their timetable.</p>}
    {!loading && !error && data && !entries.length && <p>No timetable has been published for you yet.</p>}
    {SCHOOL_DAYS.filter(day => entries.some(item => item.day === day)).map(day => <section className="panel" key={day}><div className="panel__header"><h2 className="panel__title">{day}</h2></div><div className="schedule-list">{entries.filter(item => item.day === day).map(item => <div className="schedule-row" key={item.id}><strong>{item.start_time}–{item.end_time}</strong><span>{item.subject_name} · {item.class_name}</span><small>{item.teacher_name} · {item.room_name}</small></div>)}</div></section>)}
  </div>;
}
