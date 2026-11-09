import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {ssoReady,ssoUser,type SsoEnv} from '../lib/sso-client.mjs';
export async function centralLoginEnabled(){return ssoReady(env as typeof env & SsoEnv)}
export async function centralUser(){const h=await headers();return ssoUser(new Request('https://local.invalid',{headers:{Cookie:h.get('cookie')||''}}),env as typeof env & SsoEnv)}
