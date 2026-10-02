// Read-only deployment check. No credentials or school-record requests.
const site = 'https://remaljcarewellinspirational.vercel.app';
const api = 'https://rcis-backend.onrender.com/api/v1';
let failures = 0;
const check = (label, passed) => { console.log(`${passed ? 'PASS' : 'BLOCKED'}: ${label}`); if (!passed) failures++; };
async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}
try {
  const html = await read(site);
  const paths = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
  if (!paths.length) throw new Error('No deployed JavaScript entry was found.');
  console.log(`Deployed assets: ${paths.join(', ')}`);
  const bundle = (await Promise.all(paths.map(path => read(new URL(path, site))))).join('\n');
  check('server PIN verification present in deployed bundle', bundle.includes('/auth/verify-admin-pin'));
  check('verified-session check present in deployed bundle', bundle.includes('/auth/me') && bundle.includes('Checking your database session'));
  check('original-key retry recovery present in deployed bundle', bundle.includes('Retry original request with same key'));
  const schema = JSON.parse(await read(`${api}/openapi.json`));
  for (const path of ['/auth/me', '/auth/verify-admin-pin', '/auth/admin-pin', '/timetables/workspace', '/timetables/workspace/publish', '/timetables/published']) {
    check(`live API advertises ${path}`, Boolean(schema.paths?.[`/api/v1${path}`]));
  }
  console.log('This check does not prove real-account authorization, database writes, or replay integrity. Verify those in staging with approved accounts.');
} catch (error) { failures++; console.error(`BLOCKED: ${error.message}`); }
process.exitCode = failures ? 1 : 0;
