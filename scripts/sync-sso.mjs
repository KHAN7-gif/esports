import {readFile,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
for(const app of ['efll','battle-of-the-states','labuan-efootball-league'])for(const suffix of ['mjs','d.mts']){
 const source=new URL('sso/client.'+suffix,root),target=new URL(app+'/lib/sso-client.'+suffix,root);
 if(process.argv.includes('--check')){if(!Buffer.from(await readFile(source)).equals(Buffer.from(await readFile(target))))throw Error('SSO client copy differs: '+app)}else await copyFile(source,target);
}
console.log('SSO client modules are synchronized.');
