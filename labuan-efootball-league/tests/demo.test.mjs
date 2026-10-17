import assert from 'node:assert/strict';
import {demoLeague,validateLeague,groupTable,nextRound,winner} from '../.sites-runtime/league.mjs';
for(const category of ['mobile','console']){
 let d=demoLeague(category);validateLeague(d);
 assert.equal(d.players.length,32);assert.equal(d.groups.length,4);
 assert.equal(d.groups.flatMap(g=>g.games).length,112);
 assert.equal(d.rounds[0].length,8);assert.equal(d.rounds[0].flatMap(t=>t.legs).length,16);
 const qualified=new Set(d.groups.flatMap(g=>groupTable(g,d.players).slice(0,4).map(p=>p.id)));
 const entrants=d.rounds[0].flatMap(t=>[t.a,t.b]);assert.equal(new Set(entrants).size,16);assert.ok(entrants.every(id=>qualified.has(id)));
 for(const t of d.rounds[0]){const ga=d.groups.find(g=>g.members.includes(t.a));const gb=d.groups.find(g=>g.members.includes(t.b));assert.notEqual(ga.id,gb.id);}
 for(const count of [8,4,2,1]){
  assert.equal(d.rounds.at(-1).length,count);
  for(const t of d.rounds.at(-1)){t.legs.forEach((m,i)=>Object.assign(m,{status:'completed',hs:i===0?2:0,as:i===0?0:1}));assert.equal(winner(t),t.a)}
  validateLeague(d);if(count>1)d=nextRound(d);
 }
 assert.equal(d.rounds.length,4);assert.ok(winner(d.rounds.at(-1)[0]));
 assert.deepEqual(demoLeague(category),demoLeague(category));
}
const m=demoLeague('mobile'),c=demoLeague('console');assert.ok(m.players.every(p=>!c.players.some(x=>x.id===p.id)));
console.log('PASS: Top 4 qualification, 16 unique qualifiers, cross-group pairing, full R16→QF→SF→final and independent deterministic demos.');
