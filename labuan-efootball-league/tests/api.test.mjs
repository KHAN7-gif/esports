import assert from 'node:assert/strict';
import {emptyLeague} from '../.sites-runtime/league.mjs';
const rows=new Map();
globalThis.__lelUser=null;
class DB {
 prepare(sql){return {bind(...args){return {
  async first(){return rows.get(args[0])||null},
  async run(){
   let changes=0;
   if(sql.startsWith('INSERT')){
    if(!rows.has(args[0])){rows.set(args[0],{data:args[1],version:1});changes=1}
   }else if(sql.startsWith('UPDATE')){
    const old=rows.get(args[2]);if(old&&old.version===args[3]){rows.set(args[2],{data:args[0],version:args[1]});changes=1}
   }else throw Error('Unexpected mutation');
   return {meta:{changes}};
  }
 }}}}
}
globalThis.__lelEnv={ADMIN_EMAIL:'admin@example.com',DB:new DB()};
const {GET,PUT}=await import('../.sites-runtime/api.mjs');
const req=(category,body,origin='https://lel.example')=>new Request('https://lel.example/api/league?category='+category,{method:'PUT',headers:{Origin:origin},body:JSON.stringify(body)});
const body={data:emptyLeague(),version:0};
assert.equal((await PUT(req('mobile',body))).status,403);
globalThis.__lelUser={email:'other@example.com'};
assert.equal((await PUT(req('mobile',body))).status,403);
globalThis.__lelUser={email:'admin@example.com'};
assert.equal((await PUT(req('mobile',body,'https://evil.example'))).status,403);
assert.equal((await PUT(req('unknown',body))).status,400);
assert.equal((await PUT(req('mobile',body))).status,200);
const mobileBefore=structuredClone(rows.get('mobile'));
assert.equal((await PUT(req('console',{...body,data:{...body.data,title:'Konsol League'}}))).status,200);
assert.deepEqual(rows.get('mobile'),mobileBefore);
assert.equal(rows.size,2);
assert.equal((await PUT(req('mobile',body))).status,409);
const changed={data:{...emptyLeague(),season:'Season 2'},version:1};
assert.equal((await PUT(req('mobile',changed))).status,200);
assert.equal(rows.get('mobile').version,2);
assert.equal(rows.get('console').version,1);
assert.equal((await PUT(req('mobile',changed))).status,409);
const get=await GET(new Request('https://lel.example/api/league?category=mobile'));
assert.equal((await get.json()).data.season,'Season 2');
assert.equal(get.headers.get('Cache-Control'),'no-store');
assert.equal((await GET(new Request('https://lel.example/api/league?category=bad'))).status,400);
assert.equal((await PUT(req('mobile',{version:2,data:{...emptyLeague(),players:[{}]}}))).status,400);
console.log('PASS: admin authorization, origin protection, validation, independent category storage, optimistic conflicts and uncached reads.');
rows.clear();
for(const category of ['mobile','console']){
 const initial=await GET(new Request('https://lel.example/api/league?category='+category));const b=await initial.json();
 assert.equal(initial.status,200);assert.equal(b.version,1);assert.equal(b.data.players.length,32);
 assert.deepEqual(b.data.groups.map(g=>g.members.length),[8,8,8,8]);assert.equal(b.data.settings.qualify,4);
 assert.equal(b.data.rounds[0].length,8);assert.equal(b.data.demo,true);
}
const before=structuredClone(rows.get('mobile'));
await GET(new Request('https://lel.example/api/league?category=mobile'));assert.deepEqual(rows.get('mobile'),before);
assert.notEqual(rows.get('mobile').data,rows.get('console').data);
console.log('PASS: durable, idempotent demo initialization with 32 players, 4x8 groups, Top 4 and round of 16 in both categories.');
