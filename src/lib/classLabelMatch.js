// One display/identity spelling shared by roster, score entry and reports.
export function canonicalSchoolClass(value) {
  const raw=String(value || '').trim().replace(/\s+/g,' ');
  const match=raw.match(/^(kg|kindergarten|nursery|basic|j\.?h\.?s\.?|shs)\s*(\d+)(.*)$/i);
  if (!match) return raw;
  const prefix=match[1].toLowerCase().replace(/\./g,'');
  const number=prefix==='jhs'?Number(match[2])+6:match[2];
  const names={kg:'Kindergarten',kindergarten:'Kindergarten',nursery:'Nursery',basic:'Basic',jhs:'Basic',shs:'SHS'};
  return `${names[prefix]} ${number}${match[3].replace(/^\s*([a-z])(?=$|\s*[-–])/i,(_,letter)=>letter.toUpperCase())}`;
}

// Ignore presentation spacing, while preserving level numbers and section letters.
export function classLabelMatches(assigned, target) {
  const clean = value => canonicalSchoolClass(value).toLowerCase().replace(/\s+/g, '');
  const left = clean(assigned), right = clean(target);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.startsWith(right) && !/\d/.test(left.slice(right.length))) return true;
  if (right.startsWith(left) && !/\d/.test(right.slice(left.length))) return true;
  return false;
}
