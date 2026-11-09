import {cp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
// Preserve the existing static prototype. Build secure server-backed pages only
// into the Elite Worker assets, where authentication and persistence exist.
export async function prepareTekken(root,out){
 await cp(path.join(root,'tekken'),path.join(out,'tekken'),{recursive:true,filter:source=>!source.endsWith('model.mjs')});
 for(const filename of ['index.html','match-v3.html']){
  let html=await readFile(path.join(root,'tekken',filename),'utf8');html=html.replaceAll('tekken-selection-','esports-tekken-selection-');
  if(filename==='index.html'){
   html=html.replace("const DEMO_PASSWORD='admin123';",'');const start=html.indexOf("$('auth').addEventListener('click'"),end=html.indexOf("$('count').addEventListener",start);if(start<0||end<0)throw Error('Tekken prototype login markup changed; update the secure asset transform.');
   html=html.slice(0,start)+"$('auth').addEventListener('click',()=>window.tekkenAuth?.());"+html.slice(end);
   html=html.replace(/<dialog id="loginDialog">[\s\S]*?<\/dialog>/,'').replace('Tekken 8 tournament bracket prototype • 8 / 16 / 32 players • Demo admin password: admin123 (local prototype only) • UI v5','Tekken 8 · 8 / 16 / 32 players · Akaun admin The Elite · Simpan keputusan ke server');
  }else{
   html=html.replace("if(admin){admin=false;document.body.classList.remove('admin');$('adminToggle').textContent='Admin Login';return}",'');
   html=html.replace("let pass=prompt('Masukkan kata laluan Admin (demo)');if(pass==='admin123'){admin=true;document.body.classList.add('admin');$('adminToggle').textContent='Log out'}else if(pass!==null)alert('Kata laluan salah')","window.tekkenAuth?.()");
   html=html.replace('Gambar disimpan pada pelayar ini.','Tekan Simpan ke server selepas menyunting pilihan atau gambar.');
  }
  html=html.replace('</body>','<script src="./online.js"></script></body>');
  if(html.includes('admin123')||html.includes('DEMO_PASSWORD'))throw Error('Demo credentials remain in a hosted Tekken page.');
  await writeFile(path.join(out,'tekken',filename),html);
 }
}
