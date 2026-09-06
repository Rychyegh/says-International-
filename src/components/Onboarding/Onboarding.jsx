import React, { useState } from 'react';
import { CheckCircle2, FileText, Eye } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import OfficialApplicationForm from './OfficialApplicationForm';
import BulkStudentUpload from './BulkStudentUpload';
import './Onboarding.css';

const statuses = ['Submitted', 'Documents review', 'Assessment scheduled', 'Accepted', 'Enrolled'];

export function LearnerOnboarding() {
  const { submitApplication } = usePortalData();
  const [notice, setNotice] = useState('');
  const [onboardMode, setOnboardMode] = useState('single'); // 'single' | 'bulk'

  const handleOfficialSubmit = (formData) => {
    const learnerName = `${formData.firstName || ''} ${formData.surname || ''}`.trim() || formData.learner || 'Applicant';
    const guardianName = formData.fatherName || formData.motherName || formData.guardian || 'Parent/Guardian';
    const contactEmail = formData.fatherEmail || formData.email || 'parent@example.com';
    const contactPhone = formData.fatherPhone || formData.motherPhone || formData.phone || '';

    const applicationRecord = {
      ...formData,
      learner: learnerName,
      guardian: guardianName,
      email: contactEmail,
      phone: contactPhone,
      level: formData.applyingClass || formData.level || 'JHS 1',
    };

    submitApplication(applicationRecord);
    setNotice('Official Application Form submitted successfully! Administrators have received your application.');
    setTimeout(() => setNotice(''), 6000);
  };

  return (
    <div className="onboarding animate-fade-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-header__title">Learner Onboarding & Official Admission</h1>
          <p className="page-header__subtitle">
            Fill out individual learner admission forms online, or bulk import multiple student records via CSV / Excel spreadsheet.
          </p>
        </div>

        {/* Switcher Mode Buttons */}
        <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setOnboardMode('single')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              background: onboardMode === 'single' ? '#ffffff' : 'transparent',
              color: onboardMode === 'single' ? '#0f172a' : '#64748b',
              boxShadow: onboardMode === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📝 Single Learner Form
          </button>

          <button
            type="button"
            onClick={() => setOnboardMode('bulk')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              background: onboardMode === 'bulk' ? 'var(--ics-green-700, #166534)' : 'transparent',
              color: onboardMode === 'bulk' ? '#ffffff' : '#64748b',
              boxShadow: onboardMode === 'bulk' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📊 Bulk CSV / Excel Upload
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {onboardMode === 'bulk' ? (
        <BulkStudentUpload onComplete={() => setNotice('Bulk student onboarding completed successfully!')} />
      ) : (
        <OfficialApplicationForm onSubmit={handleOfficialSubmit} />
      )}
    </div>
  );
}

export function AdmissionsRegister() {
  const { applications = [], updateApplicationStatus } = usePortalData();
  const [selectedApp, setSelectedApp] = useState(null);
  const [notice, setNotice] = useState('');

  return (
    <div className="onboarding animate-fade-up">
      <div className="page-header">
        <h1 className="page-header__title">Admissions & Applications Register</h1>
        <p className="page-header__subtitle">Review submitted applications, inspect filled application forms, or export printable PDF copies locally.</p>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #86efac' }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {selectedApp ? (
        <OfficialApplicationForm
          initialData={selectedApp}
          readOnly={true}
          isAdmin={true}
          onCancel={() => setSelectedApp(null)}
        />
      ) : (
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Applicant Register</h2>
            <span className="status-pill status-pill--info">{applications.length} applications</span>
          </div>

          <div className="application-list">
            {applications.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.learner || `${item.firstName || ''} ${item.surname || ''}`}</strong>
                  <span>{item.level || item.applyingClass} · Guardian: {item.guardian || item.fatherName || item.motherName}</span>
                  <small>{item.email || item.fatherEmail} · {item.phone || item.fatherPhone || 'No phone'} · Submitted {item.submittedAt || 'Recently'}</small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setSelectedApp(item)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'var(--ics-green-50)',
                      color: 'var(--ics-green-700)',
                      border: '1px solid var(--ics-green-200)',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Eye size={14} /> View Form & PDF
                  </button>

                  <label>
                    Status
                    <select
                      value={item.status}
                      onChange={(event) => {
                        const newStatus = event.target.value;
                        updateApplicationStatus(item.id, newStatus);
                        if (newStatus === 'Accepted' || newStatus === 'Enrolled') {
                          const parentFirstName = (item.fatherFirstName || item.motherFirstName || item.firstName || (item.guardian || 'Parent').split(' ')[0] || 'parent').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const parentSurname = (item.surname || item.fatherSurname || item.motherSurname || item.learner || 'carewell').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const contactEmail = `${parentFirstName}.${parentSurname}@remaljcarewell.edu.gh`;
                          const defaultPass = 'Carewell2026!';
                          const learnerName = item.learner || `${item.firstName || ''} ${item.surname || ''}`.trim() || 'Applicant';
                          const guardianName = item.guardian || item.fatherName || item.motherName || 'Parent/Guardian';
                          const phone = item.phone || item.guardianPhone || item.fatherPhone || item.motherPhone || '024 111 2222';
                          
                          setNotice(`📱 AUTOMATIC SMS & EMAIL CREDENTIALS DISPATCHED TO ${parentFirstName.toUpperCase()} (${phone}):\n• School: REMALJ Carewell Inspirational School\n• Email: ${contactEmail}\n• Default Password: ${defaultPass}\n• Direct Access: http://localhost:5173/#/parent (No sign-in required)`);
                          setTimeout(() => setNotice(''), 10000);
                        }
                      }}
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
