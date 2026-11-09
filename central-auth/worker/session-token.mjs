// ES256 sessions: only the central account service has the private signing key.
const tokenEncoder=new TextEncoder();
const tokenB64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const tokenBytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function issueLocalSession(privateKey,claims){
 const key=await crypto.subtle.importKey('pkcs8',tokenBytes(privateKey),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const head=tokenB64(tokenEncoder.encode(JSON.stringify({alg:'ES256',typ:'JWT'}))),payload=tokenB64(tokenEncoder.encode(JSON.stringify(claims))),data=head+'.'+payload;
 return data+'.'+tokenB64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,tokenEncoder.encode(data)));
}
export async function verifyLocalSession(token,publicKey,issuer,audience){try{
 if(typeof token!=='string'||token.length>2048||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]{86}$/.test(token)||!publicKey)return null;
 const [head,payload,signature]=token.split('.'),header=JSON.parse(new TextDecoder().decode(tokenBytes(head)));
 if(header.alg!=='ES256'||header.typ!=='JWT')return null;
 const key=await crypto.subtle.importKey('spki',tokenBytes(publicKey),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,tokenBytes(signature),tokenEncoder.encode(head+'.'+payload)))return null;
 const c=JSON.parse(new TextDecoder().decode(tokenBytes(payload))),now=Math.floor(Date.now()/1000);
 if(c.iss!==issuer||c.aud!==audience||c.role!=='superadmin'||typeof c.sub!=='string'||!c.sub||c.sub.length>254||!Number.isInteger(c.iat)||!Number.isInteger(c.exp)||c.iat>now+30||c.exp<=now||c.exp<=c.iat||c.exp-c.iat>28800||!/^[-_A-Za-z0-9]{43}$/.test(c.nonce||''))return null;
 return c;
 }catch{return null}}
