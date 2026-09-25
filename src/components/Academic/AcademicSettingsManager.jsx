import React, { useState, useEffect } from 'react';
import { usePortalData } from '../../data/PortalStore';
import { Settings, Calendar, Save, CheckCircle2, RefreshCw, ShieldCheck, Award, BookOpen, Building } from 'lucide-react';

export default function AcademicSettingsManager({ onClose, inline = false }) {
  const { academicSettings, updateAcademicSettings } = usePortalData();

  const [year, setYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [term, setTerm] = useState(academicSettings?.academicTerm || 'Term 3');
  const [classWeight, setClassWeight] = useState(academicSettings?.classTestWeight || 50);
  const [examWeight, setExamWeight] = useState(academicSettings?.examWeight || 50);
  const [schoolName, setSchoolName] = useState(academicSettings?.schoolName || 'REMALJ Carewell Inspirational School');
  const [schoolBranch, setSchoolBranch] = useState(academicSettings?.schoolBranch || 'Bogoso Main Campus');
  const [gradingSystem, setGradingSystem] = useState(academicSettings?.gradingSystem || 'BECE 9-Point Scale (GES Standard)');
  const [resumptionDate, setResumptionDate] = useState(academicSettings?.resumptionDate || '2026-09-08');
  const [vacationDate, setVacationDate] = useState(academicSettings?.vacationDate || '2026-12-18');

  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (academicSettings) {
      if (academicSettings.academicYear) setYear(academicSettings.academicYear);
      if (academicSettings.academicTerm) setTerm(academicSettings.academicTerm);
      if (academicSettings.classTestWeight) setClassWeight(academicSettings.classTestWeight);
      if (academicSettings.examWeight) setExamWeight(academicSettings.examWeight);
      if (academicSettings.schoolName) setSchoolName(academicSettings.schoolName);
      if (academicSettings.schoolBranch) setSchoolBranch(academicSettings.schoolBranch);
      if (academicSettings.gradingSystem) setGradingSystem(academicSettings.gradingSystem);
      if (academicSettings.resumptionDate) setResumptionDate(academicSettings.resumptionDate);
      if (academicSettings.vacationDate) setVacationDate(academicSettings.vacationDate);
    }
  }, [academicSettings]);

  const handleSave = (e) => {
    if (e) e.preventDefault();

    const newSettings = {
      academicYear: year,
      academicTerm: term,
      classTestWeight: Number(classWeight),
      examWeight: Number(examWeight),
      schoolName,
      schoolBranch,
      gradingSystem,
      resumptionDate,
      vacationDate,
      updatedAt: new Date().toISOString()
    };

    updateAcademicSettings(newSettings);

    setSavedNotice(`✅ Academic Settings Synchronized! Global Session set to ${year} (${term}).`);
    setTimeout(() => setSavedNotice(''), 4500);

    if (onClose && !inline) {
      setTimeout(() => onClose(), 1200);
    }
  };

  const content = (
    <div style={{ background: '#ffffff', borderRadius: 12, padding: inline ? 0 : 20, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ background: '#0284c7', color: '#fff', padding: '12px 18px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 15 }}>
          <Settings size={20} />
          <span>SIMS Global Academic Settings Manager</span>
        </div>
        {onClose && !inline && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}>✕</button>
        )}
      </div>

      <form onSubmit={handleSave} style={{ border: '1px solid #cbd5e1', borderTop: 'none', padding: 20, borderRadius: '0 0 10px 10px', background: '#f8fafc' }}>
        {savedNotice && (
          <div style={{ background: '#dcfce7', border: '1px solid #166534', color: '#166534', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{savedNotice}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              📅 Active Academic Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #0f3a4b', fontWeight: 800, fontSize: 13, background: '#fff' }}
            >
              <option value="2023/2024">2023/2024 Academic Year</option>
              <option value="2024/2025">2024/2025 Academic Year</option>
              <option value="2025/2026">2025/2026 Academic Year</option>
              <option value="2026/2027">2026/2027 Academic Year</option>
              <option value="2027/2028">2027/2028 Academic Year</option>
              <option value="2028/2029">2028/2029 Academic Year</option>
              <option value="2029/2030">2029/2030 Academic Year</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              🗓️ Active Academic Term / Semester
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #0f3a4b', fontWeight: 800, fontSize: 13, background: '#fff' }}
            >
              <option value="Term 1">Term 1 (First Term)</option>
              <option value="Term 2">Term 2 (Second Term)</option>
              <option value="Term 3">Term 3 (Third Term)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
              📝 Class Assessment Conversion Weight (%)
            </label>
            <input
              type="number"
              value={classWeight}
              onChange={(e) => setClassWeight(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #f59e0b', fontWeight: 900, fontSize: 14 }}
              min={0}
              max={100}
            />
            <small style={{ fontSize: 10.5, color: '#b45309', display: 'block', marginTop: 4 }}>
              Continuous assessment contribution to final grade (Default: 50%)
            </small>
          </div>

          <div style={{ background: '#fed7aa', padding: 12, borderRadius: 8, border: '1px solid #fdba74' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#9a3412', marginBottom: 4 }}>
              🎓 End of Term Exam Conversion Weight (%)
            </label>
            <input
              type="number"
              value={examWeight}
              onChange={(e) => setExamWeight(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ea580c', fontWeight: 900, fontSize: 14 }}
              min={0}
              max={100}
            />
            <small style={{ fontSize: 10.5, color: '#c2410c', display: 'block', marginTop: 4 }}>
              Terminal examination contribution to final grade (Default: 50%)
            </small>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            🏆 Official Assessment Grading Scale
          </label>
          <select
            value={gradingSystem}
            onChange={(e) => setGradingSystem(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12.5 }}
          >
            <option value="BECE 9-Point Scale (GES Standard)">BECE 9-Point Scale (1=Highest Proficiency, 9=Fail)</option>
            <option value="Standard Letter Grade (A-F)">Standard Letter Grade (A+, A, B, C, D, F)</option>
            <option value="Custom Percentage Bands">Custom Percentage Scale (80%+ Grade 1, 75%+ Grade 2)</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
              🏫 Institution Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
              📍 Campus / Branch Name
            </label>
            <input
              type="text"
              value={schoolBranch}
              onChange={(e) => setSchoolBranch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
              🚀 Term Resumption Date
            </label>
            <input
              type="date"
              value={resumptionDate}
              onChange={(e) => setResumptionDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
              🏖️ Term Vacation Date
            </label>
            <input
              type="date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {onClose && !inline && (
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: 6, border: '1px solid #94a3b8', background: '#e2e8f0', color: '#334155', fontWeight: 800, cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save size={16} /> Save & Synchronize Academic Settings
          </button>
        </div>
      </form>
    </div>
  );

  if (inline) return content;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720 }}>
        {content}
      </div>
    </div>
  );
}
