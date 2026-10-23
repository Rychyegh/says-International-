export const SCHOOL_GRADING_BANDS = [
  { min: 80, max: 100, grade: '1', remarks: 'Highly Proficient' },
  { min: 75, max: 79, grade: '2', remarks: 'Proficient' },
  { min: 65, max: 74, grade: '3', remarks: 'Approaching Proficient' },
  { min: 60, max: 64, grade: '4', remarks: 'Developing' },
  { min: 55, max: 59, grade: '5', remarks: 'Emerging' },
  { min: 50, max: 54, grade: '6', remarks: 'Average' },
  { min: 40, max: 49, grade: '7', remarks: 'Pass' },
  { min: 36, max: 39, grade: '8', remarks: 'Weak' },
  { min: 0, max: 35, grade: '9', remarks: 'Fail' },
];
let activeBands = SCHOOL_GRADING_BANDS;
export function validateGradingBands(bands) {
  if (!Array.isArray(bands) || bands.length !== 9) throw new Error('Enter all nine grading bands.');
  const ordered = [...bands].sort((left, right) => Number(left.min) - Number(right.min));
  const grades = new Set();
  ordered.forEach((band,index) => {
    if (![band.min,band.max].every(value => value !== '' && Number.isInteger(Number(value))) || Number(band.min) < 0 || Number(band.max) > 100 || Number(band.min) > Number(band.max) || !/^[1-9]$/.test(String(band.grade)) || !String(band.remarks || '').trim()) throw new Error('Use whole-number ranges from 0 to 100, grades 1–9 and nonempty remarks.');
    if (Number(band.min) !== (index ? Number(ordered[index-1].max)+1 : 0)) throw new Error('Mark ranges must cover 0–100 without gaps or overlaps.');
    grades.add(String(band.grade));
  });
  if (Number(ordered.at(-1).max) !== 100 || grades.size !== 9) throw new Error('Cover all marks through 100 and use each grade 1–9 once.');
  return [...bands].map(band=>({...band,min:Number(band.min),max:Number(band.max),grade:String(band.grade),remarks:band.remarks.trim()})).sort((left,right)=>right.min-left.min);
}
export function configureGradingBands(bands) {
  try { activeBands = validateGradingBands(bands); } catch { activeBands = SCHOOL_GRADING_BANDS; }
}
export function proficiencyRemark(score) {
  if (score === null || score === undefined || score === '') return 'N/A';
  const value = Number(score);
  if (!Number.isFinite(value) || value < 0 || value > 100) return 'N/A';
  return activeBands.find(band => value >= band.min)?.remarks || 'N/A';
}
export function proficiencyGrade(score) {
  if (score === null || score === undefined || score === '') return 'N/A';
  const value = Number(score);
  if (!Number.isFinite(value) || value < 0 || value > 100) return 'N/A';
  return activeBands.find(band => value >= band.min)?.grade || 'N/A';
}
