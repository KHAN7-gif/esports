const cookieName = '__Host-elite-admin';
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
function equal(a, b) { let diff = a.length ^ b.length; for (let i=0;i<Math.max(a.length,b.length);i++) diff |= (a.charCodeAt(i)||0) ^ (b.charCodeAt(i)||0); return diff===0; }
async function sign(payload, secret) {
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(payload)));
}
async function authorized(req, env) {
 if (!env.ADMIN_SESSION_SECRET) return false;
 const value=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
 const parts=value.split('.'), now=Math.floor(Date.now()/1000);
 return parts.length===3 && /^\d+$/.test(parts[0]) && Number(parts[0])>now && Number(parts[0])<=now+28800 && equal(parts[2],await sign(parts.slice(0,2).join('.'),env.ADMIN_SESSION_SECRET));
}
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const sessionCookie=(value,age=28800)=>`${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
function validate(row) {
 if(!row || !Number.isInteger(row.id)||row.id<1||row.id>10000) throw Error('ID tidak sah.');
 for(const [k,max] of [['n',60],['state',80],['club',120]]) if(typeof row[k]!=='string'||!row[k].trim()||row[k].length>max)throw Error('Profil tidak sah.');
 if(typeof row.photo!=='string'||row.photo.length>2000||(row.photo&&!/^https:\/\//i.test(row.photo)))throw Error('Photo URL mesti HTTPS.');
 for(const k of ['q','s','p','f']) if(row[k]!==null&&(!Number.isInteger(row[k])||row[k]<=0||row[k]>=6000000))throw Error('Masa tidak sah.');
 if(typeof row.is_dummy!=='boolean'||!row.recorded||typeof row.recorded!=='object')throw Error('Rekod tidak sah.');
 for(const k of ['q','s','p','f']) {const rec=row.recorded[k];if(rec!=null&&(!/^\d{4}-\d{2}-\d{2}$/.test(rec.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(rec.time)))throw Error('Tarikh / masa tidak sah.');}
 return row;
}
export default {
 async fetch(req, env) {
  const url=new URL(req.url), path=url.pathname;
  if(!path.startsWith('/api/')) {
   if(path==='/admin/')return Response.redirect(url.origin+'/admin'+url.search,308);
   if(path==='/')url.pathname='/the-elite.html';
   if(path==='/admin'||path==='/admin/')url.pathname='/elite-admin.html';
   return env.ASSETS.fetch(new Request(url,req));
  }
  try {
   if(!env.DB)return json({error:'Pangkalan data belum tersedia.'},503);
   if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return json({error:'Origin tidak sah.'},403);
   if(path==='/api/admin/logout'&&req.method==='POST')return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
   if(path==='/api/admin/session'&&req.method==='GET')return json({admin:await authorized(req,env)});
   if(path==='/api/admin/login'&&req.method==='POST') {
    if(!env.ADMIN_EMAIL||!env.ADMIN_PASSWORD_HASH||!env.ADMIN_PASSWORD_SALT||!env.ADMIN_SESSION_SECRET)return json({error:'Admin belum dikonfigurasi.'},503);
    const text=await req.text();if(text.length>2048)return json({error:'Permintaan terlalu besar.'},413);
    const body=JSON.parse(text);if(typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length>256)return json({error:'Login tidak sah.'},400);
    const ip=req.headers.get('cf-connecting-ip')||'local';const key=hex(await crypto.subtle.digest('SHA-256',encoder.encode(ip)));const now=Date.now();
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE reset_at <= ?').bind(now).run();
    await env.DB.prepare('INSERT INTO admin_login_attempts(key,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,now+900000).run();
    const attempt=await env.DB.prepare('SELECT attempts FROM admin_login_attempts WHERE key=?').bind(key).first();
    if(attempt.attempts>10)return json({error:'Terlalu banyak percubaan.'},429,{'Retry-After':'900'});
    const salt=Uint8Array.from(env.ADMIN_PASSWORD_SALT.match(/.{2}/g),x=>parseInt(x,16));
    const passwordKey=await crypto.subtle.importKey('raw',encoder.encode(body.password),'PBKDF2',false,['deriveBits']);
    const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},passwordKey,256));
    if(!equal(hash,env.ADMIN_PASSWORD_HASH)||body.email.trim().toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return json({error:'Login tidak sah.'},401);
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE key=?').bind(key).run();
    const payload=(Math.floor(Date.now()/1000)+28800)+'.'+crypto.randomUUID();
    return json({ok:true},200,{'Set-Cookie':sessionCookie(payload+'.'+await sign(payload,env.ADMIN_SESSION_SECRET))});
   }
   if(path!=='/api/drivers')return json({error:'Tidak ditemui.'},404);
   if(req.method==='GET') {
    const {results}=await env.DB.prepare('SELECT * FROM elite_drivers ORDER BY id').all();
    return json({data:results.map(d=>({...d,recorded:JSON.parse(d.recorded),is_dummy:!!d.is_dummy}))});
   }
   if(!await authorized(req,env))return json({error:'Akses admin diperlukan.'},403);
   if(!['POST','PUT','DELETE'].includes(req.method))return json({error:'Method tidak sah.'},405);
   const text=await req.text();if(text.length>100000)return json({error:'Permintaan terlalu besar.'},413);
   const body=JSON.parse(text);
   if(req.method==='DELETE') {
    if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>100||!body.ids.every(id=>Number.isInteger(id)&&id>=1&&id<=10000))return json({error:'ID tidak sah.'},400);
    const rows=await env.DB.prepare(`DELETE FROM elite_drivers WHERE id IN (${body.ids.map(()=>'?').join(',')}) RETURNING id`).bind(...body.ids).all();return json({data:rows.results});
   }
   const rows=(Array.isArray(body)?body:[body]).map(validate);if(!rows.length||rows.length>100)throw Error('Had rekod dicapai.');
   const statements=rows.map(d=>req.method==='POST'
    ?env.DB.prepare('INSERT INTO elite_drivers(id,n,state,club,photo,q,s,p,f,recorded,is_dummy) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id').bind(d.id,d.n.trim(),d.state,d.club,d.photo,d.q,d.s,d.p,d.f,JSON.stringify(d.recorded),Number(d.is_dummy))
    :env.DB.prepare('UPDATE elite_drivers SET n=?,state=?,club=?,photo=?,q=?,s=?,p=?,f=?,recorded=?,is_dummy=? WHERE id=? RETURNING id').bind(d.n.trim(),d.state,d.club,d.photo,d.q,d.s,d.p,d.f,JSON.stringify(d.recorded),Number(d.is_dummy),d.id));
   const results=await env.DB.batch(statements);return json({data:results.flatMap(r=>r.results)});
  }catch(error){console.error('Elite API operation failed',error);return json({error:'Permintaan gagal. Semak data dan cuba semula.'},400);}
 }
};
