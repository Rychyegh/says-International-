import ViewportModal from '../Modal/ViewportModal';
import { SCHOOL_GRADING_BANDS, validateGradingBands } from '../../lib/schoolGrading';
import React, { useState, useEffect, useRef } from 'react';
import { validateAcademicSettings } from '../../lib/assessmentRules.js';
import { usePortalData } from '../../data/PortalStore';
import { Settings, Calendar, Save, CheckCircle2, RefreshCw, ShieldCheck, Award, BookOpen, Building } from 'lucide-react';

export default function AcademicSettingsManager({ onClose, onSaved, inline = false, gradingOnly = false }) {
  const { academicSettings, updateAcademicSettings } = usePortalData();
  const [bands,setBands] = useState(academicSettings?.gradingBands?.length === 9 ? academicSettings.gradingBands : SCHOOL_GRADING_BANDS);

  const [year, setYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [term, setTerm] = useState(academicSettings?.academicTerm || 'Term 3');
  const [classWeight, setClassWeight] = useState(academicSettings?.classTestWeight ?? 50);
  const [examWeight, setExamWeight] = useState(academicSettings?.examWeight ?? 50);
  const [schoolName, setSchoolName] = useState(academicSettings?.schoolName || 'REMALJ Carewell Inspirational School');
  const [schoolBranch, setSchoolBranch] = useState(academicSettings?.schoolBranch || 'Bogoso Main Campus');
  const [gradingSystem, setGradingSystem] = useState(academicSettings?.gradingSystem || 'BECE 9-Point Scale (GES Standard)');
  const [resumptionDate, setResumptionDate] = useState(academicSettings?.resumptionDate || '');
  const [vacationDate, setVacationDate] = useState(academicSettings?.vacationDate || '');

  const [savedNotice, setSavedNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (academicSettings && !dirty.current) {
      if (academicSettings.gradingBands?.length === 9) setBands(academicSettings.gradingBands);
      if (academicSettings.academicYear) setYear(academicSettings.academicYear);
      if (academicSettings.academicTerm) setTerm(academicSettings.academicTerm);
      if (academicSettings.classTestWeight != null) setClassWeight(academicSettings.classTestWeight);
      if (academicSettings.examWeight != null) setExamWeight(academicSettings.examWeight);
      if (academicSettings.schoolName) setSchoolName(academicSettings.schoolName);
      if (academicSettings.schoolBranch) setSchoolBranch(academicSettings.schoolBranch);
      if (academicSettings.gradingSystem) setGradingSystem(academicSettings.gradingSystem);
      if (academicSettings.resumptionDate) setResumptionDate(academicSettings.resumptionDate);
      if (academicSettings.vacationDate) setVacationDate(academicSettings.vacationDate);
    }
  }, [academicSettings]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (savingRef.current) return;
    setSaveError(''); setSavedNotice('');
    const newSettings = {
      academicYear: year,
      academicTerm: term,
      classTestWeight: Number(classWeight),
      examWeight: Number(examWeight),
      gradingBands: bands,
      gradingSystem: 'REMALJ 9-Point Proficiency Scale',
      resumptionDate,
      vacationDate,
      updatedAt: new Date().toISOString()
    };

    try {
      newSettings.gradingBands = validateGradingBands(bands);
      validateAcademicSettings(newSettings);
      savingRef.current = true; setSaving(true);
      await updateAcademicSettings(newSettings);
      dirty.current = false;
    } catch (error) { setSaveError(`Settings not saved: ${error.message}`); return; }
    finally { savingRef.current = false; setSaving(false); }

    setSavedNotice(`✅ Academic Settings Synchronized! Global Session set to ${year} (${term}).`);
    setTimeout(() => setSavedNotice(''), 4500);

    onSaved?.();
    if (onClose && !inline) {
      onClose();
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

      <form onChange={() => { dirty.current = true; setSavedNotice(''); }} onSubmit={handleSave} style={{ border: '1px solid #cbd5e1', borderTop: 'none', padding: 20, borderRadius: '0 0 10px 10px', background: '#f8fafc' }}>
        {saveError && <p role="alert" style={{ color: '#b91c1c' }}>{saveError}</p>}
        {savedNotice && (
          <div style={{ background: '#dcfce7', border: '1px solid #166534', color: '#166534', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{savedNotice}</span>
          </div>
        )}

        {!gradingOnly && <>
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
              aria-label="Class weight"
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
              aria-label="Exam weight"
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

        </>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            🏆 Official Assessment Grading Scale
          </label>
          <select
            value={gradingSystem}
            disabled
            onChange={(e) => setGradingSystem(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12.5 }}
          >
            <option value="REMALJ 9-Point Proficiency Scale">REMALJ 9-Point Proficiency Scale (1–9)</option>


          </select>
        </div>

        <p>Saving installs the REMALJ 9-Point Proficiency Scale below. The backend must accept and apply these bands.</p>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>Minimum</th><th>Maximum</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>{bands.map((band,index)=><tr key={index}>{['min','max','grade','remarks'].map(field=><td key={field} style={{padding:4}}><input aria-label={`Band ${index+1} ${field}`} type={field==='remarks'?'text':'number'} value={band[field]} disabled={saving} onChange={event=>{dirty.current=true;setBands(current=>current.map((row,position)=>position===index?{...row,[field]:event.target.value}:row));}} style={{width:'100%',minWidth:field==='remarks'?140:50,padding:8,boxSizing:'border-box'}} /></td>)}</tr>)}</tbody></table>
        {!gradingOnly && <>
        <p>Institution and campus names are shown for reference. They are not saved by academic settings.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
              🏫 Institution Name
            </label>
            <input
              type="text"
              readOnly
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
              readOnly
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
              aria-label="Resumption date"
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
              aria-label="Vacation date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 12 }}
            />
          </div>
        </div>
        </>}

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
            disabled={saving}
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
    <ViewportModal
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720 }}>
        {content}
      </div>
    </ViewportModal>
  );
}
