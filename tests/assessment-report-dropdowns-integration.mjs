import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:1000,height:900}});let sent;page.on('pageerror',e=>console.error('PAGE ERROR:',e.message));page.setDefaultTimeout(10000);
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname;let data=[];
  if(path.endsWith('/academic/settings'))data={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path.endsWith('/academic/catalog/subjects'))data=[{name:'Numeracy'}];
  if(path.endsWith('/academic/assessment-reports')){sent=Object.fromEntries(url.searchParams);data={reports:[]};}
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=assessment-reports');
 await page.getByLabel('Academic year',{exact:true}).selectOption('2026/2027');
 await page.getByLabel('Term',{exact:true}).selectOption('Term 2');
 await page.getByLabel('Class level',{exact:true}).selectOption('Nursery 1');
 await page.getByLabel('Subject',{exact:true}).selectOption('Numeracy');
 assert.equal(await page.locator('.assessment-report-fields input').count(),0);
 await page.getByRole('button',{name:'Preview report',exact:true}).click();
 await page.getByText('No approved assessments match this selection.').waitFor();
 assert.equal(sent.academic_year,'2026/2027');assert.equal(sent.term,'Term 2');assert.equal(sent.class_level,'Nursery 1');assert.equal(sent.subject,'Numeracy');
 await page.screenshot({path:'/tmp/assessment-report-dropdowns.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS: year, term, class and subject are usable dropdowns; selected values reach report API; mobile form fits.');
} finally {await browser.close();}
