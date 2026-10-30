import React, { useState } from 'react';
import { BookOpen, Check, ChevronRight, GraduationCap, Loader2, Search, Users, X } from 'lucide-react';
import ViewportModal from '../Modal/ViewportModal';
import { findTeachingAssignment } from '../../data/PortalStore';
import './TeacherSubjectAssignment.css';

export default function TeacherSubjectAssignment({ teachers, assignments, subjects, onSave, onClose }) {
  const [teacherId, setTeacherId] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = teacher => teacher.userId || teacher.staffRecordId || teacher.id;
  const teacher = teachers.find(t => String(key(t)) === teacherId);
  const existing = teacher && findTeachingAssignment(assignments, teacher);
  const classes = teacher?.classAssigned ? teacher.classAssigned.split(',').map(s => s.trim()).filter(Boolean) : existing?.classes || [];
  const available = Array.from(new Set([...subjects, ...selected]));
  const visible = available.filter(subject => subject.toLowerCase().includes(search.trim().toLowerCase()));
  const chooseTeacher = event => {
    const id = event.target.value;
    const person = teachers.find(t => String(key(t)) === id);
    const saved = person && findTeachingAssignment(assignments, person);
    setTeacherId(id);
    setSelected(saved?.subjects || (person?.subject || '').split(',').map(s => s.trim()).filter(s => subjects.includes(s)));
    setSearch('');
    setError('');
  };
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (!teacher || !classes.length || !selected.length) {
      setError('Select a teacher with an allocated class and at least one subject.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({ userId: teacher.userId || '', staffRecordId: teacher.staffRecordId || '', staffId: teacher.staffId, teacherName: teacher.name, role: teacher.role, email: teacher.email, classes, subjects: selected });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <ViewportModal onClose={() => !busy && onClose()} className="teacher-subject-overlay" aria-labelledby="teacher-subject-title" onKeyDown={event => { if (event.key === 'Escape' && !busy) onClose(); }}>
    <section className="teacher-subject-dialog">
      <header className="tsa-header">
        <div className="tsa-header-icon"><GraduationCap size={24}/></div>
        <div><span className="tsa-eyebrow">CLASSES & STAFF</span><h2 id="teacher-subject-title">Assign teacher subjects</h2><p>Choose a teacher, then add the subjects they teach.</p></div>
        <button className="tsa-close" type="button" disabled={busy} onClick={onClose} aria-label="Close subject assignment"><X size={20}/></button>
      </header>
      <form onSubmit={submit} className="tsa-form">
        <div className="tsa-body">
          <fieldset disabled={busy} className="tsa-fields">
            <label className="tsa-label" htmlFor="tsa-teacher">Teacher <span>From UAC</span></label>
            <div className="tsa-select-wrap"><Users size={18}/><select id="tsa-teacher" required value={teacherId} onChange={chooseTeacher}><option value="">Choose a teacher</option>{teachers.map(person => <option key={key(person)} value={key(person)}>{person.name} · {person.classAssigned || 'Class not assigned'}</option>)}</select></div>
            {!teachers.length && <p className="tsa-note">Create a teacher account and allocate a class in UAC to get started.</p>}
            {teacher && <div className="tsa-profile"><div className="tsa-avatar">{teacher.name?.trim().slice(0, 1).toUpperCase() || 'T'}</div><div className="tsa-profile-info"><strong>{teacher.name}</strong><span>{teacher.role}</span></div><div className="tsa-class"><GraduationCap size={15}/>{classes.join(', ') || 'No class allocated'}</div></div>}
            {teacher && !classes.length && <p className="tsa-error" role="status">Allocate a class to this teacher in UAC before assigning subjects.</p>}
            <div className="tsa-subject-heading"><div><h3><BookOpen size={17}/> Subjects</h3><p>Select all subjects this teacher handles.</p></div><span className="tsa-count" aria-live="polite">{selected.length} selected</span></div>
            <div className="tsa-search"><Search size={17}/><input aria-label="Search subjects" placeholder="Search subjects…" value={search} onChange={event => setSearch(event.target.value)}/>{search && <button type="button" aria-label="Clear subject search" onClick={() => setSearch('')}><X size={15}/></button>}</div>
            <div className="tsa-subject-grid">
              {visible.map(subject => <label key={subject} className={`tsa-subject${selected.includes(subject) ? ' is-selected' : ''}${!teacher ? ' is-disabled' : ''}`}><input disabled={!teacher} type="checkbox" checked={selected.includes(subject)} onChange={event => setSelected(list => event.target.checked ? [...list, subject] : list.filter(item => item !== subject))}/><span className="tsa-check"><Check size={13}/></span><span>{subject}</span></label>)}
            </div>
            {!visible.length && <p className="tsa-empty">No subjects match “{search}”.</p>}
          </fieldset>
          {error && <p className="tsa-error" role="alert">{error}</p>}
        </div>
        <footer className="tsa-footer"><span><Check size={14}/> Name and class are linked to UAC</span><div><button type="button" className="tsa-cancel" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="tsa-save" disabled={busy || !teacher || !classes.length || !selected.length}>{busy ? <Loader2 size={16} className="tsa-spin"/> : null}{busy ? 'Saving…' : 'Save subjects'}{!busy && <ChevronRight size={16}/>}</button></div></footer>
      </form>
    </section>
  </ViewportModal>;
}
