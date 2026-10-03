import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage();let writes=0;
 await page.route('**/api/**',async route=>{
  if(route.request().method()==='POST')writes++;
  const voucher={id:'11111111-1111-4111-8111-111111111111',pv_number:'PV-LIST',status:'APPROVED',total_amount:75,items:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',description:'Books',status:'APPROVED',total_amount:25},{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',description:'Meals',status:'APPROVED',total_amount:50}]};
  await route.fulfill({contentType:'application/json',body:JSON.stringify(new URL(route.request().url()).pathname.endsWith('/finance/vouchers')?[voucher]:[])});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pay-pv');
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Item authorization and disbursement'});
 const form=dialog.getByRole('form',{name:'Item 1 payment instructions'});
 const expense=form.getByLabel('Expense account',{exact:true});
 assert.ok(await expense.locator('option').count()>20);
 await expense.selectOption({label:'Diesel · 10093'});
 await form.getByRole('button',{name:'Save item instructions'}).click();
 await form.getByRole('status').filter({hasText:'Instructions saved'}).waitFor();
 assert.equal(await form.getByRole('button',{name:'Record confirmed payment for item 1',exact:true}).isDisabled(),true);
 await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 assert.equal(await expense.inputValue(),'draft:10093:Diesel');
 const draft=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('pv-item-instructions:test-user:11111111-1111-4111-8111-111111111111:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')));
 assert.equal(draft.expense_account_id,'');assert.equal(draft.expense_account_draft,'draft:10093:Diesel');
 assert.equal(writes,0);
 console.log('PASS: school account list restored without configured accounts; draft persists; no fabricated account UUID or payment request.');
}finally{await browser.close();}
