from playwright.sync_api import sync_playwright
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--no-proxy-server','--host-resolver-rules=MAP home.test 127.0.0.1, MAP issuer.test 127.0.0.1, MAP bost.test 127.0.0.1, MAP lel.test 127.0.0.1, MAP efll.test 127.0.0.1'])
 context=browser.new_context(ignore_https_errors=True,viewport={'width':390,'height':844})
 page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
 page.route('https://**',lambda route:route.continue_() if any(host in route.request.url for host in ['home.test:8800','issuer.test:8798','bost.test:8801','lel.test:8802','efll.test:8803']) else route.abort())
 home='https://home.test:8800/esports/'
 page.goto(home);assert page.locator('input[type=password]').count()==0
 assert page.locator('.card').count()==4
 page.screenshot(path='/workspace/esports-directory-preview.png',full_page=True)
 for module,origin in [('bost','https://bost.test:8801'),('lel','https://lel.test:8802'),('efll','https://efll.test:8803'),('tekken','https://issuer.test:8798')]:
  page.goto(home);page.locator('[data-app='+module+']').click()
  if module=='tekken':
   page.wait_for_url(origin+'/tekken/');page.locator('#auth').click()
  else:page.get_by_role('link',name='Log masuk',exact=True).click()
  page.wait_for_selector('input[type=password]');assert page.url.startswith(origin+'/')
  page.locator('#email').fill('shared@example.test')
  if module=='bost':
   page.locator('#password').fill('wrong-password');page.get_by_role('button',name='Log masuk',exact=True).click();page.locator('#error').filter(has_text='tidak sah').wait_for()
   page.screenshot(path='/workspace/subweb-login-preview.png',full_page=True)
  page.locator('#password').fill('QA-shared-password-2026');page.get_by_role('button',name='Log masuk',exact=True).click()
  page.wait_for_url(origin+('/tekken/' if module=='tekken' else '/admin'))
  assert page.locator('input[type=password]').count()==0
  page.reload()
  if module=='tekken':page.get_by_role('button',name='Simpan ke server',exact=True).wait_for(state='visible')
  else:page.get_by_role('heading',name=('bots' if module=='bost' else module)+' admin').wait_for()
  assert page.evaluate('!Object.keys(localStorage).some(k=>/token|password|session/i.test(k))')
 # Logout is local: LEL remains authenticated after BOST logs out.
 page.goto('https://bost.test:8801/admin');page.get_by_role('button',name='Log keluar',exact=True).click();page.wait_for_url('https://bost.test:8801/')
 page.goto('https://lel.test:8802/admin');page.get_by_role('heading',name='lel admin').wait_for()
 page.goto('https://bost.test:8801/admin');page.wait_for_selector('input[type=password]')
 assert not errors,errors
 print('Browser QA passed: public directory, four local login forms, same account, wrong password, session reload, independent logout and protected admin views.')
 browser.close()
