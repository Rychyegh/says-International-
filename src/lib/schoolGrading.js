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
export function proficiencyRemark(score) {
  if (score === null || score === undefined || score === '') return 'N/A';
  const value = Number(score);
  if (!Number.isFinite(value) || value < 0 || value > 100) return 'N/A';
  return SCHOOL_GRADING_BANDS.find(band => value >= band.min)?.remarks || 'N/A';
}
