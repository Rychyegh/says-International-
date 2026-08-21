import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, Users } from 'lucide-react';
import './TeacherMessages.css';
import { usePortalData } from '../../data/PortalStore';

const RECIPIENTS = {
  Parents: [
    { id: 'angela', name: 'Mrs. Angela Edwards', detail: 'Parent of Benjamin & Adwoa Edwards', initials: 'AE' },
    { id: 'abena-parent', name: 'Mr. Joseph Mensah', detail: 'Parent of Abena Mensah · JHS 3A', initials: 'JM' },
    { id: 'kwame-parent', name: 'Mrs. Esther Asante', detail: 'Parent of Kwame Asante · JHS 3A', initials: 'EA' },
  ],
  Students: [
    { id: 'abena', name: 'Abena Mensah', detail: 'JHS 3A · REMALJ-2026-041', initials: 'AM' },
    { id: 'kwame', name: 'Kwame Asante', detail: 'JHS 3A · REMALJ-2026-112', initials: 'KA' },
    { id: 'efua', name: 'Efua Darko', detail: 'JHS 2B · REMALJ-2026-088', initials: 'ED' },
  ],
  Drivers: [
    { id: 'daniel-driver', name: 'Daniel Appiah', detail: 'Bus 01 · Bogoso Route', initials: 'DA' },
    { id: 'kweku-driver', name: 'Kweku Mensah', detail: 'Bus 02 · Route B', initials: 'KM' },
    { id: 'ama-driver', name: 'Ama Konadu', detail: 'Bus 03 · Route C', initials: 'AK' },
  ],
};

export default function TeacherMessages({ initialAudience = 'Parents' }) {
  const { messages, sendMessage } = usePortalData();
  const [audience, setAudience] = useState(initialAudience);
  const [recipientId, setRecipientId] = useState(RECIPIENTS.Parents[0].id);
  const [topic, setTopic] = useState('Academic update');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const recipients = RECIPIENTS[audience];
  const recipient = useMemo(() => recipients.find((item) => item.id === recipientId) || recipients[0], [recipients, recipientId]);

  const send = (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    sendMessage({ from: 'Mr. Samuel Amponsah', senderRole: 'Staff', to: audience, recipient: recipient.name, subject: topic, body: body.trim() });
    setBody('');
    setNotice(`Message queued for ${recipient.name}.`);
  };

  const sent = messages.filter((item) => item.senderRole === 'Staff');
  const inbox = messages.filter((item) => item.to === 'Staff');
  return <div className="teacher-messages animate-fade-up">
    <div className="page-header"><h1 className="page-header__title">Send a message</h1><p className="page-header__subtitle">Contact a parent, student, or transport driver. Student replies arrive in the staff inbox below.</p></div>
    <div className="teacher-message-layout">
      <section className="panel audience-panel"><div className="panel__header"><h2 className="panel__title">Recipients</h2></div><div className="audience-tabs" role="tablist" aria-label="Recipient type">
        {Object.keys(RECIPIENTS).map((type) => <button key={type} role="tab" aria-selected={audience === type} className={audience === type ? 'audience-tab audience-tab--active' : 'audience-tab'} onClick={() => { setAudience(type); setRecipientId(RECIPIENTS[type][0].id); }}>{type}</button>)}
      </div><div className="recipient-list">{recipients.map((item) => <button key={item.id} onClick={() => setRecipientId(item.id)} className={`recipient-row${recipient.id === item.id ? ' recipient-row--active' : ''}`}><span className="avatar">{item.initials}</span><span><strong>{item.name}</strong><small>{item.detail}</small></span></button>)}</div></section>
      <section className="panel staff-compose"><div className="panel__header"><h2 className="panel__title"><MessageSquare size={16}/> Message {recipient.name}</h2></div><form className="panel__body staff-message-form" onSubmit={send}>
        <div className="recipient-summary"><Users size={15}/><span><strong>{audience}: </strong>{recipient.detail}</span></div>
        <label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Academic update</option><option>Attendance follow-up</option><option>Assignment reminder</option><option>Fee reminder / outstanding balance</option><option>Meeting request</option><option>Transport update</option><option>Urgent notice</option></select></label>
        <label>Message<textarea rows="6" required value={body} onChange={(event) => setBody(event.target.value)} placeholder={`Write to ${recipient.name}…`} /></label>
        <button className="staff-send" type="submit"><Send size={15}/> Send message</button>
        {notice && <p className="staff-notice">✓ {notice}</p>}
      </form></section>
    </div>
    <section className="panel teacher-outbox"><div className="panel__header"><h2 className="panel__title">Student inbox</h2></div>{inbox.length ? inbox.map((item) => <div className="teacher-sent-message" key={item.id}><strong>From {item.from}</strong><span>{item.subject}</span><p>{item.body}</p><small>Received {item.sentAt}</small></div>) : <p className="teacher-empty">Student messages will arrive here.</p>}</section>
    <section className="panel teacher-outbox"><div className="panel__header"><h2 className="panel__title">Sent messages</h2></div>{sent.length ? sent.map((item) => <div className="teacher-sent-message" key={item.id}><strong>To {item.recipient} · {item.to}</strong><span>{item.subject}</span><p>{item.body}</p><small>Sent {item.sentAt}</small></div>) : <p className="teacher-empty">Your sent messages will appear here.</p>}</section>
  </div>;
}
