import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {registrationLeague,demoLeague,leagueSchema,validateLeague} from '../../../lib/league';
export const dynamic='force-dynamic';
function publicResponse(request:Request,body:unknown,status=200){
 const headers:Record<string,string>={'Cache-Control':'no-store','Vary':'Origin'};
 if(request.headers.get('Origin')==='https://khan7-gif.github.io')headers['Access-Control-Allow-Origin']='https://khan7-gif.github.io';
 return Response.json(body,{status,headers});
}
export async function GET(request:Request){
 const category=new URL(request.url).searchParams.get('category');if(category!=='mobile'&&category!=='console')return publicResponse(request,{error:'Kategori tidak sah.'},400);
 if(!env.DB)return publicResponse(request,{error:'Pangkalan data belum tersedia.'},503);
 let row=await env.DB.prepare('SELECT data,version FROM lel_leagues WHERE category=?').bind(category).first<{data:string;version:number}>();
 if(!row){await env.DB.prepare('INSERT OR IGNORE INTO lel_leagues(category,data,version) VALUES(?,?,1)').bind(category,JSON.stringify(demoLeague(category))).run();row=await env.DB.prepare('SELECT data,version FROM lel_leagues WHERE category=?').bind(category).first<{data:string;version:number}>();}
 if(!row)return publicResponse(request,{error:'Data belum dapat disediakan.'},503);
 return publicResponse(request,{data:registrationLeague(JSON.parse(row.data)),version:row.version});
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user||!env.ADMIN_EMAIL||user.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return Response.json({error:'Akses admin diperlukan.'},{status:403});
 if(request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({error:'Origin tidak sah.'},{status:403});
 const category=new URL(request.url).searchParams.get('category');if(category!=='mobile'&&category!=='console')return Response.json({error:'Kategori tidak sah.'},{status:400});
 if(!env.DB)return Response.json({error:'Pangkalan data belum tersedia.'},{status:503});
 try{const raw=await request.text();if(raw.length>500000)return Response.json({error:'Data terlalu besar.'},{status:413});const b=JSON.parse(raw);if(b.data?.referenceOnly)throw Error('Data dummy rujukan tidak boleh disimpan ke liga sebenar.');if(!Number.isInteger(b.version)||b.version<0)throw Error('Versi tidak sah.');const data=validateLeague(leagueSchema.parse(b.data));
  const text=JSON.stringify(data),next=b.version+1;
  const result=b.version===0?await env.DB.prepare('INSERT OR IGNORE INTO lel_leagues(category,data,version) VALUES(?,?,1)').bind(category,text).run():await env.DB.prepare('UPDATE lel_leagues SET data=?,version=? WHERE category=? AND version=?').bind(text,next,category,b.version).run();
  if(!result.meta.changes)return Response.json({error:'Data telah dikemas kini di tempat lain. Muat semula dahulu; perubahan tempatan masih ada.'},{status:409});
  return Response.json({version:next},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Data tidak sah.'},{status:400})}
}
