import {env} from 'cloudflare:workers';
import {checkPassword,issueSession,sessionCookie} from '../../../admin-auth';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Permintaan tidak sah.'},{status:403});
 try{
 const body=await req.json() as {email?:unknown;password?:unknown};if(typeof body.email!=='string'||typeof body.password!=='string'||body.email.length>254||body.password.length>256)return Response.json({error:'E-mel atau kata laluan tidak sah.'},{status:400});
 if(!env.DB)return Response.json({error:'Login belum tersedia.'},{status:503});
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_login_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL)').run();
 const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';const now=Date.now();
 const key=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip))),b=>b.toString(16).padStart(2,'0')).join('');
 await env.DB.prepare('DELETE FROM admin_login_attempts WHERE reset_at <= ?').bind(now).run();
 await env.DB.prepare('INSERT INTO admin_login_attempts (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,now+15*60*1000).run();
 const row=await env.DB.prepare('SELECT attempts FROM admin_login_attempts WHERE key=?').bind(key).first<{attempts:number}>();
 if((row?.attempts??11)>10)return Response.json({error:'Terlalu banyak percubaan. Cuba lagi selepas 15 minit.'},{status:429,headers:{'Retry-After':'900','Cache-Control':'no-store'}});
 if(!await checkPassword(body.email,body.password))return Response.json({error:'E-mel atau kata laluan tidak sah.'},{status:401,headers:{'Cache-Control':'no-store'}});
 await env.DB.prepare('DELETE FROM admin_login_attempts WHERE key=?').bind(key).run();
 return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(await issueSession()),'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Login tidak tersedia. Cuba semula.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
