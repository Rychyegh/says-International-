// Read-only mocked ledger; no real payments are submitted.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let reads=0,posts=0,fail=false;
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()==='POST')posts++;
  let data=[],status=200;
  if(path.endsWith('/finance/fees')) data=[{id:'invoice-1',student_id:'student-1',student_name:'History Student',billed_amount:100,paid_amount:100,balance:0}];
  if(path.endsWith('/finance/students/student-1/ledger')) {
   reads++;
   data={entries:[{id:'payment-1',type:'PAYMENT',credit:100,reference:'RCPT-HISTORY',date:'2026-10-19',notes:'Tuition payment'},{id:'waiver-1',type:'WAIVER',credit:20,reference:'WAIVER-1'}]};
   if(fail){status=500;data={detail:'Ledger temporarily unavailable'};}
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:5181'}/tests/store-harness.html?enabled=1&view=accounts`);
 await page.getByRole('button',{name:'Receive Payments',exact:true}).click();
 await page.getByRole('button',{name:'Payment History',exact:true}).click();
 await page.getByLabel('History student').selectOption('student-1');
 await page.getByRole('cell',{name:'RCPT-HISTORY',exact:true}).waitFor();
 assert.equal(await page.getByRole('cell',{name:'WAIVER-1',exact:true}).count(),0);
 await page.getByRole('button',{name:'Print receipt',exact:true}).click();
 const receipt=page.getByRole('dialog',{name:'Print student receipt'});
 await receipt.getByText('RCPT-HISTORY',{exact:true}).waitFor();
 await receipt.getByRole('button',{name:'Close',exact:true}).click();
 await page.reload();
 await page.getByRole('button',{name:'Payment History',exact:true}).click();
 await page.getByLabel('History student').selectOption('student-1');
 await page.getByRole('cell',{name:'RCPT-HISTORY',exact:true}).waitFor();
 fail=true;
 await page.getByRole('button',{name:'Refresh payment history'}).click();
 await page.getByRole('alert').filter({hasText:'Ledger temporarily unavailable'}).waitFor();
 assert.ok(reads>=3);assert.equal(posts,0);
 console.log('PASS: paid-invoice history survives reload, excludes waivers, reprints receipts without posting, and reports ledger errors.');
}finally{await browser.close();}
