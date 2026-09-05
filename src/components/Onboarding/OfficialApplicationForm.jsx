import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, CheckCircle2, Save,
  ArrowLeft, ArrowRight, UserCheck, ShieldAlert, Upload, Image as ImageIcon
} from 'lucide-react';
import './OfficialApplicationForm.css';

// SVG Crest Emblem Logo for REMALJ Carewell Inspirational School matching official crest
export function SchoolLogoSVG({ size = 110 }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Header Text */}
      <text x="100" y="16" fill="#0088cc" fontSize="13.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, Arial, sans-serif">
        REMALJ
      </text>
      <text x="100" y="28" fill="#0088cc" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, Arial, sans-serif" letterSpacing="0.2">
        CAREWELL INSPIRATIONAL SCHOOL
      </text>

      {/* Main Shield Outer Red Border Line */}
      <path d="M 40 44 C 40 44, 100 38, 160 44 C 160 115, 150 155, 100 178 C 50 155, 40 115, 40 44 Z" fill="none" stroke="#d91b1b" strokeWidth="2.5" />
      {/* Inner Dark Blue Shield Body */}
      <path d="M 43 47 C 43 47, 100 41, 157 47 C 157 113, 147 151, 100 173 C 53 151, 43 113, 43 47 Z" fill="#0b1b7f" stroke="#0b1b7f" strokeWidth="2" />
      {/* White Shield Interior */}
      <path d="M 47 51 C 47 51, 100 45, 153 51 C 153 110, 143 147, 100 167 C 57 147, 47 110, 47 51 Z" fill="#ffffff" />

      {/* Internal Red Partition Lines */}
      <path d="M 47 108 L 153 108" stroke="#d91b1b" strokeWidth="3" />
      <path d="M 100 46 L 100 108" stroke="#d91b1b" strokeWidth="3" />
      <path d="M 47 51 C 47 51, 100 45, 153 51" fill="none" stroke="#d91b1b" strokeWidth="3" />

      {/* Top-Right Quadrant: Pink Diagonal Stripes + Open Book */}
      <g>
        <rect x="100" y="47" width="53" height="60" fill="#ffb6c1" clipPath="url(#topRightClip)" />
        {/* Hatching Lines */}
        <line x1="95" y1="50" x2="160" y2="115" stroke="#e05282" strokeWidth="1.5" />
        <line x1="105" y1="50" x2="165" y2="110" stroke="#e05282" strokeWidth="1.5" />
        <line x1="115" y1="50" x2="165" y2="100" stroke="#e05282" strokeWidth="1.5" />
        <line x1="125" y1="50" x2="165" y2="90" stroke="#e05282" strokeWidth="1.5" />
        <line x1="95" y1="60" x2="150" y2="115" stroke="#e05282" strokeWidth="1.5" />
        <line x1="95" y1="70" x2="140" y2="115" stroke="#e05282" strokeWidth="1.5" />
      </g>
      {/* Open Book Graphic */}
      <g transform="translate(105, 54)">
        <path d="M 4 25 C 15 15, 20 22, 20 22 C 20 22, 25 15, 36 25 L 36 40 C 25 30, 20 37, 20 37 C 20 37, 15 30, 4 40 Z" fill="#ffffff" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <path d="M 20 22 L 20 37" stroke="#000000" strokeWidth="2" />
        <line x1="8" y1="26" x2="17" y2="28" stroke="#000" strokeWidth="1" />
        <line x1="8" y1="30" x2="17" y2="32" stroke="#000" strokeWidth="1" />
        <line x1="23" y1="28" x2="32" y2="26" stroke="#000" strokeWidth="1" />
        <line x1="23" y1="32" x2="32" y2="30" stroke="#000" strokeWidth="1" />
      </g>

      {/* Top-Left Quadrant: Children holding hands */}
      <g transform="translate(53, 56)">
        {/* Boy */}
        <circle cx="12" cy="11" r="5" fill="#fdb87d" />
        <path d="M 7 8 Q 12 4 17 8" fill="#e65100" />
        <rect x="8" y="16" width="8" height="12" fill="#0288d1" rx="2" />
        <line x1="10" y1="28" x2="10" y2="36" stroke="#000" strokeWidth="2" />
        <line x1="14" y1="28" x2="14" y2="36" stroke="#000" strokeWidth="2" />
        <line x1="15" y1="18" x2="22" y2="22" stroke="#fdb87d" strokeWidth="2" />

        {/* Girl */}
        <circle cx="30" cy="12" r="5" fill="#fdb87d" />
        <path d="M 25 9 Q 30 5 35 9" fill="#b71c1c" />
        <path d="M 24 17 L 36 17 L 38 29 L 22 29 Z" fill="#8d6e63" />
        <line x1="27" y1="29" x2="27" y2="36" stroke="#000" strokeWidth="2" />
        <line x1="33" y1="29" x2="33" y2="36" stroke="#000" strokeWidth="2" />
        <line x1="25" y1="19" x2="21" y2="22" stroke="#fdb87d" strokeWidth="2" />
      </g>

      {/* Bottom Compartment: Graduation Cap & Diploma Scroll */}
      <g transform="translate(48, 110)">
        {/* Mortarboard Cap */}
        <path d="M 52 7 L 100 24 L 52 41 L 4 24 Z" fill="#0f172a" stroke="#000000" strokeWidth="1.5" />
        <path d="M 28 27 L 28 42 C 28 42, 52 50, 76 42 L 76 27 Z" fill="#0f172a" stroke="#000000" strokeWidth="1.5" />
        {/* Tassel */}
        <line x1="52" y1="24" x2="18" y2="32" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="18" cy="38" r="3.5" fill="#f59e0b" />

        {/* Diploma Certificate Scroll */}
        <g transform="translate(24, 34) rotate(-8)">
          <rect x="0" y="0" width="55" height="15" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <ellipse cx="55" cy="7.5" rx="3" ry="7.5" fill="#e2e8f0" stroke="#000000" strokeWidth="1.5" />
          <rect x="22" y="-1" width="7" height="17" fill="#dc2626" />
          <path d="M 25 15 L 20 25 L 25 22 L 30 25 Z" fill="#dc2626" />
        </g>
      </g>

      {/* Stars on Left & Right */}
      <path d="M 26 150 L 29 157 L 36 157 L 31 161 L 33 168 L 26 164 L 19 168 L 21 161 L 16 157 L 23 157 Z" fill="#00a8ff" stroke="#000000" strokeWidth="1.5" />
      <path d="M 174 150 L 177 157 L 184 157 L 179 161 L 181 168 L 174 164 L 167 168 L 169 161 L 164 157 L 171 157 Z" fill="#00a8ff" stroke="#000000" strokeWidth="1.5" />

      {/* Bottom Ribbon Banner: "Inspiring Excellence" */}
      <g>
        <path d="M 22 178 L 42 165 L 42 188 Z" fill="#0284c7" />
        <path d="M 178 178 L 158 165 L 158 188 Z" fill="#0284c7" />
        <path d="M 32 168 Q 100 196 168 168 L 162 198 Q 100 224 38 198 Z" fill="#00a8ff" stroke="#0b1b7f" strokeWidth="2" />
        <path d="M 36 172 Q 100 199 164 172" fill="none" id="ribbonArcText" />
        <text fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="0.4" fontFamily="system-ui, Arial, sans-serif">
          <textPath href="#ribbonArcText" startOffset="50%" textAnchor="middle">
            Inspiring Excellence
          </textPath>
        </text>
      </g>
    </svg>
  );
}

