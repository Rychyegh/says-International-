import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let writes=0;
try {
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.route('**/api/**',async route=>{
  if(route.request().method()==='POST')writes++;
  const path=new URL(route.request().url()).pathname;
  const voucher={id:'11111111-1111-4111-8111-111111111111',pv_number:'PV-2026-1001',status:'APPROVED',payee_name:'Supplier',total_amount:75,items:[{id:'item-a',description:'Books',quantity:1,total_amount:25,status:'APPROVED'},{id:'item-b',description:'Repairs',quantity:1,total_amount:50,status:'APPROVED'}]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(path.endsWith('/finance/vouchers')?[voucher]:[])});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pay-pv');
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Item authorization and disbursement'});
 for(const number of [1,2]) {
  const item=dialog.getByRole('form',{name:`Item ${number} payment instructions`});
  await item.getByLabel('Source account',{exact:true}).fill(`Source ${number}`);
  await item.getByLabel('Destination account',{exact:true}).fill(`Destination ${number}`);
  await item.getByLabel('Expense account',{exact:true}).selectOption({label:'10093 · Diesel'});
  await item.getByLabel('Payment reference',{exact:true}).fill(`REFERENCE-${number}`);
  await item.getByRole('button',{name:'Save item instructions'}).click();
  await item.getByRole('status').filter({hasText:'Instructions saved'}).waitFor();
  assert.equal(await item.getByRole('button',{name:`Authorize & disburse item ${number}`}).isDisabled(),true);
 }
 assert.equal(await dialog.getByRole('button',{name:/Confirm & Disburse/}).count(),0);
 await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 assert.equal(await dialog.getByRole('form',{name:'Item 1 payment instructions'}).getByLabel('Source account',{exact:true}).inputValue(),'Source 1');
 assert.equal(await dialog.getByRole('form',{name:'Item 2 payment instructions'}).getByLabel('Destination account',{exact:true}).inputValue(),'Destination 2');
 await page.screenshot({path:'/private/tmp/pv-item-modal.png'});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 assert.equal(writes,0,'item instructions must never call whole-voucher disbursement');
 console.log('PASS: independent item accounts and references, separate saved instructions, responsive modal, no whole-voucher payment.');
} finally {await browser.close();}
