import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pnpm=path.join(root,'node_modules/.pnpm');
const packageDir=fs.readdirSync(pnpm).filter(name=>/^esbuild@/.test(name)).sort().at(-1);
if(!packageDir)throw Error('Install project dependencies before exporting.');
const esbuild=await import(pathToFileURL(path.join(pnpm,packageDir,'node_modules/esbuild/lib/main.js')).href);
const backend='https://labuan-efootball-league.apengtakahashi.chatgpt.site';
const assetPath='./labuan-efootball-league/public';
const out=path.join(root,'.sites-runtime/github');
fs.mkdirSync(path.join(out,'lel-assets'),{recursive:true});
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import Dashboard from './app/dashboard';
const originalFetch=window.fetch.bind(window);
window.fetch=(input,options)=>{
 if(typeof input==='string'&&input.startsWith('/api/league?')&&(!options?.method||options.method==='GET')){
  return originalFetch(${JSON.stringify(backend)}+input,{...options,mode:'cors',credentials:'omit'});
 }
 return originalFetch(input,options);
};
createRoot(document.getElementById('root')).render(<Dashboard admin={false}/>);`;
const result=await esbuild.build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,write:false,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'github-public-paths',setup(build){
 build.onLoad({filter:/app\/dashboard\.tsx$/},args=>{
  const contents=fs.readFileSync(args.path,'utf8')
   .replaceAll("admin?'/admin':'/'",`admin?'${backend}/admin':'./index.html'`)
   .replaceAll("admin?'/':'/admin'",`admin?'./lel.html':'${backend}/admin'`)
   .replaceAll('src="/lel-logo.png"',`src="${assetPath}/lel-logo.png"`)
   .replaceAll("'/flags/'",`'${assetPath}/flags/'`);
  return {contents,loader:'tsx',resolveDir:path.dirname(args.path)};
 });
}}]});
fs.writeFileSync(path.join(out,'lel-assets/app.js'),result.outputFiles[0].text);
const cssDir=path.join(root,'dist/client/_next/static/css');
const css=fs.readdirSync(cssDir).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(cssDir,name),'utf8')).join('\n');
fs.writeFileSync(path.join(out,'lel-assets/style.css'),css);
const revision=process.env.LEL_EXPORT_REVISION||String(Date.now());
fs.writeFileSync(path.join(out,'lel.html'),`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#142f60"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="LEL"><meta name="description" content="Labuan eFootball League · Mobile &amp; Konsol · Groups, Matches, Stats dan Knockout"><title>Labuan eFootball League</title><link rel="icon" type="image/png" sizes="48x48" href="${assetPath}/favicon-48.png?v=20261019"><link rel="apple-touch-icon" sizes="180x180" href="${assetPath}/apple-touch-icon.png?v=20261019"><link rel="manifest" href="./lel.webmanifest"><link rel="stylesheet" href="./lel-assets/style.css?v=${revision}"></head><body><div id="root"></div><noscript>Aktifkan JavaScript untuk melihat Labuan eFootball League.</noscript><script src="./lel-assets/app.js?v=${revision}" defer></script></body></html>`);
fs.writeFileSync(path.join(out,'lel.webmanifest'),JSON.stringify({id:'./lel.html',name:'Labuan eFootball League',short_name:'LEL',lang:'ms',start_url:'./lel.html',scope:'./',display:'standalone',background_color:'#f3f5fa',theme_color:'#142f60',icons:[{src:assetPath+'/icon-192.png?v=20261019',sizes:'192x192',type:'image/png',purpose:'any'},{src:assetPath+'/icon-512.png?v=20261019',sizes:'512x512',type:'image/png',purpose:'any'},{src:assetPath+'/icon-512-maskable.png?v=20261019',sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2));
console.log(JSON.stringify({out,files:['lel.html','lel.webmanifest','lel-assets/app.js','lel-assets/style.css']}));
