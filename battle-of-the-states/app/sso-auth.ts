import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {ssoEnabled,ssoUser,type SsoEnv} from '../lib/sso-client.mjs';
export function centralLoginEnabled(){return ssoEnabled(env as typeof env & SsoEnv)}
export async function centralUser(){const h=await headers();return ssoUser(new Request('https://local.invalid',{headers:{Cookie:h.get('cookie')||''}}),env as typeof env & SsoEnv)}
