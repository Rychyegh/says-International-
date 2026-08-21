import React, { useState } from 'react';
import Topbar        from './components/Topbar/Topbar';
import LoginPage     from './components/Login/LoginPage';
import TeacherPortal from './portals/TeacherPortal';
import ParentPortal  from './portals/ParentPortal';
import StudentPortal from './portals/StudentPortal';
import { PortalDataProvider } from './data/PortalStore';
import PublicPages from './components/PublicPages/PublicPages';
import './App.css';

/**
 * Auth state per portal:
 *  - 'teacher' and 'parent' require login
 *  - 'student' is open (the screenshots show no login for student)
 */
const REQUIRES_AUTH = ['teacher', 'parent'];

export default function App() {
  const [activePortal, setActivePortal] = useState('teacher');
  const [activePublicPage, setActivePublicPage] = useState(null);

  // Track which portals are authenticated this session
  const [authed, setAuthed] = useState({ teacher: false, parent: false, student: true });

  const handlePortalChange = (portal) => {
    setActivePortal(portal);
    setActivePublicPage(null);
  };

  const handleLoginSuccess = () => {
    setAuthed((prev) => ({ ...prev, [activePortal]: true }));
  };

  const handleSignOut = () => {
    setAuthed((prev) => ({ ...prev, [activePortal]: false }));
  };

  const isAuthed = authed[activePortal];
  const needsLogin = REQUIRES_AUTH.includes(activePortal) && !isAuthed;

  const portals = {
    teacher: <TeacherPortal onSignOut={handleSignOut} />,
    parent:  <ParentPortal  onSignOut={handleSignOut} />,
    student: <StudentPortal />,
  };

  return (
    <PortalDataProvider>
    <div className="app" id="app-root">
      <Topbar
        activePortal={activePortal}
        onPortalChange={handlePortalChange}
        isAuthed={isAuthed}
        onSignOut={handleSignOut}
        onNavChange={setActivePublicPage}
      />

      {activePublicPage ? <PublicPages page={activePublicPage} /> : <div
        key={`${activePortal}-${isAuthed}`}
        className="portal-wrapper animate-portal"
        role="tabpanel"
        aria-labelledby={`tab-${activePortal}`}
      >
        {needsLogin
          ? <LoginPage portal={activePortal} onLoginSuccess={handleLoginSuccess} />
          : portals[activePortal]
        }
      </div>}
    </div>
    </PortalDataProvider>
  );
}
