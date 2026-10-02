import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let fail=true,writes=0;
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let data=[],status=200;
  if(path.endsWith('/academic/settings')){
   data={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50,gradingBands:[{min:0,max:100,grade:'A'}]};
   if(req.method()!=='GET'){writes++;await new Promise(r=>setTimeout(r,300));if(fail){status=403;data={detail:'Settings permission denied'};}else data=req.postDataJSON();}
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts-dialog');
 const modal=page.getByRole('dialog');await modal.waitFor();
 await page.waitForFunction(()=>window.testStore?.academicSettings?.gradingBands?.length);
 const save=modal.getByRole('button',{name:'Save & Synchronize Academic Settings'});
 await save.click();await modal.getByText('Settings not saved:',{exact:false}).waitFor();
 assert.equal(await modal.count(),1);assert.equal(writes,1,await modal.innerText());
 fail=false;await save.click();await modal.waitFor({state:'detached'});
 await page.getByText('Accountant dialog closed',{exact:true}).waitFor();
 assert.equal(writes,2);assert.deepEqual(errors,[]);
 console.log('PASS: Accountant outer dialog stays open on rejected save, closes on confirmed save, and does not submit twice.');
} finally {await browser.close();}
