import json,urllib.parse
from playwright.sync_api import sync_playwright
# Start a static server for .cloudflare/elite/assets on port 8796 first. APIs are mocked; server auth is covered by the SQLite integration tests.
state={'data':None,'version':0,'admin':True};errors=[]
def route_api(route):
 req=route.request;url=req.url
 if '/api/admin/session' in url:result={'admin':state['admin']}
 elif '/api/tekken/tournament' in url:
  if req.method=='PUT':
   body=json.loads(req.post_data);state['data']=body['data'];state['version']+=1;result={'ok':True,'version':state['version']}
  else:result={'data':state['data'],'version':state['version']}
 elif '/api/tekken/match' in url:
  result={'data':{'id':'W1-1','players':state['data']['names'][:2],'score':None,'format':'BO3','datetime':'','live':False,'photos':{},'selection':state['data']['selections'].get('W1-1',{})},'version':state['version']}
 elif '/api/tekken/selection' in url:
  body=json.loads(req.post_data);state['data']['selections'][body['matchId']]=body['data'];state['version']+=1;result={'ok':True,'version':state['version']}
 else:result={}
 route.fulfill(status=200,content_type='application/json',body=json.dumps(result))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/**',route_api)
 page.route('https://**',lambda r:r.abort())
 page.goto('http://127.0.0.1:8796/tekken/index.html')
 save=page.get_by_role('button',name='Simpan ke server',exact=True);save.wait_for(state='visible')
 names=['Labuan Player '+str(i+1) for i in range(16)]
 page.locator('details.names > summary').click();page.locator('#names').fill('\n'.join(names));page.locator('#apply').click();save.click()
 page.get_by_role('status').filter(has_text='Perubahan disimpan').wait_for()
 assert state['data']['names'][0]=='Labuan Player 1'
 page.reload();page.wait_for_function("document.getElementById('names').value.startsWith('Labuan Player 1')")
 payload=urllib.parse.quote(json.dumps({'id':'W1-1','players':names[:2],'format':'BO3'}))
 page.goto('http://127.0.0.1:8796/tekken/match-v3.html#'+payload)
 page.get_by_role('button',name='Simpan ke server',exact=True).wait_for(state='visible')
 page.locator('[data-edit="char0_1"]').click();page.get_by_role('button',name='King',exact=True).click()
 page.get_by_role('button',name='Simpan ke server',exact=True).click();page.get_by_role('status').filter(has_text='Perubahan disimpan').wait_for()
 assert state['data']['selections']['W1-1']['char0_1']=='King'
 state['admin']=False
 page.goto('http://127.0.0.1:8796/tekken/index.html');page.get_by_role('status').filter(has_text='Paparan awam').wait_for()
 assert page.get_by_role('button',name='Simpan ke server',exact=True).is_hidden()
 assert not errors,errors
 print('Browser QA passed: mobile roster edit, server save/reload, match selection save, public read-only UI; no JavaScript errors.')
 browser.close()
