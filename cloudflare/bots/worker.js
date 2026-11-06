// BOTS eFootball API — Cloudflare Workers + D1
const encoder = new TextEncoder();
const json = (value,status=200,headers={}) => new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(s.length/4)*4,"=")),c=>c.charCodeAt(0));
const hex = bytes => [...bytes].map(x=>x.toString(16).padStart(2,"0")).join("");
const constantEqual = (a,b) => {const x=encoder.encode(a||""),y=encoder.encode(b||"");if(x.length!==y.length)return false;let v=0;for(let i=0;i<x.length;i++)v|=x[i]^y[i];return v===0};
async function hashPassword(password,salt,iterations=210000){
 const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:unb64(salt),iterations,hash:"SHA-256"},key,256)));
}
async function sign(data,secret){
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(data))));
}
async function verifyToken(req,env){
 const token=(req.headers.get("authorization")||"").match(/^Bearer (.+)$/i)?.[1];
 if(!token||!env.AUTH_SECRET)return null;
 const [body,sig,...rest]=token.split(".");
 if(rest.length||!body||!sig||!constantEqual(await sign(body,env.AUTH_SECRET),sig))return null;
 let claims;try{claims=JSON.parse(new TextDecoder().decode(unb64(body)))}catch{return null}
 if(claims.exp<=Math.floor(Date.now()/1000)||claims.exp>Math.floor(Date.now()/1000)+3600)return null;
 return await env.DB.prepare("SELECT id,username,role FROM admins WHERE id=? AND active=1").bind(claims.sub).first();
}
async function bodyJSON(req){const b=await req.json();if(!b||typeof b!=="object"||Array.isArray(b))throw Error("Invalid JSON object");return b}
function str(x,max=160){return typeof x==="string"?x.trim().slice(0,max):""}
function required(x,label){if(!x)throw Error(label+" is required");return x}
function int(x){return Number.isInteger(x)&&x>=0?x:null}
async function audit(env,actor,action,resource,id){await env.DB.prepare("INSERT INTO audit_log(id,actor_id,action,resource,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),actor,action,resource,id).run()}
export default {async fetch(req,env){
 const origin=req.headers.get("origin");
 const allow=env.ALLOWED_ORIGIN||"https://khan7-gif.github.io";
 const cors=origin===allow?{"access-control-allow-origin":allow,"vary":"Origin","access-control-allow-methods":"GET,POST,PATCH,OPTIONS","access-control-allow-headers":"Content-Type,Authorization,X-Bootstrap-Token"}:{};
 if(req.method==="OPTIONS")return new Response(null,{status:origin===allow?204:403,headers:cors});
 const respond=(value,status=200)=>json(value,status,cors);
 if(origin&&origin!==allow)return respond({error:"Origin not allowed"},403);
 if(!env.DB)return respond({error:"Database binding not configured"},503);
 const url=new URL(req.url),path=url.pathname;
 try{
 if(path==="/health"&&req.method==="GET"){await env.DB.prepare("SELECT 1").first();return respond({ok:true,service:"bots-api",database:"connected"})}
 if(path==="/admin/bootstrap"&&req.method==="POST"){
  if(!env.BOOTSTRAP_TOKEN||!constantEqual(req.headers.get("x-bootstrap-token"),env.BOOTSTRAP_TOKEN))return respond({error:"Forbidden"},403);
  const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();
  if(count.n!==0)return respond({error:"Admin already exists"},409);
  const b=await bodyJSON(req),username=required(str(b.username,80),"username"),password=b.password;
  if(typeof password!=="string"||password.length<14||password.length>256)return respond({error:"Password must be 14–256 characters"},400);
  const salt=b64(crypto.getRandomValues(new Uint8Array(16))),id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO admins(id,username,password_hash,password_salt) VALUES(?,?,?,?)").bind(id,username,await hashPassword(password,salt),salt).run();
  return respond({created:true,username},201);
 }
 if(path==="/auth/login"&&req.method==="POST"){
  const b=await bodyJSON(req),username=str(b.username,80),password=b.password;
  if(typeof password!=="string"||password.length>256)return respond({error:"Invalid credentials"},401);
  const user=await env.DB.prepare("SELECT * FROM admins WHERE username=? AND active=1").bind(username).first();
  // Do a real PBKDF2 operation even for unknown usernames to reduce timing differences.
  const salt=user?.password_salt||b64(new Uint8Array(16));
  const computed=await hashPassword(password,salt,user?.password_iterations||210000);
  if(!user||!constantEqual(computed,user.password_hash))return respond({error:"Invalid credentials"},401);
  const payload=b64(encoder.encode(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})));
  return respond({token:payload+"."+await sign(payload,env.AUTH_SECRET),expires_in:3600,role:user.role});
 }
 if(path==="/api/seasons"&&req.method==="GET")return respond({items:(await env.DB.prepare("SELECT * FROM seasons ORDER BY created_at DESC").all()).results});
 if(path==="/api/teams"&&req.method==="GET"){const id=str(url.searchParams.get("season_id"),80);return respond({items:(await env.DB.prepare(id?"SELECT * FROM teams WHERE season_id=? ORDER BY name":"SELECT * FROM teams ORDER BY name").bind(...(id?[id]:[])).all()).results})}
 if(path==="/api/players"&&req.method==="GET"){const id=str(url.searchParams.get("team_id"),80);return respond({items:(await env.DB.prepare(id?"SELECT * FROM players WHERE team_id=? ORDER BY ign":"SELECT * FROM players ORDER BY ign").bind(...(id?[id]:[])).all()).results})}
 if(path==="/api/matches"&&req.method==="GET"){const id=str(url.searchParams.get("season_id"),80);return respond({items:(await env.DB.prepare(id?"SELECT * FROM matches WHERE season_id=? ORDER BY matchday,scheduled_at":"SELECT * FROM matches ORDER BY matchday,scheduled_at").bind(...(id?[id]:[])).all()).results})}
 if(path.startsWith("/api/")&&["POST","PATCH","DELETE"].includes(req.method)){
  const admin=await verifyToken(req,env);if(!admin)return respond({error:"Admin authentication required"},401);
  const b=await bodyJSON(req),id=crypto.randomUUID();
  if(path==="/api/seasons"&&req.method==="POST"){
   const name=required(str(b.name,120),"name");
   await env.DB.prepare("INSERT INTO seasons(id,name,active) VALUES(?,?,?)").bind(id,name,b.active===true?1:0).run();
   await audit(env,admin.id,"create","season",id);return respond({id,name},201);
  }
  if(path==="/api/teams"&&req.method==="POST"){
   const season_id=required(str(b.season_id,80),"season_id"),name=required(str(b.name,120),"name");
   await env.DB.prepare("INSERT INTO teams(id,season_id,name,state,manager,assistant) VALUES(?,?,?,?,?,?)").bind(id,season_id,name,str(b.state,100)||null,str(b.manager,120)||null,str(b.assistant,120)||null).run();
   await audit(env,admin.id,"create","team",id);return respond({id,name},201);
  }
  if(path==="/api/players"&&req.method==="POST"){
   const team_id=required(str(b.team_id,80),"team_id"),ign=required(str(b.ign,100),"ign");
   await env.DB.prepare("INSERT INTO players(id,team_id,ign,display_name) VALUES(?,?,?,?)").bind(id,team_id,ign,str(b.display_name,120)||null).run();
   await audit(env,admin.id,"create","player",id);return respond({id,ign},201);
  }
  if(path==="/api/matches"&&req.method==="POST"){
   const season_id=required(str(b.season_id,80),"season_id"),home=required(str(b.home_team_id,80),"home_team_id"),away=required(str(b.away_team_id,80),"away_team_id");
   if(home===away||int(b.matchday)===null)return respond({error:"Invalid match teams or matchday"},400);
   await env.DB.prepare("INSERT INTO matches(id,season_id,home_team_id,away_team_id,matchday,scheduled_at) VALUES(?,?,?,?,?,?)").bind(id,season_id,home,away,b.matchday,str(b.scheduled_at,40)||null).run();
   await audit(env,admin.id,"create","match",id);return respond({id},201);
  }
  const matchId=path.match(/^\/api\/matches\/([\w-]+)$/)?.[1];
  if(matchId&&req.method==="PATCH"){
   const status=b.status,hs=b.home_score,as=b.away_score;
   if(!["PREVIEW","LIVE","FULL TIME","POSTPONED"].includes(status)||!(hs===null||int(hs)!==null)||!(as===null||int(as)!==null))return respond({error:"Invalid match update"},400);
   const result=await env.DB.prepare("UPDATE matches SET status=?,home_score=?,away_score=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,hs,as,matchId).run();
   if(!result.meta.changes)return respond({error:"Match not found"},404);
   await audit(env,admin.id,"update","match",matchId);return respond({updated:true,id:matchId});
  }
  return respond({error:"Unsupported admin endpoint"},404);
 }
 return respond({error:"Not found"},404);
 }catch(e){if(e instanceof SyntaxError)return respond({error:"Invalid JSON"},400);if(/required|Invalid JSON object/.test(e.message))return respond({error:e.message},400);return respond({error:"Request failed; verify database constraints and input"},400)}
}};
