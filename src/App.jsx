import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar/Topbar';
import LoginPage from './components/Login/LoginPage';
import TeacherPortal from './portals/TeacherPortal';
import ParentPortal from './portals/ParentPortal';
import StudentPortal from './portals/StudentPortal';
import AdminPortal from './portals/AdminPortal';
import AccountantPortal from './portals/AccountantPortal';
import { PortalDataProvider } from './data/PortalStore';
import { setAuthToken, setAuthUser } from './services/api';
import './App.css';

const REQUIRES_AUTH = ['admin', 'accountant', 'parent', 'teacher', 'student'];

function DirectAccessNotice() {
  return (
    <div style={{
      maxWidth: 600, margin: '60px auto', padding: 32, background: '#fff',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', textAlign: 'center'
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gray-900)', marginBottom: 12 }}>
        REMALJ Carewell Portals
      </h2>
      <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        To access your designated school portal, please enter the direct forward slash URL in your browser address bar:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/admin</code> — Administrator Portal (Student Onboarding & Roster)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/accountant</code> — Accountant Portal (Payments & Fee Notices)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/parent</code> — Parent Portal (Child Progress & Fees)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/teacher</code> — Staff / Teacher Portal (Grading & Attendance)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/student</code> — Student Portal (Grades & Timetable)
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  // All portals start logged out and require sign in
  const [authed, setAuthed] = useState({
    admin: false,
    accountant: false,
    parent: false,
    teacher: false,
    student: false,
  });

  const getPortalFromPath = (pathname) => {
    if (pathname.includes('/admin')) return 'admin';
    if (pathname.includes('/accountant')) return 'accountant';
    if (pathname.includes('/parent')) return 'parent';
    if (pathname.includes('/student')) return 'student';
    if (pathname.includes('/teacher')) return 'teacher';
    return 'admin';
  };

  const activePortal = getPortalFromPath(location.pathname);
  const isAuthed = authed[activePortal];

  const handleSignOut = () => {
    setAuthToken(null);
    setAuthUser(null);
    setAuthed((prev) => ({ ...prev, [activePortal]: false }));
  };

  const renderPortalView = (portalKey, Component) => {
    if (!authed[portalKey]) {
      return (
        <LoginPage
          portal={portalKey}
          onLoginSuccess={() => setAuthed((prev) => ({ ...prev, [portalKey]: true }))}
        />
      );
    }
    return <Component onSignOut={handleSignOut} />;
  };

  return (
    <div className="app" id="app-root">
      <Topbar
        activePortal={activePortal}
        isAuthed={isAuthed}
        onSignOut={handleSignOut}
      />

      <div
        key={`${activePortal}-${isAuthed}-${location.pathname}`}
        className="portal-wrapper animate-portal"
        role="tabpanel"
        aria-labelledby={`tab-${activePortal}`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={renderPortalView('admin', AdminPortal)} />
          <Route path="/accountant" element={renderPortalView('accountant', AccountantPortal)} />
          <Route path="/parent" element={renderPortalView('parent', ParentPortal)} />
          <Route path="/teacher" element={renderPortalView('teacher', TeacherPortal)} />
          <Route path="/student" element={renderPortalView('student', StudentPortal)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PortalDataProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </PortalDataProvider>
  );
}
