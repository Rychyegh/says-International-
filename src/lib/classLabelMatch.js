// Ignore presentation spacing, while preserving level numbers and section letters.
export function classLabelMatches(assigned, target) {
  const clean = value => String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  const left = clean(assigned), right = clean(target);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.startsWith(right) && !/\d/.test(left.slice(right.length))) return true;
  if (right.startsWith(left) && !/\d/.test(right.slice(left.length))) return true;
  return false;
}
