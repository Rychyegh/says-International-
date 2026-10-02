import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let failed=true;
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const core=/\/students$|\/admissions\/applications$|\/staff$/.test(path);
  if(core) await new Promise(resolve=>setTimeout(resolve,300));
  await route.fulfill({status:core&&failed?403:200,contentType:'application/json',body:JSON.stringify(core&&failed?{detail:'Session verification required'}:[])});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await page.waitForFunction(()=>window.testStore?.resourceStatus?.studentsRes==='error');
 assert.match(await page.evaluate(()=>window.testStore.syncErrors.studentsRes),/HTTP 403: Session verification required/);
 failed=false;
 await page.waitForFunction(()=>window.testStore?.isRefreshingBackend===false);
 await page.evaluate(()=>window.testStore.refreshBackendData());
 await page.waitForFunction(()=>window.testStore?.resourceStatus?.studentsRes==='ready');
 assert.equal(await page.evaluate(()=>window.testStore.syncErrors.studentsRes),undefined);
 console.log('PASS: denied core reads expose status and detail; successful retry clears errors.');
} finally { await browser.close(); }
