export type SsoEnv={SSO_LOGIN_MODE?:string;SUBWEB_SESSION_PUBLIC_KEY?:string;SSO_ENABLED?:string;SSO_ISSUER?:string;SSO_CLIENT_ID?:string;SSO_SERVICE_TOKEN?:string;SSO_LOGIN_HOME?:string};
export function ssoEnabled(env:SsoEnv):boolean;
export function ssoConfig(env:SsoEnv):{issuer:string;clientId:string;serviceToken?:string;loginHome?:string}|null;
export function ssoReady(env:SsoEnv):Promise<boolean>;
export function ssoUser(req:Request,env:SsoEnv):Promise<{email:string;role:'superadmin';expires_at:number}|null>;
export function ssoRoute(req:Request,env:SsoEnv):Promise<Response|null>;
