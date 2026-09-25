import React, { useState, useMemo } from 'react';
import { usePortalData } from '../../data/PortalStore';

export default function ScoreSheetEntryForm({ setM, students: propStudents }) {
  const { academicSettings, onboardedStudents, saveScoreSheetEntry } = usePortalData();
  const students = (propStudents && propStudents.length > 0) ? propStudents : (onboardedStudents || []);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState('AZ'); // 'AZ' | 'ZA' | 'Class'
  const [selectedStudent, setSelectedStudent] = useState(students[0] || { fullName: 'NANA ADJOA ASARI SEREBOUR', studentId: '421270' });
  const [cls, setCls] = useState('Basic 1');
  const [year, setYear] = useState(academicSettings?.academicYear || '2025/2026');
  const [term, setTerm] = useState(academicSettings?.academicTerm || 'Term 3');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('Core');
  const [instructor, setInstructor] = useState('Mr. Ebenezer Arthur');
  const [examDate, setExamDate] = useState('2025-07-16');

  const [arrivalTest, setArrivalTest] = useState(0);
  const [test1, setTest1] = useState(15);
  const [test2, setTest2] = useState(18);
  const [test3, setTest3] = useState(17);
  const [classTestMaxBase, setClassTestMaxBase] = useState(100);
  const [examsScore, setExamsScore] = useState(84);
  const [applyGrade, setApplyGrade] = useState(true);

  const filteredStudents = useMemo(() => {
    let list = [...(students || [])];
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.studentId || s.id || '').toLowerCase().includes(q) ||
        (s.level || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (studentSort === 'ZA') return (b.fullName || b.name || '').localeCompare(a.fullName || a.name || '');
      if (studentSort === 'Class') return (a.level || '').localeCompare(b.level || '') || (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
      return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
    });
    return list;
  }, [students, studentSearch, studentSort]);

  const totalTest = Number(arrivalTest) + Number(test1) + Number(test2) + Number(test3);
  const maxTestBase = Number(classTestMaxBase) > 0 ? Number(classTestMaxBase) : 100;
  const test50 = Math.min(50, Math.round((totalTest / maxTestBase) * 50));
  const exams50 = Math.min(50, Math.round((Number(examsScore) / 100) * 50));
  const totalScore = test50 + exams50;

  const getGrade = (score) => {
    if (score >= 80) return { grade: '1', remarks: 'Highly Proficient' };
    if (score >= 75) return { grade: '2', remarks: 'Proficient' };
    if (score >= 65) return { grade: '3', remarks: 'Approaching Proficiency' };
    if (score >= 60) return { grade: '4', remarks: 'Developing' };
    if (score >= 55) return { grade: '5', remarks: 'Emerging' };
    if (score >= 50) return { grade: '6', remarks: 'Average' };
    if (score >= 40) return { grade: '7', remarks: 'Pass' };
    if (score >= 36) return { grade: '8', remarks: 'Weak' };
    return { grade: '9', remarks: 'Fail' };
  };
  const { grade, remarks } = getGrade(totalScore);

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12, boxSizing: 'border-box', overflowX: 'hidden', width: '100%' }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '8px 14px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Score Sheet [Entry]</span>
        <span>REMALJ Carewell Inspirational School</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px', boxSizing: 'border-box' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Creche</option><option>Nursery 1</option><option>Nursery 2</option><option>KG 1</option><option>KG 2</option><option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Basic 6</option><option>JHS 1</option><option>JHS 2</option><option>JHS 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
              <option value="2028/2029">2028/2029</option>
              <option value="2029/2030">2029/2030</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Subject title</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Mathematics</option><option>English Language</option><option>Integrated Science</option><option>Social Studies</option><option>RME</option><option>ICT / Computing</option><option>Creative Arts</option><option>OWOP</option>
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
              <input type="text" value={selectedStudent.studentId || 'ENR-4212'} readOnly style={{ width: '100%', padding: '5px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700, fontSize: 11.5 }} />
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
              <select value={selectedStudent.fullName} onChange={(e) => {
                const s = students.find(x => x.fullName === e.target.value);
                if (s) setSelectedStudent(s);
              }} style={{ width: '100%', minWidth: 220, padding: '5px 8px', border: '1px solid #0f3a4b', borderRadius: 4, fontWeight: 800, fontSize: 12, background: '#ffffff', color: '#0f3a4b' }}>
                {filteredStudents.map(s => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId || s.id})</option>)}
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
                <span style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b' }}>Class test (Max Base: {maxTestBase})</span>
                <select value={classTestMaxBase} onChange={(e) => setClassTestMaxBase(Number(e.target.value))} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, border: '1px solid #cbd5e1' }}>
                  <option value={100}>Max 100</option>
                  <option value={50}>Max 50</option>
                  <option value={60}>Max 60</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Arrival test:</span>
                <input type="number" value={arrivalTest} onChange={(e) => setArrivalTest(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 1:</span>
                <input type="number" value={test1} onChange={(e) => setTest1(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 2:</span>
                <input type="number" value={test2} onChange={(e) => setTest2(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 3:</span>
                <input type="number" value={test3} onChange={(e) => setTest3(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontWeight: 700, background: '#fef3c7', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Total Class test ({maxTestBase}):</span>
                <span>{totalTest}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Class test converted to 50%:</span>
                <span>{test50} / 50</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>Exams score</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11 }}>Exams score (100):</span>
                <input type="number" value={examsScore} onChange={(e) => setExamsScore(e.target.value)} style={{ width: 80, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '6px 8px', borderRadius: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 11 }}>Exams score converted to 50%:</span>
                <span>{exams50} / 50</span>
              </div>

              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 4 }}>Scores summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, background: '#fed7aa', padding: '8px 10px', borderRadius: 4, fontSize: 13, color: '#9a3412' }}>
                <span>Total score (100%):</span>
                <span>{totalScore} / 100</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Grading</span>
              <label style={{ fontSize: 11, fontWeight: 600, marginLeft: 10 }}>
                <input type="checkbox" checked={applyGrade} onChange={(e) => setApplyGrade(e.target.checked)} /> Apply grade marks?
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12, alignItems: 'center' }}>
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof saveScoreSheetEntry === 'function') {
                      saveScoreSheetEntry({
                        studentId: selectedStudent.studentId || selectedStudent.id,
                        studentName: selectedStudent.fullName,
                        classLevel: cls,
                        subject,
                        score: totalScore,
                        grade,
                        remarks,
                        term,
                        year,
                        instructor
                      });
                    }
                    alert(`✅ Score entry for ${selectedStudent.fullName} (${subject}) saved!\nTotal Score: ${totalScore}% | Grade: ${grade} (${remarks})`);
                  }}
                  style={{ padding: '6px 12px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}
                >
                  + Submit scores
                </button>
                <button type="button" onClick={() => alert(`Test Roll for ${cls} (${subject}): ${selectedStudent.fullName} - Score ${totalScore}% (Grade ${grade})`)} style={{ padding: '6px 12px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}>
                  View Test Roll
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => {
              const idx = students.findIndex(s => s.fullName === selectedStudent.fullName);
              if (idx < students.length - 1) setSelectedStudent(students[idx + 1]);
            }} style={{ padding: '10px 24px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
              Next &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
