import React, { useMemo, useState } from 'react';
import { Mail, Phone, Search, Users } from 'lucide-react';
import './ContactDirectory.css';

const CONTACTS = {
  Parents: [
    { name: 'Mrs. Angela Edwards', role: 'Parent · Benjamin & Adwoa Edwards', phone: '+233 24 555 0148', email: 'angela.edwards@example.com' },
    { name: 'Mr. Joseph Mensah', role: 'Parent · Abena Mensah', phone: '+233 20 415 2083', email: 'joseph.mensah@example.com' },
    { name: 'Mrs. Esther Asante', role: 'Parent · Kwame Asante', phone: '+233 24 312 9805', email: 'esther.asante@example.com' },
  ],
  Teachers: [
    { name: 'Ms. Sarah Mensah', role: 'Class Teacher · Social Studies', phone: '+233 24 630 1310', email: 'sarah.mensah@remaljcarewell.edu.gh' },
    { name: 'Mr. Kofi Appiah', role: 'Subject Teacher · Mathematics', phone: '+233 20 581 4210', email: 'kofi.appiah@remaljcarewell.edu.gh' },
    { name: 'Mrs. Ama Boateng', role: 'Subject Teacher · English Language', phone: '+233 24 710 2961', email: 'ama.boateng@remaljcarewell.edu.gh' },
  ],
  Students: [
    { name: 'Abena Mensah', role: 'Student · JHS 3A', phone: '+233 24 780 3901', email: 'abena.mensah@remaljcarewell.edu.gh' },
    { name: 'Kwame Asante', role: 'Student · JHS 3A', phone: '+233 20 218 5040', email: 'kwame.asante@remaljcarewell.edu.gh' },
    { name: 'Efua Darko', role: 'Student · JHS 2B', phone: '+233 24 441 0799', email: 'efua.darko@remaljcarewell.edu.gh' },
  ],
  Drivers: [
    { name: 'Daniel Appiah', role: 'Driver · Bus 01, Bogoso Route', phone: '+233 24 300 6105', email: 'daniel.appiah@remaljcarewell.edu.gh' },
    { name: 'Kweku Mensah', role: 'Driver · Bus 02, Route B', phone: '+233 20 473 9006', email: 'kweku.mensah@remaljcarewell.edu.gh' },
    { name: 'Ama Konadu', role: 'Driver · Bus 03, Route C', phone: '+233 24 821 7402', email: 'ama.konadu@remaljcarewell.edu.gh' },
  ],
};

export default function ContactDirectory({ parentMode = false }) {
  const categories = parentMode ? ['Parents', 'Teachers'] : Object.keys(CONTACTS);
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState('');
  const results = useMemo(() => CONTACTS[category].filter((contact) => `${contact.name} ${contact.role}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <div className="contact-directory animate-fade-up">
    <div className="page-header"><h1 className="page-header__title">{parentMode ? 'Parent & teacher contacts' : 'School contact directory'}</h1><p className="page-header__subtitle">{parentMode ? 'Reach the parent community and your children’s teaching team.' : 'Find contact details for parents, students, teaching staff, and transport drivers.'}</p></div>
    <section className="panel"><div className="panel__header contact-toolbar"><div className="contact-tabs" role="tablist" aria-label="Contact category">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'contact-tab contact-tab--active' : 'contact-tab'} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="contact-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts" aria-label="Search contacts" /></label></div>
      <div className="contact-list">{results.map((contact) => <article className="contact-row" key={contact.email}><span className="contact-avatar">{contact.name.split(' ').slice(-1)[0].charAt(0)}</span><div><strong>{contact.name}</strong><small>{contact.role}</small></div><div className="contact-actions"><a href={`tel:${contact.phone.replaceAll(' ', '')}`}><Phone size={14}/>{contact.phone}</a><a href={`mailto:${contact.email}`}><Mail size={14}/>{contact.email}</a></div></article>)}{!results.length && <p className="contact-empty"><Users size={17}/> No matching contacts.</p>}</div>
    </section>
  </div>;
}
