import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'.cloudflare/elite/assets');
await mkdir(out,{recursive:true});
for(const name of ['the-elite.html','elite-admin.html','admin-login.css','elite-config.js','mde-logo.svg','elite.webmanifest','elite-icon.svg','elite-icon-maskable.svg','elite-icon-192.png','elite-icon-512.png','elite-icon-512-maskable.png']) {
 await copyFile(path.join(root,name),path.join(out,name));
}
console.log('The Elite static assets prepared. No database records are seeded.');
