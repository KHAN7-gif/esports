import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
const COOKIE='__Host-bots-admin';
export const SESSION_SECONDS=8*60*60;
const encoder=new TextEncoder();
function config(){return env as typeof env & {ADMIN_EMAIL?:string;ADMIN_PASSWORD_HASH?:string;ADMIN_PASSWORD_SALT?:string;ADMIN_SESSION_SECRET?:string}}
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
function equal(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
async function signature(payload:string){const secret=config().ADMIN_SESSION_SECRET;if(!secret)throw Error('Admin configuration missing');const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(payload)))}
export async function checkPassword(email:string,password:string){const c=config();if(!c.ADMIN_EMAIL||!c.ADMIN_PASSWORD_HASH||!c.ADMIN_PASSWORD_SALT)throw Error('Admin configuration missing');const salt=Uint8Array.from(c.ADMIN_PASSWORD_SALT.match(/.{2}/g)!,s=>parseInt(s,16));const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));return equal(hash,c.ADMIN_PASSWORD_HASH)&&email.trim().toLowerCase()===c.ADMIN_EMAIL.toLowerCase()}
export async function issueSession(){const expires=Math.floor(Date.now()/1000)+SESSION_SECONDS;const payload=expires+'.'+crypto.randomUUID();return payload+'.'+await signature(payload)}
export async function verifySession(value:string){const parts=value.split('.');if(parts.length!==3||!/^\d+$/.test(parts[0]))return false;const expires=Number(parts[0]),now=Math.floor(Date.now()/1000);if(expires<=now||expires>now+SESSION_SECONDS)return false;try{return equal(parts[2],await signature(parts.slice(0,2).join('.')))}catch{return false}}
export async function isSuperadmin(){const jar=await cookies();const value=jar.get(COOKIE)?.value;return !!value&&await verifySession(value)}
export function sessionCookie(value:string,maxAge=SESSION_SECONDS){return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
