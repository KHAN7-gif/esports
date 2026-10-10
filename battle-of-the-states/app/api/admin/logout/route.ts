import {sessionCookie} from '../../../admin-auth';
export async function POST(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});return new Response(null,{status:303,headers:{Location:'/admin/login','Set-Cookie':sessionCookie('',0),'Cache-Control':'no-store'}})}
