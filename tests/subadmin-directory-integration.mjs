// All requests intercepted: no production accounts or records used.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
try {
  const page = await browser.newPage();
  const requests = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    let body = [], status = 200, headers = {};
    if (path.endsWith('/students')) body = { students: [{ id: '11111111-1111-4111-8111-111111111111', full_name: 'Directory Student', status: 'Active', is_active: true }], total: 1 };
    if (path.endsWith('/admissions/applications')) { body = [{ id: '22222222-2222-4222-8222-222222222222', learner_name: 'Application Student' }]; headers['X-Total-Count'] = '125'; headers['Access-Control-Expose-Headers'] = 'X-Total-Count'; }
    if (path.endsWith('/staff')) body = [{ id: '33333333-3333-4333-8333-333333333333', full_name: 'Directory Teacher', designation: 'Teacher', is_active: true }];
    if (path.endsWith('/fees')) { status = 403; body = { detail: 'Finance not allowed' }; }
    await route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('http://127.0.0.1:5179/tests/store-harness.html');
  await page.evaluate(() => window.mountStore('sub_admin', true));
  await page.waitForFunction(() => window.testStore?.resourceStatus?.staffRes === 'ready' && !window.testStore.isRefreshingBackend);
  const state = await page.evaluate(() => ({ students: window.testStore.onboardedStudents, apps: window.testStore.applications, total: window.testStore.applicationsTotal, staff: window.testStore.teacherDirectory, errors: window.testStore.syncErrors }));
  assert.equal(state.students.length, 1);
  assert.equal(state.apps.length, 1);
  assert.equal(state.total, 125);
  assert.equal(state.staff.length, 1);
  assert.match(state.errors.feesRes, /Finance not allowed/);
  assert.equal(requests.some(path => /\/(users|auth\/class-teachers)\/?$/.test(path)), false);
  console.log('PASS: Sub-Admin uses safe staff directory; unrelated rejection preserves directories and server application total.');
} finally { await browser.close(); }
