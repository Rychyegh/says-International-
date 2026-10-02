import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
try {
 const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.endsWith('/users') ? [{ id: '11111111-1111-4111-8111-111111111111', full_name: 'Test Person', email: 'person@example.org', role: 'teacher', status: 'Active' }] : []) }));
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=uac');
 await page.getByText('Test Person', { exact: true }).waitFor();
 async function checkModal() {
   const dialog = page.locator('.viewport-modal'); await dialog.waitFor();
   const box = await dialog.evaluate(el => { const card = el.firstElementChild.getBoundingClientRect(); return { parent: el.parentElement.tagName, top: card.top, bottom: card.bottom, height: innerHeight, overflow: document.body.style.overflow }; });
   assert.equal(box.parent, 'BODY'); assert.equal(box.top, 20); assert.ok(box.bottom <= box.height - 19); assert.equal(box.overflow, 'hidden');
 }
 for (const title of ['Edit Role & Details', 'Set / Reset User Password']) {
   await page.getByTitle(title).click(); await checkModal();
   await page.locator('.viewport-modal > div').first().click({ position: { x: 8, y: 8 } });
   assert.equal(await page.locator('.viewport-modal').count(), 1, 'clicking the dialog must keep it open');
   await page.locator('.viewport-modal').click({ position: { x: 2, y: 2 } });
   await page.locator('.viewport-modal').waitFor({ state: 'detached' });
   assert.equal(await page.evaluate(() => document.body.style.overflow), '');
 }
 await page.getByRole('button', { name: 'Create New User', exact: false }).click(); await checkModal();
 await page.locator('.viewport-modal').click({ position: { x: 2, y: 2 } });
 await page.locator('.viewport-modal').waitFor({ state: 'detached' });
 await page.setViewportSize({ width: 390, height: 600 });
 await page.evaluate(() => window.scrollTo(0, 900));
 // Programmatic activation keeps the scrolled position, exercising offscreen triggers.
 await page.getByTitle('Edit Role & Details').evaluate(el => el.click()); await checkModal();
 await page.locator('.viewport-modal').click({ position: { x: 2, y: 2 } });
 await page.locator('.viewport-modal').waitFor({ state: 'detached' });
 assert.deepEqual(errors, []);
 console.log('PASS: UAC create, edit and reset dialogs escape transformed long pages, open at top, fit mobile viewport restore page scrolling, close on outside clicks and remain open on inside clicks.');
} finally { await browser.close(); }
