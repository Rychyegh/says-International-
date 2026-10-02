import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
try {
 const page = await browser.newPage();
 let writes = 0;
 await page.route('**/api/**', route => {
  if (route.request().method() !== 'GET') writes++;
  const voucher = { id: '11111111-1111-4111-8111-111111111111', pv_number: 'PV-2026-202028', payee_name: 'Test Provider', amount: 1500, status: 'DISBURSED', disbursed_at: '2026-10-02T13:04:48Z' };
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify(route.request().url().includes('/finance/') ? [voucher] : []) });
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=pay-pv');
 await page.getByRole('button', { name: /History/ }).click();
 await page.getByRole('button', { name: 'Receipt', exact: true }).first().click();
 const overlay = page.locator('.pv-print-overlay'); await overlay.waitFor();
 await page.getByText('Official Payment Disbursement Receipt', { exact: true }).click();
 assert.equal(await overlay.count(), 1);
 await overlay.click({ position: { x: 3, y: 100 } });
 await overlay.waitFor({ state: 'detached' });
 assert.equal(writes, 0);
 console.log('PASS: actual PV disbursement receipt stays open on content clicks, closes on shaded-space click, and makes no writes.');
} finally { await browser.close(); }
