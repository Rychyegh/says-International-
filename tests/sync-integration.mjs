// Run against Vite on 5179. Every API request is intercepted.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const page=await browser.newPage();
let releaseSlow;const slow=new Promise(resolve=>releaseSlow=resolve);
let releaseReload;let reloadGate=null;let failFees=false;let calls=[];
const appId='11111111-1111-4111-8111-111111111111';
const stuId='22222222-2222-4222-8222-222222222222';
let students=[{id:stuId,student_id_code:'CODE-1',full_name:'Same Name',application_id:appId,status:'ACTIVE'}, {id:'33333333-3333-4333-8333-333333333333',student_id_code:'CODE-2',full_name:'Same Name'}];
let fees=[{id:'invoice-1',student_id:stuId,student_name:'Same Name',billed_amount:100,paid_amount:0}];
let apps=[{id:appId,learner_name:'Same Name',status:'Submitted'}];
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**',async route=>{
 const req=route.request();const path=new URL(req.url()).pathname.replace('/api/v1','');calls.push({path,method:req.method()});
 if(reloadGate)await reloadGate;
 if(path==='/bus/routes')await slow;
 let value=[],status=200;
 if(path==='/academic/settings')value={academicYear:'2026/2027',academicTerm:'Term 1'};
 if(path==='/students')value=students;
 if(path==='/finance/fees'){value=fees;if(failFees){status=503;value={detail:'Fees unavailable'};}}
 if(path==='/admissions/applications')value=apps;
 if(path===`/students/${stuId}`&&req.method()==='PUT')value={student:students[0]};
 if(path===`/admissions/applications/${appId}/enroll`){apps=[{...apps[0],status:'Enrolled'}];value={student:students[0],application:apps[0]};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
});
try{
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await page.waitForFunction(()=>window.testStore?.studentFees.length===1);
 assert.equal(await page.evaluate(()=>window.testStore.isRefreshingBackend),true,'fees must render while another API is blocked');
 await page.waitForFunction(()=>window.testStore.onboardedStudents.length===2);
 assert.equal(await page.evaluate(()=>window.studentsAreSamePerson({id:'a',applicationId:'app'},{id:'b',applicationId:'app'})),true);
 releaseSlow();await page.waitForFunction(()=>!window.testStore.isRefreshingBackend);
 await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('says-session-snapshot-v1')).records.studentFees.length===1);
 reloadGate=new Promise(resolve=>releaseReload=resolve);
 await page.reload();
 await page.waitForFunction(()=>window.testStore?.studentFees.length===1&&window.testStore.showingCachedData);
 assert.equal(await page.evaluate(()=>window.testStore.onboardedStudents.length),2);
 fees=[{...fees[0],paid_amount:30}];releaseReload();reloadGate=null;
 await page.waitForFunction(()=>window.testStore.studentFees[0]?.paidAmount===30&&!window.testStore.isRefreshingBackend);
 failFees=true;await page.evaluate(()=>window.testStore.refreshBackendData());
 assert.equal(await page.evaluate(()=>window.testStore.studentFees[0].paidAmount),30,'failure preserves last confirmed records');
 failFees=false;
 calls=[];
 await page.evaluate(id=>window.testStore.onboardStudent({applicationId:id,fullName:'Same Name',dob:'2016-01-01'}),appId);
 assert.equal(calls.filter(c=>c.path==='/students/onboard').length,0,'linked student must be updated instead of created again');
 assert.equal(await page.evaluate(()=>window.testStore.studentFees.length),1,'onboarding must not invent a second invoice');
 calls=[];
 await page.evaluate(id=>window.testStore.updateApplicationStatus(id,'Enrolled'),appId);
 assert.equal(calls.filter(c=>c.path.endsWith('/enroll')).length,1);
 assert.equal(calls.filter(c=>c.path==='/students/onboard').length,0);
 fees=[];students=[];await page.evaluate(()=>window.testStore.refreshBackendData());
 assert.equal(await page.evaluate(()=>window.testStore.studentFees.length),0);
 assert.equal(await page.evaluate(()=>window.testStore.onboardedStudents.length),0,'removed students must not be resurrected');
 reloadGate=new Promise(resolve=>releaseReload=resolve);
 await page.evaluate(()=>{ const saved=JSON.parse(sessionStorage.getItem('says-session-snapshot-v1'));saved.records.studentFees=[{id:'private-invoice'}];sessionStorage.setItem('says-session-snapshot-v1',JSON.stringify(saved));window.mountStore('accountant',true,'another-user'); });
 await page.waitForFunction(()=>window.testStore?.studentFees.length===0);
 assert.equal(await page.evaluate(()=>Boolean(window.testStore.showingCachedData)),false,'another account cannot hydrate prior records');
 releaseReload();reloadGate=null;
 assert.deepEqual(errors,[]);
 console.log('PASS: progressive reads, reload cache, background reconciliation, failed reads, same-name identity, repeat onboarding, single enrollment write, authoritative empty lists, account isolation.');
}finally{releaseSlow();releaseReload?.();await browser.close();}
