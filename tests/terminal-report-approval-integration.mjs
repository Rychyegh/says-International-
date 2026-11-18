// Isolated backend fixture: no real learner records or live approval requests.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const watchdog=setTimeout(()=>{console.error('Report integration timed out');process.exit(1);},90000);
const page = await browser.newPage({viewport:{width:1440,height:1100}});
const studentId='11111111-1111-4111-8111-111111111111';
const secondId='22222222-2222-4222-8222-222222222222';
const student={id:studentId,student_id_code:'TEST-001',full_name:'Test Learner',class_level:'Nursery 1',sub_class:'Nursery 1A'};
let sheets=[],submissions=0,approvals=0,lastScope,deny=false;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**', async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');let status=200,data=[];
 if(path==='/students') data=[student,{...student,id:secondId,student_id_code:'TEST-002',full_name:'Test Learner Two'}];
 if(path==='/academic/settings') data={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50};
 if(path==='/academic/assessment-reports') {lastScope=Object.fromEntries(url.searchParams);data=deny?{detail:'Not assigned to this class'}:{reports:[]};status=deny?403:200;}
 if(path==='/sims/score-sheets')data=sheets;
 if(path==='/sims/score-sheets/entry' && req.method()==='POST') {
   submissions++;const body=req.postDataJSON(),score=body.scores[0];
   const saved={...body,...score,id:`score-${submissions}`,class_score:40,exam_score:42,exam_score_converted:42,raw_class_score:80,raw_exam_score:84,total_score:82,status:'Pending Approval'};
   delete saved.scores;sheets.push(saved);data={entry:saved};
 }
 if(path.startsWith('/sims/test-results/') && path.endsWith('/publish')) {approvals++;const id=path.split('/')[3];sheets=sheets.map(s=>s.id===id?{...s,status:'Published'}:s);data={status:'Published'};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
try {
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=terminal-reports');
 await page.evaluate(()=>window.mountStore('teacher',true,'teacher-test'));
 await page.waitForFunction(()=>window.testStore?.onboardedStudents.length===2);
 const entry={studentId,studentName:'Test Learner',classLevel:'Nursery 1',subClass:'Nursery 1A',year:'2026/2027',term:'Term 1',subject:'Numeracy',classScore:80,examScore:84,submitKind:'exam',hasExamScore:true};
 await page.evaluate(entry=>window.testStore.saveScoreSheetEntry(entry),entry);
 await page.evaluate(entry=>window.testStore.saveScoreSheetEntry(entry),{...entry,studentId:secondId,studentName:'Test Learner Two'});
 assert.equal(submissions,2);
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.getByText('No approved reports match this class', {exact:false}).waitFor();
 assert.equal(await page.locator('.class-report-viewer .class-report-paper').count(),0);
 // Change actor and reload persisted sheets before approving.
 await page.evaluate(()=>window.mountStore('admin',true,'admin-test'));
 await page.waitForFunction(()=>window.testStore?.results.some(r=>r.backendId==='score-1'));
 await page.evaluate(()=>window.testStore.approveResult('score-1'));
 await page.evaluate(()=>window.testStore.approveResult('score-2'));
 assert.equal(approvals,2);assert.equal(sheets[0].status,'Published');
 // Fresh teacher session, not an optimistic local approval snapshot.
 await page.evaluate(()=>window.mountStore('teacher',true,'teacher-test'));
 await page.waitForFunction(()=>window.testStore?.results.some(r=>r.status==='Published'));
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 const paper=page.locator('.class-report-viewer .class-report-paper');
 await paper.getByText('Student name: Test Learner',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await paper.getByText('Student name: Test Learner Two',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Previous',exact:true}).click();
 assert.equal(lastScope.class_level,'Nursery 1');assert.equal(lastScope.sub_class,'Nursery 1A');assert.equal(lastScope.report_type,'class');
 await paper.getByRole('cell',{name:'Numeracy',exact:true}).waitFor();
 await paper.getByRole('cell',{name:'82',exact:true}).first().waitFor();
 assert.match(await paper.innerText(),/REMALJ Carewell Inspirational School/i);
 assert.match(await paper.innerText(),/0535400080/);
 assert.equal(await paper.locator('img').evaluate(img=>img.complete && img.naturalWidth>0),true);
 await page.screenshot({path:'/tmp/terminal-report-approved.png',fullPage:true});
 await page.evaluate(()=>{window.print=()=>{};});
 await page.getByRole('button',{name:'Print all reports'}).click();
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.class-report-print-root .class-report-paper').count(),2);
 assert.equal(await page.locator('.class-report-print-root').isVisible(),true);
 await page.pdf({path:'/tmp/terminal-report-approved.pdf',format:'A4',printBackground:true});
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 deny=true;await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Not assigned to this class'}).waitFor();
 assert.equal(await page.locator('.class-report-viewer .class-report-paper').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: teacher submits → admin approves → fresh teacher preview displays saved Nursery 1A report; school details/logo and print verified; pending and forbidden results excluded.');
} finally {clearTimeout(watchdog);await browser.close();}
