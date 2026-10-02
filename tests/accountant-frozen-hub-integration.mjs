import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage();
 await page.route('**/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(()=>localStorage.setItem('says_accountant_active_nav','SIMS Financial Hub & Tools'));
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts');
 const hub=page.getByRole('button',{name:/SIMS Financial Hub & Tools/});
 await hub.waitFor();assert.equal(await hub.isDisabled(),true);
 assert.match(await hub.evaluate(el=>getComputedStyle(el).filter),/blur/);
 await page.getByRole('heading',{name:'Financial Dashboard',exact:false}).waitFor();
 for(const nav of ['SIMS Financial Hub & Tools','SIMS Auth & Login Terminal','SIMS v2025 Module','Post Academic Bill Header']) {
  await page.evaluate(nav=>window.dispatchEvent(new CustomEvent('says_navigate',{detail:{portal:'accountant',nav}})),nav);
  assert.equal(await page.evaluate(()=>localStorage.getItem('says_accountant_active_nav')),'Financial Overview');
 }
 await page.getByRole('button',{name:'Fee Ledgers & Payments',exact:false}).click();
 await page.locator('.sidebar-item.active').filter({hasText:'Fee Ledgers & Payments'}).waitFor();
 console.log('PASS: hub is blurred and disabled, restored hub falls back to dashboard, navigation aliases cannot reopen it, normal ledger navigation works.');
} finally {await browser.close();}
