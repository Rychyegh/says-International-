// Run against the local Vite server. All API traffic is intercepted; no live records are touched.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) });
const page = await browser.newPage();
const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
let calls=[], failPayment=false, failScore=false, failAll=false;
const fees=[{id:'fee-a',student_id:'s-a',student_name:'Same Name',billed_amount:100,paid_amount:0},{id:'fee-b',student_id:'s-b',student_name:'Same Name',billed_amount:100,paid_amount:0}];
await page.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');calls.push({path,method:req.method(),body:req.postDataJSON()});
 let value=[],status=200;
 if(failAll){status=503;value={detail:'Unavailable'};}
 else if(path==='/auth/me')value={user:{id:'student-user',role:'student',fullName:'Test Student'}};
 else if(path==='/students/me/dashboard')value={stats:[],schedule:[],assignments:[],deadlines:[]};
 else if(path==='/academic/settings')value={academicYear:'2026/2027',academicTerm:'Term 1'};
 else if(path==='/finance/fees')value=fees;
 else if(path==='/finance/fees/fee-b/pay'){
   if(failPayment){status=503;value={detail:'Payment failed'};}
   else {fees[1]={...fees[1],paid_amount:10};value={fee:fees[1],payment:{id:'p1'}};}
 }else if(path==='/sims/score-sheets/entry'){
   if(failScore){status=503;value={detail:'Score failed'};}
   else value={...req.postDataJSON(),id:'score-1'};
 }else if(path==='/parents/me/children')value={children:[]};
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
});
try {
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html');
 await page.waitForFunction(()=>window.testStore);
 assert.equal(calls.length,0,'signed-out provider must not fetch school records');
 assert.equal(await page.evaluate(()=>window.studentsAreSamePerson({id:'a',fullName:'Same Name'},{id:'b',fullName:'Same Name'})),false);
 assert.equal(await page.evaluate(()=>window.studentsAreSamePerson({fullName:'Same Name'},{fullName:'Same Name'})),false);
 await page.evaluate(()=>window.mountStore());
 await page.waitForFunction(()=>window.testStore.studentFees.length===2);
 await page.evaluate(()=>window.testStore.recordFeePayment({id:'fee-b',paidAmount:10}));
 await page.waitForFunction(()=>window.testStore.studentFees.find(f=>f.id==='fee-b')?.paidAmount===10);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees.find(f=>f.id==='fee-a').paidAmount),0);
 failPayment=true;
 assert.match(await page.evaluate(()=>window.testStore.recordFeePayment({id:'fee-b',paidAmount:20}).catch(e=>e.message)),/Payment failed/);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees.find(f=>f.id==='fee-b').paidAmount),10);
 await page.evaluate(()=>window.testStore.saveScoreSheetEntry({studentId:'s-b',studentName:'Same Name',subject:'Math',term:'Term 1',year:'2026/2027',classLevel:'Basic 1',submitKind:'class',classScore:40,hasClassScore:true}));
 await page.waitForFunction(()=>window.testStore.results.some(r=>r.backendId==='score-1'));
 failScore=true;
 assert.match(await page.evaluate(()=>window.testStore.saveScoreSheetEntry({studentId:'s-a',subject:'Math',term:'Term 1',year:'2026/2027',classScore:30}).catch(e=>e.message)),/Score failed/);
 assert.equal(await page.evaluate(()=>window.testStore.results.some(r=>r.studentId==='s-a')),false);
 failAll=true;
 await page.evaluate(()=>window.testStore.refreshBackendData());
 await page.waitForFunction(()=>window.testStore.backendConnected===false);
 failAll=false;calls=[];
 await page.evaluate(()=>window.mountStore('parent'));
 await page.waitForFunction(()=>window.testStore.backendConnected);
 assert.ok(calls.some(c=>c.path==='/parents/me/children'));
 assert.ok(!calls.some(c=>c.path==='/users'||c.path==='/admissions/students'||c.path==='/finance/vouchers'));
 assert.deepEqual(pageErrors,[]);
 console.log('PASS: signed-out isolation, exact invoice update, failed payment rollback, confirmed score persistence, failed score preservation, offline detection, scoped parent reads; no browser errors.');
} finally { await browser.close(); }
