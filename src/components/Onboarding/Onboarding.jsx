import React, { useState } from 'react';
import { CheckCircle2, ClipboardCheck, FileText, UserPlus, Download, Printer, Eye } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import OfficialApplicationForm from './OfficialApplicationForm';
import './Onboarding.css';

const STEPS = ['Learner details', 'Guardian & contacts', 'Placement & records', 'Review'];
const statuses = ['Submitted', 'Documents review', 'Assessment scheduled', 'Accepted', 'Enrolled'];

export function LearnerOnboarding() {
  const { submitApplication } = usePortalData();
  const [mode, setMode] = useState('official'); // 'official' | 'quick'
  const [notice, setNotice] = useState('');

  const handleOfficialSubmit = (formData) => {
    const learnerName = `${formData.firstName} ${formData.surname}`.trim() || formData.learner || 'Applicant';
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
          Fill out the official REMALJ Carewell Inspirational School application form online, or download printable copy locally.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setMode('official')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: 13,
            border: 'none',
            background: mode === 'official' ? 'var(--ics-green-500)' : 'var(--gray-200)',
            color: mode === 'official' ? '#fff' : 'var(--gray-700)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FileText size={16} /> Official 4-Page Application Form
        </button>

        <button
          onClick={() => setMode('quick')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: 13,
            border: 'none',
            background: mode === 'quick' ? 'var(--ics-green-500)' : 'var(--gray-200)',
            color: mode === 'quick' ? '#fff' : 'var(--gray-700)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <UserPlus size={16} /> Express Wizard Mode
        </button>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {mode === 'official' ? (
        <OfficialApplicationForm onSubmit={handleOfficialSubmit} />
      ) : (
        <QuickOnboardingForm onSubmitSuccess={() => setNotice('Application submitted successfully!')} />
      )}
    </div>
  );
}

function QuickOnboardingForm({ onSubmitSuccess }) {
  const { submitApplication } = usePortalData();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ learner: '', dob: '', level: 'JHS 1', guardian: '', relationship: 'Parent / guardian', email: '', phone: '', address: '', previousSchool: '', needs: '', consent: false });

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
  const next = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));

  const submit = (event) => {
    event.preventDefault();
    if (!form.learner || !form.guardian || !form.email || !form.consent) return;
    submitApplication(form);
    onSubmitSuccess();
    setStep(0);
    setForm({ learner: '', dob: '', level: 'JHS 1', guardian: '', relationship: 'Parent / guardian', email: '', phone: '', address: '', previousSchool: '', needs: '', consent: false });
  };

  return (
    <div className="panel onboarding-form" style={{ maxWidth: 700 }}>
      <div className="onboarding-steps" style={{ padding: '16px 20px 0 20px' }}>
        {STEPS.map((label, index) => (
          <span key={label} className={index === step ? 'onboarding-step active' : index < step ? 'onboarding-step done' : 'onboarding-step'}>
            {index < step ? '✓' : index + 1}. {label}
          </span>
        ))}
      </div>

      <form className="panel__body" onSubmit={submit}>
        {step === 0 && (
          <>
            <label>Learner full name<input required value={form.learner} onChange={update('learner')} placeholder="Learner's legal name" /></label>
            <label>Date of birth<input type="date" value={form.dob} onChange={update('dob')} /></label>
            <label>Entry level<select value={form.level} onChange={update('level')}><option>Primary 1</option><option>Primary 5</option><option>JHS 1</option><option>JHS 2</option><option>SHS 1</option></select></label>
          </>
        )}
        {step === 1 && (
          <>
            <label>Parent / guardian full name<input required value={form.guardian} onChange={update('guardian')} /></label>
            <label>Relationship<select value={form.relationship} onChange={update('relationship')}><option>Parent / guardian</option><option>Authorised guardian</option><option>Other approved contact</option></select></label>
            <label>Email address<input type="email" required value={form.email} onChange={update('email')} /></label>
            <label>Phone number<input required value={form.phone} onChange={update('phone')} /></label>
            <label>Home address<textarea value={form.address} onChange={update('address')} rows="3" /></label>
          </>
        )}
        {step === 2 && (
          <>
            <label>Previous school<input value={form.previousSchool} onChange={update('previousSchool')} /></label>
            <label>Learning, health or access notes<textarea value={form.needs} onChange={update('needs')} rows="4" placeholder="Share only information needed for safe placement and support." /></label>
            <div className="onboarding-note"><FileText size={16} /><span>After submission, Admissions verifies identity and documents, creates the learner ID, links authorised guardians and assigns class/transport/boarding services as approved.</span></div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="onboarding-review"><ClipboardCheck size={22} /><div><strong>{form.learner || 'Learner name'}</strong><span>{form.level} · Guardian: {form.guardian || 'Not supplied'}</span><span>{form.email} · {form.phone}</span></div></div>
            <label className="onboarding-consent"><input type="checkbox" checked={form.consent} onChange={update('consent')} /> I confirm that the information is accurate and may be used by authorised RCIS staff for admissions, safeguarding and enrolment.</label>
          </>
        )}
        {step < 3 ? <button className="workflow-button" type="button" onClick={next}>Continue</button> : <button className="workflow-button" type="submit"><UserPlus size={15} /> Submit application</button>}
        {step > 0 && <button className="onboarding-back" type="button" onClick={() => setStep((current) => current - 1)}>Back</button>}
      </form>
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
        <p className="page-header__subtitle">Review submitted applications, inspect filled application forms, or download printable PDF copies locally.</p>
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