const DEFAULT_FORM = {
  // Header / Page 1
  applyingClass: '',
  enrolmentType: 'Day',
  passportPhoto: null,
  surname: '',
  firstName: '',
  otherNames: '',
  sex: 'Male',
  dob: '',
  placeOfBirth: '',
  nationality: 'Ghanaian',
  religion: '',
  residentialAddress: '',
  postalAddress: '',
  languagesSpoken: 'English',
  presentSchool: '',
  presentClass: '',

  // Guardian details
  fatherName: '',
  fatherOccupation: '',
  fatherOrganisation: '',
  fatherPhone: '',
  fatherEmail: '',
  motherName: '',
  motherOccupation: '',
  motherOrganisation: '',
  motherPhone: '',
  parentsLivingStatus: 'Together',

  // Page 2: Previous Schools
  previousSchools: [
    { name: '', address: '', fromYear: '', toYear: '', lastClass: '' },
    { name: '', address: '', fromYear: '', toYear: '', lastClass: '' },
    { name: '', address: '', fromYear: '', toYear: '', lastClass: '' },
    { name: '', address: '', fromYear: '', toYear: '', lastClass: '' },
  ],

  // Medical Information
  bloodGroup: '',
  hasAllergies: 'No',
  allergiesDetails: '',
  hasSkinDisorders: 'No',
  skinDisordersDetails: '',
  hasRespiratoryDisorders: 'No',
  respiratoryDisordersDetails: '',
  hasHearingDifficulties: 'No',
  hearingDifficultiesDetails: '',
  requiresCorrectiveGlasses: 'No',
  correctiveGlassesDetails: '',
  physicallyFitForSports: 'Yes',
  sportsUnfitDetails: '',

  // Behaviour / Special Needs
  hasSpecialTalent: 'No',
  specialTalentDetails: '',

  // Page 3
  expelledRefusedEntry: 'No',
  expelledDetails: '',
  hasBehaviouralProblems: 'No',
  behaviouralProblemsDetails: '',
  hasSpecialLearningNeeds: 'No',
  specialLearningNeedsDetails: '',
  otherFactorsSchoolAwareness: '',

  // Emergency & Doctor
  emergencyContactName: '',
  emergencyContactPhone: '',
  doctorName: '',
  doctorAddress: '',
  doctorPhone: '',

  // Page 4: Declaration & Requirements
  declarationParentName: '',
  declarationSignature: '',
  declarationDate: new Date().toISOString().split('T')[0],
  parentsGhanaCard: '',
  childHealthInsuranceCard: '',
  gpsAddress: '',

  // Office Use Only
  officeExamEnglishMark: '',
  officeExamEnglishComments: '',
  officeExamMathMark: '',
  officeExamMathComments: '',
  officeExamAptitudeMark: '',
  officeExamAptitudeComments: '',
  officeAdmit: 'Yes',
  officeFormAssigned: '',
  officeStudentID: '',
  officeSIATrust: 'No',
  officeComments: '',
  officeStaffName: '',
  officeStaffSignature: '',
  officeDate: new Date().toISOString().split('T')[0],
};

