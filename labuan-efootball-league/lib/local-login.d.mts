import type {SsoEnv} from './sso-client.mjs';
export function localUser(req:Request,env:SsoEnv):Promise<{email:string;role:'superadmin';expires_at:number}|null>;
export function localLoginRoute(req:Request,env:SsoEnv):Promise<Response|null>;
