import { mkdir, copyFile, stat, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'.cloudflare/elite/assets');
await mkdir(out,{recursive:true});
for(const name of ['esports.html','the-elite.html','elite-track-guide.html','IMG_1185.jpeg','elite-admin.html','admin-login.css','elite-config.js','elite-registration.js','elite-admin-registrations.js','mde-logo.svg','elite.webmanifest','elite-icon.svg','elite-icon-maskable.svg','elite-icon-192.png','elite-icon-512.png','elite-icon-512-maskable.png']) {
 const source=path.join(root,name);
 const info=await stat(source);
 if(!info.isFile()||info.size===0)throw Error('Missing or empty The Elite asset: '+name);
 await copyFile(source,path.join(out,name));
}
await cp(path.join(root,'tekken'),path.join(out,'tekken'),{recursive:true,filter:source=>!source.endsWith('model.mjs')});
console.log('The Elite static assets prepared. No database records are seeded.');
