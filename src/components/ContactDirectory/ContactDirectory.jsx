import React, { useMemo, useState } from 'react';
import { Mail, Phone, Search, Users } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import './ContactDirectory.css';

export default function ContactDirectory({ parentMode = false }) {
  const store = usePortalData();
  const teacherDirectory = store?.teacherDirectory || [];
  const onboardedStudents = store?.onboardedStudents || [];
  const busRoutes = store?.busRoutes || [];

  const dynamicContacts = useMemo(() => {
    const teachers = (teacherDirectory || []).filter(t => t.status !== 'Offboarded').map(t => ({
      name: t.name,
      role: `${t.role || 'Teacher'} · ${t.subject || 'General'} (${t.classAssigned || 'All Classes'})`,
      phone: t.phone || '+233 24 000 0000',
      email: t.email || `${t.name.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`
    }));

    const students = (onboardedStudents || []).map(s => ({
      name: s.fullName,
      role: `Student · ${s.level} (ID: ${s.studentId})`,
      phone: s.guardianPhone || '+233 24 111 2222',
      email: s.studentEmail || `${s.fullName.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`
    }));

    const parentsMap = new Map();
    (onboardedStudents || []).forEach(s => {
      if (s.guardianName && !parentsMap.has(s.guardianName)) {
        parentsMap.set(s.guardianName, {
          name: s.guardianName,
          role: `Parent / Guardian of ${s.fullName}`,
          phone: s.guardianPhone || '+233 24 111 2222',
          email: s.guardianEmail || `${s.guardianName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
        });
      }
    });

    const drivers = (busRoutes || []).map(b => ({
      name: b.driverName || 'Bus Driver',
      role: `Driver · ${b.name}`,
      phone: b.driverPhone || '+233 24 444 5555',
      email: `driver.${(b.driverName || 'transport').toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`
    }));

    return {
      Parents: Array.from(parentsMap.values()),
      Teachers: teachers,
      Students: students,
      Drivers: drivers,
    };
  }, [teacherDirectory, onboardedStudents, busRoutes]);

  const categories = parentMode ? ['Parents', 'Teachers'] : Object.keys(dynamicContacts);
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState('');

  const currentList = dynamicContacts[category] || [];
  const results = useMemo(() => currentList.filter((contact) => `${contact.name} ${contact.role}`.toLowerCase().includes(query.toLowerCase())), [currentList, query]);

  return (
    <div className="contact-directory animate-fade-up">
      <div className="page-header">
        <h1 className="page-header__title">{parentMode ? 'Parent & teacher contacts' : 'School contact directory'}</h1>
        <p className="page-header__subtitle">{parentMode ? 'Reach the parent community and your children’s teaching team.' : 'Find contact details for parents, students, teaching staff, and transport drivers.'}</p>
      </div>
      <section className="panel">
        <div className="panel__header contact-toolbar">
          <div className="contact-tabs" role="tablist" aria-label="Contact category">
            {categories.map((item) => (
              <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'contact-tab contact-tab--active' : 'contact-tab'} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <label className="contact-search">
            <Search size={15}/>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts" aria-label="Search contacts" />
          </label>
        </div>
        <div className="contact-list">
          {results.map((contact) => (
            <article className="contact-row" key={contact.email + contact.name}>
              <span className="contact-avatar">{contact.name.split(' ').slice(-1)[0].charAt(0)}</span>
              <div>
                <strong>{contact.name}</strong>
                <small>{contact.role}</small>
              </div>
              <div className="contact-actions">
                <a href={`tel:${contact.phone.replaceAll(' ', '')}`}><Phone size={14}/>{contact.phone}</a>
                <a href={`mailto:${contact.email}`}><Mail size={14}/>{contact.email}</a>
              </div>
            </article>
          ))}
          {!results.length && <p className="contact-empty"><Users size={17}/> No matching contacts found.</p>}
        </div>
      </section>
    </div>
  );
}
