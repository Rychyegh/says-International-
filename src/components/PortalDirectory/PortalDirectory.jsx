import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Users, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import './PortalDirectory.css';

const PORTALS = [
  {
    id: 'admin',
    title: 'Administrator Portal',
    path: '/admin',
    icon: <ShieldCheck size={28} />,
    color: '#4a1d6e',
    lightBg: '#f3e8ff',
    desc: 'Onboard new students, manage student roster, review admissions applications, and manage institutional settings.',
    badge: 'Admissions & Onboarding',
  },
  {
    id: 'accountant',
    title: 'Accountant & Finance Portal',
    path: '/accountant',
    icon: <CreditCard size={28} />,
    color: '#0f3a4b',
    lightBg: '#e0f2fe',
    desc: 'Manage student fee ledgers, record fee payments, monitor owing balances, and dispatch direct payment notices to parents.',
    badge: 'Finance & Payments',
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    path: '/parent',
    icon: <Users size={28} />,
    color: '#1a3668',
    lightBg: '#ddeeff',
    desc: 'Track child academic progress, view live fee accounts, communicate with class teachers, and track school bus location.',
    badge: 'Family & Guardians',
  },
  {
    id: 'teacher',
    title: 'Staff / Teacher Portal',
    path: '/teacher',
    icon: <GraduationCap size={28} />,
    color: '#1b4d3e',
    lightBg: '#dcfce7',
    desc: 'Class management, student attendance, grade publishing, assignment management, and incident/safeguarding tracking.',
    badge: 'Academic Staff',
  },
  {
    id: 'student',
    title: 'Student Portal',
    path: '/student',
    icon: <BookOpen size={28} />,
    color: '#5e2d0e',
    lightBg: '#fff1e8',
    desc: 'View personal timetable, grades, published assignments, access e-Library resources, and send messages to staff.',
    badge: 'Learners',
  },
];

export default function PortalDirectory() {
  return (
    <div className="portal-directory animate-fade-up">
      <div className="portal-directory__hero">
        <span className="portal-directory__badge">REMALJ Carewell Inspirational School</span>
        <h1 className="portal-directory__title">School Management Portals</h1>
        <p className="portal-directory__subtitle">
          Select your dedicated portal link below to access your role-specific dashboard and administrative features.
        </p>
      </div>

      <div className="portal-directory__grid">
        {PORTALS.map((portal) => (
          <Link to={portal.path} key={portal.id} className="portal-card" style={{ borderTop: `4px solid ${portal.color}` }}>
            <div className="portal-card__icon" style={{ background: portal.lightBg, color: portal.color }}>
              {portal.icon}
            </div>
            <div className="portal-card__tag" style={{ color: portal.color, background: portal.lightBg }}>
              {portal.badge}
            </div>
            <h2 className="portal-card__title">{portal.title}</h2>
            <p className="portal-card__desc">{portal.desc}</p>
            <div className="portal-card__link" style={{ color: portal.color }}>
              <span>Enter Portal</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
