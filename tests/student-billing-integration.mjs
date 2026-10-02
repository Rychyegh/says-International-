// Synthetic records only. No network request reaches the backend.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const appId='11111111-1111-4111-8111-111111111111',studentId='22222222-2222-4222-8222-222222222222';
let apps=[],students=[],fees=[],calls=[],failBill=false;
await page.route('**/api/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1',''),method=req.method(),body=path==='/admissions/applications' && method==='POST' ? JSON.parse(req.postData().match(/\r\n\r\n(\{[^]*?\})\r\n--/)[1]) : req.postDataJSON();
 calls.push({path,method,body,key:req.headers()['idempotency-key']});let value=[],status=200;
 if(path==='/academic/settings')value={academicYear:'2026/2027',academicTerm:'Term 1'};
 if(path==='/students')value=students;
 if(path==='/finance/fees')value=fees;
 if(path==='/admissions/applications'){
  if(method==='POST'){await new Promise(r=>setTimeout(r,100));apps=[{id:appId,...body,status:'Submitted'}];value=apps[0];}else value=apps;
 }
 if(path===`/admissions/applications/${appId}/enroll`){
  students=[{id:studentId,student_id_code:'REMALJ-2026-02FC2FFF',full_name:'Bortey Borketey',student_email:'bortey.borketey@remaljcarewell.edu.gh',application_id:appId,class_level:'Basic 7',status:'ACTIVE'}];
  apps=apps.map(a=>({...a,status:'Enrolled'}));value={student:students[0],application:apps[0]};
 }
 if(path==='/finance/bills/student'){
  if(failBill){status=500;value={detail:'Bill rejected'};}
  else{fees=[{id:'invoice-1',student_id:studentId,student_name:'Bortey Borketey',billed_amount:123.45,paid_amount:0,balance:123.45}];value={bill_id:'invoice-1',total_billed:123.45};}
 }
 if(path==='/students/onboard'){value={id:'33333333-3333-4333-8333-333333333333',student_id_code:'REMALJ-2026-NEW',full_name:'New learner',status:'ACTIVE'};students.push(value);}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
});
try{
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await page.waitForFunction(()=>window.testStore&&!window.testStore.isRefreshingBackend);
 const application={firstName:'Bortey',surname:'Borketey',dob:'2014-01-01',applyingClass:'Basic 7',academicYear:'2026/2027',academicTerm:'Term 1'};
 await page.evaluate(a=>Promise.all([window.testStore.submitApplication(a),window.testStore.submitApplication(a)]),application);
 await page.evaluate(a=>window.testStore.submitApplication(a),application);
 assert.equal(calls.filter(c=>c.path==='/admissions/applications'&&c.method==='POST').length,1);
 assert.equal(calls.filter(c=>c.path.endsWith('/enroll')).length,1);
 assert.equal(calls.find(c=>c.path.endsWith('/enroll')).body.initial_billed_amount,0);
 assert.equal(calls.filter(c=>c.path==='/students/onboard').length,0);
 await page.waitForFunction(()=>window.testStore.onboardedStudents.length===1);
 assert.equal(await page.evaluate(()=>window.testStore.onboardedStudents[0].studentEmail),'bortey.borketey@remaljcarewell.edu.gh');
 const bill={studentId,items:[{details:'Tuition',amount:100},{details:'Stationery',amount:23.45}],totalAmount:123.45,term:'Term 1'};
 let result=await page.evaluate(b=>window.testStore.postAcademicBill(b),bill);assert.equal(result.posted,1);
 await page.waitForFunction(()=>window.testStore.studentFees[0]?.billedAmount===123.45);
 assert.equal(await page.evaluate(()=>window.testStore.feeAccounts[0].billed),123.45);
 result=await page.evaluate(b=>window.testStore.postAcademicBill(b),bill);assert.equal(result.posted,1);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees[0].billedAmount),123.45,'a replay does not add the bill a second time');
 const posts=calls.filter(c=>c.path==='/finance/bills/student');assert.equal(posts[0].key,posts[1].key);assert.equal(posts[0].body.student_id,studentId);
 failBill=true;result=await page.evaluate(b=>window.testStore.postAcademicBill(b),bill);assert.equal(result.failed,1);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees[0].billedAmount),123.45);
 await page.reload();await page.waitForFunction(()=>window.testStore?.studentFees[0]?.billedAmount===123.45&&!window.testStore.isRefreshingBackend);
 assert.equal(await page.evaluate(()=>window.testStore.onboardedStudents.length),1);
 await page.evaluate(()=>window.testStore.onboardStudent({fullName:'New learner',dob:'2015-01-01',level:'Basic 7'}));
 const onboard=calls.find(c=>c.path==='/students/onboard');assert.equal(onboard.body.initialBilledAmount,0);assert.equal(onboard.body.initial_billed_amount,0);
 assert.deepEqual(errors,[]);
 console.log('PASS: one application, one enrollment/student with email, zero preset charges, exact UUID billing, unchanged posted amount after replay/reload, failed bill preserves balances.');
}finally{await browser.close();}
