// Full UI test with isolated HTTP fixtures. Never contacts the live school backend.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1500,height:1150}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const id='11111111-1111-4111-8111-111111111111';
 const student={id,student_id_code:'TEST-KG2-ONLY',full_name:'TEST LEARNER — NOT A REAL STUDENT',class_level:'Kindergarten 2',sub_class:'Kindergarten 2A'};
 let sheets=[],submitted=0,approved=0,submittedPayload;
 await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1','');let data=[];
   if(path==='/students')data=[student];
   if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50};
   if(path==='/academic/teaching-assignments')data=[{user_id:'teacher-test',classes:['KG 2'],subjects:['Mathematics']}];
   if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Kindergarten 2'}};
   if(path==='/academic/assessment-reports')data={reports:[]};
   if(path==='/sims/score-sheets')data=sheets;
   if(path==='/sims/score-sheets/entry' && req.method()==='POST') {
     submitted++;submittedPayload=req.postDataJSON();const body=submittedPayload,score=body.scores[0];
     const saved={...body,...score,id:'kg-test-score',class_level:'KG 2',sub_class:'KG 2A',raw_class_score:score.class_score,raw_exam_score:score.exam_score,class_score:score.class_score/2,exam_score_converted:score.exam_score/2,exam_score:score.exam_score/2,total_score:(score.class_score+score.exam_score)/2,status:'Pending Approval'};
     delete saved.scores;sheets=[saved];data={entry:saved};
   }
   if(path==='/sims/test-results/kg-test-score/publish') {approved++;sheets=sheets.map(s=>({...s,status:'Published'}));data={status:'Published'};}
   await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Score Sheet [Entry]');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
 await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===1);
 const main=page.locator('main');
 await main.locator('select').nth(0).selectOption('Kindergarten 2');
 await main.locator('select').nth(1).selectOption('Kindergarten 2A');
 await main.getByRole('option',{name:/TEST LEARNER/}).waitFor({state:'attached'});
 assert.equal(await main.getByText(/No students in/).count(),0);
 const marks=main.locator('input[type=number]');assert.equal(await marks.count(),5);
 for(let i=0;i<4;i++)await marks.nth(i).fill('80');
 await marks.nth(4).fill('84');
 await main.getByRole('button',{name:'Submit exam for approval',exact:true}).click();
 await main.getByText('Exam score saved to the database for approval.').waitFor();
 assert.equal(submitted,1);assert.equal(submittedPayload.class_level,'Kindergarten 2');assert.equal(submittedPayload.sub_class,'Kindergarten 2A');assert.equal(submittedPayload.academic_year,'2026/2027');assert.equal(submittedPayload.term,'Term 1');
 await page.locator('.sidebar-item').filter({hasText:'Terminal Report Cards'}).click();
 await main.getByRole('button',{name:'Preview',exact:true}).click();
 await main.getByText('No approved reports match this class',{exact:false}).waitFor();
 // Fresh admin actor reads the saved submission, then runs the actual approval handler.
 await page.evaluate(()=>window.mountStore('admin',true,'admin-test'));
 await page.waitForFunction(()=>window.testStore?.results.some(s=>s.backendId==='kg-test-score'));
 await page.evaluate(()=>window.testStore.approveResult('kg-test-score'));assert.equal(approved,1);
 // Fresh teacher actor reloads persisted published marks before previewing.
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Terminal Report Cards');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
 await page.waitForFunction(()=>window.testStore?.results.some(s=>s.status==='Published'));
 const filters=page.locator('.class-report-filters select');
 await filters.nth(0).selectOption('Pre-school');
 await filters.nth(1).selectOption('Kindergarten 2');
 await main.getByRole('button',{name:'Preview',exact:true}).click();
 const report=page.locator('.class-report-viewer .class-report-paper');
 await report.getByText(/TEST LEARNER/).waitFor();
 await report.getByRole('cell',{name:'82',exact:true}).first().waitFor();
 assert.match(await report.innerText(),/Kindergarten 2A/);
 assert.match(await report.innerText(),/REMALJ CAREWELL INSPIRATIONAL SCHOOL/i);
 assert.equal(await report.locator('img').evaluate(img=>img.complete && img.naturalWidth>0),true);
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='ISOLATED TEST RUN • Test learner only • No live school records changed';note.style.cssText='padding:16px;background:#fff7d6;color:#683d00;text-align:center;font:700 15px system-ui';document.body.prepend(note);});
 await mkdir('output',{recursive:true});
 await page.screenshot({path:'output/kindergarten-2-test-report.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: Kindergarten 2 roster found → UI submits 80 class / 84 exam → pending report excluded → admin approval → fresh teacher preview shows 40 + 42 = 82, logo and school details. All HTTP traffic used isolated fixtures.');
} finally {await browser.close();}
