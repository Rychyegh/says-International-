// Browser regression with isolated synthetic records; no live school writes.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1550,height:1250}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const studentId='11111111-1111-4111-8111-111111111111';
 const learner={id:studentId,student_id_code:'TEST-KG2-REMARKS',full_name:'TEST LEARNER — REMARKS DEMO',class_level:'Kindergarten 2',sub_class:'Kindergarten 2A'};
 const score={id:'score-1',student_id:studentId,student_name:learner.full_name,class_level:'KG 2',sub_class:'KG 2A',academic_year:'2026/2027',term:'Term 1',subject:'Mathematics',class_score:40,exam_score:42,total_score:82,status:'Published'};
 let remarks=[],actor='teacher',saves=0,approvals=0,denySave=false;
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');let data=[],status=200;
  if(path==='/students')data=[learner];
  if(path==='/results')data=[score];
  if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path==='/academic/teaching-assignments')data=[{user_id:'teacher-test',classes:['KG 2']}];
  if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Kindergarten 2'}};
  if(path==='/academic/assessment-reports')data={reports:url.searchParams.get('report_type')==='class'?[]:[{student_id:studentId,student_name:learner.full_name,class_level:'Kindergarten 2',sub_class:'Kindergarten 2A',rows:[{subject:'Mathematics',class_score:40,exam_score:42,total:82}]}]};
  if(path==='/academic/report-setup')data={remarks};
  if(path===`/academic/terminal-report-remarks/${studentId}` && req.method()==='PUT') {
    saves++;const body=req.postDataJSON();assert.ok(body.reason);assert.equal(body.academic_year,'2026/2027');assert.equal(body.term,'Term 1');
    assert.equal(body.class_level,'Kindergarten 2');
    if(denySave){status=409;data={detail:'Another user changed this remark. Refresh remarks.'};}
    else {
      assert.ok(actor==='head' || body.kind==='teacher');
      const existing=remarks.find(r=>r.kind===body.kind);assert.equal(body.expected_version,existing?.version || 0);
      const saved={...body,id:body.kind==='teacher'?'22222222-2222-4222-8222-222222222222':'33333333-3333-4333-8333-333333333333',student_id:studentId,status:'draft',version:(existing?.version || 0)+1};
      remarks=[...remarks.filter(r=>r.kind!==body.kind),saved];data={remark:saved};
    }
  }
  if(path.endsWith('/approve') && path.includes('/terminal-report-remarks/')) {
    assert.equal(actor,'head');approvals++;const id=path.split('/').at(-2),body=req.postDataJSON();const existing=remarks.find(r=>r.id===id);
    assert.equal(body.expected_version,existing.version);assert.ok(body.reason);
    const saved={...existing,status:'approved',version:existing.version+1};remarks=remarks.map(r=>r.id===id?saved:r);data={remark:saved};
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 const teacher=async()=>{
  await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
  await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Terminal Report Cards');window.mountStore('teacher',true,'teacher-test',{fullName:'Test Teacher',classAssigned:'Kindergarten 2',teacher_designation:'class_teacher'});});
  await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===1);
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  await page.getByLabel("Class teacher's remarks",{exact:true}).waitFor();
 };
 await teacher();
 const teacherText='Works steadily.\nKeep practising reading.';
 await page.getByLabel("Class teacher's remarks",{exact:true}).fill(teacherText);
 await page.getByRole('button',{name:'Save remark',exact:true}).click();
 await page.getByRole('status').filter({hasText:'saved for headteacher review'}).waitFor();assert.equal(saves,1);
 const paper=page.locator('.class-report-viewer .class-report-paper');
 assert.ok(!(await paper.locator('.class-report-comments').innerText()).includes('Works steadily.'));
 assert.equal(await page.getByLabel("Headteacher's remarks",{exact:true}).count(),0);
 // Failed edit must preserve the user's text and the existing persisted draft.
 denySave=true;await page.getByLabel("Class teacher's remarks",{exact:true}).fill('Unsaved conflicting edit');
 await page.getByRole('button',{name:'Save remark',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Another user changed'}).waitFor();
 assert.equal(await page.getByLabel("Class teacher's remarks",{exact:true}).inputValue(),'Unsaved conflicting edit');assert.equal(remarks[0].comment,teacherText);denySave=false;
 actor='head';
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=assessment-reports');
 await page.evaluate(()=>window.mountStore('head_admin',true,'head-test'));
 await page.getByLabel('Academic year',{exact:true}).selectOption('2026/2027');
 await page.getByLabel('Class level',{exact:true}).selectOption('Kindergarten 2');
 await page.getByLabel('Subject',{exact:true}).selectOption('Mathematics');
 await page.getByRole('button',{name:'Preview report',exact:true}).click();
 await page.getByLabel("Headteacher's remarks",{exact:true}).waitFor();
 await page.waitForFunction(text=>Array.from(document.querySelectorAll('textarea')).some(area=>area.readOnly && area.value===text),teacherText);
 assert.equal(await page.getByLabel("Class teacher's remarks",{exact:true}).inputValue(),teacherText);
 await page.getByLabel("Headteacher's remarks",{exact:true}).fill('Keep up the good work.');
 await page.getByRole('button',{name:'Save remark',exact:true}).click();
 await page.getByRole('status').filter({hasText:'saved for headteacher review'}).waitFor();
 await page.getByRole('button',{name:'Approve teacher remark',exact:true}).click();
 await page.getByRole('status').filter({hasText:'approved and added'}).waitFor();
 await page.getByRole('button',{name:'Approve headteacher remark',exact:true}).click();
 await page.getByRole('status').filter({hasText:'approved and added'}).waitFor();assert.equal(approvals,2);
 actor='teacher';await teacher();
 await paper.locator('.class-report-comments').getByText('Works steadily.',{exact:false}).waitFor();
 await paper.locator('.class-report-comments').getByText('Keep up the good work.',{exact:true}).waitFor();
 await page.evaluate(()=>{window.print=()=>{};});await page.getByRole('button',{name:'Print this report',exact:true}).click();
 assert.match(await page.locator('.class-report-print-root').innerText(),/Keep practising reading/);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.terminal-remark-editor').isVisible(),false);
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='ISOLATED TEST • Teacher remark saved → Headteacher approved → Printed report confirmed';note.style.cssText='padding:16px;background:#fff7d6;font:700 15px system-ui;text-align:center';document.body.prepend(note);});
 await mkdir('output',{recursive:true});await page.screenshot({path:'output/report-remarks-test.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: saved teacher/head remarks, version conflicts preserve text, headteacher approvals, fresh-session persistence, report display and print verified with isolated records.');
} finally {await browser.close();}
