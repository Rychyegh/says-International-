// Synthetic backend only; no live payments are created.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let mode='reject',calls=[],fee={id:'invoice-1',student_id:'student-1',student_name:'Payment Student',billed_amount:100,paid_amount:0,balance:100};
const committed=new Map();
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[],status=200;
  if(path.endsWith('/finance/fees'))data=[fee];
  if(path.endsWith('/finance/fees/invoice-1/pay')){
   const key=req.headers()['idempotency-key'],payload=req.postDataJSON();calls.push({key,payload});
   if(mode==='reject'){status=422;data={detail:'Check transaction reference'};}
   else if(committed.has(key))data=committed.get(key);
   else {
    fee={...fee,paid_amount:fee.paid_amount+payload.paidAmount,balance:fee.balance-payload.paidAmount};
    data={success:true,message:'Payment recorded',updatedFee:fee,receipt_number:mode==='no-receipt'?null:'RCPT-SAVED-001'};
    committed.set(key,data);
    if(mode==='lost'){await route.abort('connectionreset');return;}
   }
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts');
 await page.getByRole('button',{name:'Receive Payments',exact:true}).click();
 const form=page.getByRole('form',{name:'Receive student payment'});
 await form.getByLabel('Student invoice',{exact:true}).selectOption('invoice-1');
 await form.getByLabel('Amount received (GHS)',{exact:true}).fill('25');
 await form.getByLabel('Transaction reference',{exact:true}).fill('MOMO-123');
 await page.screenshot({path:'/private/tmp/receive-payment-page.png',fullPage:true});
 await form.getByRole('button',{name:'Receive Payment & Print Receipt'}).click();
 await page.getByRole('alert').filter({hasText:'Check transaction reference'}).waitFor();
 assert.equal(await form.getByLabel('Transaction reference',{exact:true}).isEnabled(),true);
 assert.equal(committed.size,0);
 mode='lost';
 await form.getByRole('button',{name:'Receive Payment & Print Receipt'}).click();
 await page.getByRole('button',{name:'Retry original payment'}).waitFor();
 assert.equal(fee.paid_amount,25);
 const original=calls.at(-1);
 await page.reload();
 await page.getByRole('button',{name:'Retry original payment'}).waitFor();
 assert.equal(await form.getByLabel('Amount received (GHS)',{exact:true}).inputValue(),'25');
 assert.equal(await form.getByLabel('Amount received (GHS)',{exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Retry original payment'}).click();
 const receipt=page.getByRole('dialog',{name:'Print student receipt'});
 await receipt.getByText('RCPT-SAVED-001',{exact:true}).waitFor();
 assert.deepEqual(calls.at(-1),original);assert.equal(committed.size,1);assert.equal(fee.paid_amount,25);
 assert.match(original.payload.paymentDate,/T00:00:00Z$/);
 assert.equal(await page.evaluate(()=>window.testStore.studentFees[0].balance),75);
 await page.evaluate(()=>{window.print=()=>{window.didPrint=true;window.dispatchEvent(new Event('afterprint'));};});
 const before=calls.length;
 await receipt.getByRole('button',{name:'Print Receipt',exact:true}).click();
 await receipt.waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>window.didPrint),true);assert.equal(calls.length,before);
 await page.getByRole('button',{name:'Print Receipt',exact:true}).click();await receipt.waitFor();
 assert.equal(calls.length,before);
 await receipt.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Receive another payment',exact:true}).click();
 mode='no-receipt';
 await form.getByLabel('Student invoice',{exact:true}).selectOption('invoice-1');
 await form.getByLabel('Amount received (GHS)',{exact:true}).fill('10');
 await form.getByRole('button',{name:'Receive Payment & Print Receipt'}).click();
 await page.getByText('The payment is saved, but the server did not return a receipt number.',{exact:false}).waitFor();
 assert.equal(fee.paid_amount,35);
 assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.getByRole('button',{name:'Receive Payment & Print Receipt'}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Print Receipt',exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: Receive Payments tab, validation rejection, saved-input recovery after lost response and refresh, same-key replay, updatedFee handling, exact receipt printing without another payment.');
}finally{await browser.close();}
