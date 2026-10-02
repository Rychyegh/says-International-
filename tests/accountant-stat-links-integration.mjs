import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage();
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname;
  const fees=[{id:'one',student_id:'s1',student_name:'Paid Student',billed_amount:100,paid_amount:100,balance:0},{id:'two',student_id:'s2',student_name:'Partial Student',billed_amount:100,paid_amount:25,balance:75},{id:'three',student_id:'s3',student_name:'Unpaid Student',billed_amount:100,paid_amount:0,balance:100}];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(path.endsWith('/finance/fees')?fees:[])});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts');
 await page.waitForFunction(()=>window.testStore.studentFees.length===3);
 for(const [label,filter,count] of [['Total Revenue Billed','All',3],['Total Collected','Collected',2],['Outstanding Balance','Owing',2],['Settled Accounts','Paid',1]]) {
  await page.getByRole('button',{name:'Financial Overview',exact:false}).first().click();
  const card=page.getByRole('button',{name:`View ${label}`,exact:true});
  await card.focus();await page.keyboard.press('Enter');
  await page.locator('.sidebar-item.active').filter({hasText:'Fee Ledgers & Payments'}).waitFor();
  assert.equal(await page.getByRole('button',{name:`${filter} Accounts`,exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Print Receipt',exact:true}).count(),count);
 }
 console.log('PASS: all four dashboard cards navigate to the ledger with correct filters using keyboard activation.');
} finally {await browser.close();}
