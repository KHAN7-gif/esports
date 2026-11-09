import {handleSubwebLogin} from './subweb-api.mjs';
import {localUser,localLoginRoute} from './local-login.mjs';
import {handlePortalApi,homeAuthorize,loginHome} from './portal-api.mjs';
import auth,{centralIdentity,centralLogout,clientIdentity} from './index.js';
import {handleTekken} from './tekken-api.mjs';
import assets from './assets.generated.js';
const FLOW='__Host-esports-portal-flow';
const noStore={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const cookie=(value,age=300)=>`${FLOW}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const random=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const encode=value=>btoa(JSON.stringify(value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function redirect(location,cookies=[]){const headers=new Headers({...noStore,Location:location});for(const value of cookies)headers.append('Set-Cookie',value);return new Response(null,{status:303,headers})}
const readCookie=(req,name)=>(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';
async function configured(origin,env){const result=await auth.fetch(new Request(origin+'/health'),env);if(!result.ok)return false;return (await result.json()).configured===true}
export default {async fetch(req,env,ctx){const url=new URL(req.url),path=url.pathname;const local=env.SUBWEB_LOGIN_ENABLED==='true',tekkenEnv={...env,SSO_ISSUER:url.origin,SSO_CLIENT_ID:'tekken'},home=local?null:loginHome(env);const identity=()=>local?localUser(req,tekkenEnv):home?clientIdentity(req,env,'tekken'):centralIdentity(req,env);try{
 if(local&&path==='/subweb-api/login')return handleSubwebLogin(req,env);
 if(local&&(path==='/login'||path.startsWith('/api/sso/')))return await localLoginRoute(req,tekkenEnv)??new Response('Not found',{status:404});
 if(local&&path==='/')return redirect('/tekken/');
 if(path.startsWith('/portal-api/')||path==='/revoke')return handlePortalApi(req,env);
 if(home&&path==='/authorize')return homeAuthorize(req,env);
 if(home&&path==='/login'&&req.method==='POST')return Response.json({error:'Login hanya di halaman utama esports.'},{status:409});
 if(home&&path==='/'&&req.method==='GET')return redirect(home.href);
 if(path==='/api/admin/session')return Response.json({admin:!!await identity()},{headers:noStore});
 if(path==='/api/admin/logout'){
  if(req.method!=='POST'||req.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:noStore});
  if(local){const result=await localLoginRoute(new Request(url.origin+'/api/sso/logout',req),tekkenEnv);const h=new Headers(noStore);for(const c of result.headers.getSetCookie())h.append('Set-Cookie',c);return Response.json({ok:true,home_url:'/tekken/'},{headers:h})}
  if(home){const token=readCookie(req,'__Host-esports-sso');if(token){const result=await handlePortalApi(new Request(url.origin+'/revoke',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({client_id:'tekken'})}),env);if(!result.ok)return result;}const destination=new URL(home);destination.searchParams.set('logout','1');return Response.json({ok:true,home_url:destination.href},{headers:{...noStore,'Set-Cookie':'__Host-esports-sso=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}})}
  return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':await centralLogout(req,env)}});
 }
 if(home&&path.startsWith('/api/tekken/')&&!await identity())return Response.json({error:'Log masuk melalui halaman utama esports.'},{status:401,headers:noStore});
 if(path.startsWith('/api/tekken/'))return handleTekken(req,env,async()=>!!await identity());
 if(path==='/login'&&req.method==='GET'){
  if(!await configured(url.origin,env))return redirect(home?home.href:'/setup');
  const target=url.searchParams.get('return_to')==='/tekken/'?'/tekken/':'/';
  const state=random(),verifier=random(),bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  const challenge=btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const dest=new URL('/authorize',url);dest.search=new URLSearchParams({client_id:'tekken',redirect_uri:url.origin+'/portal-callback',state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
  return redirect(dest.href,[cookie(encode({state,verifier,target,created:Date.now()}))]);
 }
 if(path==='/portal-callback'&&req.method==='GET'){
  try{const raw=readCookie(req,FLOW);if(raw.length>2048)throw Error('Bad flow');const flow=JSON.parse(atob(raw.replace(/-/g,'+').replace(/_/g,'/')));
   if(!/^[-_A-Za-z0-9]{43}$/.test(flow.state||'')||flow.state!==url.searchParams.get('state')||!/^[-_A-Za-z0-9]{43}$/.test(flow.verifier||'')||!Number.isFinite(flow.created)||Date.now()-flow.created>300000||flow.created>Date.now()||!['/','/tekken/'].includes(flow.target)||!/^[-_A-Za-z0-9]{43}$/.test(url.searchParams.get('code')||''))throw Error('Bad state');
   const token=await auth.fetch(new Request(url.origin+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:'tekken',redirect_uri:url.origin+'/portal-callback',code:url.searchParams.get('code'),code_verifier:flow.verifier})}),env);
   if(!token.ok)throw Error('Login rejected');if(home){const result=await token.json();if(!/^[-_A-Za-z0-9]{43}$/.test(result.access_token||'')||!Number.isInteger(result.expires_in)||result.expires_in<=0||result.expires_in>28800)throw Error('Invalid token');return redirect(flow.target,[cookie('',0),`__Host-esports-sso=${result.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${result.expires_in}`]);}if(!await centralIdentity(req,env))throw Error('Login rejected');return redirect(flow.target,[cookie('',0)]);
  }catch{return new Response('Sesi login tamat. Buka /login untuk cuba semula.',{status:400,headers:{...noStore,'Set-Cookie':cookie('',0)}})}
 }
 if(path==='/authorize'&&!await configured(url.origin,env))return redirect('/setup');
 if(home&&path.startsWith('/tekken/')&&(path.endsWith('/')||path.endsWith('.html'))&&!await identity())return redirect('/login?return_to=%2Ftekken%2F');
 if(path==='/admin')return redirect('/login');
 if(path==='/esports'||path==='/esports/')return redirect(home?home.href:'/');
 if(path==='/tekken')return redirect('/tekken/');
 if(['/tekken/match.html','/tekken/match-v2.html'].includes(path))return redirect('/tekken/match-v3.html'+url.search);
 if(path==='/'&&req.method==='GET'){
  const ready=await configured(url.origin,env),notice=ready?'<p class="intro">Akaun pusat tersedia. Log masuk sekali untuk mengurus empat kejohanan.</p>':'<div class="notice">Persediaan sekali sahaja: <a href="/setup">tetapkan e-mel dan kata laluan pusat</a>. Akses persediaan terhad kepada pemilik portal.</div>';
  return new Response(assets['portal.html'].replace('{{SETUP_NOTICE}}',notice),{headers:{...noStore,'Content-Type':'text/html;charset=utf-8','X-Frame-Options':'DENY'}});
 }
 const key=path==='/tekken/'?'tekken/index.html':path.slice(1);
 if(req.method==='GET'&&Object.hasOwn(assets,key)){
  const ext=key.split('.').pop(),type={html:'text/html;charset=utf-8',js:'text/javascript;charset=utf-8',json:'application/json',svg:'image/svg+xml'}[ext]||'text/plain';
  return new Response(assets[key],{headers:{...noStore,'Content-Type':type,'X-Frame-Options':'DENY'}});
 }
 return auth.fetch(req,env,ctx);
 }catch{return Response.json({error:'Portal tidak tersedia. Cuba semula.'},{status:503,headers:noStore})}},scheduled:(event,env,ctx)=>auth.scheduled?.(event,env,ctx)};
