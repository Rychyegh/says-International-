export function approvedResults(results = []) {
  return results.filter(result => ['approved', 'published'].includes(String(result.status || '').trim().toLowerCase()));
}
