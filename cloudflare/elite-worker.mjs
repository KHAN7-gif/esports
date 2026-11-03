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
 if(row.replays!==undefined){if(!row.replays||typeof row.replays!=='object'||Array.isArray(row.replays))throw Error('Video tidak sah.');for(const k of ['s','p','f']){const v=row.replays[k];if(v==null)continue;if(typeof v.url!=='string'||v.url.length>600||!Number.isInteger(v.start)||v.start<0||v.start>86400)throw Error('Rekod video tidak sah.');if(v.url){let u;try{u=new URL(v.url)}catch(e){throw Error('YouTube URL tidak sah.')}if(u.protocol!=='https:'||!['youtu.be','youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname))throw Error('YouTube URL tidak sah.')}}}
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
   if(path==='/api/admin/config'&&req.method==='GET')return json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||'',turnstileConfigured:!!(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET_KEY)});
   if(path==='/api/admin/session'&&req.method==='GET')return json({admin:await authorized(req,env)});
   if(path==='/api/admin/login'&&req.method==='POST') {
    if(!env.ADMIN_EMAIL||!env.ADMIN_PASSWORD_HASH||!env.ADMIN_PASSWORD_SALT||!env.ADMIN_SESSION_SECRET)return json({error:'Admin belum dikonfigurasi.'},503);
    if(!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY)return json({error:'Cloudflare Turnstile belum dikonfigurasi.'},503);
    const text=await req.text();if(text.length>8192)return json({error:'Permintaan terlalu besar.'},413);
    const body=JSON.parse(text);if(typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length>256||typeof body.turnstileToken!=='string'||body.turnstileToken.length>2048)return json({error:'Login tidak sah.'},400);
    const ip=req.headers.get('cf-connecting-ip')||'local';
    let verificationResponse;
    try {
     verificationResponse=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:body.turnstileToken,remoteip:ip})});
    } catch(error) {
     console.error('Turnstile verification request failed',error);
     return json({error:'Pengesahan Cloudflare gagal dihubungi. Cuba semula.'},502);
    }
    if(!verificationResponse.ok) {
     console.error('Turnstile verification returned HTTP',verificationResponse.status);
     return json({error:'Pengesahan Cloudflare gagal dihubungi. Cuba semula.'},502);
    }
    let verification;
    try {
     verification=await verificationResponse.json();
    } catch(error) {
     console.error('Turnstile verification returned invalid JSON',error);
     return json({error:'Pengesahan Cloudflare gagal dihubungi. Cuba semula.'},502);
    }
    if(!verification||verification.success!==true||verification.hostname!==url.hostname||verification.action!=='admin-login')return json({error:'Pengesahan Cloudflare tidak berjaya. Sila cuba semula.'},403);
    const key=hex(await crypto.subtle.digest('SHA-256',encoder.encode(ip)));const now=Date.now();
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
   if(path==='/api/registrations') {
    const admin=await authorized(req,env);
    if(req.method==='GET'&&url.searchParams.has('id')){
      // Public lookup intentionally discloses status only, never participant details.
      const id=String(url.searchParams.get('id')||'').trim().toUpperCase();
      if(!/^ELT26-[A-F0-9]{12}$/.test(id))return json({error:'Format Registration ID tidak sah.'},400);
      const sourceIp=req.headers.get('CF-Connecting-IP')||'unknown';
      const key=hex(await crypto.subtle.digest('SHA-256',encoder.encode('elite-status|'+sourceIp)));
      const now=Math.floor(Date.now()/1000);
      await env.DB.prepare('DELETE FROM elite_registration_limits WHERE expires_at<?').bind(now).run();
      const limiter=await env.DB.prepare('INSERT INTO elite_registration_limits(ip_hash,submissions,expires_at) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET submissions=CASE WHEN expires_at<=? THEN 1 ELSE submissions+1 END, expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END WHERE expires_at<=? OR submissions<30').bind(key,now+3600,now,now,now+3600,now).run();
      if(!limiter.meta?.changes)return json({error:'Had semakan status dicapai. Cuba lagi dalam satu jam.'},429);
      const row=await env.DB.prepare('SELECT status FROM elite_registrations WHERE id=?').bind(id).first();
      if(!row)return json({error:'Registration ID tidak ditemui.'},404);
      return json({id,status:row.status});
    }
    if(req.method==='GET'&&admin){
      const {results}=await env.DB.prepare('SELECT id,full_name,ign,state,gender,phone,club,status,driver_id,created_at,reviewed_at FROM elite_registrations ORDER BY created_at DESC LIMIT 300').all();
      return json({data:results});
    }
    if(req.method==='GET')return json({error:'Masukkan Registration ID untuk semakan.'},400);
    if(req.method==='POST'){
      const raw=await req.text();
      if(raw.length>4096)return json({error:'Borang terlalu besar.'},413);
      const v=JSON.parse(raw);
      if(v.website)return json({error:'Pendaftaran tidak berjaya.'},400);
      const full=String(v.full_name||'').trim(),ign=String(v.ign||'').trim(),state=String(v.state||'').trim(),gender=String(v.gender||'').trim(),phone=String(v.phone||'').trim(),club=String(v.club||'').trim();
      const validStates=['WP Labuan','Sabah','Sarawak','Selangor','Johor','WP Kuala Lumpur','Pulau Pinang','Perak','Kedah','Melaka','Negeri Sembilan','Pahang','Terengganu','Kelantan','Perlis','WP Putrajaya'];
      if(full.length<2||full.length>100||ign.length<2||ign.length>60||!validStates.includes(state)||!['Lelaki','Perempuan'].includes(gender)||!(/^(011[0-9]{8}|01[2346789][0-9]{7})$/.test(phone))||club.length>120||v.consent!==true)return json({error:'Sila lengkapkan borang dan persetujuan.'},400);
      const existing=await env.DB.prepare("SELECT id FROM elite_registrations WHERE ign=? AND status IN ('pending','approved') LIMIT 1").bind(ign).first();
      if(existing)return json({error:'IGN ini telah mempunyai permohonan aktif.'},409);
      const sourceIp=req.headers.get('CF-Connecting-IP')||'unknown';
      const ipHash=hex(await crypto.subtle.digest('SHA-256',encoder.encode(sourceIp+'|elite-register')));
      const now=Math.floor(Date.now()/1000);
      await env.DB.prepare('DELETE FROM elite_registration_limits WHERE expires_at<?').bind(now).run();
      const limiter=await env.DB.prepare('INSERT INTO elite_registration_limits(ip_hash,submissions,expires_at) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET submissions=submissions+1 WHERE submissions<5').bind(ipHash,now+3600).run();if(!limiter.meta?.changes)return json({error:'Had pendaftaran dicapai. Sila cuba kemudian.'},429);
      const limit=await env.DB.prepare('SELECT submissions FROM elite_registration_limits WHERE ip_hash=?').bind(ipHash).first();
      if(!limit||limit.submissions>5)return json({error:'Had pendaftaran dicapai. Sila cuba kemudian.'},429);
      const id='ELT26-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();
      const digest=hex(await crypto.subtle.digest('SHA-256',encoder.encode(crypto.randomUUID())));
      await env.DB.prepare('INSERT INTO elite_registrations(id,receipt_hash,full_name,ign,state,gender,phone,club,consent) VALUES(?,?,?,?,?,?,?,?,1)').bind(id,digest,full,ign,state,gender,phone,club).run();
      return json({id,status:'pending'},201);
    }
    if(req.method==='PATCH'){
      if(!admin)return json({error:'Akses admin diperlukan.'},403);
      const raw=await req.text();if(raw.length>1024)return json({error:'Data terlalu besar.'},413);
      const v=JSON.parse(raw),id=String(v.id||''),status=String(v.status||'');
      if(!/^ELT26-[A-F0-9]{12}$/.test(id)||!['approved','rejected','pending'].includes(status))return json({error:'Status tidak sah.'},400);
      const result=await env.DB.prepare('UPDATE elite_registrations SET status=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=? RETURNING id,status').bind(status,id).first();
      if(!result)return json({error:'Pendaftaran tidak ditemui.'},404);
      return json({data:result});
    }
    return json({error:'Method tidak sah.'},405);
   }
   if(path==='/api/stage-videos') {
    if(req.method==='GET'){const {results}=await env.DB.prepare('SELECT stage,youtube_url,start_seconds FROM elite_stage_videos ORDER BY stage').all();return json({data:results});}
    if(req.method!=='PUT')return json({error:'Method tidak sah.'},405);
    if(!await authorized(req,env))return json({error:'Akses admin diperlukan.'},403);
    const bodyText=await req.text();if(bodyText.length>2048)return json({error:'Permintaan terlalu besar.'},413);
    const entry=JSON.parse(bodyText),stage=entry.stage,urlText=String(entry.youtube_url||'').trim(),start=Number(entry.start_seconds);
    if(!['q','s','p','f'].includes(stage)||!Number.isInteger(start)||start<0||start>86400||urlText.length>600)return json({error:'Rekod video tidak sah.'},400);
    if(urlText){try{const link=new URL(urlText);if(link.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(link.hostname))throw Error('domain');const seg=link.pathname.split('/').filter(Boolean);const id=link.hostname==='youtu.be'?seg[0]:link.searchParams.get('v')||(['shorts','live','embed'].includes(seg[0])?seg[1]:null);if(!/^[a-zA-Z0-9_-]{11}$/.test(id||''))throw Error('id')}catch(e){return json({error:'Pautan video YouTube tidak sah.'},400)}}
    await env.DB.prepare('INSERT INTO elite_stage_videos(stage,youtube_url,start_seconds) VALUES(?,?,?) ON CONFLICT(stage) DO UPDATE SET youtube_url=excluded.youtube_url,start_seconds=excluded.start_seconds,updated_at=CURRENT_TIMESTAMP').bind(stage,urlText,start).run();return json({ok:true});
   }
   if(path!=='/api/drivers')return json({error:'Tidak ditemui.'},404);
   if(req.method==='GET') {
    const {results}=await env.DB.prepare('SELECT * FROM elite_drivers ORDER BY id').all();
    return json({data:results.map(d=>({...d,recorded:JSON.parse(d.recorded),replays:JSON.parse(d.replays||'{}'),is_dummy:!!d.is_dummy}))});
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
    ?env.DB.prepare('INSERT INTO elite_drivers(id,n,state,club,photo,q,s,p,f,recorded,is_dummy,replays) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id').bind(d.id,d.n.trim(),d.state,d.club,d.photo,d.q,d.s,d.p,d.f,JSON.stringify(d.recorded),Number(d.is_dummy),JSON.stringify(d.replays||{}))
    :env.DB.prepare('UPDATE elite_drivers SET n=?,state=?,club=?,photo=?,q=?,s=?,p=?,f=?,recorded=?,is_dummy=?,replays=? WHERE id=? RETURNING id').bind(d.n.trim(),d.state,d.club,d.photo,d.q,d.s,d.p,d.f,JSON.stringify(d.recorded),Number(d.is_dummy),JSON.stringify(d.replays||{}),d.id));
   const results=await env.DB.batch(statements);return json({data:results.flatMap(r=>r.results)});
  }catch(error){console.error('Elite API operation failed',error);return json({error:'Permintaan gagal. Semak data dan cuba semula.'},400);}
 }
};
