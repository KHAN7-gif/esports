import {mkdir,cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));if(!manifest.project_id)throw Error('Missing registered Site identity.');
const data={};
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await walk(path);else if(/\.(html|js|json|svg)$/.test(path))data[path.slice('assets/'.length)]=await readFile(path,'utf8')}}
await walk('assets');
await writeFile('worker/assets.generated.js','export default '+JSON.stringify(data)+';\n');
function moduleBody(source){return source.replace(/^import .*?;\s*$/gm,'').replace('export default ','const defaultExport=').replace(/^export /gm,'')}
const model=moduleBody(await readFile('worker/tekken-model.mjs','utf8'));
const api=moduleBody(await readFile('worker/tekken-api.mjs','utf8'));
const engine=moduleBody(await readFile('worker/index.js','utf8'));
const app=(await readFile('worker/app.js','utf8')).replace(/^import .*?;\s*$/gm,'');
const bundle=`const assets=${JSON.stringify(data)};\nconst auth=(()=>{${engine}\nreturn {default:defaultExport,centralIdentity,centralLogout};})();\nconst {centralIdentity,centralLogout}=auth;\nconst engineWorker=auth.default;\nconst model=(()=>{${model}\nreturn {MAX_TOURNAMENT_BYTES,validateTournament,validateSelection,resolved};})();\nconst handleTekken=(()=>{const {MAX_TOURNAMENT_BYTES,validateTournament,validateSelection,resolved}=model;${api}\nreturn handleTekken;})();\n`+app.replaceAll('auth.fetch','engineWorker.fetch').replaceAll('auth.scheduled','engineWorker.scheduled');
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',bundle);await cp('.openai/hosting.json','dist/.openai/hosting.json');await cp('drizzle','dist/.openai/drizzle',{recursive:true});
const check=spawnSync(process.execPath,['--check','dist/server/index.js'],{stdio:'inherit'});if(check.status)process.exit(check.status);
console.log('Portal, shared login and Tekken Worker packaged without external credentials.');
