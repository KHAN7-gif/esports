export function issueLocalSession(privateKey:string,claims:Record<string,unknown>):Promise<string>;
export function verifyLocalSession(token:string,publicKey:string|undefined,issuer:string|undefined,audience:string|undefined):Promise<{sub:string;role:'superadmin';exp:number;nonce:string;[key:string]:unknown}|null>;
