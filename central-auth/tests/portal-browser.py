# Start tests/serve-portal.mjs with a temporary localhost TLS certificate first.
from playwright.sync_api import sync_playwright
import json,urllib.parse
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(ignore_https_errors=True,viewport={'width':390,'height':844})
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.route('https://**',lambda route:route.continue_() if route.request.url.startswith('https://127.0.0.1:8798') else route.abort())
 page.goto('https://127.0.0.1:8798/')
 for name in ['BOST','LEL','Tekken','eFLL']:assert page.get_by_role('heading',name=name,exact=True).count()==1
 assert 'The Elite' not in page.locator('body').inner_text()
 page.get_by_role('link',name='tetapkan e-mel dan kata laluan pusat').click()
 page.locator('[name=email]').fill('shared@example.test')
 page.locator('[name=password]').fill('QA-shared-password-2026')
 page.locator('[name=confirm]').fill('QA-shared-password-2026')
 page.get_by_role('button',name='Simpan akaun pusat').click()
 page.get_by_role('link',name='Log masuk dan buka portal').click()
 page.locator('[name=email]').fill('shared@example.test');page.locator('[name=password]').fill('QA-shared-password-2026')
 page.get_by_role('button',name='Log masuk',exact=True).click();page.wait_for_url('https://127.0.0.1:8798/')
 page.locator('article').filter(has=page.get_by_role('heading',name='Tekken',exact=True)).get_by_role('link',name='Admin',exact=True).click()
 page.wait_for_url('**/tekken/')
 save=page.get_by_role('button',name='Simpan ke server',exact=True);save.wait_for(state='visible')
 names=['Labuan Player '+str(i+1) for i in range(16)]
 page.locator('details.names > summary').click();page.locator('#names').fill('\n'.join(names));page.locator('#apply').click();save.click()
 page.get_by_role('status').filter(has_text='Perubahan disimpan').wait_for()
 page.reload();page.wait_for_function("document.getElementById('names').value.startsWith('Labuan Player 1')")
 payload=urllib.parse.quote(json.dumps({'id':'W1-1','players':names[:2],'format':'BO3'}))
 page.goto('https://127.0.0.1:8798/tekken/match-v3.html#'+payload)
 page.get_by_role('button',name='Simpan ke server',exact=True).wait_for(state='visible')
 page.locator('[data-edit="char0_1"]').click();page.get_by_role('button',name='King',exact=True).click()
 page.get_by_role('button',name='Simpan ke server',exact=True).click();page.get_by_role('status').filter(has_text='Perubahan disimpan').wait_for()
 page.reload();page.wait_for_function("document.getElementById('char0_1').textContent==='King'")
 page.locator('#adminToggle').click();page.wait_for_url('https://127.0.0.1:8798/')
 page.goto('https://127.0.0.1:8798/tekken/');page.get_by_role('status').filter(has_text='Paparan awam').wait_for()
 assert page.get_by_role('button',name='Simpan ke server',exact=True).is_hidden()
 assert not errors,errors
 print('Full browser QA passed: owner setup, one login, automatic Tekken access, real SQLite save/reload, Character selection and logout; no JavaScript errors.')
 browser.close()
