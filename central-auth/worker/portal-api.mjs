import {portalAccountConfig,portalPasswordMatches,portalRevision,authRequest} from './index.js';
const encoder=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const hash=async value=>b64(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const now=()=>Math.floor(Date.now()/1000);
const bearer=req=>req.headers.get('Authorization')?.match(/^Bearer ([-_A-Za-z0-9]{43})$/)?.[1];
export function loginHome(env){try{const u=new URL(env.LOGIN_HOME_URL);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash?u:null}catch{return null}}
function cors(req,home){return {'Access-Control-Allow-Origin':home.origin,'Vary':'Origin','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}}
const json=(req,home,value,status=200)=>Response.json(value,{status,headers:cors(req,home)});
async function body(req){const reader=req.body?.getReader();if(!reader)throw Error('Body required');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw Error('Payload too large')}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes))}
async function current(req,env){const token=bearer(req);if(!token)return null;const account=await portalAccountConfig(env);if(!account.ADMIN_EMAIL||!account.ADMIN_PASSWORD_HASH||!account.ADMIN_PASSWORD_SALT)return null;return env.DB.prepare('SELECT * FROM sso_sessions WHERE id=? AND expires_at>? AND credential_version=?').bind(await hash(token),now(),await portalRevision(account)).first()}
async function limited(env,ids,max=10){for(const id of ids){const row=await env.DB.prepare('INSERT INTO sso_attempts(id,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING attempts').bind(id,now()+900,now(),now(),now()+900).first();if(row.attempts>max)return true}return false}
export async function homeAuthorize(req,env){const home=loginHome(env);if(!home)return null;const auth=authRequest(new URL(req.url),env);if(req.method!=='GET'||!auth)return Response.json({error:'Permintaan login tidak sah.'},{status:400,headers:{'Cache-Control':'no-store'}});if(await limited(env,[await hash('home-request|'+(req.headers.get('cf-connecting-ip')||'unknown'))],60))return Response.json({error:'Terlalu banyak permintaan. Cuba semula kemudian.'},{status:429});await env.DB.prepare('DELETE FROM portal_requests WHERE expires_at<=?').bind(now()).run();const ticket=random();await env.DB.prepare('INSERT INTO portal_requests(id,client_id,redirect_uri,state,challenge,expires_at) VALUES(?,?,?,?,?,?)').bind(await hash(ticket),auth.clientId,auth.redirectUri,auth.state,auth.challenge,now()+300).run();home.searchParams.set('request',ticket);return new Response(null,{status:303,headers:{Location:home.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})}
export async function handlePortalApi(req,env){const home=loginHome(env),url=new URL(req.url),path=url.pathname;if(!home)return new Response('Not found',{status:404});
 if(path==='/revoke'){
  if(req.method!=='POST'||req.headers.get('Origin')&&req.headers.get('Origin')!==url.origin)return Response.json({error:'Forbidden'},{status:403});
  try{const input=await body(req),token=bearer(req),account=await portalAccountConfig(env);if(!token||typeof input.client_id!=='string'||!account.ADMIN_EMAIL)return Response.json({error:'Sesi tidak sah.'},{status:401});const row=await env.DB.prepare('SELECT s.id FROM sso_tokens t JOIN sso_sessions s ON s.id=t.session_id WHERE t.id=? AND t.client_id=? AND t.expires_at>? AND s.expires_at>? AND s.credential_version=?').bind(await hash(token),input.client_id,now(),now(),await portalRevision(account)).first();if(!row)return Response.json({ok:true});await env.DB.prepare('DELETE FROM sso_sessions WHERE id=?').bind(row.id).run();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Permintaan tidak sah.'},{status:400})}
 }
 if(req.headers.get('Origin')!==home.origin)return new Response('Origin not allowed',{status:403});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors(req,home),'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'300'}});
 try{
  const account=await portalAccountConfig(env),configured=!!(account.ADMIN_EMAIL&&account.ADMIN_PASSWORD_HASH&&account.ADMIN_PASSWORD_SALT);
  if(path==='/portal-api/config'&&req.method==='GET')return json(req,home,{configured,setup_url:url.origin+'/setup'});
  if(path==='/portal-api/login'&&req.method==='POST'){
   if(!configured)return json(req,home,{error:'Akaun pusat belum disediakan. Pemilik perlu melengkapkan persediaan sekali sahaja.'},503);
   const input=await body(req);if(typeof input.email!=='string'||input.email.length>254||typeof input.password!=='string'||!input.password||input.password.length>256)return json(req,home,{error:'E-mel atau kata laluan tidak sah.'},400);
   const limits=[await hash('home-ip|'+(req.headers.get('cf-connecting-ip')||'unknown')),await hash('home-account|'+input.email.trim().toLowerCase())];if(await limited(env,limits))return json(req,home,{error:'Terlalu banyak percubaan. Cuba semula selepas 15 minit.'},429);
   if(!await portalPasswordMatches(account,input.email,input.password))return json(req,home,{error:'E-mel atau kata laluan tidak sah.'},401);
   const token=random(),expiry=now()+28800;await env.DB.prepare('INSERT INTO sso_sessions(id,email,credential_version,expires_at) VALUES(?,?,?,?)').bind(await hash(token),account.ADMIN_EMAIL.trim().toLowerCase(),await portalRevision(account),expiry).run();return json(req,home,{token,user:{email:account.ADMIN_EMAIL.trim().toLowerCase(),expiresAt:expiry*1000}});
  }
  const session=await current(req,env);if(!session)return json(req,home,{error:'Sesi tamat. Log masuk semula di halaman esports.'},401);
  if(path==='/portal-api/session'&&req.method==='GET')return json(req,home,{user:{email:session.email,expiresAt:session.expires_at*1000}});
  if(path==='/portal-api/logout'&&req.method==='POST'){await env.DB.prepare('DELETE FROM sso_sessions WHERE id=?').bind(session.id).run();return json(req,home,{ok:true})}
  if(path==='/portal-api/approve'&&req.method==='POST'){
   const input=await body(req);if(!/^[-_A-Za-z0-9]{43}$/.test(input.request||''))return json(req,home,{error:'Permintaan subweb tidak sah.'},400);
   const id=await hash(input.request),row=await env.DB.prepare('SELECT * FROM portal_requests WHERE id=? AND expires_at>?').bind(id,now()).first();if(!row)return json(req,home,{error:'Permintaan subweb tamat. Buka semula subweb dari halaman utama.'},400);
   const check=new URL(url.origin+'/authorize');check.search=new URLSearchParams({client_id:row.client_id,redirect_uri:row.redirect_uri,state:row.state,code_challenge:row.challenge,code_challenge_method:'S256'}).toString();if(!authRequest(check,env))return json(req,home,{error:'Subweb tidak berdaftar.'},400);
   const used=await env.DB.prepare('DELETE FROM portal_requests WHERE id=? RETURNING id').bind(id).first();if(!used)return json(req,home,{error:'Permintaan telah digunakan.'},400);
   const code=random();await env.DB.prepare('INSERT INTO sso_codes(id,session_id,client_id,redirect_uri,challenge,expires_at) VALUES(?,?,?,?,?,?)').bind(await hash(code),session.id,row.client_id,row.redirect_uri,row.challenge,now()+60).run();const target=new URL(row.redirect_uri);target.searchParams.set('code',code);target.searchParams.set('state',row.state);return json(req,home,{redirect_url:target.href});
  }
  return json(req,home,{error:'Not found'},404);
 }catch{return json(req,home,{error:'Permintaan login tidak dapat diproses. Cuba semula.'},400)}
}
