from playwright.sync_api import sync_playwright
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--no-proxy-server','--host-resolver-rules=MAP home.test 127.0.0.1, MAP issuer.test 127.0.0.1, MAP efll.test 127.0.0.1'])
 page=browser.new_page(ignore_https_errors=True,viewport={'width':390,'height':844})
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.route('https://**',lambda route:route.continue_() if any(host in route.request.url for host in ['home.test:8800','issuer.test:8798','efll.test:8801']) else route.abort())
 page.goto('https://home.test:8800/esports/')
 page.locator('#loginForm').wait_for(state='visible')
 page.screenshot(path='/workspace/esports-home-login-preview.png',full_page=True)
 page.locator('#email').fill('shared@example.test');page.locator('#password').fill('wrong-password');page.locator('#loginButton').click()
 page.locator('#loginError').filter(has_text='tidak sah').wait_for()
 page.locator('#password').fill('QA-shared-password-2026');page.locator('#loginButton').click()
 page.locator('body:not(.locked)').wait_for(state='visible')
 page.locator('[data-app=efll]').click()
 page.wait_for_url('https://efll.test:8801/admin');assert page.locator('input[type=password]').count()==0
 assert page.get_by_role('heading',name='eFLL admin').count()==1
 page.goto('https://home.test:8800/esports/');page.locator('body:not(.locked)').wait_for(state='visible')
 page.reload();page.locator('body:not(.locked)').wait_for(state='visible')
 page.locator('[data-app=tekken]').click();page.wait_for_url('https://issuer.test:8798/tekken/')
 assert page.locator('input[type=password]').count()==0
 save=page.get_by_role('button',name='Simpan ke server',exact=True);save.wait_for(state='visible')
 page.locator('details.names > summary').click();page.locator('#names').fill('\n'.join('Player '+str(i+1) for i in range(16)));page.locator('#apply').click();save.click();page.get_by_role('status').filter(has_text='Perubahan disimpan').wait_for()
 page.locator('#auth').click();page.wait_for_url('https://home.test:8800/esports/')
 page.locator('#loginForm').wait_for(state='visible');assert page.locator('body').get_attribute('class')=='locked'
 page.goto('https://efll.test:8801/admin');page.wait_for_url('https://home.test:8800/esports/')
 page.locator('#loginForm').wait_for(state='visible')
 assert not errors,errors
 print('Browser QA passed: login exists only on the home origin; wrong password, restore/reload, eFLL and Tekken SSO, save and global logout validated with real SQLite.')
 browser.close()
