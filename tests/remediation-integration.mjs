// Synthetic local integration only. Every backend request is intercepted.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const sid='22222222-2222-4222-8222-222222222222';
let sheets=[],calls=[],failScore=0,failAdjust=0,failSettings=0;
let fees=[{id:'fee-a',student_id:sid,student_name:'Learner',billed_amount:100,paid_amount:80,balance:20},{id:'fee-b',student_id:sid,student_name:'Learner',billed_amount:100,paid_amount:0,balance:100}];
const settings={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50,gradingSystem:'BECE 9-Point Scale (GES Standard)',gradingBands:[{min:0,max:100,grade:'School approved'}],resumptionDate:'2026-09-01',vacationDate:'2026-12-01'};
await page.route('**/api/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1',''),method=req.method(),body=req.postDataJSON();calls.push({path,method,body,key:req.headers()['idempotency-key']});
 let result=[],status=200;
 if(path==='/students')result=[{id:sid,student_id_code:'CODE-1',full_name:'Learner',class_level:'Basic 1',class_section:'A'}];
 if(path==='/academic/settings'){result=settings;if(method==='PUT'){status=failSettings||200;result=failSettings?{detail:'Settings rejected'}:body;}}
 if(path==='/finance/fees')result=fees;
 if(path==='/sims/score-sheets')result={scores:sheets};
 if(path==='/sims/score-sheets/entry'){
  if(failScore){status=failScore;result={detail:'Score rejected'};}
  else{const score=body.scores[0],exam=score.exam_score;
   const saved={...score,id:'score-uuid',academic_year:body.academic_year,term:body.term,subject:body.subject,class_level:body.class_level,raw_class_score:score.class_score,raw_exam_score:exam,class_score:score.class_score*.5,exam_score:exam==null?null:exam*.5,total_score:exam==null?null:score.class_score*.5+exam*.5,has_exam_score:exam!==null,grade:exam==null?'':'School approved',status:exam==null?'Class Score Recorded':'Pending Approval',class_breakdown:{arrival_test:score.arrival_test,class_test_1:score.class_test_1,class_test_2:score.class_test_2,class_test_3:score.class_test_3}};
   sheets=[saved];result={scores:[saved]};
  }
 }
 if(path==='/finance/fees/fee-a/adjust'||path==='/finance/fees/fee-a/cancel'){
   if(failAdjust){status=failAdjust;result={detail:'Locked or unreconciled period'};}
   else{fees[0]={...fees[0],billed_amount:path.endsWith('/cancel')?0:50,balance:path.endsWith('/cancel')?-80:-30};result={fee:fees[0]};}
 }
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
});
try{
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===1&&!window.testStore.isRefreshingBackend);
 const entry={studentId:'CODE-1',subject:'Math',term:'Term 1',year:'2026/2027',classLevel:'Basic 1',arrivalTest:80,test1:80,test2:80,test3:80,classScore:40,examScore:null,submitKind:'class',hasExamScore:false};
 let saved=await page.evaluate(e=>window.testStore.saveScoreSheetEntry(e),entry);
 assert.equal(saved.id,'score-uuid');assert.equal(saved.studentId,sid);assert.equal(saved.hasExamScore,false);assert.equal(saved.grade,'');
 saved=await page.evaluate(e=>window.testStore.saveScoreSheetEntry(e),{...entry,examScore:60,submitKind:'exam',hasExamScore:true});
 assert.equal(saved.score,70);assert.equal(saved.rawClassScore,80);assert.equal(saved.rawExamScore,60);
 saved=await page.evaluate(e=>window.testStore.saveScoreSheetEntry(e),entry);
 assert.equal(saved.rawExamScore,60,'class edit preserves exam');assert.equal(saved.score,70);
 assert.equal(calls.filter(c=>c.path==='/sims/score-sheets/entry').every(c=>c.body.scores[0].class_score===80),true);
 for(const code of [401,403,409,422,500]){failScore=code;assert.match(await page.evaluate(e=>window.testStore.saveScoreSheetEntry(e).catch(e=>e.message),{...entry,test1:70}),/Score rejected/);assert.equal(await page.evaluate(()=>window.testStore.results.find(r=>r.id==='score-uuid').score),70);}failScore=0;
 await page.reload();await page.waitForFunction(()=>window.testStore?.results.some(r=>r.id==='score-uuid')&&!window.testStore.isRefreshingBackend);
 assert.equal(await page.evaluate(()=>window.testStore.results.find(r=>r.id==='score-uuid').test3),80);
 const adjustment={feeId:'fee-a',adjustmentType:'CREDIT',amount:50,reason:'Authorized discount'};
 for(const code of [401,403,409,422,500]){failAdjust=code;assert.match(await page.evaluate(a=>window.testStore.adjustStudentBill(a).catch(e=>e.message),adjustment),/Locked/);assert.equal(await page.evaluate(()=>window.testStore.studentFees.find(f=>f.id==='fee-a').balance),20);}failAdjust=0;
 const attempts=calls.filter(c=>c.path==='/finance/fees/fee-a/adjust');assert.equal(new Set(attempts.map(c=>c.key)).size,1,'failed retry uses the same key');
 saved=await page.evaluate(a=>window.testStore.adjustStudentBill(a),adjustment);assert.equal(saved.balance,-30);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees.find(f=>f.id==='fee-b').balance),100);
 assert.match(await page.evaluate(sid=>window.testStore.adjustStudentBill({studentId:sid,adjustmentType:'CREDIT',amount:10,reason:'test'}).catch(e=>e.message),sid),/Select one existing invoice/);
 saved=await page.evaluate(()=>window.testStore.adjustStudentBill({feeId:'fee-a',adjustmentType:'CANCEL',amount:0,reason:'Duplicate'}));assert.equal(saved.balance,-80);assert.equal(saved.paidAmount,80);
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=settings');await page.waitForFunction(()=>window.testStore?.academicSettings.gradingBands?.length);
 await page.getByLabel('Class weight').fill('60');await page.getByRole('button',{name:'Save & Synchronize Academic Settings'}).click();await page.getByRole('alert').filter({hasText:'total 100%'}).waitFor();
 assert.equal(calls.filter(c=>c.path==='/academic/settings'&&c.method==='PUT').length,0);
 await page.getByLabel('Class weight').fill('50');failSettings=422;await page.getByRole('button',{name:'Save & Synchronize Academic Settings'}).click();await page.getByRole('alert').filter({hasText:'Settings rejected'}).waitFor();
 assert.equal(await page.getByText(/Academic Settings Synchronized!/).count(),0);
 failSettings=0;await page.getByRole('button',{name:'Save & Synchronize Academic Settings'}).click();await page.getByText(/Academic Settings Synchronized!/).waitFor();
 const submitted=calls.filter(c=>c.path==='/academic/settings'&&c.method==='PUT').at(-1).body;assert.deepEqual(submitted.gradingBands,settings.gradingBands);assert.equal('schoolName' in submitted,false);
 assert.deepEqual(errors,[]);
 console.log('PASS: raw grading 80/60=70, drafts, exam preservation, canonical UUIDs, reopen, rejected saves, stable correction retries, isolated invoice credits/cancellation, settings errors and approved bands.');
}finally{await browser.close();}
