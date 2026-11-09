const COOKIE='__Host-esports-sso';
const FLOW='__Host-esports-flow';
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const read=(req,name)=>(req.headers.get('Cookie')||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(name+'='))?.slice(name.length+1)||'';
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const noStore={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function redirect(location,cookies=[]){const headers=new Headers({...noStore,Location:location});cookies.forEach(c=>headers.append('Set-Cookie',c));return new Response(null,{status:303,headers})}
export function ssoEnabled(env){return env.SSO_ENABLED==='true'}
export function ssoConfig(env){if(!ssoEnabled(env))return null;try{const url=new URL(env.SSO_ISSUER);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!/^[-a-z0-9]+$/.test(env.SSO_CLIENT_ID||''))return null;return {issuer:url.origin,clientId:env.SSO_CLIENT_ID,serviceToken:env.SSO_SERVICE_TOKEN}}catch{return null}}
async function call(url,init,config){const headers=new Headers(init.headers);if(config?.serviceToken)headers.set('OAI-Sites-Authorization','Bearer '+config.serviceToken);return fetch(url,{...init,headers,redirect:'error',signal:AbortSignal.timeout(5000)})}
export async function ssoUser(req,env){const c=ssoConfig(env);if(!c)return null;const token=read(req,COOKIE);if(!/^[-_A-Za-z0-9]{43}$/.test(token))return null;try{const r=await call(c.issuer+'/userinfo?'+new URLSearchParams({client_id:c.clientId}),{headers:{Authorization:'Bearer '+token}},c);if(!r.ok)return null;const body=await r.json();return body.role==='superadmin'&&typeof body.email==='string'&&Number.isFinite(body.expires_at)&&body.expires_at>Date.now()/1000?body:null}catch{return null}}
export async function ssoRoute(req,env){const path=new URL(req.url).pathname;if(!['/api/sso/start','/api/sso/callback','/api/sso/logout'].includes(path))return null;
 if(!ssoEnabled(env))return new Response('Login pusat belum diaktifkan.',{status:404,headers:noStore});
 const config=ssoConfig(env);if(!config)return new Response('Konfigurasi login pusat belum lengkap.',{status:503,headers:noStore});
 const url=new URL(req.url),callback=url.origin+'/api/sso/callback';
 if(path==='/api/sso/logout'){
  if(req.method!=='POST'||req.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:noStore});
  return redirect(config.issuer+'/logout',[cookie(COOKIE,'',0),cookie(FLOW,'',0)]);
 }
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers:noStore});
 if(path==='/api/sso/start'){
  const state=random(),verifier=random(),challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const flow=b64(new TextEncoder().encode(JSON.stringify({state,verifier,created:Date.now()})));
  const target=new URL(config.issuer+'/authorize');target.search=new URLSearchParams({client_id:config.clientId,redirect_uri:callback,state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
  return redirect(target.href,[cookie(FLOW,flow,300)]);
 }
 try{
  const raw=read(req,FLOW);if(raw.length>2048)throw Error('Invalid flow');const flow=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
  if(!/^[-_A-Za-z0-9]{43}$/.test(flow.state||'')||flow.state!==url.searchParams.get('state')||!/^[-_A-Za-z0-9]{43}$/.test(flow.verifier||'')||!Number.isFinite(flow.created)||Date.now()-flow.created>300000||flow.created>Date.now()||!/^[-_A-Za-z0-9]{43}$/.test(url.searchParams.get('code')||''))throw Error('Invalid flow');
  const response=await call(config.issuer+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,redirect_uri:callback,code:url.searchParams.get('code'),code_verifier:flow.verifier})},config);if(!response.ok)throw Error('Exchange rejected');
  const body=await response.json();if(!/^[-_A-Za-z0-9]{43}$/.test(body.access_token||'')||!Number.isInteger(body.expires_in)||body.expires_in<=0||body.expires_in>28800)throw Error('Invalid token');
  return redirect('/admin',[cookie(COOKIE,body.access_token,body.expires_in),cookie(FLOW,'',0)]);
 }catch{return new Response('Login gagal atau tamat. Buka /api/sso/start untuk cuba semula.',{status:400,headers:{...noStore,'Set-Cookie':cookie(FLOW,'',0)}})}
}
