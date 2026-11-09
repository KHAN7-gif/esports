import provider,{externalAuthorize} from '../central-auth/worker/index.js';
const clearedElite='__Host-elite-admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
export async function handleEliteSso(req,env,legacySession){
 if(env.SSO_PROVIDER_ENABLED!=='true')return new Response('Login pusat belum diaktifkan.',{status:404});
 const url=new URL(req.url),route=url.pathname.slice(4);
 if(!['/authorize','/token','/userinfo','/logout'].includes(route))return new Response('Not found',{status:404});
 const mapped=new URL(req.url);mapped.pathname=route;
 const forwarded=new Request(mapped,req);
 try{
  if(route==='/authorize'){
   if(req.method!=='GET')return new Response('Method not allowed',{status:405});
   const response=await externalAuthorize(forwarded,env,await legacySession());
   if(response)return response;
   const login=new URL('/admin',url);login.searchParams.set('sso',url.pathname+url.search);
   return new Response(null,{status:303,headers:{Location:login.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  }
  const result=await provider.fetch(forwarded,{...env,PUBLIC_PATH_PREFIX:'/sso'});
  if(route==='/logout'&&req.method==='POST'&&result.status===200)result.headers.append('Set-Cookie',clearedElite);
  return result;
 }catch{return Response.json({error:'Login pusat tidak tersedia. Cuba semula.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
