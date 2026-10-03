import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let calls=[],lost=true;
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const source1='11111111-1111-4111-8111-111111111112',source2='11111111-1111-4111-8111-111111111113',expense='11111111-1111-4111-8111-111111111114';
let voucher={id:'11111111-1111-4111-8111-111111111111',pv_number:'PV-TEST',status:'APPROVED',version:4,total_amount:75,items:[{id:a,description:'Books',payee_name:'Books supplier',status:'APPROVED',amount:25,version:1},{id:b,description:'Meals',payee_name:'Meals supplier',status:'APPROVED',amount:50,version:1}]};
const responses=new Map();
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[];
  if(path.endsWith('/finance/payment-accounts')) data={source_accounts:[{id:source1,name:'Source 1',is_active:true,is_default:true},{id:source2,name:'Source 2',is_active:true}],expense_accounts:[{id:expense,name:'Diesel',code:'10093',is_active:true}]};
  if(path.endsWith('/finance/vouchers')) data=[voucher];
  if(path.endsWith(`/finance/vouchers/${voucher.id}`)) data=voucher;
  if(path.endsWith('/payments/by-idempotency-key')) data={payment:responses.get(new URL(req.url()).searchParams.get('idempotency_key'))?.payment};
  if(req.method()==='POST') {
   assert.match(path,/\/items\/[a-f0-9-]+\/disburse$/);
   const id=path.split('/').at(-2),key=req.headers()['idempotency-key'],body=req.postDataJSON();calls.push({id,key,body});
   if(responses.has(key)) data=responses.get(key);
   else {
    voucher={...voucher,version:voucher.version+1,status:id===a?'PARTIALLY_DISBURSED':'DISBURSED',items:voucher.items.map(item=>item.id===id?{...item,status:'PAID',version:2}:item)};
    data={voucher,payment:{id:`payment-${id}`,item_id:id,voucher_id:voucher.id}};responses.set(key,data);
    if(lost){lost=false;await route.abort('connectionreset');return;}
   }
  }
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:5181'}/tests/store-harness.html?enabled=1&view=pay-pv`);
 await page.evaluate(()=>window.mountStore('head_admin',true));
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Item authorization and disbursement'});
 for(const number of [1,2]) {
  const form=dialog.getByRole('form',{name:`Item ${number} payment instructions`});
  await form.getByLabel('Destination account',{exact:true}).fill(`Destination ${number}`);
  await form.getByLabel('Expense account',{exact:true}).selectOption(expense);
  await form.getByLabel('Payment reference',{exact:true}).fill(`REF-${number}`);
  await form.getByRole('button',{name:'Save item instructions'}).click();
 }
 await dialog.getByRole('button',{name:'Record confirmed payment for item 1',exact:true}).click();
 await dialog.getByRole('button',{name:'Retry item 1 payment'}).waitFor();
 const original=calls[0];
 assert.equal(voucher.items[1].status,'APPROVED');
 await page.reload();await page.evaluate(()=>window.mountStore('head_admin',true));
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 await dialog.getByRole('button',{name:'Retry item 1 payment'}).click();
 await dialog.getByText('Item payment confirmed.',{exact:true}).waitFor();
 assert.deepEqual(calls[1],original);assert.equal(responses.size,1);
 lost=true;
 await dialog.getByRole('button',{name:'Record confirmed payment for item 2',exact:true}).click();
 await dialog.getByRole('button',{name:'Check saved payment',exact:true}).click();
 await dialog.waitFor({state:'detached'});
 assert.equal(responses.size,2);assert.notEqual(calls[2].key,calls[1].key);
 assert.equal(calls[2].body.source_account_id,source1);assert.equal(calls[2].body.destination_account,'Destination 2');
 assert.equal(voucher.status,'DISBURSED');
 assert.equal(original.body.version,4);assert.equal(calls[2].body.version,5);
 assert.equal(original.body.payment_method,'Bank Transfer');assert.equal(original.body.beneficiary,'Books supplier');
 assert.equal('expected_version' in original.body,false);
 voucher={...voucher,status:'PARTIALLY_APPROVED',items:voucher.items.map(item=>({...item,status:item.id===a?'PENDING':'REJECTED'}))};
 await page.reload();await page.evaluate(()=>window.mountStore('head_admin',true));
 await page.getByRole('button',{name:'Disburse & Pay',exact:true}).click();
 assert.equal(await dialog.getByRole('button',{name:'Record confirmed payment for item 1',exact:true}).isDisabled(),true);
 assert.equal(await dialog.getByRole('button',{name:'Record confirmed payment for item 2',exact:true}).isDisabled(),true);
 assert.equal(await dialog.getByRole('form',{name:'Item 1 payment instructions'}).getByLabel('Source account',{exact:true}).isEnabled(),true);
 assert.equal(calls.length,3);
 console.log('PASS: independent payments, distinct accounts/keys, lost response with refresh replay, partial payment, final automatic close.');
} finally {await browser.close();}
