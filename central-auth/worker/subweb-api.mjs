import {portalAccountConfig,portalPasswordMatches} from './index.js';
import {issueLocalSession} from './session-token.mjs';
const loginEncoder=new TextEncoder();
const loginHash=async s=>btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',loginEncoder.encode(s))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const loginNow=()=>Math.floor(Date.now()/1000);
function loginOrigins(env){try{const clients=JSON.parse(env.SSO_CLIENTS||'{}'),out={};for(const [id,client] of Object.entries(clients)){out[id]=(client.redirect_uris||[]).map(uri=>new URL(uri)).filter(u=>u.protocol==='https:').map(u=>u.origin)}return out}catch{return {}}}
export async function handleSubwebLogin(req,env){
 const origin=req.headers.get('Origin'),origins=loginOrigins(env),url=new URL(req.url);
 if(!origin||!Object.values(origins).some(list=>list.includes(origin)))return new Response('Origin not allowed',{status:403});
 const headers={'Access-Control-Allow-Origin':origin,Vary:'Origin','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'},json=(value,status=200)=>Response.json(value,{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'300'}});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 if(!env.SUBWEB_SESSION_PRIVATE_KEY)return json({error:'Login belum tersedia.'},503);
 try{
  if(!req.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Permintaan tidak sah.'},400);
  const reader=req.body?.getReader();if(!reader)return json({error:'Permintaan tidak sah.'},400);const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return json({error:'Permintaan terlalu besar.'},413)}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}const input=JSON.parse(new TextDecoder().decode(bytes));
  if(!origins[input.client_id]?.includes(origin)||typeof input.email!=='string'||input.email.length>254||typeof input.password!=='string'||!input.password||input.password.length>256||!/^[-_A-Za-z0-9]{43}$/.test(input.nonce||''))return json({error:'Permintaan login tidak sah.'},400);
  for(const identity of ['subweb-ip|'+(req.headers.get('cf-connecting-ip')||'unknown'),'subweb-account|'+input.email.trim().toLowerCase()]){
   const row=await env.DB.prepare('INSERT INTO sso_attempts(id,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING attempts').bind(await loginHash(identity),loginNow()+900,loginNow(),loginNow(),loginNow()+900).first();if(row.attempts>10)return json({error:'Terlalu banyak percubaan. Cuba semula selepas 15 minit.'},429);
  }
  const account=await portalAccountConfig(env);if(!account.ADMIN_EMAIL||!account.ADMIN_PASSWORD_HASH||!account.ADMIN_PASSWORD_SALT)return json({error:'Akaun admin belum tersedia.'},503);
  if(!await portalPasswordMatches(account,input.email,input.password))return json({error:'E-mel atau kata laluan tidak sah.'},401);
  const token=await issueLocalSession(env.SUBWEB_SESSION_PRIVATE_KEY,{iss:url.origin,aud:input.client_id,sub:account.ADMIN_EMAIL.trim().toLowerCase(),role:'superadmin',iat:loginNow(),exp:loginNow()+28800,nonce:input.nonce});
  return json({token});
 }catch{return json({error:'Login tidak dapat diproses. Cuba semula.'},400)}
}
