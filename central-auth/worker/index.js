const SESSION_COOKIE='__Host-esports-login';
const CSRF_COOKIE='__Host-esports-csrf';
const enc=new TextEncoder();
const MAX_AGE=28800;
const now=()=>Math.floor(Date.now()/1000);
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export const sha=async value=>b64(await crypto.subtle.digest('SHA-256',enc.encode(value)));
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0};
const readCookie=(req,key)=>(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(key+'='))?.slice(key.length+1)||'';
const cookie=(name,value,age=MAX_AGE)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
const json=(value,status=200)=>Response.json(value,{status,headers});
const redirect=(url,cookies=[])=>{const h=new Headers({...headers,Location:url});cookies.forEach(c=>h.append('Set-Cookie',c));return new Response(null,{status:303,headers:h})};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(content,status=200,cookies=[]){const h=new Headers({...headers,'Content-Type':'text/html;charset=utf-8'});cookies.forEach(c=>h.append('Set-Cookie',c));return new Response(`<!doctype html><html lang="ms"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MAIDA Esports · Akaun Admin</title><style>body{font:16px system-ui;background:#f3f5fa;color:#15213b;display:grid;place-items:center;min-height:100svh;margin:0}main{background:white;border:1px solid #e1e5ef;border-radius:24px;padding:36px;max-width:420px;width:calc(100% - 96px)}h1{font-size:30px}label{display:block;font-weight:600;margin:24px 0}input{display:block;box-sizing:border-box;width:100%;padding:14px;border:1px solid #ced5e4;border-radius:10px;font:inherit;margin-top:8px}button,a{font:inherit}button{width:100%;border:0;background:#b41683;color:white;border-radius:10px;padding:16px;font-weight:700;cursor:pointer}p{line-height:1.6;color:#657085}.error{color:#a12435}small{color:#657085}</style><main>${content}</main></html>`,{status,headers:h})}
function clients(env){try{const c=JSON.parse(env.SSO_CLIENTS||'{}');return c&&typeof c==='object'&&!Array.isArray(c)?c:{}}catch{return {}}}
export function authRequest(url,env){const clientId=url.searchParams.get('client_id'),redirectUri=url.searchParams.get('redirect_uri'),state=url.searchParams.get('state'),challenge=url.searchParams.get('code_challenge');const client=clients(env)[clientId];if(!client||!Array.isArray(client.redirect_uris)||!client.redirect_uris.includes(redirectUri)||!state||!/^[-_A-Za-z0-9]{32,128}$/.test(state)||!/^[-_A-Za-z0-9]{43}$/.test(challenge||'')||url.searchParams.get('code_challenge_method')!=='S256')return null;try{if(new URL(redirectUri).protocol!=='https:')return null}catch{return null}return {clientId,redirectUri,state,challenge,name:client.name||clientId}}
function ready(env){return !!env.DB&&typeof env.ADMIN_EMAIL==='string'&&/^[a-f0-9]{64}$/i.test(env.ADMIN_PASSWORD_HASH||'')&&/^[a-f0-9]{32}$/i.test(env.ADMIN_PASSWORD_SALT||'')}
async function credentialVersion(env){return sha(env.ADMIN_EMAIL.toLowerCase()+'|'+env.ADMIN_PASSWORD_HASH+'|'+env.ADMIN_PASSWORD_SALT)}
async function session(req,env){const token=readCookie(req,SESSION_COOKIE);if(!/^[-_A-Za-z0-9]{43}$/.test(token))return null;return env.DB.prepare('SELECT * FROM sso_sessions WHERE id=? AND expires_at>? AND credential_version=?').bind(await sha(token),now(),await credentialVersion(env)).first()}
async function grant(auth,sessionId,env,cookies=[]){const code=random();await env.DB.prepare('INSERT INTO sso_codes(id,session_id,client_id,redirect_uri,challenge,expires_at) VALUES(?,?,?,?,?,?)').bind(await sha(code),sessionId,auth.clientId,auth.redirectUri,auth.challenge,now()+60).run();const target=new URL(auth.redirectUri);target.searchParams.set('code',code);target.searchParams.set('state',auth.state);return redirect(target.href,cookies)}
function loginPage(auth,url,error=''){const csrf=random();const action=new URL('/login',url);for(const [k,v] of new URL(url).searchParams)action.searchParams.set(k,v);return page(`<small>MAIDA ESPORTS · AKAUN PUSAT</small><h1>Superadmin</h1><p>Log masuk untuk membuka ${escape(auth.name)}. Akaun yang sama digunakan untuk semua subweb berdaftar.</p>${error?`<p class="error" role="alert">${escape(error)}</p>`:''}<form method="post" action="${escape(action.pathname+action.search)}"><input type="hidden" name="csrf" value="${csrf}"><label>E-mel<input type="email" name="email" autocomplete="username" required maxlength="254"></label><label>Kata laluan<input type="password" name="password" autocomplete="current-password" required maxlength="256"></label><button>Log masuk</button></form>`,error?401:200,[cookie(CSRF_COOKIE,csrf,600)])}
async function passwordMatches(env,email,password){const salt=Uint8Array.from(env.ADMIN_PASSWORD_SALT.match(/../g),v=>parseInt(v,16));const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));return equal(hash,env.ADMIN_PASSWORD_HASH.toLowerCase())&&equal(email.trim().toLowerCase(),env.ADMIN_EMAIL.trim().toLowerCase())}
async function credentials(env){
 if(ready(env))return env;
 if(!env.DB)return env;
 const account=await env.DB.prepare("SELECT email,password_hash,password_salt FROM sso_account WHERE id='main'").first();
 return account?{...env,ADMIN_EMAIL:account.email,ADMIN_PASSWORD_HASH:account.password_hash,ADMIN_PASSWORD_SALT:account.password_salt,ACCOUNT_DATABASE:true}:env;
}
async function setupAccount(req,env){
 const identity=req.headers.get('oai-authenticated-user-email');
 if(!env.SETUP_OWNER_EMAIL||identity?.toLowerCase()!==env.SETUP_OWNER_EMAIL.toLowerCase()||!req.headers.get('oai-authenticated-user-id'))return page('<h1>Akses pemilik diperlukan</h1><p>Buka melalui akaun ChatGPT pemilik Site untuk menyediakan akaun pusat.</p>',403);
 if(ready(await credentials(env)))return page('<h1>Akaun pusat sudah disediakan</h1><p>Buka halaman admin subweb untuk log masuk.</p>',409);
 if(req.method==='GET'){const csrf=random();return page(`<small>MAIDA ESPORTS · PEMILIK SITE</small><h1>Sediakan akaun pusat</h1><p>Pilih satu e-mel dan kata laluan untuk semua subweb. Kata laluan tidak disimpan sebagai teks biasa.</p><form method="post" action="/setup"><input type="hidden" name="csrf" value="${csrf}"><label>E-mel admin<input name="email" type="email" required maxlength="254" autocomplete="username" value="${escape(identity)}"></label><label>Kata laluan baharu<input name="password" type="password" required minlength="12" maxlength="256" autocomplete="new-password"></label><label>Sahkan kata laluan<input name="confirm" type="password" required minlength="12" maxlength="256" autocomplete="new-password"></label><button>Simpan akaun pusat</button></form>`,200,[cookie(CSRF_COOKIE,csrf,600)])}
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 if(req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Origin tidak sah.'},403);
 const raw=await req.text();if(raw.length>8192)return json({error:'Permintaan terlalu besar.'},413);const body=new URLSearchParams(raw);
 if(!/^[-_A-Za-z0-9]{43}$/.test(body.get('csrf')||'')||!equal(body.get('csrf'),readCookie(req,CSRF_COOKIE)))return json({error:'Sesi borang tamat.'},403);
 const email=(body.get('email')||'').trim().toLowerCase(),password=body.get('password');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!password||password.length<12||password.length>256||password!==body.get('confirm'))return page('<h1>Semak maklumat akaun</h1><p>Gunakan e-mel sah dan kata laluan sepadan sepanjang 12–256 aksara.</p><a href="/setup">Cuba semula</a>',400);
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));
 const result=await env.DB.prepare("INSERT OR IGNORE INTO sso_account(id,email,password_hash,password_salt) VALUES('main',?,?,?)").bind(email,hash,hex(salt)).run();
 if(!result.meta.changes)return page('<h1>Akaun sudah disediakan</h1>',409);
 return page('<h1>Akaun pusat siap</h1><p>Akaun telah disimpan. Subweb boleh disambungkan selepas ujian login berjaya. Login lama belum ditukar.</p>',200,[cookie(CSRF_COOKIE,'',0)]);
}
async function manageAccount(req,env){
 const active=await session(req,env);if(!active)return page('<h1>Log masuk diperlukan</h1><p>Buka admin subweb untuk log masuk sebelum mengubah akaun pusat.</p>',401);
 if(!env.ACCOUNT_DATABASE)return page('<h1>Akaun diurus melalui runtime settings</h1>',409);
 if(req.method==='GET'){const csrf=random();return page(`<h1>Akaun admin pusat</h1><p>Menukar e-mel atau kata laluan akan menamatkan semua sesi subweb.</p><form method="post" action="/account"><input type="hidden" name="csrf" value="${csrf}"><label>E-mel admin<input name="email" type="email" value="${escape(active.email)}" required maxlength="254" autocomplete="username"></label><label>Kata laluan semasa<input name="current" type="password" required maxlength="256" autocomplete="current-password"></label><label>Kata laluan baharu<input name="password" type="password" required minlength="12" maxlength="256" autocomplete="new-password"></label><label>Sahkan kata laluan<input name="confirm" type="password" required minlength="12" maxlength="256" autocomplete="new-password"></label><button>Simpan dan tamatkan semua sesi</button></form>`,200,[cookie(CSRF_COOKIE,csrf,600)])}
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 if(req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Origin tidak sah.'},403);
 const raw=await req.text();if(raw.length>8192)return json({error:'Permintaan terlalu besar.'},413);const body=new URLSearchParams(raw);
 if(!/^[-_A-Za-z0-9]{43}$/.test(body.get('csrf')||'')||!equal(body.get('csrf'),readCookie(req,CSRF_COOKIE)))return json({error:'Sesi borang tamat.'},403);
 const email=(body.get('email')||'').trim().toLowerCase(),password=body.get('password'),current=body.get('current');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!password||password.length<12||password.length>256||password!==body.get('confirm')||!current||current.length>256)return page('<h1>Maklumat tidak sah</h1><a href="/account">Cuba semula</a>',400);
 const limit=await env.DB.prepare('INSERT INTO sso_attempts(id,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING attempts').bind(await sha('account-change|'+active.email),now()+900,now(),now(),now()+900).first();if(limit.attempts>10)return page('<h1>Cuba lagi selepas 15 minit</h1>',429);
 if(!await passwordMatches(env,active.email,current))return page('<h1>Kata laluan semasa tidak sah</h1><a href="/account">Cuba semula</a>',401);
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));
 const updated=await env.DB.prepare("UPDATE sso_account SET email=?,password_hash=?,password_salt=? WHERE id='main' AND password_hash=?").bind(email,hash,hex(salt),env.ADMIN_PASSWORD_HASH).run();if(!updated.meta.changes)return page('<h1>Akaun telah berubah. Log masuk semula.</h1>',409);
 return page('<h1>Akaun dikemas kini</h1><p>Semua sesi ditamatkan. Buka subweb dan log masuk dengan maklumat baharu.</p>',200,[cookie(SESSION_COOKIE,'',0),cookie(CSRF_COOKIE,'',0)]);
}
export default {async fetch(req,env){
 const url=new URL(req.url),path=url.pathname;
 try{
 if(path==='/setup')return await setupAccount(req,env);
 env=await credentials(env);
 if(path==='/account'&&ready(env))return await manageAccount(req,env);
 if(path==='/health')return json({service:'esports-central-auth',configured:ready(env)});
 if(!ready(env))return page('<h1>Login pusat belum tersedia</h1><p>Pentadbir perlu melengkapkan konfigurasi akaun. Akses admin subweb belum ditukar.</p>',503);
 if(req.method==='POST'&&['/login','/logout'].includes(path)&&req.headers.get('Origin')!==url.origin)return json({error:'Origin tidak sah.'},403);
 if(path==='/authorize'&&req.method==='GET'){const auth=authRequest(url,env);if(!auth)return json({error:'Permintaan login tidak sah.'},400);const existing=await session(req,env);return existing?grant(auth,existing.id,env):loginPage(auth,url)}
 if(path==='/login'&&req.method==='POST'){
  const auth=authRequest(url,env);if(!auth)return json({error:'Permintaan login tidak sah.'},400);
  const raw=await req.text();if(raw.length>8192)return json({error:'Permintaan terlalu besar.'},413);const body=new URLSearchParams(raw);
  if(!equal(body.get('csrf'),readCookie(req,CSRF_COOKIE))||!/^[-_A-Za-z0-9]{43}$/.test(body.get('csrf')||''))return json({error:'Sesi borang tamat. Buka semula login.'},403);
  const email=body.get('email'),password=body.get('password');if(!email||email.length>254||!password||password.length>256)return loginPage(auth,url,'Login tidak sah.');
  // Atomic fixed-window limits for both source IP and account, without recording email/IP.
  const limits=[await sha('ip|'+(req.headers.get('cf-connecting-ip')||'unknown')),await sha('account|'+email.trim().toLowerCase())];
  for(const id of limits){const row=await env.DB.prepare('INSERT INTO sso_attempts(id,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING attempts').bind(id,now()+900,now(),now(),now()+900).first();if(row.attempts>10)return page('<h1>Cuba lagi kemudian</h1><p>Terlalu banyak percubaan. Tunggu 15 minit.</p>',429)}
  if(!await passwordMatches(env,email,password))return loginPage(auth,url,'E-mel atau kata laluan tidak sah.');
  await env.DB.batch(['sso_codes','sso_tokens','sso_sessions','sso_attempts'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(now())));
  const rawSession=random(),id=await sha(rawSession);await env.DB.prepare('INSERT INTO sso_sessions(id,email,credential_version,expires_at) VALUES(?,?,?,?)').bind(id,env.ADMIN_EMAIL.trim().toLowerCase(),await credentialVersion(env),now()+MAX_AGE).run();
  await env.DB.prepare('DELETE FROM sso_attempts WHERE id=?').bind(limits[1]).run();
  const old=await session(req,env);if(old)await env.DB.prepare('DELETE FROM sso_sessions WHERE id=?').bind(old.id).run();
  return grant(auth,id,env,[cookie(SESSION_COOKIE,rawSession),cookie(CSRF_COOKIE,'',0)]);
 }
 if(path==='/token'&&req.method==='POST'){
  const raw=await req.text();if(raw.length>4096)return json({error:'Permintaan terlalu besar.'},413);const body=new URLSearchParams(raw),code=body.get('code'),verifier=body.get('code_verifier');
  if(!/^[-_A-Za-z0-9]{43}$/.test(code||'')||!/^[-._~A-Za-z0-9]{43,128}$/.test(verifier||''))return json({error:'Kod tidak sah.'},400);
  const id=await sha(code),stored=await env.DB.prepare('SELECT * FROM sso_codes WHERE id=? AND expires_at>?').bind(id,now()).first();
  if(!stored||stored.client_id!==body.get('client_id')||stored.redirect_uri!==body.get('redirect_uri')||!equal(stored.challenge,await sha(verifier)))return json({error:'Kod tidak sah atau tamat.'},400);
  const active=await env.DB.prepare('SELECT * FROM sso_sessions WHERE id=? AND expires_at>? AND credential_version=?').bind(stored.session_id,now(),await credentialVersion(env)).first();if(!active)return json({error:'Sesi tamat.'},401);
  const taken=await env.DB.prepare('DELETE FROM sso_codes WHERE id=? RETURNING id').bind(id).first();if(!taken)return json({error:'Kod telah digunakan.'},400);
  const token=random();await env.DB.prepare('INSERT INTO sso_tokens(id,session_id,client_id,expires_at) VALUES(?,?,?,?)').bind(await sha(token),active.id,stored.client_id,active.expires_at).run();
  return json({access_token:token,token_type:'Bearer',expires_in:Math.max(0,active.expires_at-now())});
 }
 if(path==='/userinfo'&&req.method==='GET'){
  const token=req.headers.get('Authorization')?.match(/^Bearer ([-_A-Za-z0-9]{43})$/)?.[1];if(!token)return json({error:'Akses diperlukan.'},401);
  const identity=await env.DB.prepare('SELECT s.email,s.expires_at FROM sso_tokens t JOIN sso_sessions s ON s.id=t.session_id WHERE t.id=? AND t.client_id=? AND t.expires_at>? AND s.expires_at>? AND s.credential_version=?').bind(await sha(token),url.searchParams.get('client_id'),now(),now(),await credentialVersion(env)).first();return identity?json({email:identity.email,role:'superadmin',expires_at:identity.expires_at}):json({error:'Sesi tamat.'},401);
 }
 if(path==='/logout'&&req.method==='GET'){const csrf=random();return page(`<h1>Log keluar semua subweb?</h1><p>Sesi akaun pusat akan ditamatkan untuk semua subweb yang menggunakan login ini.</p><form method="post" action="/logout"><input type="hidden" name="csrf" value="${csrf}"><button>Log keluar semua</button></form>`,200,[cookie(CSRF_COOKIE,csrf,600)])}
 if(path==='/logout'&&req.method==='POST'){
  const raw=await req.text();if(raw.length>4096)return json({error:'Permintaan terlalu besar.'},413);const body=new URLSearchParams(raw);if(!/^[-_A-Za-z0-9]{43}$/.test(body.get('csrf')||'')||!equal(body.get('csrf'),readCookie(req,CSRF_COOKIE)))return json({error:'Sesi borang tamat.'},403);
  const active=await session(req,env);if(active)await env.DB.prepare('DELETE FROM sso_sessions WHERE id=?').bind(active.id).run();return page('<h1>Anda telah log keluar</h1><p>Sesi pusat ditamatkan. Buka semula subweb untuk log masuk.</p>',200,[cookie(SESSION_COOKIE,'',0),cookie(CSRF_COOKIE,'',0)]);
 }
 if(path==='/'&&req.method==='GET')return page('<small>MAIDA ESPORTS</small><h1>Akaun Admin Pusat</h1><p>Buka halaman admin eFLL, BOTM, LEL atau The Elite untuk log masuk.</p><a href="/account">Urus e-mel dan kata laluan</a><p><a href="/logout">Log keluar semua subweb</a></p>');
 return json({error:'Tidak ditemui.'},404);
 }catch{return json({error:'Perkhidmatan login tidak tersedia. Cuba semula.'},503)}
},async scheduled(event,env){const time=now();await env.DB.batch(['sso_codes','sso_tokens','sso_sessions','sso_attempts'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(time)))}};
