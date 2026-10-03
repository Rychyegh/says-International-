import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let writes=0;
let legacy=false;
try {
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.route('**/api/**',async route=>{
  if(route.request().method()==='POST')writes++;
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/finance/payment-accounts')) {await route.fulfill({contentType:'application/json',body:JSON.stringify({source_accounts:[{id:'11111111-1111-4111-8111-111111111112',name:'Source 1',is_active:true},{id:'11111111-1111-4111-8111-111111111113',name:'Source 2',is_active:true}],expense_accounts:[{id:'11111111-1111-4111-8111-111111111114',name:'Diesel',is_active:true}]})});return;}
  const voucher={id:'11111111-1111-4111-8111-111111111111',pv_number:'PV-2026-1001',status:'APPROVED',payee_name:'Supplier',total_amount:75,items:[{id:'item-a',description:'Books',quantity:1,total_amount:25,status:'APPROVED'},{id:'item-b',description:'Repairs',quantity:1,total_amount:50,status:'APPROVED'}]};
  if (legacy) { delete voucher.items; voucher.total_amount=2100; voucher.description='[2026/2027 · 1st Term] STATIONERY (qty 2 × GHS 700.00 = GHS 1400.00); MEALS (qty 1 × GHS 700.00 = GHS 700.00)'; }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(path.endsWith('/finance/vouchers')?[voucher]:[])});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pay-pv');
 await page.evaluate(()=>window.mountStore('head_admin',true));
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Item authorization and disbursement'});
 for(const number of [1,2]) {
  const item=dialog.getByRole('form',{name:`Item ${number} payment instructions`});
  await item.getByLabel('Source account',{exact:true}).selectOption(number===1?'11111111-1111-4111-8111-111111111112':'11111111-1111-4111-8111-111111111113');
  await item.getByLabel('Destination account',{exact:true}).fill(`Destination ${number}`);
  await item.getByLabel('Expense account',{exact:true}).selectOption('11111111-1111-4111-8111-111111111114');
  await item.getByLabel('Payment reference',{exact:true}).fill(`REFERENCE-${number}`);
  await item.getByRole('button',{name:'Save item instructions'}).click();
  await item.getByRole('status').filter({hasText:'Instructions saved'}).waitFor();
  assert.equal(await item.getByRole('button',{name:`Record confirmed payment for item ${number}`}).isDisabled(),true);
 }
 assert.equal(await dialog.getByRole('button',{name:/Confirm & Disburse/}).count(),0);
 await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 await dialog.locator('option[value="11111111-1111-4111-8111-111111111112"]').first().waitFor({state:'attached'});
 assert.equal(await dialog.getByRole('form',{name:'Item 1 payment instructions'}).getByLabel('Source account',{exact:true}).inputValue(),'11111111-1111-4111-8111-111111111112');
 assert.equal(await dialog.getByRole('form',{name:'Item 2 payment instructions'}).getByLabel('Destination account',{exact:true}).inputValue(),'Destination 2');
 await page.screenshot({path:'/private/tmp/pv-item-modal.png'});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 assert.equal(writes,0,'item instructions must never call whole-voucher disbursement');
 legacy=true;
 await page.evaluate(()=>sessionStorage.clear());
 await page.reload();
 await page.evaluate(()=>window.mountStore('head_admin',true));
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 await dialog.getByRole('heading',{name:'STATIONERY',exact:true}).waitFor();
 await dialog.getByRole('heading',{name:'MEALS',exact:true}).waitFor();
 assert.equal(await dialog.getByRole('form').count(),2);
 assert.equal(await dialog.getByRole('button',{name:/Confirm & Disburse/}).count(),0);
 const rejection=await page.evaluate(async()=>{try {await window.testStore.disbursePaymentVoucher('PV-2026-1001',{}); return '';} catch(error) {return error.message;}});
 assert.match(rejection,/separate item payments/);
 assert.equal(writes,0);
 console.log('PASS: independent item accounts and references, separate saved instructions, responsive modal, no whole-voucher payment.');
} finally {await browser.close();}