export default function OfficialApplicationForm({
  initialData = null,
  readOnly = false,
  isAdmin = false,
  onSubmit = null,
  onSaveOfficeUse = null,
  onCancel = null
}) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_FORM,
    ...(initialData || {})
  }));

  const [activeTab, setActiveTab] = useState('page1');
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    if (readOnly && !isAdmin) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSchoolTableChange = (index, field, value) => {
    if (readOnly && !isAdmin) return;
    setFormData((prev) => {
      const updated = [...(prev.previousSchools || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, previousSchools: updated };
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('passportPhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSchoolRow = () => {
    setFormData((prev) => ({
      ...prev,
      previousSchools: [
        ...(prev.previousSchools || []),
        { name: '', address: '', fromYear: '', toYear: '', lastClass: '' }
      ]
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
      setSuccessNotice('Official Application Form successfully submitted online!');
      setTimeout(() => setSuccessNotice(''), 6000);
    }
  };

  const handleOfficeSave = () => {
    if (onSaveOfficeUse) {
      onSaveOfficeUse(formData.id || initialData?.id, {
        officeExamEnglishMark: formData.officeExamEnglishMark,
        officeExamEnglishComments: formData.officeExamEnglishComments,
        officeExamMathMark: formData.officeExamMathMark,
        officeExamMathComments: formData.officeExamMathComments,
        officeExamAptitudeMark: formData.officeExamAptitudeMark,
        officeExamAptitudeComments: formData.officeExamAptitudeComments,
        officeAdmit: formData.officeAdmit,
        officeFormAssigned: formData.officeFormAssigned,
        officeStudentID: formData.officeStudentID,
        officeSIATrust: formData.officeSIATrust,
        officeComments: formData.officeComments,
        officeStaffName: formData.officeStaffName,
        officeStaffSignature: formData.officeStaffSignature,
        officeDate: formData.officeDate,
      });
      setSuccessNotice('Office examination and recommendation saved successfully!');
      setTimeout(() => setSuccessNotice(''), 5000);
    }
  };

  // Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Clear for blank download template
  const handleBlankDownload = () => {
    setFormData(DEFAULT_FORM);
    setActiveTab('all');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="official-form-wrapper">
      {/* Top Action Bar (hidden on print) */}
      <div className="official-form-toolbar no-print">
        <div>
          <div className="official-form-title">
            <SchoolLogoSVG size={36} />
            REMALJ CAREWELL INSPIRATIONAL SCHOOL — APPLICATION FORM
          </div>
          <div className="official-form-subtitle">
            P.O. BOX 139, BOGOSO • info@remaljschools.com • Online Submission & PDF Export
          </div>
        </div>

        <div className="official-form-actions">
          {onCancel && (
            <button className="btn-form-action btn-form-action--outline" type="button" onClick={onCancel}>
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <button className="btn-form-action btn-form-action--secondary" type="button" onClick={handlePrint} title="Download or Save Application Form as PDF">
            <Download size={14} /> Download Form PDF
          </button>

          <button className="btn-form-action btn-form-action--secondary" type="button" onClick={handlePrint} title="Print or Save as PDF locally">
            <Printer size={14} /> Print PDF
          </button>

          <button className="btn-form-action btn-form-action--outline" type="button" onClick={handleBlankDownload} title="Download empty blank form template">
            Blank Template PDF
          </button>

          {!readOnly && (
            <button className="btn-form-action btn-form-action--primary" type="button" onClick={handleFormSubmit}>
              <CheckCircle2 size={14} /> Submit Application Online
            </button>
          )}

          {isAdmin && readOnly && (
            <button className="btn-form-action btn-form-action--primary" type="button" onClick={handleOfficeSave}>
              <Save size={14} /> Save Office Review
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (hidden on print) */}
      <div className="official-form-nav no-print">
        <button className={`official-form-tab ${activeTab === 'page1' ? 'active' : ''}`} onClick={() => setActiveTab('page1')}>
          Page 1: Student & Parents
        </button>
        <button className={`official-form-tab ${activeTab === 'page2' ? 'active' : ''}`} onClick={() => setActiveTab('page2')}>
          Page 2: Schools & Medical
        </button>
        <button className={`official-form-tab ${activeTab === 'page3' ? 'active' : ''}`} onClick={() => setActiveTab('page3')}>
          Page 3: Special Needs & Doctor
        </button>
        <button className={`official-form-tab ${activeTab === 'page4' ? 'active' : ''}`} onClick={() => setActiveTab('page4')}>
          Page 4: Declaration & Office Use
        </button>
        <button className={`official-form-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          📄 Full 4-Page PDF View
        </button>
      </div>

      {successNotice && (
        <div style={{ padding: '12px 20px', background: '#dcfce7', color: '#166534', fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {successNotice}
        </div>
      )}

      {/* Printable / Interactive Form Area */}
      <form onSubmit={handleFormSubmit} className="official-document-printable">

        {/* ── PAGE 1 ── */}
        {(activeTab === 'page1' || activeTab === 'all') && (
          <div className="official-document-page">
            {/* Header Box */}
            <div className="school-header-box">
              <div className="school-header-logo">
                <SchoolLogoSVG size={100} />
              </div>
              <div className="school-header-text">
                <div className="school-header-title">REMALJ CAREWELL INSPIRATIONAL SCHOOL</div>
                <div className="school-header-sub">P. O. BOX 139, BOGOSO</div>
                <div className="school-header-email">Email: info@remaljschools.com</div>
              </div>
              <div className="photo-box">
                {formData.passportPhoto ? (
                  <img src={formData.passportPhoto} alt="Student Passport" />
                ) : (
                  <>
                    <ImageIcon size={24} style={{ marginBottom: 4 }} />
                    Student's<br />Passport size<br />photo
                  </>
                )}
                {!readOnly && (
                  <input type="file" accept="image/*" className="photo-box-input" onChange={handlePhotoUpload} title="Upload photo" />
                )}
              </div>
            </div>

            <div className="document-main-title">APPLICATION FORM</div>
            <div className="document-instruction">(Complete the form in block letters)</div>

            <div className="form-line-row">
              <span className="form-line-label">APPLYING FOR CLASS/FORM:</span>
              <input
                className="form-line-input"
                value={formData.applyingClass}
                onChange={(e) => handleChange('applyingClass', e.target.value)}
                placeholder="e.g. Primary 5 / JHS 1 / SHS 1"
                disabled={readOnly && !isAdmin}
              />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Enrolment type:</span>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="enrolmentType"
                    checked={formData.enrolmentType === 'Boarding'}
                    onChange={() => handleChange('enrolmentType', 'Boarding')}
                    disabled={readOnly && !isAdmin}
                  />
                  <span className="checkbox-box"></span>
                  Boarding
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="enrolmentType"
                    checked={formData.enrolmentType === 'Day'}
                    onChange={() => handleChange('enrolmentType', 'Day')}
                    disabled={readOnly && !isAdmin}
                  />
                  <span className="checkbox-box"></span>
                  Day
                </label>
              </div>
            </div>
            <div style={{ fontSize: 11, fontStyle: 'italic', marginBottom: 16 }}>
              (Students from Year 7 onwards are eligible for boarding school)
            </div>

            {/* Student's Information */}
            <div className="form-section-header">STUDENT'S INFORMATION</div>

            <div className="form-line-row">
              <span className="form-line-label">Surname:</span>
              <input className="form-line-input" value={formData.surname} onChange={(e) => handleChange('surname', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">First name:</span>
              <input className="form-line-input" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Other names:</span>
              <input className="form-line-input" value={formData.otherNames} onChange={(e) => handleChange('otherNames', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Sex:</span>
              <select
                style={{ border: 'none', borderBottom: '1px dotted #000', fontSize: 13, background: 'transparent', outline: 'none' }}
                value={formData.sex}
                onChange={(e) => handleChange('sex', e.target.value)}
                disabled={readOnly && !isAdmin}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
              <span className="form-line-label" style={{ marginLeft: 16 }}>Date of Birth:</span>
              <input type="date" className="form-line-input" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} disabled={readOnly && !isAdmin} />
              <span className="form-line-label" style={{ marginLeft: 16 }}>Place of Birth:</span>
              <input className="form-line-input" value={formData.placeOfBirth} onChange={(e) => handleChange('placeOfBirth', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Nationality:</span>
              <input className="form-line-input" value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} disabled={readOnly && !isAdmin} />
              <span className="form-line-label" style={{ marginLeft: 16 }}>Religion:</span>
              <input className="form-line-input" value={formData.religion} onChange={(e) => handleChange('religion', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Residential Address:</span>
              <input className="form-line-input" value={formData.residentialAddress} onChange={(e) => handleChange('residentialAddress', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Postal Address:</span>
              <input className="form-line-input" value={formData.postalAddress} onChange={(e) => handleChange('postalAddress', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Languages spoken:</span>
              <input className="form-line-input" value={formData.languagesSpoken} onChange={(e) => handleChange('languagesSpoken', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Present School:</span>
              <input className="form-line-input" value={formData.presentSchool} onChange={(e) => handleChange('presentSchool', e.target.value)} disabled={readOnly && !isAdmin} />
              <span className="form-line-label" style={{ marginLeft: 16 }}>Class/Form:</span>
              <input className="form-line-input" value={formData.presentClass} onChange={(e) => handleChange('presentClass', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row" style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: 6, border: '1px dashed #0284c7', marginTop: 10, marginBottom: 16 }}>
              <span className="form-line-label" style={{ color: '#0369a1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                💳 RFID / SMART CARD READER CODE:
              </span>
              <input
                className="form-line-input"
                style={{ fontWeight: 800, color: '#166534', letterSpacing: '0.05em' }}
                value={formData.rfidCardCode || ''}
                onChange={(e) => handleChange('rfidCardCode', e.target.value)}
                placeholder="e.g. CARD-001 or tap RFID Card Reader to assign..."
                disabled={readOnly && !isAdmin}
              />
              {!readOnly && (
                <button
                  type="button"
                  style={{ padding: '4px 12px', fontSize: 11, fontWeight: 800, borderRadius: 4, background: '#166534', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input) input.focus();
                  }}
                  title="Click to focus & tap card on USB Card Reader"
                >
                  💳 Tap Card Reader
                </button>
              )}
            </div>

            {/* Parents' / Guardian's Information */}
            <div className="form-section-header">PARENTS' / GUARDIAN'S INFORMATION</div>

            <div className="form-line-row">
              <span className="form-line-label">Father's/Guardian's full name:</span>
              <input className="form-line-input" value={formData.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Occupation/Profession:</span>
              <input className="form-line-input" value={formData.fatherOccupation} onChange={(e) => handleChange('fatherOccupation', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Organisation:</span>
              <input className="form-line-input" value={formData.fatherOrganisation} onChange={(e) => handleChange('fatherOrganisation', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Telephone number(s):</span>
              <input className="form-line-input" value={formData.fatherPhone} onChange={(e) => handleChange('fatherPhone', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Email address:</span>
              <input type="email" className="form-line-input" value={formData.fatherEmail} onChange={(e) => handleChange('fatherEmail', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row" style={{ marginTop: 12 }}>
              <span className="form-line-label">Mother's/Guardian's full name:</span>
              <input className="form-line-input" value={formData.motherName} onChange={(e) => handleChange('motherName', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Occupation/Profession:</span>
              <input className="form-line-input" value={formData.motherOccupation} onChange={(e) => handleChange('motherOccupation', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Organisation:</span>
              <input className="form-line-input" value={formData.motherOrganisation} onChange={(e) => handleChange('motherOrganisation', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Telephone number(s):</span>
              <input className="form-line-input" value={formData.motherPhone} onChange={(e) => handleChange('motherPhone', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row" style={{ marginTop: 12 }}>
              <span className="form-line-label">Are parents living:</span>
              <div className="checkbox-group" style={{ flexWrap: 'wrap' }}>
                {['Together', 'Separated', 'Divorced', 'Single Parent'].map((status) => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="radio"
                      name="parentsLivingStatus"
                      checked={formData.parentsLivingStatus === status}
                      onChange={() => handleChange('parentsLivingStatus', status)}
                      disabled={readOnly && !isAdmin}
                    />
                    <span className="checkbox-box"></span>
                    ({ status })
                  </label>
                ))}
              </div>
            </div>

            <div className="document-page-num">1</div>
          </div>
        )}

        {/* ── PAGE 2 ── */}
        {(activeTab === 'page2' || activeTab === 'all') && (
          <div className="official-document-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <SchoolLogoSVG size={50} />
              <div className="form-section-header" style={{ margin: 0 }}>PREVIOUS SCHOOLS ATTENDED</div>
            </div>

            <table className="form-custom-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Name</th>
                  <th style={{ width: '30%' }}>Address</th>
                  <th style={{ width: '13%' }}>From (Year)</th>
                  <th style={{ width: '13%' }}>To (Year)</th>
                  <th style={{ width: '14%' }}>Last class completed</th>
                </tr>
              </thead>
              <tbody>
                {(formData.previousSchools || []).map((sch, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={sch.name}
                        onChange={(e) => handleSchoolTableChange(i, 'name', e.target.value)}
                        placeholder="School Name"
                        disabled={readOnly && !isAdmin}
                      />
                    </td>
                    <td>
                      <input
                        value={sch.address}
                        onChange={(e) => handleSchoolTableChange(i, 'address', e.target.value)}
                        placeholder="Location / Address"
                        disabled={readOnly && !isAdmin}
                      />
                    </td>
                    <td>
                      <input
                        value={sch.fromYear}
                        onChange={(e) => handleSchoolTableChange(i, 'fromYear', e.target.value)}
                        placeholder="e.g. 2021"
                        disabled={readOnly && !isAdmin}
                      />
                    </td>
                    <td>
                      <input
                        value={sch.toYear}
                        onChange={(e) => handleSchoolTableChange(i, 'toYear', e.target.value)}
                        placeholder="e.g. 2024"
                        disabled={readOnly && !isAdmin}
                      />
                    </td>
                    <td>
                      <input
                        value={sch.lastClass}
                        onChange={(e) => handleSchoolTableChange(i, 'lastClass', e.target.value)}
                        placeholder="e.g. Primary 4"
                        disabled={readOnly && !isAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!readOnly && (
              <button type="button" onClick={addSchoolRow} className="no-print" style={{ padding: '4px 10px', fontSize: 11, background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 16 }}>
                + Add Another School Row
              </button>
            )}

            {/* Medical Information */}
            <div className="form-section-header">MEDICAL INFORMATION OF STUDENT</div>

            <div className="form-line-row">
              <span className="form-line-label">Blood Group if known:</span>
              <input className="form-line-input" value={formData.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)} placeholder="e.g. O+, A+, B+" disabled={readOnly && !isAdmin} />
            </div>

            {/* Questions with details */}
            {[
              { label: 'Does the student have any allergies?', keyFlag: 'hasAllergies', keyDetail: 'allergiesDetails' },
              { label: 'Does the student have any skin disorders?', keyFlag: 'hasSkinDisorders', keyDetail: 'skinDisordersDetails' },
              { label: 'Does the student suffer from any respiratory disorders?', keyFlag: 'hasRespiratoryDisorders', keyDetail: 'respiratoryDisordersDetails' },
              { label: 'Does the student have hearing difficulties?', keyFlag: 'hasHearingDifficulties', keyDetail: 'hearingDifficultiesDetails' },
              { label: 'Does the student wear or require corrective glasses?', keyFlag: 'requiresCorrectiveGlasses', keyDetail: 'correctiveGlassesDetails', detailPrompt: 'If yes, please provide details (short/long sighted or other condition)' },
              { label: 'Is the student physically fit to participate in all sporting activities?', keyFlag: 'physicallyFitForSports', keyDetail: 'sportsUnfitDetails', invertPrompt: true },
            ].map((q) => (
              <div className="question-block" key={q.keyFlag}>
                <div className="question-prompt">
                  <span className="question-prompt-text">{q.label}</span>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name={q.keyFlag}
                        checked={formData[q.keyFlag] === 'Yes'}
                        onChange={() => handleChange(q.keyFlag, 'Yes')}
                        disabled={readOnly && !isAdmin}
                      />
                      Yes
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name={q.keyFlag}
                        checked={formData[q.keyFlag] === 'No'}
                        onChange={() => handleChange(q.keyFlag, 'No')}
                        disabled={readOnly && !isAdmin}
                      />
                      No
                    </label>
                  </div>
                </div>
                <div className="question-details-row">
                  <span className="form-line-label">{q.detailPrompt || (q.invertPrompt ? 'If no, please provide details:' : 'If yes, please provide details:')}</span>
                  <input
                    className="form-line-input"
                    value={formData[q.keyDetail]}
                    onChange={(e) => handleChange(q.keyDetail, e.target.value)}
                    disabled={readOnly && !isAdmin}
                  />
                </div>
              </div>
            ))}

            {/* Behaviour / Special Needs */}
            <div className="form-section-header" style={{ marginTop: 24 }}>BEHAVIOUR / SPECIAL NEEDS / GIFTED AND TALENTED INFORMATION</div>
            <div className="question-block">
              <div className="question-prompt">
                <span className="question-prompt-text">Does the student have a special talent or interest that you are aware of?</span>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="hasSpecialTalent"
                      checked={formData.hasSpecialTalent === 'Yes'}
                      onChange={() => handleChange('hasSpecialTalent', 'Yes')}
                      disabled={readOnly && !isAdmin}
                    />
                    Yes
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="hasSpecialTalent"
                      checked={formData.hasSpecialTalent === 'No'}
                      onChange={() => handleChange('hasSpecialTalent', 'No')}
                      disabled={readOnly && !isAdmin}
                    />
                    No
                  </label>
                </div>
              </div>
              <div className="question-details-row">
                <span className="form-line-label">If yes, please provide further details:</span>
                <input
                  className="form-line-input"
                  value={formData.specialTalentDetails}
                  onChange={(e) => handleChange('specialTalentDetails', e.target.value)}
                  disabled={readOnly && !isAdmin}
                />
              </div>
            </div>

            <div className="document-page-num">2</div>
          </div>
        )}

        {/* ── PAGE 3 ── */}
        {(activeTab === 'page3' || activeTab === 'all') && (
          <div className="official-document-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <SchoolLogoSVG size={50} />
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', textDecoration: 'underline' }}>STUDENT SPECIAL NEEDS & MEDICAL EMERGENCY</div>
            </div>

            {[
              { label: 'Has the student ever been expelled from or refused entry into another school?', keyFlag: 'expelledRefusedEntry', keyDetail: 'expelledDetails' },
              { label: 'Does the student have any behavioural problems you are aware of?', keyFlag: 'hasBehaviouralProblems', keyDetail: 'behaviouralProblemsDetails' },
              { label: 'Does the student have Special Learning Needs?', keyFlag: 'hasSpecialLearningNeeds', keyDetail: 'specialLearningNeedsDetails', detailPrompt: 'If yes, please provide details, including the support the student is currently receiving:' },
            ].map((q) => (
              <div className="question-block" key={q.keyFlag} style={{ marginBottom: 18 }}>
                <div className="question-prompt">
                  <span className="question-prompt-text">{q.label}</span>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name={q.keyFlag}
                        checked={formData[q.keyFlag] === 'Yes'}
                        onChange={() => handleChange(q.keyFlag, 'Yes')}
                        disabled={readOnly && !isAdmin}
                      />
                      Yes
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name={q.keyFlag}
                        checked={formData[q.keyFlag] === 'No'}
                        onChange={() => handleChange(q.keyFlag, 'No')}
                        disabled={readOnly && !isAdmin}
                      />
                      No
                    </label>
                  </div>
                </div>
                <div className="question-details-row">
                  <span className="form-line-label">{q.detailPrompt || 'If yes, please provide details:'}</span>
                  <input
                    className="form-line-input"
                    value={formData[q.keyDetail]}
                    onChange={(e) => handleChange(q.keyDetail, e.target.value)}
                    disabled={readOnly && !isAdmin}
                  />
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
                Please provide details of any other factors or issues the school should be aware of before the student is admitted:
              </div>
              <input
                className="form-line-input"
                style={{ width: '100%' }}
                value={formData.otherFactorsSchoolAwareness}
                onChange={(e) => handleChange('otherFactorsSchoolAwareness', e.target.value)}
                disabled={readOnly && !isAdmin}
              />
            </div>

            <div style={{
              border: '1px solid #666', padding: 12, fontSize: 11, fontStyle: 'italic',
              lineHeight: 1.5, background: '#fcfcfc', marginBottom: 24
            }}>
              The school will endeavour to support students with Special Needs or who have specific learning difficulties after a thorough assessment is made. However, it may be necessary to recommend some students to other institutions which are better able to support their needs if the support we provide is deemed to be inadequate.
            </div>

            {/* Emergency & Doctor */}
            <div className="form-section-header">EMERGENCY CONTACT AND DOCTOR INFORMATION</div>
            <div style={{ fontSize: 11, marginBottom: 10 }}>
              Please provide an alternative name and number, in case parent or guardian is not contactable in the event of an emergency:
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Emergency Contact Name & Phone:</span>
              <input className="form-line-input" value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} placeholder="Full Name & Phone Number" disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row" style={{ marginTop: 14 }}>
              <span className="form-line-label">Name of family Doctor (if applicable):</span>
              <input className="form-line-input" value={formData.doctorName} onChange={(e) => handleChange('doctorName', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Doctor's address:</span>
              <input className="form-line-input" value={formData.doctorAddress} onChange={(e) => handleChange('doctorAddress', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Doctor's telephone number:</span>
              <input className="form-line-input" value={formData.doctorPhone} onChange={(e) => handleChange('doctorPhone', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="document-page-num">3</div>
          </div>
        )}

        {/* ── PAGE 4 ── */}
        {(activeTab === 'page4' || activeTab === 'all') && (
          <div className="official-document-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <SchoolLogoSVG size={50} />
              <div className="form-section-header" style={{ margin: 0 }}>DECLARATION & OFFICE USE</div>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              I understand that this form must be completed and returned to Administration accompanied by my ward's school reports (the last 3 terms), a written report from his/her Head Teacher and a medical report from a reputable medical laboratory.
            </p>

            <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
              I am also aware that my ward will be expected to undertake an entry examination before admission can be confirmed.
            </p>

            <div className="form-line-row">
              <span className="form-line-label">Name of Parent/Guardian:</span>
              <input className="form-line-input" value={formData.declarationParentName} onChange={(e) => handleChange('declarationParentName', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            <div className="form-line-row">
              <span className="form-line-label">Signature of Parent/Guardian:</span>
              <input className="form-line-input" value={formData.declarationSignature} onChange={(e) => handleChange('declarationSignature', e.target.value)} placeholder="Type digital signature name" disabled={readOnly && !isAdmin} />
              <span className="form-line-label" style={{ marginLeft: 16 }}>Date:</span>
              <input type="date" className="form-line-input" value={formData.declarationDate} onChange={(e) => handleChange('declarationDate', e.target.value)} disabled={readOnly && !isAdmin} />
            </div>

            {/* Office Use Only Section */}
            <div className="office-use-panel">
              <div className="office-use-header">FOR OFFICE USE ONLY</div>

              <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>Entry Examination Results</div>
              <table className="form-custom-table" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Subject</th>
                    <th style={{ width: '25%' }}>Mark</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>English</strong></td>
                    <td><input value={formData.officeExamEnglishMark} onChange={(e) => handleChange('officeExamEnglishMark', e.target.value)} placeholder="Score" disabled={!isAdmin} /></td>
                    <td><input value={formData.officeExamEnglishComments} onChange={(e) => handleChange('officeExamEnglishComments', e.target.value)} placeholder="Comments" disabled={!isAdmin} /></td>
                  </tr>
                  <tr>
                    <td><strong>Math</strong></td>
                    <td><input value={formData.officeExamMathMark} onChange={(e) => handleChange('officeExamMathMark', e.target.value)} placeholder="Score" disabled={!isAdmin} /></td>
                    <td><input value={formData.officeExamMathComments} onChange={(e) => handleChange('officeExamMathComments', e.target.value)} placeholder="Comments" disabled={!isAdmin} /></td>
                  </tr>
                  <tr>
                    <td><strong>Aptitude/Reasoning</strong></td>
                    <td><input value={formData.officeExamAptitudeMark} onChange={(e) => handleChange('officeExamAptitudeMark', e.target.value)} placeholder="Score" disabled={!isAdmin} /></td>
                    <td><input value={formData.officeExamAptitudeComments} onChange={(e) => handleChange('officeExamAptitudeComments', e.target.value)} placeholder="Comments" disabled={!isAdmin} /></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>Recommendation</div>
              <table className="form-custom-table">
                <thead>
                  <tr>
                    <th>Admit (Y/N)</th>
                    <th>Form</th>
                    <th>Student ID</th>
                    <th>SIA Trust (Y/N)</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select style={{ border: 'none', background: 'transparent' }} value={formData.officeAdmit} onChange={(e) => handleChange('officeAdmit', e.target.value)} disabled={!isAdmin}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                    <td><input value={formData.officeFormAssigned} onChange={(e) => handleChange('officeFormAssigned', e.target.value)} placeholder="Form assigned" disabled={!isAdmin} /></td>
                    <td><input value={formData.officeStudentID} onChange={(e) => handleChange('officeStudentID', e.target.value)} placeholder="Assigned ID" disabled={!isAdmin} /></td>
                    <td>
                      <select style={{ border: 'none', background: 'transparent' }} value={formData.officeSIATrust} onChange={(e) => handleChange('officeSIATrust', e.target.value)} disabled={!isAdmin}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                    <td><input value={formData.officeComments} onChange={(e) => handleChange('officeComments', e.target.value)} placeholder="Remarks" disabled={!isAdmin} /></td>
                  </tr>
                </tbody>
              </table>

              <div className="form-line-row" style={{ marginTop: 12 }}>
                <span className="form-line-label">Officer Name:</span>
                <input className="form-line-input" value={formData.officeStaffName} onChange={(e) => handleChange('officeStaffName', e.target.value)} disabled={!isAdmin} />
                <span className="form-line-label" style={{ marginLeft: 12 }}>Signature:</span>
                <input className="form-line-input" value={formData.officeStaffSignature} onChange={(e) => handleChange('officeStaffSignature', e.target.value)} disabled={!isAdmin} />
                <span className="form-line-label" style={{ marginLeft: 12 }}>Date:</span>
                <input type="date" className="form-line-input" value={formData.officeDate} onChange={(e) => handleChange('officeDate', e.target.value)} disabled={!isAdmin} />
              </div>
            </div>

            {/* Other Requirements */}
            <div className="form-section-header" style={{ marginTop: 24 }}>OTHER REQUIREMENTS</div>
            <div className="form-line-row">
              <span className="form-line-label">PARENTS GHANA CARD NO.:</span>
              <input className="form-line-input" value={formData.parentsGhanaCard} onChange={(e) => handleChange('parentsGhanaCard', e.target.value)} placeholder="e.g. GHA-123456789-0" disabled={readOnly && !isAdmin} />
            </div>
            <div className="form-line-row">
              <span className="form-line-label">CHILD'S HEALTH INSURANCE CARD NO.:</span>
              <input className="form-line-input" value={formData.childHealthInsuranceCard} onChange={(e) => handleChange('childHealthInsuranceCard', e.target.value)} placeholder="NHIS Card Number" disabled={readOnly && !isAdmin} />
            </div>
            <div className="form-line-row">
              <span className="form-line-label">GPS ADDRESS:</span>
              <input className="form-line-input" value={formData.gpsAddress} onChange={(e) => handleChange('gpsAddress', e.target.value)} placeholder="e.g. WS-123-4567" disabled={readOnly && !isAdmin} />
            </div>

            <div className="document-page-num">4</div>
          </div>
        )}

        {/* Footer controls for online steps */}
        <div className="official-form-toolbar no-print" style={{ background: '#f8fafc', color: '#000', borderTop: '1px solid var(--gray-200)', marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {activeTab !== 'page1' && activeTab !== 'all' && (
              <button
                className="btn-form-action btn-form-action--outline"
                type="button"
                style={{ color: '#000', borderColor: '#ccc' }}
                onClick={() => {
                  if (activeTab === 'page2') setActiveTab('page1');
                  else if (activeTab === 'page3') setActiveTab('page2');
                  else if (activeTab === 'page4') setActiveTab('page3');
                }}
              >
                <ArrowLeft size={14} /> Previous Page
              </button>
            )}

            {activeTab !== 'page4' && activeTab !== 'all' && (
              <button
                className="btn-form-action btn-form-action--primary"
                type="button"
                onClick={() => {
                  if (activeTab === 'page1') setActiveTab('page2');
                  else if (activeTab === 'page2') setActiveTab('page3');
                  else if (activeTab === 'page3') setActiveTab('page4');
                }}
              >
                Next Page <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-form-action btn-form-action--secondary" style={{ color: '#1a3668', background: '#e0e7ff' }} type="button" onClick={handlePrint}>
              <Download size={14} /> Download Form PDF
            </button>

            {!readOnly && (
              <button className="btn-form-action btn-form-action--primary" type="submit">
                <CheckCircle2 size={14} /> Submit Application
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
