// Isolated synthetic API fixture. No live learner records or attendance writes.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1600,height:1200}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const students=Array.from({length:4},(_,i)=>({id:`11111111-1111-4111-8111-${String(i+1).padStart(12,'0')}`,student_id_code:`TEST-KG2-${i+1}`,full_name:`TEST LEARNER ${i+1}`,class_level:'Kindergarten 2',sub_class:'Kindergarten 2A',...(i===3?{attendance_percent:75}:{})}));
 const base={class_level:'KG 2',academic_year:'2026/2027',term:'Term 1',class_score:40,exam_score:42,total_score:82,status:'Approved'};
 const records=[{...base,id:'math-1',student_id:students[0].id,subject:'Mathematics'},{...base,id:'science-1',student_id:students[0].id,subject:'Integrated Science',total_score:70},{...base,id:'math-2',student_id:students[1].id,subject:'Mathematics',class_score:0,exam_score:0,total_score:0},{...base,id:'pending',student_id:students[2].id,subject:'Mathematics',status:'Pending Approval'}];
 const logs=[['2026-11-20','Present'],['2026-11-20','Check Out'],['2026-11-21','Absent'],['2026-11-22','Present']].map(([date,status],i)=>({id:`event-${i}`,student_id:students[0].id,date,status}));
 logs.push({id:'absent-2',student_id:students[1].id,date:'2026-11-22',status:'Absent'});
 let attendanceReads=0,denyAttendance=false;
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');let data=[],status=200;
  assert.equal(req.method(),'GET','Dashboard must never write attendance or marks');
  if(path==='/students')data=students;
  if(path==='/results')data=records;
  if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path==='/academic/teaching-assignments')data=[{user_id:'teacher-test',classes:['KG 2']}];
  if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Kindergarten 2'},students:students.map(s=>({student_id:s.student_id_code,full_name:s.full_name,class_level:s.class_level,sub_class:s.sub_class,math_grade:'N/A',science_grade:'N/A'}))};
  if(path==='/attendance/logs'){attendanceReads++;assert.equal(url.searchParams.get('academic_year'),'2026/2027');assert.equal(url.searchParams.get('term'),'Term 1');data=denyAttendance?{detail:'Attendance access denied'}:{logs};status=denyAttendance?403:200;}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Dashboard');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
 const row=name=>page.locator('main tbody tr').filter({hasText:name});
 await row('TEST LEARNER 1').getByText('66.7%',{exact:true}).waitFor();
 assert.equal(await row('TEST LEARNER 1').locator('td').nth(3).innerText(),'1');
 assert.equal(await row('TEST LEARNER 1').locator('td').nth(4).innerText(),'3');
 assert.match(await row('TEST LEARNER 2').innerText(),/0%/);assert.equal(await row('TEST LEARNER 2').locator('td').nth(3).innerText(),'9');
 assert.match(await row('TEST LEARNER 3').innerText(),/Not recorded/);assert.equal(await row('TEST LEARNER 3').locator('td').nth(3).innerText(),'N/A');
 assert.match(await row('TEST LEARNER 4').innerText(),/75%/);assert.equal(await page.locator('main tbody tr').count(),4);assert.ok(attendanceReads>0);
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='ISOLATED TEST • Attendance + approved Maths/Science grades • No live records changed';note.style.cssText='padding:16px;background:#fff7d6;text-align:center;font:700 15px system-ui';document.body.prepend(note);});
 await mkdir('output',{recursive:true});await page.screenshot({path:'output/teacher-dashboard-metrics-test.png',fullPage:true});
 denyAttendance=true;
 await page.locator('.sidebar-item').filter({hasText:'Grades'}).click();await page.locator('.sidebar-item').filter({hasText:'Dashboard'}).click();
 await page.getByRole('alert').filter({hasText:'Attendance access denied'}).waitFor();
 assert.match(await row('TEST LEARNER 1').innerText(),/Not recorded/);assert.deepEqual(errors,[]);
 console.log('PASS: dashboard merges stable learner identities, shows saved attendance, 66.7%/0% recorded-day rates, current approved Maths/Science grades and zero grade; missing/pending data stays missing; failed history is visible.');
} finally {await browser.close();}
