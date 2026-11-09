export type SsoEnv={SSO_ENABLED?:string;SSO_ISSUER?:string;SSO_CLIENT_ID?:string;SSO_SERVICE_TOKEN?:string};
export function ssoEnabled(env:SsoEnv):boolean;
export function ssoConfig(env:SsoEnv):{issuer:string;clientId:string;serviceToken?:string}|null;
export function ssoReady(env:SsoEnv):Promise<boolean>;
export function ssoUser(req:Request,env:SsoEnv):Promise<{email:string;role:'superadmin';expires_at:number}|null>;
export function ssoRoute(req:Request,env:SsoEnv):Promise<Response|null>;
