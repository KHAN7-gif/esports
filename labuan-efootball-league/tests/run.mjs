import fs from 'node:fs';
import ts from 'typescript';
fs.mkdirSync('.sites-runtime',{recursive:true});
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
fs.writeFileSync('.sites-runtime/league.mjs',transpile(fs.readFileSync('lib/league.ts','utf8')));
let api=transpile(fs.readFileSync('app/api/league/route.ts','utf8'));
api=api.replace(/import \{ env \} from ['"]cloudflare:workers['"];/,'const env=globalThis.__lelEnv;').replace(/import \{ getChatGPTUser \} from [^;]+;/,'const getChatGPTUser=async()=>globalThis.__lelUser;').replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/league['"]/,"from './league.mjs'");
fs.writeFileSync('.sites-runtime/api.mjs',api);
await import('./league.test.mjs');
await import('./demo.test.mjs');
await import('./api.test.mjs');

await import('./manual.test.mjs');

await import('./setup.test.mjs');

await import('./registration.test.mjs');
