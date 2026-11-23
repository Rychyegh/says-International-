// Keyboard-style RFID reader simulation. Every backend request is intercepted.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1500,height:1200}});page.setDefaultTimeout(15000);
 await page.clock.install({time:new Date('2026-11-23T08:00:00Z')});
 const studentId='11111111-1111-4111-8111-111111111111';
 const student={id:studentId,student_id_code:'TEST-CARD-KG2',full_name:'TEST CARD LEARNER',class_level:'Kindergarten 2',sub_class:'Kindergarten 2A',rfid_card_code:'TEST-CARD-001',status:'Active',is_active:true};
 const score={id:'score-1',student_id:studentId,class_level:'Kindergarten 2',academic_year:'2026/2027',term:'Term 1',subject:'Mathematics',class_score:40,exam_score:42,total_score:82,status:'Published'};
 let logs=[{id:'prior-absence',student_id:studentId,date:'2026-11-22',status:'Absent'}],scans=[];
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');let data=[];
  if(path==='/students')data=[student];
  if(path==='/results')data=[score];
  if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path==='/academic/teaching-assignments')data=[{user_id:'teacher-test',classes:['KG 2']}];
  if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Kindergarten 2'}};
  if(path==='/academic/assessment-reports')data={reports:[]};
  if(path==='/academic/report-setup')data={remarks:[]};
  if(path==='/attendance/logs')data={logs};
  if(path==='/attendance/scan') {
   const body=req.postDataJSON();scans.push(body);assert.equal(body.identifier,'TEST-CARD-001');assert.equal(body.send_sms,false);
   logs.push({id:`scan-${scans.length}`,student_id:studentId,date:'2026-11-23',scanned_at:`2026-11-23T${body.scan_type==='check_in'?'08':'15'}:20:00Z`,scan_type:body.scan_type,sms_status:'Not requested'});
   data={success:true};
  }
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=attendance');
 await page.getByText('TEST CARD LEARNER',{exact:true}).first().waitFor();
 await page.getByRole('checkbox',{name:/Send Arrival/}).uncheck();
 const mode=page.locator('select').filter({has:page.locator('option[value="morning"]')});
 await mode.selectOption('morning');
 const reader=page.getByPlaceholder(/Tap \/ Scan Card/);
 await reader.fill('TEST-CARD-001');await reader.press('Enter');
 await page.getByText(/Attendance saved: TEST CARD LEARNER — Check In/).waitFor();
 assert.equal(scans.length,1);assert.equal(scans[0].scan_type,'check_in');
 // A repeated tap must not create a second same-day check-in.
 await reader.fill('TEST-CARD-001');await reader.press('Enter');
 await page.getByText(/Attendance already recorded/).waitFor();assert.equal(scans.length,1);
 await mode.selectOption('afternoon');await reader.fill('TEST-CARD-001');await reader.press('Enter');
 await page.getByText(/Attendance saved: TEST CARD LEARNER — Check Out/).waitFor();
 assert.equal(scans.length,2);assert.equal(scans[1].scan_type,'check_out');
 // A new teacher page reads the persisted logs rather than scanner-local state.
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Terminal Report Cards');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
 await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===1);
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 const paper=page.locator('.class-report-viewer .class-report-paper');
 await paper.getByText('Attendance: 50% (1 attended / 2 recorded days)',{exact:true}).waitFor();
 assert.ok(!(await paper.innerText()).includes('Date of birth:'));
 await page.evaluate(()=>{window.print=()=>{};});await page.getByRole('button',{name:'Print this report',exact:true}).click();
 assert.match(await page.locator('.class-report-print-root').innerText(),/Attendance: 50% \(1 attended \/ 2 recorded days\)/);
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='ISOLATED TEST • Card check-in + check-out → one attended day → report preview + print verified';note.style.cssText='padding:16px;background:#fff7d6;text-align:center;font:700 15px system-ui';document.body.prepend(note);});
 await mkdir('output',{recursive:true});await page.screenshot({path:'output/card-attendance-report-test.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: card-reader check-in persists, repeat tap is ignored, checkout does not double-count the day, fresh report preview and print show saved attendance. No real cards, SMS or live records used.');
} finally {await browser.close();}
