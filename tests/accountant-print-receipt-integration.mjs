import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let writes=0;
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;if(req.method()!=='GET')writes++;
  let data=[];
  if(path.endsWith('/finance/fees'))data=[{id:'invoice-1',student_id:'student-1',student_name:'Receipt Student',billed_amount:100,paid_amount:25,balance:75}];
  if(path.endsWith('/finance/students/student-1/ledger'))data={student_id:'student-1',ledger_entries:[{type:'PAYMENT',reference:'RCPT-001',amount:25,date:'2026-10-02',description:'Tuition payment'},{type:'WAIVER',reference:'WAIVER-001',amount:10,date:'2026-10-02'}]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts');
 await page.getByRole('button',{name:'Fee Ledgers & Payments',exact:false}).first().click();
 await page.getByRole('button',{name:'Print Receipt',exact:true}).first().click();
 const modal=page.getByRole('dialog',{name:'Print student receipt'});
 await modal.getByText('RCPT-001',{exact:true}).waitFor();
 assert.equal(await modal.getByLabel('Recorded payment').locator('option').count(),1);
 await page.evaluate(()=>{window.print=()=>{window.receiptPrintCalled=true;window.dispatchEvent(new Event('afterprint'));};});
 await modal.getByRole('button',{name:'Print Receipt',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.receiptPrintCalled),true);
 await modal.waitFor({state:'detached'});
 assert.equal(writes,0);
 assert.equal(await page.getByRole('button',{name:'Record Payment',exact:true}).count(),0);
 console.log('PASS: Print Receipt loads real ledger payments, excludes waivers, invokes printing, and makes no writes.');
} finally {await browser.close();}
