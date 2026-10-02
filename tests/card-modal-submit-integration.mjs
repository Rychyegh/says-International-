import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let writes=0,fail=true;
let student={id:'11111111-1111-4111-8111-111111111111',full_name:'Card Student',student_id:'STU-1001',status:'Active',is_active:true};
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let value=[],status=200;
  if(path.endsWith('/auth/me'))value={user:{id:'head',role:'head_admin'},requiresSecondFactor:false};
  if(path.endsWith('/students'))value={students:[student],total:1};
  if(path.endsWith('/students/'+student.id)&&['PUT','PATCH'].includes(req.method())) {
   writes++;await new Promise(resolve=>setTimeout(resolve,500));
   if(fail){status=403;value={detail:'Card assignment denied'};}
   else {student={...student,...req.postDataJSON()};value=student;}
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.addInitScript(()=>{
  localStorage.setItem('auth_token','opaque-head');localStorage.setItem('auth_user',JSON.stringify({id:'head',role:'head_admin'}));
  localStorage.setItem('says_authed_portals',JSON.stringify({admin:true}));localStorage.setItem('says_admin_active_nav','Card Issuance & Smart Identity');
 });
 await page.goto('http://127.0.0.1:5179/#/admin');
 await page.getByRole('button',{name:'Encode & Issue Card',exact:false}).last().click();
 const modal=page.getByRole('dialog');
 const submit=modal.getByRole('button',{name:'Write & Activate RFID Card',exact:false});
 await submit.click();assert.equal(writes,0);assert.equal(await modal.count(),1);
 await modal.getByPlaceholder('e.g. RFID-8849-2026 or tap RFID scanner').fill('CARD-1234');
 await submit.click();
 await modal.getByRole('button',{name:'Saving card…'}).waitFor();
 await modal.getByRole('alert').filter({hasText:'Card assignment denied'}).waitFor();
 assert.equal(await modal.getByPlaceholder('e.g. RFID-8849-2026 or tap RFID scanner').inputValue(),'CARD-1234');
 fail=false;await submit.click();
 await modal.waitFor({state:'detached'});
 assert.equal(writes,2);
 await page.getByText('CARD-1234',{exact:true}).waitFor();
 console.log('PASS: empty input stays open, saving feedback, inline failure preserves input, successful save closes popup and updates registry.');
} finally {await browser.close();}
