import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
try {
 for (const pending of [false, true]) {
  const page = await browser.newPage(); let passcodeCalls = 0;
  const user = { id: 'teacher-uuid', email: 'class@example.org', role: 'teacher', teacher_designation: 'class_teacher', class_assigned: 'Basic 7A', full_name: 'Class Teacher' };
  await page.route('**/api/**', route => {
   const path = new URL(route.request().url()).pathname;
   if (/verify-class-teacher|class-teacher-login/.test(path)) passcodeCalls++;
   const body = path.endsWith('/auth/login') ? { token: 'eyJ-teacher-session', user, requiresSecondFactor: pending } : path.endsWith('/auth/me') ? { user, requiresSecondFactor: pending } : [];
   return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('http://127.0.0.1:5179/#/teacher');
  await page.locator('#teacher-email').fill(user.email);
  await page.locator('#teacher-password').fill('test-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  if (pending) await page.getByText('The backend still requires additional verification', { exact: false }).waitFor();
  else await page.getByRole('button', { name: 'Sign Out', exact: true }).waitFor();
  assert.equal(await page.locator('#class-teacher-passcode').count(), 0);
  assert.equal(passcodeCalls, 0);
  await page.close();
 }
 console.log('PASS: verified class teachers enter directly; provisional sessions show backend policy error without passcode screen or verification calls.');
} finally { await browser.close(); }
