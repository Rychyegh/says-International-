import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 for(const mixed of [true,false]) {
  const page=await browser.newPage();
  const id='11111111-1111-4111-8111-111111111111',a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let voucher={id,pv_number:'PV-TEST',status:'PRE_AUDITED',version:1,total_amount:1200,items:[{id:a,description:'KIK',quantity:2,unit_cost:50,total_amount:100,status:'PENDING'},{id:b,description:'BOOT',quantity:2,unit_cost:550,total_amount:1100,status:'PENDING'}]},calls=[];
  await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let value=[];
   if(path.endsWith('/finance/vouchers'))value=[voucher];
   if(path.endsWith(`/finance/vouchers/${id}`))value=voucher;
   if(req.method()==='POST'){
    assert.ok(path.endsWith('/authorize'));const body=req.postDataJSON();const target=path.split('/').at(-2);calls.push({target,body});
    assert.equal(body.version,voucher.version);
    voucher={...voucher,version:voucher.version+1,items:voucher.items.map(item=>item.id===target?{...item,status:body.decision==='approve'?'APPROVED':'DECLINED'}:item)};
    if(voucher.items.every(item=>item.status!=='PENDING'))voucher.status='APPROVED';
    value={voucher};
   }
   await route.fulfill({contentType:'application/json',body:JSON.stringify(value)});
  });
  await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=approve');
  await page.getByTitle('Approve KIK',{exact:true}).click();
  await page.waitForFunction(()=>window.testStore.paymentVouchers[0]?.items[0]?.status==='Validated');
  assert.equal(await page.getByTitle('Approve KIK',{exact:true}).count(),0);
  await page.getByTitle(mixed?'Decline / Reject BOOT':'Approve BOOT',{exact:true}).click();
  if(mixed){await page.getByLabel('Rejection reason',{exact:true}).fill('Not required this term');await page.getByRole('button',{name:'Confirm rejection',exact:true}).click();}
  await page.waitForFunction(()=>window.testStore.paymentVouchers[0]?.items.every(item=>['Validated','Declined'].includes(item.status)));
  assert.equal(calls.length,2);assert.equal(calls[0].target,a);assert.equal(calls[1].target,b);
  assert.equal(calls[1].body.decision,mixed?'decline':'approve');
  assert.equal(voucher.total_amount,1200);
  assert.equal(await page.getByTitle('Approve BOOT',{exact:true}).count(),0);
  // Recall the completed voucher to verify the editing-station controls disappear too.
  await page.getByRole('button',{name:'Open Voucher Particulars ▼',exact:true}).click();
  await page.getByPlaceholder('Enter PV N/o (e.g. PV-2026-088, 51250897)...').fill('PV-TEST');
  await page.getByRole('button',{name:'Recall PV Details',exact:true}).click();
  await page.getByText(/Voucher #PV-TEST Contains 2 Itemized Lines/).waitFor();
  assert.equal(await page.getByRole('button',{name:'Approve',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:/Bulk Action Selected/}).count(),0);
  assert.equal(await page.getByRole('button',{name:/Action (Single|Active)/}).count(),0);
  await page.close();
 }
 console.log('PASS: independent approve/reject, server versions and canonical status, completed row and bulk actions disappear.');
}finally{await browser.close();}
