import { canonicalSchoolClass } from './classLabelMatch.js';
import { reportClass } from './terminalReportRecords.js';

const identity = row => [row.id,row.userId,row.user_id,row.staffId,row.staff_id,row.staff_code,row.email].filter(Boolean).map(value=>String(value).trim().toLowerCase());
function list(value) {
  if (Array.isArray(value)) return value.flatMap(list);
  if (value && typeof value==='object') return list(value.class_level || value.classAssigned || value.name);
  return String(value || '').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
}
const classValues = row => [row.classes,row.assigned_classes,row.assignedClasses,row.classAssigned,row.class_assigned,row.assigned_class,row.assignedClass,row.mainClass,row.main_class].flatMap(list);
export function teacherAssignedClasses({ user = {}, assignments = [], directory = [], primaryClass = '' }) {
  const userKeys = identity(user);
  const matches = row => identity(row).some(id=>userKeys.includes(id));
  const all = [primaryClass,...classValues(user),...assignments.filter(matches).flatMap(classValues),...directory.filter(matches).flatMap(classValues)];
  const unique = new Map();
  all.forEach(value=>{const cls=reportClass(value);const name=cls.section || cls.level;const key=name.replace(/\s+/g,'').toLowerCase();if(key)unique.set(key,name);});
  return [...unique.values()];
}
export function studentInAssignedClass(student, assigned) {
  const clean = value => canonicalSchoolClass(value).replace(/\s+/g,'').toLowerCase();
  const target=reportClass(assigned), actual=reportClass(student.level || student.classLevel || student.class);
  if (!target.level || clean(target.level)!==clean(actual.level)) return false;
  if (!target.section) return true;
  const section=student.subClass || student.subClassLevel || student.classSection || student.section || actual.section;
  const qualified = /^[a-z]$/i.test(String(section || '').trim()) ? `${actual.level}${String(section).trim()}` : section;
  return clean(qualified)===clean(target.section);
}
