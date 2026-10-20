// All API responses are mocked; no production account or bus telemetry is used.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const page=await browser.newPage();page.setDefaultTimeout(15000);
let posts=0,reject=true;
await page.route('**/api/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname;let data=[],status=200;
 if(req.method()==='POST')posts++;
 if(path.endsWith('/reports/requests')&&req.method()==='POST') {status=reject?403:200;data=reject?{detail:'Request not permitted'}:{id:'saved-report',child:'Learner',semester:'Semester 1 · 2026',status:'Requested'};}
 if(path.endsWith('/students/me/dashboard'))data={stats:[],schedule:[],assignments:[],deadlines:[]};
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
try {
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=parent');
 await page.getByText('No children are linked to this account. Ask the school to confirm your parent access.',{exact:true}).waitFor();
 assert.equal(await page.getByText(/Benjamin|Route 14|96%/).count(),0);
 await page.getByRole('button',{name:'Reports',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Request result',exact:true}).isEnabled(),false);
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=reports');
 await page.getByRole('button',{name:'Request result',exact:true}).click();await page.getByRole('alert').filter({hasText:'Request not permitted'}).waitFor();
 assert.equal(await page.getByText(/request has been saved/).count(),0);
 reject=false;await page.getByRole('button',{name:'Request result',exact:true}).click();await page.getByText(/request has been saved/).waitFor();
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=transport');
 await page.getByText('No transport routes are available for this account.').waitFor();const before=posts;await page.waitForTimeout(5500);assert.equal(posts,before,'viewing transport must not manufacture telemetry');
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=student');await page.getByRole('button',{name:'My Dashboard',exact:true}).waitFor();assert.equal(await page.getByText(/Kwame Edwards|Senior High II/).count(),0);
 console.log('PASS: unlinked parent cannot request reports; server rejection stays visible; success follows confirmed save; transport emits no telemetry; student identity has no sample fallback.');
} finally {await browser.close();}
