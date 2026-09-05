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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled portal runtime error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      window.localStorage.removeItem('remalj-portal-live-data-v1');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            background: '#ffffff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
              REMALJ Carewell Inspiration School - Bogoso
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              The portal encountered a display state update. Click below to refresh and reload clean portal state.
            </p>
            {this.state.error?.message && (
              <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, fontSize: 11, color: '#475569', fontFamily: 'monospace', marginBottom: 20, textAlign: 'left', wordBreak: 'break-all' }}>
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: '#1e293b',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh & Reload Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
