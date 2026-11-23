// Local browser regression: all API responses are synthetic.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1700,height:1200}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const students=Array.from({length:8},(_,i)=>({id:`11111111-1111-4111-8111-${String(i+1).padStart(12,'0')}`,student_id_code:`TEST-KG2-${i+1}`,full_name:`TEST LEARNER ${i+1}`,class_level:'Kindergarten 2',sub_class:'Kindergarten 2A'}));
 const records=students.slice(0,3).map((s,i)=>({id:`result-${i}`,student_id:s.id,student_name:s.full_name,subject:'Mathematics',class_level:'KG 2',sub_class:'KG 2A',academic_year:i?'2026/2027':'2026-2027',term:i?'Term 1':'1st Term',class_score:[40,0,30][i],exam_score:i<2?[42,0][i]:null,total_score:i<2?[82,0][i]:null,has_class_score:true,has_exam_score:i<2,status:i===2?'Class Score Recorded':i===1?'Pending Approval':'Approved'}));
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api/v1','');let data=[];
  if(path==='/students')data=students;
  if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50};
  if(path==='/academic/teaching-assignments')data=[{user_id:'teacher-test',classes:['KG 2'],subjects:['Mathematics']}];
  if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Kindergarten 2'}};
  if(path==='/results')data=records;
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Grades');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
 await page.waitForFunction(()=>window.testStore?.results.length===3 && window.testStore.onboardedStudents.length===8);
 const row=page.locator('tbody tr').filter({hasText:'TEST LEARNER 1'});
 await row.getByText('82.0 / 100',{exact:true}).waitFor();
 assert.match(await row.innerText(),/40\.0 \/ 50/);assert.match(await row.innerText(),/42\.0 \/ 50/);
 assert.match(await page.locator('tbody tr').filter({hasText:'TEST LEARNER 2'}).innerText(),/0\.0 \/ 100/);
 const partial=page.locator('tbody tr').filter({hasText:'TEST LEARNER 3'});assert.match(await partial.innerText(),/30\.0 \/ 50/);assert.match(await partial.innerText(),/N\/A/);
 for(const [label,value] of [['Scores Entered','3 / 8'],['Avg Class Score (/50)','23.3'],['Avg Exam Score (/50)','21.0'],['Class Avg Total (/100)','41.0'],['Highest Score','82.0']]) {
   assert.ok((await page.getByText(label,{exact:true}).locator('..').innerText()).includes(value),`${label} must show ${value}`);
 }
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='ISOLATED TEST • 8 test learners • Saved numbers and summary cards verified • No live records changed';note.style.cssText='padding:16px;background:#fff7d6;text-align:center;font:700 15px system-ui';document.body.prepend(note);});
 await mkdir('output',{recursive:true});await page.screenshot({path:'output/kindergarten-grades-test.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: saved 40/50 + 42/50 = 82/100, real zero, partial scores, 3/8 entered, independent averages and highest score appear in the Grades UI.');
} finally {await browser.close();}
