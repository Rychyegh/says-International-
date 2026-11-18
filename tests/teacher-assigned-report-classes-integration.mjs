import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage();page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const studentA={id:'11111111-1111-4111-8111-111111111111',student_id_code:'TEST-001',full_name:'Basic Test Learner',class_level:'Basic 1',sub_class:'Basic 1A'};
 const studentB={...studentA,id:'22222222-2222-4222-8222-222222222222',student_id_code:'TEST-002',full_name:'Nursery Test Learner',class_level:'Nursery 1',sub_class:'Nursery 1A'};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api/v1','');let data=[];
  if(path==='/students')data=[studentA,studentB,{...studentA,id:'other',full_name:'Other Section Learner',sub_class:'Basic 1B'}];
  if(path==='/academic/settings')data={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path==='/academic/teaching-assignments')data=[{id:'assignment-1',user_id:'teacher-1',classes:['Basic 1A'],subjects:['Mathematics']},{id:'assignment-2',user_id:'teacher-1',classes:['Nursery 1A'],subjects:['Numeracy']},{id:'assignment-3',user_id:'another-teacher',classes:['Basic 9']}];
  if(path==='/class-teachers/dashboard')data={teacher:{full_name:'Test Teacher',class_assigned:'Nursery 1A'}};
  if(path==='/results')data=[studentA,studentB].map((s,i)=>({id:`result-${i}`,student_id:s.id,student_name:s.full_name,class_level:s.class_level,sub_class:s.sub_class,academic_year:'2026/2027',term:'Term 1',subject:i?'Numeracy':'Mathematics',class_score:40,exam_score:42,total_score:82,status:'Approved'}));
  if(path==='/academic/assessment-reports')data={reports:[]};
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=teacher-classes');
 await page.evaluate(()=>{localStorage.setItem('says_teacher_active_nav','Terminal Report Cards');window.mountStore('teacher',true,'teacher-1',{fullName:'Test Teacher',classAssigned:'Nursery 1A',teacher_designation:'class_teacher'});});
 await page.waitForFunction(()=>window.testStore?.teachingAssignments.length===3);
 const select=page.locator('.class-report-filters select').nth(1);
 await select.selectOption('Basic 1A');
 assert.deepEqual(await select.locator('option').allTextContents(),['Select assigned class','Nursery 1A','Basic 1A']);
 await select.selectOption('Basic 1A');await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.locator('.class-report-viewer .class-report-paper').getByText('Basic Test Learner',{exact:false}).waitFor();
 assert.equal(await page.locator('.class-report-viewer').getByText('Other Section Learner',{exact:false}).count(),0);
 await select.selectOption('Nursery 1A');await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.locator('.class-report-viewer .class-report-paper').getByText('Nursery Test Learner',{exact:false}).waitFor();
 await page.locator('.sidebar-item').filter({hasText:'Grades'}).click();
 await page.getByRole('button',{name:/Basic 1A/}).click();
 await page.getByText('Basic Test Learner',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:/Basic 9/}).count(),0);
 assert.equal(await page.getByText('Other Section Learner',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: teacher ID resolves both saved assignments; both classes show and load reports; Grades uses the same assignments; other sections/classes remain excluded.');
} finally {await browser.close();}
