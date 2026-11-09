import {centralLoginEnabled} from '../../../sso-auth';
import {env} from 'cloudflare:workers';
import {ssoRoute,type SsoEnv} from '../../../../lib/sso-client.mjs';
import {sessionCookie} from '../../../admin-auth';
export async function POST(req:Request){if(centralLoginEnabled())return (await ssoRoute(new Request(new URL('/api/sso/logout',req.url),req),env as typeof env & SsoEnv))!;if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});return new Response(null,{status:303,headers:{Location:'/admin/login','Set-Cookie':sessionCookie('',0),'Cache-Control':'no-store'}})}
