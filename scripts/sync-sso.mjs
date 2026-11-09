import {readFile,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
for(const target of ['efll/lib/sso-client','battle-of-the-states/lib/sso-client','labuan-efootball-league/lib/sso-client','central-auth/tests/sso-client'])for(const suffix of ['mjs','d.mts']){
 const source=new URL('sso/client.'+suffix,root),destination=new URL(target+'.'+suffix,root);
 if(process.argv.includes('--check')){if(!Buffer.from(await readFile(source)).equals(Buffer.from(await readFile(destination))))throw Error('SSO client copy differs: '+target)}else await copyFile(source,destination);
}
console.log('SSO client modules are synchronized.');

for(const directory of ['efll/lib/','battle-of-the-states/lib/','labuan-efootball-league/lib/','central-auth/tests/','central-auth/worker/'])for(const name of ['local-login','session-token'])for(const suffix of ['mjs','d.mts']){const source=new URL('sso/'+name+'.'+suffix,root),destination=new URL(directory+name+'.'+suffix,root);if(process.argv.includes('--check')){if(!Buffer.from(await readFile(source)).equals(Buffer.from(await readFile(destination))))throw Error('Local login copy differs: '+directory+name)}else await copyFile(source,destination)}
