export function driveImage(link:string){
try{if(link.length>1000)return null;const u=new URL(link.trim());if(u.protocol!=='https:'||u.hostname!=='drive.google.com'||u.username||u.password||u.port)return null;
const match=u.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/);const id=match?.[1]??(['\/open','\/uc','\/thumbnail'].includes(u.pathname)?u.searchParams.get('id'):null);
if(!id||! /^[a-zA-Z0-9_-]{5,200}$/.test(id))return null;
const query=new URLSearchParams({id,sz:'w400'});const key=u.searchParams.get('resourcekey');if(key&&/^[a-zA-Z0-9_-]{1,200}$/.test(key))query.set('resourcekey',key);
return {id,src:'https://drive.google.com/thumbnail?'+query.toString(),fallback:'https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w400'};
}catch{return null}}
export function validDriveLink(link:unknown){return link===undefined||link===''||(typeof link==='string'&&!!driveImage(link));}

export function clubLogoImage(link:string){
const drive=driveImage(link);if(drive)return drive;
try{if(link.length>1000)return null;const u=new URL(link.trim());if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname==='drive.google.com')return null;return {id:u.href,src:u.href,fallback:u.href};}catch{return null}
}
export function validClubLogoLink(link:unknown){return link===undefined||link===''||(typeof link==='string'&&!!clubLogoImage(link));}
