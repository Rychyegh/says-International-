import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePortalData, scoreSheetEntryKey } from '../../data/PortalStore';
import { getUserFullName } from '../../services/api';
import { getMappedSubClasses, isLegacySectionLabel, normalizeSubClass } from '../../data/classStructure';

// Each of the four class tests is marked over 100, so the class test total is out of 400
const CLASS_TEST_MAX = 100;
const CLASS_TEST_COUNT = 4;
const CLASS_TEST_TOTAL_MAX = CLASS_TEST_MAX * CLASS_TEST_COUNT;

const STANDARD_SUB_CLASSES = [];

function detectStudentClassAndSub(student) {
  if (!student) return { classLevel: 'Basic 1', subClassLevel: 'Basic 1A' };
  let level = (student.level || student.classLevel || student.class || '').trim();
  let sub = (student.classSection || student.subClass || student.stream || student.section || '').trim();

  // If level contains e.g. "Basic 1A" or "JHS 3A"
  const match = level.match(/^(Creche|Nursery \d|Kindergarten \d|KG \d|Basic \d|JHS \d)\s*([A-Z0-9]+)$/i);
  if (match) {
    level = match[1];
    if (!sub) sub = `${match[1]} ${match[2]}`.trim();
  }

  // Normalize JHS to Basic
  if (level.toUpperCase() === 'JHS 1') level = 'Basic 7';
  if (level.toUpperCase() === 'JHS 2') level = 'Basic 8';
  if (level.toUpperCase() === 'JHS 3') level = 'Basic 9';

  if (!level) level = 'Basic 1';
  if (!sub) {
    const mapped = getMappedSubClasses(level);
    sub = (mapped && mapped.length > 0) ? mapped[0] : `${level}A`;
  }
  return { classLevel: level, subClassLevel: sub };
}

function compactLabel(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function canonicalClassLevel(value) {
  const lower = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (lower === 'kg 1' || lower === 'kindergarten 1') return 'kg 1';
  if (lower === 'kg 2' || lower === 'kindergarten 2') return 'kg 2';
  if (lower === 'jhs 1') return 'basic 7';
  if (lower === 'jhs 2') return 'basic 8';
  if (lower === 'jhs 3') return 'basic 9';
  return lower;
}

function splitEmbeddedClass(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(Creche|Nursery \d|Kindergarten \d|KG \d|Basic \d|JHS \d)\s*([A-Z])$/i);
  if (!match) return { level: raw, section: '' };
  return { level: match[1], section: match[2] };
}

function subclassKey(classLevel, section) {
  const raw = String(section || '').trim();
  if (!raw) return '';
  const squeezed = raw.replace(/\s+([A-Za-z])$/g, '$1');
  const mapped = getMappedSubClasses(classLevel);
  const exact = mapped.find((item) => compactLabel(item) === compactLabel(squeezed) || compactLabel(item) === compactLabel(raw));
  if (exact) return compactLabel(exact);
  if (/^[ab]$/i.test(raw) || isLegacySectionLabel(raw)) return compactLabel(normalizeSubClass(classLevel, raw));
  return compactLabel(squeezed);
}

function studentMatchesSelectedClass(student, classLevel, subClassLevel) {
  const rawLevel = String(student?.level || student?.classLevel || student?.class || '').trim();
  const rawSection = String(student?.classSection || student?.subClass || student?.stream || student?.section || '').trim();
  if (!rawLevel && !rawSection) return false;

  const levelSource = splitEmbeddedClass(rawLevel);
  const sectionSource = levelSource.section ? levelSource : splitEmbeddedClass(rawSection);
  const level = levelSource.level || sectionSource.level;
  const section = rawSection || levelSource.section;
  if (!level || canonicalClassLevel(level) !== canonicalClassLevel(classLevel)) return false;
  if (!subClassLevel) return true;
  return subclassKey(classLevel, section || level) === subclassKey(classLevel, subClassLevel);
}

function persistStudentScores(saveScoreSheetEntry, payload) {
  if (typeof saveScoreSheetEntry !== 'function') return;
  return saveScoreSheetEntry(payload);
}

