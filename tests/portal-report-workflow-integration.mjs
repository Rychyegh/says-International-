// Isolated local regression. All backend traffic is intercepted.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const watchdog=setTimeout(()=>{console.error('Workflow test timed out');process.exit(1);},90000);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const page=await browser.newPage();page.setDefaultTimeout(12000);
let requests=[],reject=false,deletions=0;
await page.route('**/api/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1','');let data=[],status=200;
 if(path==='/reports/requests'){
  if(req.method()==='POST') {if(reject){status=403;data={detail:'Child not linked'};}else {data={id:'report-server-id',...req.postDataJSON(),status:'Requested'};requests=[data];}}
  else data=requests;
 }
 if(path==='/students/11111111-1111-4111-8111-111111111111'&&req.method()==='DELETE'){deletions++;status=409;data={detail:'Posted payments require reconciliation'};}
 if(path==='/students')data=[{id:'11111111-1111-4111-8111-111111111111',student_id_code:'CODE',full_name:'Synthetic Student',class_level:'Basic 1'}];
 if(path==='/admissions/applications/app-id'&&req.method()==='DELETE'){status=500;data={detail:'Deletion unavailable'};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
try {
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===1, null, {timeout:45000});
 const input={child:'Synthetic Student',studentId:'11111111-1111-4111-8111-111111111111',semester:'Term 1',note:'Test'};
 const saved=await page.evaluate(input=>window.testStore.requestReport(input),input);assert.equal(saved.id,'report-server-id');
 reject=true;assert.match(await page.evaluate(input=>window.testStore.requestReport(input).catch(e=>e.message),input),/Child not linked/);
 assert.equal(await page.evaluate(()=>window.testStore.reportRequests.length),1);
 assert.match(await page.evaluate(()=>window.testStore.deleteOnboardedStudent('11111111-1111-4111-8111-111111111111').catch(e=>e.message)),/reconciliation/);
 assert.equal(await page.evaluate(()=>window.testStore.onboardedStudents.length),1);assert.equal(deletions,1);
 assert.match(await page.evaluate(()=>window.testStore.deleteApplication('app-id').catch(e=>e.message)),/Deletion unavailable/);
 console.log('PASS: report uses saved server ID; rejected parent requests stay rejected; failed student/application deletion preserves visible records.');
} finally {clearTimeout(watchdog);await browser.close();}
