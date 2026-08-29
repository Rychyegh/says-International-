import React, { useState } from 'react';
import { CheckCircle2, FileText, Eye } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import OfficialApplicationForm from './OfficialApplicationForm';
import './Onboarding.css';

const statuses = ['Submitted', 'Documents review', 'Assessment scheduled', 'Accepted', 'Enrolled'];

export function LearnerOnboarding() {
  const { submitApplication } = usePortalData();
  const [notice, setNotice] = useState('');

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
      <div className="page-header">
        <h1 className="page-header__title">Learner Onboarding & Official Admission Form</h1>
        <p className="page-header__subtitle">
          Fill out the official REMALJ Carewell Inspirational School application form online, or export printable PDF copy locally.
        </p>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <OfficialApplicationForm onSubmit={handleOfficialSubmit} />
    </div>
  );
}

export function AdmissionsRegister() {
  const { applications = [], updateApplicationStatus } = usePortalData();
  const [selectedApp, setSelectedApp] = useState(null);

  return (
    <div className="onboarding animate-fade-up">
      <div className="page-header">
        <h1 className="page-header__title">Admissions & Applications Register</h1>
        <p className="page-header__subtitle">Review submitted applications, inspect filled application forms, or export printable PDF copies locally.</p>
      </div>

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
                    <select value={item.status} onChange={(event) => updateApplicationStatus(item.id, event.target.value)}>
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