export default function ScoreSheetEntryForm({ setM, students: propStudents, onViewTestRoll, initialTarget }) {
  const { academicSettings, onboardedStudents, saveScoreSheetEntry, results, subjects = [], classLevels = [] } = usePortalData();
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const hydratedKey = useRef('');
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const students = Array.isArray(propStudents) ? propStudents : (onboardedStudents || []);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState('AZ'); // 'AZ' | 'ZA' | 'Class'

  const initialStudent = students[0] || { fullName: '', studentId: '' };
  const initialDetected = detectStudentClassAndSub(initialStudent);

  const [selectedStudent, setSelectedStudent] = useState(initialStudent);
  const [cls, setCls] = useState(initialDetected.classLevel || 'Basic 1');
  const [subClass, setSubClass] = useState(normalizeSubClass(initialDetected.classLevel || 'Basic 1', initialDetected.subClassLevel || 'A'));
  const [customSubClasses, setCustomSubClasses] = useState([]);

  // Sync when initialTarget is passed (e.g. from Grades view "Edit in Score Sheet")
  useEffect(() => {
    if (!initialTarget) return;
    if (initialTarget.classLevel) setCls(initialTarget.classLevel);
    if (initialTarget.subClass) setSubClass(initialTarget.subClass);
    if (initialTarget.subject) setSubject(initialTarget.subject);
    if (initialTarget.studentId || initialTarget.studentName) {
      const matches = students.filter(s => initialTarget.studentId
        ? [s.studentId, s.id].filter(Boolean).some(id => String(id) === String(initialTarget.studentId))
        : initialTarget.studentName && (s.fullName === initialTarget.studentName || s.name === initialTarget.studentName));
      setSelectedStudent(matches.length === 1 ? matches[0] : { fullName: '', studentId: '' });
    }
  }, [initialTarget, students]);

  const [year, setYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [term, setTerm] = useState(academicSettings?.academicTerm || 'Term 3');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('Core');
  const [instructor, setInstructor] = useState(getUserFullName() || '');
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));

  const [arrivalTest, setArrivalTest] = useState(0);
  const [test1, setTest1] = useState(0);
  const [test2, setTest2] = useState(0);
  const [test3, setTest3] = useState(0);
  const [examsScore, setExamsScore] = useState(0);
  const [applyGrade, setApplyGrade] = useState(true);
  const [teacherNote, setTeacherNote] = useState('');
  const [savedAt, setSavedAt] = useState('');

  const availableSubClasses = useMemo(() => {
    const list = [];
    const add = (val) => {
      const v = normalizeSubClass(cls, (val || '').trim());
      if (v && !list.includes(v)) list.push(v);
    };

    // 1. Mapped subclasses for the chosen class (e.g. Basic 1A, Basic 1B)
    const mapped = getMappedSubClasses(cls);
    (mapped || []).forEach(add);

    // 2. Current subClass and custom subclasses
    if (subClass) add(subClass);
    customSubClasses.forEach(add);

    // 3. Student's specific subclass if defined
    const stuSub = selectedStudent?.classSection || selectedStudent?.subClass || selectedStudent?.stream || selectedStudent?.section;
    if (stuSub) add(stuSub);

    return list;
  }, [cls, subClass, customSubClasses, selectedStudent]);

  const handleClassChange = (newCls) => {
    setCls(newCls);
    // Smoothly convert subclass if it matched old class prefix (e.g. Basic 1A -> Basic 2A)
    const oldClean = cls.replace(/\s+/g, '').toLowerCase();
    const subClean = subClass.replace(/\s+/g, '').toLowerCase();
    if (subClean.startsWith(oldClean)) {
      const suffix = subClean.slice(oldClean.length).toUpperCase() || 'A';
      setSubClass(`${newCls}${suffix.length === 1 ? suffix : ` ${suffix}`}`);
    } else {
      const isGeneral = STANDARD_SUB_CLASSES.some(s => s.toLowerCase() === subClass.toLowerCase());
      if (!isGeneral) {
        const mapped = getMappedSubClasses(newCls);
        setSubClass((mapped && mapped[0]) || `${newCls}A`);
      }
    }
  };

  const filteredStudents = useMemo(() => {
    let list = (students || []).filter((student) => studentMatchesSelectedClass(student, cls, subClass));
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.studentId || s.id || '').toLowerCase().includes(q) ||
        (s.level || '').toLowerCase().includes(q) ||
        (s.classSection || s.subClass || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (studentSort === 'ZA') return (b.fullName || b.name || '').localeCompare(a.fullName || a.name || '');
      if (studentSort === 'Class') return (a.level || '').localeCompare(b.level || '') || (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
      return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
    });
    return list;
  }, [students, cls, subClass, studentSearch, studentSort]);

  useEffect(() => {
    const currentKey = selectedStudent?.studentId || selectedStudent?.id || '';
    const stillVisible = filteredStudents.some((student) => (student.studentId || student.id) === currentKey);
    if (stillVisible) return;
    if (filteredStudents[0]) {
      setSelectedStudent(filteredStudents[0]);
      return;
    }
    if (currentKey) setSelectedStudent({ fullName: '', name: '', studentId: '' });
  }, [filteredStudents, selectedStudent]);

  const studentKey = selectedStudent.id || selectedStudent.studentId;

  // Reopen a previously saved sheet for this student / subject / term / year so it can be edited
  const savedEntry = useMemo(() => {
    const key = scoreSheetEntryKey({ studentId: studentKey, studentName: selectedStudent.fullName, subject, term, year });
    return (results || []).find(r => scoreSheetEntryKey({ ...r, studentId: [selectedStudent.id, selectedStudent.studentId].includes(r.studentId) ? studentKey : r.studentId }) === key) || null;
  }, [results, studentKey, selectedStudent.fullName, subject, term, year]);

  useEffect(() => {
    const key = [studentKey, subject, term, year].join(':');
    const changedStudentOrPeriod = hydratedKey.current !== key;
    if (dirty.current && hydratedKey.current === key) return;
    hydratedKey.current = key;
    dirty.current = false;
    setArrivalTest(savedEntry ? savedEntry.arrivalTest ?? '' : 0);
    setTest1(savedEntry ? savedEntry.test1 ?? '' : 0);
    setTest2(savedEntry ? savedEntry.test2 ?? '' : 0);
    setTest3(savedEntry ? savedEntry.test3 ?? '' : 0);
    setExamsScore(savedEntry?.hasExamScore || savedEntry?.examSubmitted ? (savedEntry?.rawExamScore ?? savedEntry?.examScore ?? 0) : 0);
    setTeacherNote(savedEntry?.teacherNote ?? '');
    setSavedAt(savedEntry?.updatedAt || '');
    if (changedStudentOrPeriod) { setSaveNotice(''); setSaveError(''); }
  }, [savedEntry, studentKey, subject, term, year]);

  const clampTest = value => value === '' ? '' : Number(value);
  const totalTest = [arrivalTest, test1, test2, test3].reduce((sum, value) => sum + (Number(value) || 0), 0);
  const classWeight = Number(academicSettings?.classTestWeight ?? 50);
  const examWeight = Number(academicSettings?.examWeight ?? 50);
  const test50 = Number((totalTest / CLASS_TEST_TOTAL_MAX * classWeight).toFixed(2));
  const exams50 = Number((Number(examsScore || 0) / 100 * examWeight).toFixed(2));
  const totalScore = test50 + exams50;
  const grade = savedEntry?.hasExamScore && !dirty.current ? savedEntry.grade || '' : '';
  const remarks = savedEntry?.hasExamScore && !dirty.current ? savedEntry.remarks || '' : 'Grade is available after a complete score is saved.';

  const buildEntry = (submitKind) => {
    const submittingExam = submitKind === 'exam';
    const keepExam = Boolean(savedEntry?.hasExamScore || savedEntry?.examSubmitted);
    const examRaw = submittingExam ? (Number(examsScore) || 0) : (keepExam ? (savedEntry.rawExamScore ?? savedEntry.examScore) : null);
    const examConverted = submittingExam ? exams50 : (keepExam ? savedEntry.examScoreConverted : null);
    return {
      submitKind,
      studentId: selectedStudent.id || selectedStudent.studentId,
      studentName: selectedStudent.fullName || selectedStudent.name,
      classLevel: cls,
      subClass,
      subClassLevel: subClass,
      classSection: subClass,
      subject,
      category,
      examDate,
      arrivalTest: clampTest(arrivalTest),
      test1: clampTest(test1),
      test2: clampTest(test2),
      test3: clampTest(test3),
      classTestMax: CLASS_TEST_MAX,
      classTestTotalMax: CLASS_TEST_TOTAL_MAX,
      classTestTotal: totalTest,
      classScore: totalTest / CLASS_TEST_TOTAL_MAX * 100,
      examScore: examRaw,
      examScoreMax: 100,
      examScoreConverted: examConverted,

      teacherNote,
      term,
      year,
      instructor,
      hasClassScore: true,
      hasExamScore: submittingExam || keepExam,
    };
  };

  const saveScores = async (kind) => {
    if (saving) return;
    if (!studentKey) { setSaveError('Select a student before saving.'); return; }
    if ([arrivalTest, test1, test2, test3].some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > CLASS_TEST_MAX)) { setSaveError('Enter all four class tests, each between 0 and 100.'); return; }
    if (kind === 'exam' && (examsScore === '' || !Number.isFinite(Number(examsScore)) || Number(examsScore) < 0 || Number(examsScore) > 100)) { setSaveError('Enter an exam mark between 0 and 100. Zero is a valid submitted score.'); return; }
    setSaving(true); setSaveError(''); setSaveNotice('');
    try {
      await persistStudentScores(saveScoreSheetEntry, buildEntry(kind));
      dirty.current = false;
      setSavedAt(new Date().toLocaleString());
      setSaveNotice(kind === 'exam' ? 'Exam score saved to the database for approval.' : 'Class scores saved to the database.');
    } catch (error) { setSaveError(error.message || 'Scores could not be saved. Your inputs remain available to retry.'); }
    finally { setSaving(false); }
  };
  const saveClassScores = () => saveScores('class');
  const submitExamForApproval = () => saveScores('exam');

  return (
    <div onChange={() => { dirty.current = true; setSaveNotice(''); setSavedAt(''); }} style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12, boxSizing: 'border-box', overflowX: 'hidden', width: '100%' }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '8px 14px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Score Sheet [Entry] 📝 <span style={{ fontSize: 11.5, opacity: 0.9, fontWeight: 700, marginLeft: 8 }}>({cls} · {subClass})</span></span>
        <span>REMALJ Carewell Inspirational School</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px', boxSizing: 'border-box' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Class</label>
            <select value={cls} onChange={(e) => handleClassChange(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Creche</option><option>Nursery 1</option><option>Nursery 2</option><option>KG 1</option><option>KG 2</option><option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Basic 6</option><option>Basic 7</option><option>Basic 8</option><option>Basic 9</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Sub class level</label>
            <select
              value={subClass}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__ADD_NEW__') {
                  const custom = window.prompt(`Enter new custom Sub-Class for ${cls} (e.g. ${cls}A, ${cls}B):`);
                  if (custom && custom.trim()) {
                    const clean = custom.trim();
                    setCustomSubClasses(prev => [...prev, clean]);
                    setSubClass(clean);
                  }
                } else {
                  setSubClass(val);
                }
              }}
              style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 600, color: '#0f3a4b' }}
            >
              {availableSubClasses.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
              <option value="__ADD_NEW__">➕ Add Custom Sub-Class...</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              {Array.from(new Set([academicSettings?.academicYear, year, ...(results || []).map(r => r.year)].filter(Boolean))).map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              {Array.from(new Set([academicSettings?.academicTerm, term, ...(results || []).map(r => r.term)].filter(Boolean))).map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Subject title</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              {Array.from(new Set([subject, ...subjects].filter(Boolean))).map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Instructor</label>
            <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>

          {/* Student Photo Preview Box */}
          <div style={{ width: 110, height: 120, margin: '10px auto', border: '1px dashed #94a3b8', background: '#f8fafc', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {selectedStudent.photo || selectedStudent.passportPhoto ? (
              <img src={selectedStudent.photo || selectedStudent.passportPhoto} alt={selectedStudent.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 10, padding: 4 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#cbd5e1', margin: '0 auto 4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <span>Student Photo</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 90px 2.2fr 1.3fr', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>Enrollment ID</label>
              <input type="text" value={selectedStudent.studentId || selectedStudent.id || ''} readOnly style={{ width: '100%', padding: '5px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700, fontSize: 11.5 }} />
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>Index N/o.</label>
              <input type="text" value="IX-104" readOnly style={{ width: '100%', padding: '5px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>Student's Name</label>
                <select
                  value={studentSort}
                  onChange={(e) => setStudentSort(e.target.value)}
                  style={{ fontSize: 9.5, padding: '1px 3px', borderRadius: 3, border: '1px solid #cbd5e1', cursor: 'pointer', background: '#e0f2fe', fontWeight: 800, color: '#0369a1' }}
                >
                  <option value="AZ">Sort: A-Z</option>
                  <option value="ZA">Sort: Z-A</option>
                  <option value="Class">Sort: Class</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="🔍 Search name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ width: '100%', padding: '3px 6px', border: '1px solid #0f3a4b', borderRadius: 4, fontSize: 11, marginBottom: 4, background: '#f8fafc' }}
              />
              <select
                value={filteredStudents.some(student => String(student.studentId || student.id) === String(studentKey)) ? studentKey : ''}
                onChange={(e) => {
                  const s = filteredStudents.find(x => String(x.studentId || x.id) === e.target.value);
                  if (s) setSelectedStudent(s);
                }}
                style={{ width: '100%', minWidth: 220, padding: '5px 8px', border: '1px solid #0f3a4b', borderRadius: 4, fontWeight: 800, fontSize: 12, background: '#ffffff', color: '#0f3a4b' }}
              >
                {filteredStudents.length === 0 && <option value="">No students in {cls} · {subClass}</option>}
                {filteredStudents.map(s => {
                  const subTag = s.classSection || s.subClass ? ` · ${s.classSection || s.subClass}` : (s.level ? ` · ${s.level}` : '');
                  return (
                    <option key={s.id || s.studentId} value={s.studentId || s.id}>
                      {s.fullName || s.name} ({s.studentId || s.id}){subTag}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2, whiteSpace: 'nowrap' }}>Date Exams taken</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', border: '1px solid #0f3a4b', borderRadius: 4, fontWeight: 700, fontSize: 12, background: '#ffffff', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b' }}>Class tests (each / {CLASS_TEST_MAX})</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: 99 }}>Total / {CLASS_TEST_TOTAL_MAX}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Arrival test (/100):</span>
                <input type="number" min={0} max={CLASS_TEST_MAX} value={arrivalTest} onChange={(e) => setArrivalTest(clampTest(e.target.value))} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 1 (/100):</span>
                <input type="number" min={0} max={CLASS_TEST_MAX} value={test1} onChange={(e) => setTest1(clampTest(e.target.value))} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 2 (/100):</span>
                <input type="number" min={0} max={CLASS_TEST_MAX} value={test2} onChange={(e) => setTest2(clampTest(e.target.value))} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 3 (/100):</span>
                <input type="number" min={0} max={CLASS_TEST_MAX} value={test3} onChange={(e) => setTest3(clampTest(e.target.value))} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontWeight: 700, background: '#fef3c7', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Total Class test (/400):</span>
                <span>{totalTest} / {CLASS_TEST_TOTAL_MAX}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Class contribution preview ({classWeight}%):</span>
                <span>{test50} / {classWeight}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>Exams score</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11 }}>Exams score (100):</span>
                <input type="number" min={0} max={100} value={examsScore} onChange={(e) => setExamsScore(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: 80, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '6px 8px', borderRadius: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 11 }}>Exam contribution preview ({examWeight}%):</span>
                <span>{exams50} / {examWeight}</span>
              </div>

              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 4 }}>Scores summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, background: '#fed7aa', padding: '8px 10px', borderRadius: 4, fontSize: 13, color: '#9a3412' }}>
                <span>Unsaved total preview:</span>
                <span>{totalScore} / 100</span>
              </div>
            </div>
          </div>

          {savedEntry && <p role="status">Last database result: {savedEntry.hasExamScore ? `${savedEntry.score ?? 'Not available'} / 100 · Grade ${savedEntry.grade || 'Not available'}` : 'Class score recorded · Exam not submitted'} ({savedEntry.status})</p>}
          <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Grading</span>
              <label style={{ fontSize: 11, fontWeight: 600, marginLeft: 10 }}>
                <input type="checkbox" checked={applyGrade} onChange={(e) => setApplyGrade(e.target.checked)} /> Apply grade marks?
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12, alignItems: 'start' }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700 }}>Grade</label>
                <input type="text" value={applyGrade ? grade : ''} readOnly style={{ width: '100%', padding: 6, background: '#fed7aa', border: '1px solid #fdba74', borderRadius: 4, fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700 }}>Remarks</label>
                <input type="text" value={applyGrade ? remarks : ''} readOnly style={{ width: '100%', padding: 6, background: '#fed7aa', border: '1px solid #fdba74', borderRadius: 4, fontWeight: 800 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  disabled={saving || !studentKey}
                  onClick={(e) => {
                    e.preventDefault();
                    saveClassScores();
                  }}
                  style={{ padding: '6px 12px', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: 4, fontWeight: 800, color: '#166534', cursor: 'pointer' }}
                >
                  Save class scores
                </button>
                {/* Class scores skip Head Admin approval */}
                <button
                  type="button"
                  disabled={saving || !studentKey}
                  onClick={(e) => {
                    e.preventDefault();
                    submitExamForApproval();
                  }}
                  style={{ padding: '6px 12px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}
                >
                  Submit exam for approval
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onViewTestRoll === 'function') {
                      onViewTestRoll({
                        classLevel: cls,
                        subClass,
                        studentId: selectedStudent.studentId || selectedStudent.id,
                        studentName: selectedStudent.fullName || selectedStudent.name,
                        subject,
                        term,
                        year
                      });
                    } else {
                      alert(`Test Roll for ${cls} · ${subClass} (${subject}): ${selectedStudent.fullName || selectedStudent.name} - Score ${totalScore}% (Grade ${grade})`);
                    }
                  }}
                  title="View test roll and student grades for this class"
                  style={{ padding: '6px 12px', background: '#312e81', border: '1px solid #4338ca', borderRadius: 4, fontWeight: 800, color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  📊 View Test Roll
                </button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>Teacher comment / note (editable per student)</label>
              <textarea
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Write a comment on this student's performance, effort, or areas to improve..."
                rows={3}
                style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {saveNotice ? (
                <div style={{ marginTop: 6, fontSize: 11, color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '6px 8px', borderRadius: 4 }}>
                  {saveNotice}
                </div>
              ) : null}
              {saveError ? (
                <div style={{ marginTop: 6, fontSize: 11, color: '#b91c1c', fontWeight: 700, background: '#fee2e2', padding: '6px 8px', borderRadius: 4 }}>
                  {saveError}
                </div>
              ) : null}
              {savedAt ? (
                <div style={{ marginTop: 4, fontSize: 10, color: '#166534', fontWeight: 700 }}>
                  Last saved {savedAt}. Reopen this student, subject, term and year to edit. Class scores save immediately; exam scores wait for Head Admin approval.
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                const idx = filteredStudents.findIndex(s => String(s.studentId || s.id) === String(studentKey));
                if (idx >= 0 && idx < filteredStudents.length - 1) {
                  setSelectedStudent(filteredStudents[idx + 1]);
                }
              }}
              style={{ padding: '10px 24px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
            >
              Next &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
