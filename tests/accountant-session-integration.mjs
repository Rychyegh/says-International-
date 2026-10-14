import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
try {
 const page=await browser.newPage();let verified=false,protectedBeforeVerified=0,denyNext=false,pinCalls=0;
 const testRole=process.env.SESSION_TEST_ROLE||'accountant';
 const user={id:'accounts-1',role:testRole,fullName:'Accounts Test',email:'accounts@test.com'};
 await page.addInitScript(role=>{localStorage.setItem('auth_token','primary');localStorage.setItem('auth_user',JSON.stringify({id:'accounts-1',role}));localStorage.setItem('says_authed_portals',JSON.stringify({accountant:true}));localStorage.setItem('says_accountant_active_nav','Account Records');},testRole);
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let status=200,data=[];
  if(path.endsWith('/auth/me'))data={user,requiresSecondFactor:!verified,pinSetupRequired:false};
  else if(path.endsWith('/auth/verify-admin-pin')){pinCalls++;if(req.postDataJSON().pin!=='2468'){status=401;data={detail:'Invalid PIN'};}else{verified=true;data={user,token:`verified-${pinCalls}`,requiresSecondFactor:false};}}
  else if(path.endsWith('/auth/login'))data={user,token:'primary',requiresSecondFactor:!verified};
  else {
   if(!verified)protectedBeforeVerified++;
   if(denyNext&&path.endsWith('/finance/accounting/journals')){denyNext=false;verified=false;status=403;data={code:'SESSION_VERIFICATION_REQUIRED',detail:'Complete session verification before accessing this resource'};}
   else if(path.includes('/accounting/'))data={items:[],next_cursor:null};
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:5179'}/#/accountant`);
 await page.getByRole('heading',{name:'Accountant Security PIN'}).waitFor();assert.equal(protectedBeforeVerified,0);
 await page.locator('#admin-pin-input').fill('0000');await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();await page.getByText('Invalid PIN',{exact:false}).waitFor();assert.equal(protectedBeforeVerified,0);
 await page.locator('#admin-pin-input').fill('2468');await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();
 await page.locator('.sidebar-item').filter({hasText:'Account Records'}).click();await page.getByRole('heading',{name:'Prepare journal / opening balances'}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auth_user')).role),testRole);
 denyNext=true;await page.getByRole('button',{name:'Refresh journals',exact:true}).click();await page.getByRole('heading',{name:'Accountant Security PIN'}).waitFor();
 await page.locator('#admin-pin-input').fill('2468');await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();await page.getByRole('heading',{name:'Prepare journal / opening balances'}).waitFor();
 assert.equal(protectedBeforeVerified,0);assert.equal(await page.evaluate(()=>localStorage.getItem('says_accountant_active_nav')),'Account Records');
 await page.evaluate(()=>window.dispatchEvent(new Event('says_reauthenticate')));
 // Fully verified /auth/me does not force PIN again: credential view remains available.
 await page.locator('#accountant-email').waitFor();
 console.log('PASS: restored accountant session is gated, wrong PIN cannot load finance, verified token enables access, verification 403 recovers to the same section.');
} finally {await browser.close();}
