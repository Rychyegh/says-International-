// Synthetic backend; never sends real attendance or SMS.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let rows=[], scans=[],fail=false,balanceCalls=0;
 const student={id:'11111111-1111-4111-8111-111111111111',student_id:'REMALJ-TEST',student_code:'REMALJ-TEST',full_name:'Attendance Student',rfid_card_code:'CARD-123',status:'Active',is_active:true,class_level:'Basic 1'};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[],status=200;
  if(path.endsWith('/students'))data=[student];
  if(path.endsWith('/attendance/logs'))data={logs:rows};
  if(path.endsWith('/attendance/sms-balance'))balanceCalls++;
  if(path.endsWith('/attendance/scan')){
   const payload=req.postDataJSON();scans.push(payload);
   if(fail){status=422;data={detail:'Card inactive'};}
   else {rows=[{id:'saved-1',student_id:student.id,date:new Date().toISOString().slice(0,10),time:'08:20',scan_type:payload.scan_type,sms_status:'Not requested'}];data={success:true};}
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 const url='http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=attendance';
 await page.goto(url);
 await page.getByText('Attendance Student',{exact:true}).first().waitFor();
 const input=page.getByPlaceholder(/Tap \/ Scan Card/);
 await page.getByRole('checkbox',{name:/Send Arrival/}).uncheck();
 await input.fill('CARD-123');await input.press('Enter');
 await page.getByText(/Attendance saved: Attendance Student/).waitFor();
 assert.deepEqual(scans[0],{identifier:'CARD-123',scan_type:new Date().getHours()<12?'check_in':'check_out',send_sms:false});
 await page.reload();
 await page.getByRole('button',{name:/Attendance Records.*\(1\)/}).waitFor();
 await page.getByPlaceholder(/Tap \/ Scan Card/).fill('CARD-123');await page.getByPlaceholder(/Tap \/ Scan Card/).press('Enter');
 await page.getByText(/Attendance already recorded/).waitFor();assert.equal(scans.length,1);
 rows=[];fail=true;await page.reload();
 await page.getByText('Attendance Student',{exact:true}).first().waitFor();
 await page.getByPlaceholder(/Tap \/ Scan Card/).fill('CARD-123');await page.getByPlaceholder(/Tap \/ Scan Card/).press('Enter');
 await page.getByText(/Attendance save not confirmed/).waitFor();
 assert.equal(rows.length,0);await page.getByRole('button',{name:/Attendance Records.*\(0\)/}).waitFor();
 assert.equal(balanceCalls,0);assert.equal(await page.getByText(/SMS Credits/).count(),0);assert.deepEqual(errors,[]);
 console.log('Attendance saves through snake_case API, restores on refresh, prevents duplicate, rejects phantom records, and removes credits widget.');
} finally {await browser.close();}
