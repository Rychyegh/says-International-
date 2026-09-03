import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar/Topbar';
import LoginPage from './components/Login/LoginPage';
import TeacherPortal from './portals/TeacherPortal';
import ParentPortal from './portals/ParentPortal';
import StudentPortal from './portals/StudentPortal';
import AdminPortal from './portals/AdminPortal';
import AccountantPortal from './portals/AccountantPortal';
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Portal ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 520, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, color: '#204d2d', fontWeight: 800, marginBottom: 12 }}>REMALJ Carewell School Portals</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>
            Application state was refreshed. Click below to reload your portal.
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch (e) {}
              window.location.reload();
            }}
            style={{ padding: '10px 22px', background: '#204d2d', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
          >
            Reload Portal System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  const location = useLocation();

  const [authed, setAuthed] = useState({
    admin: false,
    accountant: false,
    parent: false,
    teacher: false,
    student: false,
  });

  const getPortalFromPath = (pathname) => {
    const fullPath = (pathname + (window.location?.hash || '') + (window.location?.pathname || '')).toLowerCase();
    if (fullPath.includes('admin')) return 'admin';
    if (fullPath.includes('accountant')) return 'accountant';
    if (fullPath.includes('parent')) return 'parent';
    if (fullPath.includes('student')) return 'student';
    if (fullPath.includes('teacher')) return 'teacher';
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
    <ErrorBoundary>
      <PortalDataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </PortalDataProvider>
    </ErrorBoundary>
  );
}
