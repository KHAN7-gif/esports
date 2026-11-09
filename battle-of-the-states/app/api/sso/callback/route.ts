import {env} from 'cloudflare:workers';
import {ssoRoute,type SsoEnv} from '../../../../lib/sso-client.mjs';
export const dynamic='force-dynamic';
async function handle(req:Request){return await ssoRoute(req,env as typeof env & SsoEnv)??new Response('Not found',{status:404})}
export const GET=handle;
export const POST=handle;
