import React, { useState, useMemo } from 'react';
import { CheckCircle2, FileText, Eye, Edit3, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Calendar, Clock } from 'lucide-react';
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
    const otherNames = (formData.otherNames || '').trim();
    const learnerName = (formData.firstName || formData.surname || otherNames)
      ? `${formData.firstName || ''} ${otherNames ? otherNames + ' ' : ''}${formData.surname || ''}`.replace(/\s+/g, ' ').trim()
      : (formData.learner || formData.fullName || 'Applicant');
    const guardianName = formData.fatherName || formData.motherName || formData.guardian || 'Parent/Guardian';
    const contactEmail = formData.fatherEmail || formData.email || 'parent@example.com';
    const contactPhone = formData.fatherPhone || formData.motherPhone || formData.phone || '';

    const applicationRecord = {
      ...formData,
      learner: learnerName,
      fullName: learnerName,
      firstName: formData.firstName || '',
      otherNames,
      surname: formData.surname || '',
      guardian: guardianName,
      email: contactEmail,
      phone: contactPhone,
      level: formData.applyingClass || formData.level || 'Basic 1',
      applyingClass: formData.applyingClass || formData.level || 'Basic 1',
      academicYear: formData.academicYear || '2025/2026',
      academicTerm: formData.academicTerm || formData.term || 'Term 1',
      term: formData.academicTerm || formData.term || 'Term 1',
      classSection: formData.classSection || formData.subClass || 'A',
    };

    submitApplication(applicationRecord);
    setNotice('✅ Official Application Form submitted & Student onboarded successfully! Details populated across Student Roster, Credentials Vault, and Fee Schedule.');
    setTimeout(() => setNotice(''), 7000);
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
  const { applications = [], updateApplicationStatus, updateApplication, deleteApplication } = usePortalData();
  const [selectedApp, setSelectedApp] = useState(null);
  const [notice, setNotice] = useState('');

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [termFilter, setTermFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [enrolmentFilter, setEnrolmentFilter] = useState('All');
  
  // Sort Column & Direction state
  const [sortColumn, setSortColumn] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const handleHeaderSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const name = (app.learner || `${app.firstName || ''} ${app.surname || ''}`).toLowerCase();
        const guardian = (app.guardian || app.fatherName || app.motherName || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || guardian.includes(searchTerm.toLowerCase());
        
        const appClass = app.level || app.applyingClass || '';
        const matchesClass = classFilter === 'All' || appClass.toLowerCase().trim() === classFilter.toLowerCase().trim();

        const appYear = app.academicYear || '2025/2026';
        const matchesYear = yearFilter === 'All' || appYear === yearFilter;

        const appTerm = app.academicTerm || app.term || 'Term 1';
        const matchesTerm = termFilter === 'All' || appTerm.toLowerCase().trim() === termFilter.toLowerCase().trim();
        
        const appStatus = app.status || 'Submitted';
        const matchesStatus = statusFilter === 'All' || appStatus === statusFilter;

        const appEnrolment = app.residenceType || app.enrolmentType || 'Day';
        const matchesEnrolment = enrolmentFilter === 'All' || appEnrolment === enrolmentFilter;

        return matchesSearch && matchesClass && matchesYear && matchesTerm && matchesStatus && matchesEnrolment;
      })
      .sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortColumn === 'learner') {
          valA = (a.learner || `${a.firstName || ''} ${a.surname || ''}`).toLowerCase();
          valB = (b.learner || `${b.firstName || ''} ${b.surname || ''}`).toLowerCase();
        } else if (sortColumn === 'class') {
          valA = (a.level || a.applyingClass || '').toLowerCase();
          valB = (b.level || b.applyingClass || '').toLowerCase();
        } else if (sortColumn === 'guardian') {
          valA = (a.guardian || a.fatherName || a.motherName || '').toLowerCase();
          valB = (b.guardian || b.fatherName || b.motherName || '').toLowerCase();
        } else if (sortColumn === 'enrolment') {
          valA = (a.residenceType || a.enrolmentType || 'Day').toLowerCase();
          valB = (b.residenceType || b.enrolmentType || 'Day').toLowerCase();
        } else if (sortColumn === 'status') {
          valA = (a.status || 'Submitted').toLowerCase();
          valB = (b.status || 'Submitted').toLowerCase();
        } else if (sortColumn === 'submittedAt') {
          valA = new Date(a.submittedAt || 0).getTime();
          valB = new Date(b.submittedAt || 0).getTime();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, searchTerm, classFilter, yearFilter, termFilter, statusFilter, enrolmentFilter, sortColumn, sortDirection]);

  const uniqueClasses = useMemo(() => {
    const defaultClasses = [
      'Creche', 'Nursery 1', 'Nursery 2', 'Kindergarten 1', 'Kindergarten 2',
      'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'
    ];
    const appClasses = applications.map(a => a.level || a.applyingClass).filter(Boolean);
    return ['All', ...Array.from(new Set([...defaultClasses, ...appClasses]))];
  }, [applications]);

  const uniqueYears = useMemo(() => {
    const defaultYears = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];
    const appYears = applications.map(a => a.academicYear).filter(Boolean);
    return ['All', ...Array.from(new Set([...defaultYears, ...appYears]))];
  }, [applications]);

  const uniqueTerms = ['All', 'Term 1', 'Term 2', 'Term 3'];

  const renderSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35, marginLeft: 4 }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} style={{ color: '#166534', marginLeft: 4 }} />
    ) : (
      <ArrowDown size={13} style={{ color: '#166534', marginLeft: 4 }} />
    );
  };

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
          onUpdate={(id, updatedForm) => {
            if (updateApplication) updateApplication(id, updatedForm);
            setSelectedApp(null);
            setNotice('✅ Application Form updated successfully! Changes reflected across all portals.');
            setTimeout(() => setNotice(''), 6000);
          }}
        />
      ) : (
        <section className="panel" style={{ padding: 20 }}>
          <div className="panel__header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="panel__title" style={{ margin: 0 }}>Applicant Register</h2>
              <span className="status-pill status-pill--info">{filteredApplications.length} of {applications.length} applications</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: 14,
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 20,
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by learner or guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              {searchTerm && (
                <X
                  size={14}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>

            {/* Class Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
              >
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
              >
                {uniqueYears.map((yr) => (
                  <option key={yr} value={yr}>{yr === 'All' ? 'All Years' : yr}</option>
                ))}
              </select>
            </div>

            {/* Academic Term Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Term:</span>
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
              >
                {uniqueTerms.map((t) => (
                  <option key={t} value={t}>{t === 'All' ? 'All Terms' : t}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
              >
                <option value="All">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Enrolment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Enrolment:</span>
              <select
                value={enrolmentFilter}
                onChange={(e) => setEnrolmentFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
              >
                <option value="All">All Types</option>
                <option value="Day">Day</option>
                <option value="Boarding">Boarding</option>
              </select>
            </div>

            {/* Quick Sort Order Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Order:</span>
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1e293b'
                }}
              >
                {sortDirection === 'asc' ? <ArrowUp size={14} color="#166534" /> : <ArrowDown size={14} color="#166534" />}
                {sortDirection === 'asc' ? 'Ascending (A-Z)' : 'Descending (Z-A)'}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th
                    onClick={() => handleHeaderSort('learner')}
                    style={{ padding: '12px 14px', color: sortColumn === 'learner' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      LEARNER NAME {renderSortIcon('learner')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('class')}
                    style={{ padding: '12px 14px', color: sortColumn === 'class' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      CLASS/FORM {renderSortIcon('class')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('guardian')}
                    style={{ padding: '12px 14px', color: sortColumn === 'guardian' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      GUARDIAN DETAILS {renderSortIcon('guardian')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('enrolment')}
                    style={{ padding: '12px 14px', color: sortColumn === 'enrolment' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      ENROLMENT TYPE {renderSortIcon('enrolment')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('status')}
                    style={{ padding: '12px 14px', color: sortColumn === 'status' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      STATUS {renderSortIcon('status')}
                    </div>
                  </th>
                  <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    OFFICE EVALUATION
                  </th>
                  <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      No matching applicant records found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((item) => {
                    const learnerName = (item.firstName || item.surname || item.otherNames)
                      ? `${item.firstName || ''} ${item.otherNames ? item.otherNames + ' ' : ''}${item.surname || ''}`.replace(/\s+/g, ' ').trim()
                      : (item.learner || item.learner_name || item.fullName || 'Applicant');
                    const guardianName = item.guardian || item.fatherName || item.motherName || 'Parent/Guardian';
                    const email = item.email || item.fatherEmail || item.motherEmail || `${learnerName.toLowerCase().replace(/\s+/g, '')}@remaljcarewell.edu.gh`;
                    const enrolmentType = item.residenceType || item.enrolmentType || 'Day';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{learnerName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            Submitted: {item.submittedAt ? new Date(item.submittedAt).toISOString() : '2026-09-29T18:00:00.000Z'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', verticalAlign: 'middle' }}>
                          <div>{item.level || item.applyingClass || 'Basic 1'}</div>
                          {(item.academicYear || item.academicTerm) && (
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 2 }}>
                              {[item.academicYear, item.academicTerm].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{guardianName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{email}</div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: enrolmentType === 'Boarding' ? '#ffedd5' : '#e0f2fe',
                            color: enrolmentType === 'Boarding' ? '#c2410c' : '#0369a1',
                            fontWeight: 700,
                            fontSize: 11
                          }}>
                            {enrolmentType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <select
                            value={item.status || 'Submitted'}
                            onChange={(event) => {
                              const newStatus = event.target.value;
                              updateApplicationStatus(item.id, newStatus);
                              if (newStatus === 'Accepted' || newStatus === 'Enrolled') {
                                const parentFirstName = (item.fatherFirstName || item.motherFirstName || item.firstName || (item.guardian || 'Parent').split(' ')[0] || 'parent').toLowerCase().replace(/[^a-z0-9]/g, '');
                                const parentSurname = (item.surname || item.fatherSurname || item.motherSurname || item.learner || 'carewell').toLowerCase().replace(/[^a-z0-9]/g, '');
                                const contactEmail = `${parentFirstName}.${parentSurname}@remaljcarewell.edu.gh`;
                                const defaultPass = 'Carewell2026!';
                                const phone = item.phone || item.guardianPhone || item.fatherPhone || item.motherPhone || '024 111 2222';

                                setNotice(`📱 AUTOMATIC SMS & EMAIL CREDENTIALS DISPATCHED TO ${parentFirstName.toUpperCase()} (${phone}):\n• School: REMALJ Carewell Inspirational School\n• Email: ${contactEmail}\n• Default Password: ${defaultPass}\n• Direct Access: http://localhost:5173/#/parent (No sign-in required)`);
                                setTimeout(() => setNotice(''), 10000);
                              }
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              fontWeight: 700,
                              fontSize: 12,
                              background: '#fff'
                            }}
                          >
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            background: '#dcfce7',
                            color: '#15803d',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 11
                          }}>
                            ✅ Office Reviewed (Admit: Yes)
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => setSelectedApp(item)}
                              title="View Form PDF"
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontWeight: 700,
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Eye size={13} /> View Form PDF
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete application for ${learnerName}?`)) {
                                  if (deleteApplication) deleteApplication(item.id);
                                }
                              }}
                              title="Delete Application"
                              style={{
                                padding: 6,
                                borderRadius: 6,
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

