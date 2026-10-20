// Mocked local single-voucher account selection; no money moves.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const page=await browser.newPage();page.setDefaultTimeout(15000);
const voucher={id:'11111111-1111-4111-8111-111111111111',pv_number:'PV-2026-1001',pv_no:'PV-2026-1001',status:'APPROVED',amount:1,quantity:1,unit_cost:1,description:'Synthetic single',payee_name:'Synthetic Vendor',payment_mode:'Cash',version:1};
await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;let data=[];
 if(path.endsWith('/finance/vouchers'))data=[voucher];
 if(path.endsWith('/finance/payment-accounts'))data={accounts:[{id:'11111111-1111-4111-8111-111111111112',name:'Configured Cash',account_type:'asset',is_active:true},{id:'11111111-1111-4111-8111-111111111113',name:'Configured Expense',code:'5201',account_type:'expense',is_active:true},{id:'11111111-1111-4111-8111-111111111114',name:'Income account',account_type:'income',is_active:true}]};
 if(path.includes('/finance/accounting/'))data={items:[],next_cursor:null};
 await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
});
try {
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pay-pv');
 await page.waitForFunction(()=>window.testStore?.paymentVouchers.length===1);
 assert.equal(await page.evaluate(()=>window.testStore.paymentVouchers[0].paymentMethod),'Cash');
 await page.getByRole('button',{name:'Disburse & Pay',exact:false}).first().click();
 const options=await page.getByRole('option').allTextContents();assert.ok(options.includes('Configured Cash'));assert.ok(options.some(v=>v.includes('Configured Expense')));assert.equal(options.some(v=>v.includes('Stanbic')||v.includes('Income account')),false);
 assert.equal(await page.getByPlaceholder('e.g. TXN-2026-90412 or Cheque #891').inputValue(),'');
 console.log('PASS: single PV preserves Cash; account choices are configured by server; incompatible income and static banks excluded; payment reference starts empty.');
}finally{await browser.close();}
