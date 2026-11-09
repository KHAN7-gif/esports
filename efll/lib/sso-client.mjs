const COOKIE='__Host-esports-sso';
const FLOW='__Host-esports-flow';
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const read=(req,name)=>(req.headers.get('Cookie')||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(name+'='))?.slice(name.length+1)||'';
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=${name===FLOW?'None':'Lax'}; Max-Age=${age}`;
const noStore={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function redirect(location,cookies=[]){const headers=new Headers({...noStore,Location:location});cookies.forEach(c=>headers.append('Set-Cookie',c));return new Response(null,{status:303,headers})}
export function ssoEnabled(env){return env.SSO_ENABLED==='true'||env.SSO_ENABLED==='auto'}
export function ssoConfig(env){if(!ssoEnabled(env))return null;try{const url=new URL(env.SSO_ISSUER);if(url.protocol!=='https:'||!['/','/sso','/sso/'].includes(url.pathname)||url.search||url.hash||url.username||url.password||!/^[-a-z0-9]+$/.test(env.SSO_CLIENT_ID||''))return null;return {issuer:url.origin+(url.pathname==='/'?'':url.pathname.replace(/\/$/,'')),clientId:env.SSO_CLIENT_ID,serviceToken:env.SSO_SERVICE_TOKEN,loginHome:env.SSO_LOGIN_HOME}}catch{return null}}
async function call(url,init,config){const headers=new Headers(init.headers);if(config?.serviceToken)headers.set('OAI-Sites-Authorization','Bearer '+config.serviceToken);return fetch(url,{...init,headers,redirect:'error',signal:AbortSignal.timeout(5000)})}
export async function ssoReady(env){
 if(env.SSO_ENABLED!=='auto')return ssoEnabled(env);
 const config=ssoConfig(env);if(!config)return true;
 try{const result=await call(config.issuer+'/health',{},config);if(!result.ok)return true;const status=await result.json();return !(status.service==='esports-central-auth'&&status.configured===false)}catch{return true}
}
export async function ssoUser(req,env){const c=ssoConfig(env);if(!c)return null;const token=read(req,COOKIE);if(!/^[-_A-Za-z0-9]{43}$/.test(token))return null;try{const r=await call(c.issuer+'/userinfo?'+new URLSearchParams({client_id:c.clientId}),{headers:{Authorization:'Bearer '+token}},c);if(!r.ok)return null;const body=await r.json();return body.role==='superadmin'&&typeof body.email==='string'&&Number.isFinite(body.expires_at)&&body.expires_at>Date.now()/1000?body:null}catch{return null}}
export async function ssoRoute(req,env){const path=new URL(req.url).pathname;if(!['/api/sso/start','/api/sso/callback','/api/sso/logout'].includes(path))return null;
 if(!ssoEnabled(env))return new Response('Login pusat belum diaktifkan.',{status:404,headers:noStore});
 const config=ssoConfig(env);if(!config)return new Response('Konfigurasi login pusat belum lengkap.',{status:503,headers:noStore});
 const url=new URL(req.url),callback=url.origin+'/api/sso/callback';
 if(path==='/api/sso/logout'){
  if(req.method!=='POST'||req.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:noStore});
  if(config.loginHome){const home=new URL(config.loginHome);if(home.protocol!=='https:')return new Response('Invalid home configuration',{status:503});const token=read(req,COOKIE);if(token){try{const result=await call(config.issuer+'/revoke',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({client_id:config.clientId})},config);if(!result.ok)return new Response('Logout tidak dapat disahkan. Cuba semula.',{status:503,headers:noStore})}catch{return new Response('Logout tidak dapat disahkan. Cuba semula.',{status:503,headers:noStore})}}home.searchParams.set('logout','1');return redirect(home.href,[cookie(COOKIE,'',0),cookie(FLOW,'',0)])}
  return redirect(config.issuer+'/logout',[cookie(COOKIE,'',0),cookie(FLOW,'',0)]);
 }
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers:noStore});
 if(path==='/api/sso/start'){
  const state=random(),verifier=random(),challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const flow=b64(new TextEncoder().encode(JSON.stringify({state,verifier,created:Date.now()})));
  const target=new URL(config.issuer+'/authorize');target.search=new URLSearchParams({client_id:config.clientId,redirect_uri:callback,state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
  return redirect(target.href,[cookie(FLOW,flow,300)]);
 }
 let failure='FLOW_MISSING';
 try{
  const raw=read(req,FLOW);if(!raw)throw Error('Missing flow');failure='FLOW_INVALID';if(raw.length>2048)throw Error('Invalid flow');const flow=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
  if(!/^[-_A-Za-z0-9]{43}$/.test(flow.state||'')||flow.state!==url.searchParams.get('state')||!/^[-_A-Za-z0-9]{43}$/.test(flow.verifier||'')||!Number.isFinite(flow.created)||Date.now()-flow.created>300000||flow.created>Date.now()||!/^[-_A-Za-z0-9]{43}$/.test(url.searchParams.get('code')||''))throw Error('Invalid flow');
  failure='EXCHANGE_NETWORK';
  const response=await call(config.issuer+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,redirect_uri:callback,code:url.searchParams.get('code'),code_verifier:flow.verifier})},config);if(!response.ok){failure='EXCHANGE_HTTP_'+response.status;throw Error('Exchange rejected')}
  failure='TOKEN_INVALID';
  const body=await response.json();if(!/^[-_A-Za-z0-9]{43}$/.test(body.access_token||'')||!Number.isInteger(body.expires_in)||body.expires_in<=0||body.expires_in>28800)throw Error('Invalid token');
  return redirect('/admin',[cookie(COOKIE,body.access_token,body.expires_in),cookie(FLOW,'',0)]);
 }catch(error){
  // Log only a fixed stage and error type; never codes, cookies, tokens or URLs.
  console.warn('esports_sso_callback',JSON.stringify({client:config.clientId,stage:failure,error:error instanceof Error?error.name:'Error'}));
  const html=`<!doctype html><html lang="ms"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sambung login esports</title><body style="font:16px system-ui;max-width:32rem;margin:12vh auto;padding:24px;line-height:1.6"><h1>Sambung login esports</h1><p>Sesi sementara login tidak dapat disahkan. Mulakan semula dari pautan di bawah.</p><p><a href="/api/sso/start">Cuba semula</a></p><p>Gunakan pelayar dan tab yang sama sepanjang proses login.</p><small>Rujukan: ${failure}</small></body></html>`;
  return new Response(html,{status:400,headers:{...noStore,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",'Set-Cookie':cookie(FLOW,'',0)}})
 }

}
