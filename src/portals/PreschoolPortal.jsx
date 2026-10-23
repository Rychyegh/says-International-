import React, { useEffect, useState } from 'react';
import { api, request } from '../services/api';
import SchoolPrintHeader from '../components/School/SchoolPrintHeader';
import './PreschoolPortal.css';

const kgAreas = {
  'Language and literacy': ['Participating in songs and rhymes', 'Following spoken directions', 'Sharing stories and favourite characters', 'Combining syllables into words', 'Developing a story', 'Communicating through labelled drawings', 'Writing short sentences'],
  Numeracy: ['Describing position and movement', 'Measuring and comparing container capacity', 'Comparing physical attributes', 'Organising data and reading simple graphs'],
  'Creative arts': ['Creating practical artworks', 'Collecting personal artworks in an album'],
  'Our world and our people': ['Recognising living and non-living things', 'Caring for animals', 'Recognising Ghanaian weather', 'Exploring connections with other communities', 'Understanding plant growth'],
  'Social-emotional learning': ['Cooperating and sharing', 'Expressing and managing feelings', 'Acting confidently and independently', 'Listening and following instructions', 'Taking turns patiently', 'Joining movement and balance activities'],
};
const crecheAreas = {
  'Classroom skills': ['I get involved in and attend to activities', 'I can follow direction', "I respond well to teacher’s suggestions", 'I use books correctly', 'I am a curious child', 'I ask questions', 'I can play with logos'],
  'Feeding skills': ['I am able to express hunger', 'I am able to eat well'],
  'Gross motor skills': ['I can alternate feet on stairs', 'I can gallop', 'I can balance on right foot', 'I can hop on one foot', 'I can hop on two feet', 'I can throw a ball forward', 'I can kick a ball forward'],
  'Listening skills': ['I listen quietly to stories', 'My attention span is lengthening', 'I respond to story by recalling a specific detail'],
  'Music skills': ['I participate in group singing', 'I enjoy doing musical activities', 'I am learning to repeat rhythmic patterns'],
  'Practical life': ['I participate in carrying, cutting, washing, pegging activities', 'I can pour and spoon without spilling', 'I can thread beads and laces', 'I help clean messes after my project'],
  'Reliance skills': ['I can go to the bathroom myself', 'I can wash and dry my hands', 'I can wear my shoes', 'I make good use of my free time'],
  Sensorial: ['I can arrange broad stairs', 'I can use scissors', 'I can arrange pink tower', 'I can arrange knobbed cylinders'],
  'Social and emotional skills': ['I use words please, thank you and excuse me', "I accept and respond to my teacher’s authority", 'I have a good self-image', 'I am happy and cheerful at school', 'I play and share with other children'],
  'Speaking skills': ['I speak clearly', 'I communicate in sentences', 'I can answer some questions', 'I wait for my turn when speaking in a group', 'I can use language to communicate my wants and ideas', 'I am expanding my vocabulary'],
};
const blank = () => ({ student_id: '', academic_year: '', term: '', school_days: '', days_present: '', general_comments: '', vacation_date: '', reopening_date: '', progression: '', assessments: {} });
export default function PreschoolPortal() {
  const [session, setSession] = useState(null), [learners, setLearners] = useState([]), [form, setForm] = useState(blank), [saved, setSaved] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { let live = true; (async () => { try { const verified = await api.getVerifiedSession(); if (verified.user.role !== 'preschool_teacher' || verified.requiresSecondFactor) throw new Error('A verified preschool teacher account issued by Head Admin is required.'); const raw = await request('/preschool/learners'); if (!Array.isArray(raw.items)) throw new Error('The preschool learner API is not available in the expected format.'); if (live) { setSession(verified.user); setLearners(raw.items); } } catch (failure) { if (live) setError(failure.message); } })(); return () => { live = false; }; }, []);
  const change = (key, value) => { setForm(current => ({ ...current, [key]: value })); setSaved(null); };
  const learner = learners.find(row => row.id === form.student_id);
  const creche = learner?.report_template === 'creche-progressive-v1';
  const areas = creche ? crecheAreas : kgAreas;
  const ratings = creche ? ['Good', 'Working on skill'] : ['G','S','B','X','O'];
  const assess = (key, field, value) => { setForm(current => ({ ...current, assessments: { ...current.assessments, [key]: { ...current.assessments[key], [field]: value } } })); setSaved(null); };
  const submit = async event => { event.preventDefault(); if (busy) return; setError(''); if (Number(form.days_present) > Number(form.school_days)) { setError('Days present cannot exceed school days.'); return; } setBusy(true); try { const raw = await request('/preschool/reports', { method: 'POST', body: JSON.stringify({ ...form, template: learner.report_template, school_days: Number(form.school_days), days_present: Number(form.days_present) }) }); if (!raw.report?.id) throw new Error('The server did not confirm a saved report.'); setSaved(raw.report); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  if (!session) return <main className="preschool-portal"><h1>Pre-school Teacher Portal</h1><p role="status">{error || 'Verifying your school account…'}</p></main>;
  return <main className="preschool-portal"><header><SchoolPrintHeader /><h1>{creche ? 'Creche Progressive Report' : 'Pre-school Teacher Portal'}</h1><p>{session.full_name || session.name}</p><p>Assess learners in your assigned class using the school report framework.</p></header>
    {error && <p role="alert">{error}</p>}
    {learner && <section className="preschool-learner-summary"><strong>Student name: {learner.full_name}</strong><p>Student ID: {learner.student_code || learner.id} · Class: {learner.class_name}</p><p>Academic period: Term {form.term || '—'}, {form.academic_year || '—'} · Attendance: {form.days_present || '—'} out of {form.school_days || '—'}</p></section>}
    <form onSubmit={submit}><fieldset disabled={busy}><legend>Learner and term</legend><div className="preschool-grid">
      <label>Learner<select required value={form.student_id} onChange={event => { setForm({ ...blank(), student_id: event.target.value }); setSaved(null); }}><option value="">Select assigned learner</option>{learners.filter(learner => ['kg2-2025','creche-progressive-v1'].includes(learner.report_template)).map(learner => <option key={learner.id} value={learner.id}>{learner.full_name} · {learner.class_name}</option>)}</select></label>
      <label>Academic year<input required value={form.academic_year} placeholder="2026/2027" onChange={event => change('academic_year', event.target.value)} /></label>
      <label>Term<select required value={form.term} onChange={event => change('term', event.target.value)}><option value="">Select term</option>{[1,2,3].map(term => <option key={term} value={term}>Term {term}</option>)}</select></label>
      {['school_days','days_present'].map(key => <label key={key}>{key === 'school_days' ? 'School days' : 'Days present'}<input required type="number" min="0" step="1" value={form[key]} onChange={event => change(key,event.target.value)} /></label>)}
      <p>Days absent: {form.school_days !== '' && form.days_present !== '' ? Number(form.school_days)-Number(form.days_present) : '—'}</p>
    </div></fieldset>
    <p>{creche ? 'Activity / Remarks · Choose Good or Working on skill for each activity.' : 'G: Gold · S: Silver · B: Bronze · X: Not assessed/introduced · O: Absent.'}</p>
    {Object.entries(areas).map(([area,skills],areaIndex) => <fieldset disabled={busy} key={area}><legend>{area}</legend>{skills.map((skill,index) => { const key=`${areaIndex+1}.${index+1}`; return <div className="preschool-skill" key={key}><label>{skill}<select required value={form.assessments[key]?.rating || ''} onChange={event => assess(key,'rating',event.target.value)}><option value="">Choose rating</option>{ratings.map(rating => <option key={rating}>{rating}</option>)}</select></label><label>Observation / comment<input value={form.assessments[key]?.comment || ''} onChange={event => assess(key,'comment',event.target.value)} /></label></div>; })}</fieldset>)}
    <fieldset disabled={busy}><legend>Progress and school information</legend><label>General comments<textarea required value={form.general_comments} onChange={event => change('general_comments',event.target.value)} /></label><div className="preschool-grid">{['vacation_date','reopening_date','progression'].map(key => <label key={key}>{key.replaceAll('_',' ')}<input type={key.endsWith('date')?'date':'text'} value={form[key]} onChange={event => change(key,event.target.value)} /></label>)}</div><button disabled={busy} type="submit">{busy?'Saving…':'Save learner report'}</button></fieldset></form>
    {saved && <section role="status"><h2>Report saved · {saved.id}</h2><p>Status: {saved.status}. Approval and official print availability are controlled by the school backend.</p></section>}
  </main>;
}
