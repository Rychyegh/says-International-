import React, { useMemo, useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';
import './ParentCommunication.css';
import { usePortalData } from '../../data/PortalStore';


const TEACHERS = [
  { id: 'sarah', name: 'Ms. Sarah Mensah', subject: 'Social Studies', role: 'Class Teacher', email: 'sarah.mensah@remaljcarewell.edu.gh', availability: 'Available today · 2:30–4:00 PM' },
  { id: 'kofi', name: 'Mr. Kofi Appiah', subject: 'Mathematics', role: 'Subject Teacher', email: 'kofi.appiah@remaljcarewell.edu.gh', availability: 'Available tomorrow · 10:00–11:30 AM' },
  { id: 'ama', name: 'Mrs. Ama Boateng', subject: 'English Language', role: 'Subject Teacher', email: 'ama.boateng@remaljcarewell.edu.gh', availability: 'Available today · 3:00–4:30 PM' },
  { id: 'daniel', name: 'Mr. Daniel Owusu', subject: 'Science & ICT', role: 'Subject Teacher', email: 'daniel.owusu@remaljcarewell.edu.gh', availability: 'Available Friday · 1:00–2:00 PM' },
];

export default function ParentCommunication({ child }) {
  const { messages, sendMessage } = usePortalData();
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0].id);
  const [subject, setSubject] = useState('Academic progress');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const teacher = useMemo(() => TEACHERS.find((item) => item.id === selectedTeacher), [selectedTeacher]);

  const send = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    sendMessage({ from: 'Mrs. Angela Edwards', senderRole: 'Parent', to: 'Staff', recipient: teacher.name, subject, body: `${child.name}: ${message.trim()}` });
    setMessage('');
    setNotice(`Message sent to ${teacher.name} about ${child.name}.`);
  };

  return <div className="parent-communication animate-fade-up">
    <div className="page-header"><h1 className="page-header__title">Teachers & messages</h1><p className="page-header__subtitle">Contact the lecturers responsible for {child.name} and keep each concern attached to the right child.</p></div>
    <div className="teacher-grid">
      <section className="panel teacher-directory"><div className="panel__header"><h2 className="panel__title">{child.name}'s lecturers</h2></div><div className="teacher-list">
        {TEACHERS.map((item) => <button key={item.id} onClick={() => setSelectedTeacher(item.id)} className={`teacher-card${selectedTeacher === item.id ? ' teacher-card--selected' : ''}`}>
          <span className="avatar" style={{ background: PARENT_COLOUR(item.id), width: 40, height: 40 }}>{item.name.charAt(item.name.indexOf(' ') + 1)}</span>
          <span><strong>{item.name}</strong><small>{item.role} · {item.subject}</small><small>{item.availability}</small></span>
        </button>)}
      </div></section>
      <section className="panel message-panel"><div className="panel__header"><h2 className="panel__title"><MessageSquare size={16}/> Message {teacher.name}</h2></div><form className="panel__body message-form" onSubmit={send}>
        <div className="message-recipient"><span className="avatar" style={{ background: PARENT_COLOUR(teacher.id) }}>{teacher.name.charAt(teacher.name.indexOf(' ') + 1)}</span><span><strong>{teacher.name}</strong><small>{teacher.subject} · {teacher.email}</small></span></div>
        <label>Concern about<select value={subject} onChange={(event) => setSubject(event.target.value)}><option>Academic progress</option><option>Attendance</option><option>Assignment support</option><option>Behaviour or wellbeing</option><option>Meeting request</option></select></label>
        <label>Your message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Write a message about ${child.name}…`} rows="5" required /></label>
        <button className="parent-send" type="submit"><Send size={15}/> Send to lecturer</button>
        {notice && <p className="parent-notice"><Mail size={15}/>{notice}</p>}
      </form></section>
    </div>
    <section className="panel sent-messages"><div className="panel__header"><h2 className="panel__title">Messages</h2></div>{messages.filter((item) => item.from === 'Mrs. Angela Edwards' || item.recipient === 'Mrs. Angela Edwards').length ? <div>{messages.filter((item) => item.from === 'Mrs. Angela Edwards' || item.recipient === 'Mrs. Angela Edwards').map((item) => <div className="sent-message" key={item.id}><strong>{item.from === 'Mrs. Angela Edwards' ? `To ${item.recipient}` : `From ${item.from}`} · {item.subject}</strong><p>{item.body}</p><small>{item.sentAt}</small></div>)}</div> : <p className="message-empty">No messages about {child.name} yet.</p>}</section>
  </div>;
}

function PARENT_COLOUR(id) { return ({ sarah: '#1a3668', kofi: '#2e7a44', ama: '#8b4a1e', daniel: '#7c3ac8' })[id]; }
