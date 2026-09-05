import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, LogOut, ShieldCheck, CreditCard, Radio } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { getAuthUser } from '../../services/api';
import './Topbar.css';

const PORTAL_INFO = {
  teacher: { label: 'Staff Portal', icon: <GraduationCap size={15} />, color: '#1b4d3e' },
  parent: { label: 'Parent Portal', icon: <Users size={15} />, color: '#1a3668' },
  student: { label: 'Student Portal', icon: <BookOpen size={15} />, color: '#5e2d0e' },
  admin: { label: 'Admin Portal', icon: <ShieldCheck size={15} />, color: '#4a1d6e' },
  accountant: { label: 'Account Portal', icon: <CreditCard size={15} />, color: '#0f3a4b' },
};

const PORTAL_USER = {
  teacher: { name: 'Mr. S. Amponsah', role: 'Staff' },
  parent: { name: 'Mrs. A. Edwards', role: 'Parent' },
  student: { name: 'Kwame Edwards', role: 'Student' },
  admin: { name: 'Mr. John Admin', role: 'Administrator' },
  accountant: { name: 'Mrs. Grace Accountant', role: 'Finance Head' },
};

export default function Topbar({ activePortal, isAuthed, onSignOut }) {
  const portalData = usePortalData();
  const backendConnected = portalData?.backendConnected;
  const currentInfo = PORTAL_INFO[activePortal] || PORTAL_INFO.admin;
  const defaultUser = PORTAL_USER[activePortal] || PORTAL_USER.admin;

  const authUser = getAuthUser();
  const userName = authUser?.fullName || authUser?.name || authUser?.email || defaultUser.name;
  const userRole = authUser?.role
    ? (authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1))
    : defaultUser.role;
  const userInitial = (userName.charAt(0) || 'U').toUpperCase();

  return (
    <header className="topbar" role="banner" style={{ borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
      <div className="topbar__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
        {/* School logo */}
        <Link to={`/${activePortal}`} className="topbar__logo" title="REMALJ Carewell Inspirational School" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/remalj-carewell-logo.jpg"
            alt="REMALJ Carewell Inspirational School logo"
            style={{ height: 46, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <div className="topbar__school-name">
            <strong style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>REMALJ Carewell</strong>
            <span style={{ fontSize: 11, color: 'var(--gray-500)', display: 'block' }}>Inspirational School · Bogoso</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live API Endpoint Indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20,
            background: backendConnected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${backendConnected ? '#bbf7d0' : '#fecaca'}`,
            fontSize: 11, fontWeight: 700,
            color: backendConnected ? '#15803d' : '#b91c1c'
          }} title="Backend API: https://rcis-backend.onrender.com/api/v1">
            <Radio size={12} className={backendConnected ? 'animate-pulse' : ''} />
            <span>API v1 Connected</span>
          </div>

          {/* Current Portal Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderRadius: 99, background: currentInfo.color, color: '#fff',
            fontWeight: 800, fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <span>{currentInfo.icon}</span>
            <span>{currentInfo.label}</span>
          </div>
        </div>

        {/* User profile & Sign out */}
        {isAuthed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-700)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: currentInfo.color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12
              }}>
                {userInitial}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{userName}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>{userRole}</div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: '#fee2e2', border: '1px solid #fca5a5',
                color: '#dc2626', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
            Secure Authentication Required
          </div>
        )}
      </div>
    </header>
  );
}
