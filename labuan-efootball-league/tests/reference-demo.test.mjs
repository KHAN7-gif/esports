import assert from 'node:assert/strict';
import {referenceLeague,leagueSchema,validateLeague,winner,allGames,playerStats,groupTable} from '../.sites-runtime/league.mjs';
for(const category of ['mobile','console'])for(const mode of ['bo3','aggregate']){
 const d=referenceLeague(category,mode);validateLeague(leagueSchema.parse(d));
 assert.equal(d.referenceOnly,true);assert.equal(d.players.length,32);assert.equal(new Set(d.players.map(p=>p.id)).size,32);
 assert.equal(d.groups.length,4);assert.ok(d.groups.every(g=>g.members.length===8&&g.games.length===28&&g.games.every(m=>m.status==='completed')));
 assert.deepEqual(d.rounds.map(r=>r.length),[8,4,2,1]);
 const qualified=d.groups.flatMap(g=>groupTable(g,d.players).slice(0,4).map(p=>p.id));assert.deepEqual([...d.rounds[0].flatMap(t=>[t.a,t.b])].sort(),qualified.sort());
 assert.ok(d.rounds.flat().every(t=>t.mode===mode&&winner(t)));assert.ok(winner(d.thirdPlace));
 const games=allGames(d);assert.equal(new Set(games.map(m=>m.id)).size,games.length);
 if(mode==='bo3'){assert.ok(games.every(m=>m.ph===null&&m.pa===null));assert.ok(d.rounds.flat().some(t=>t.legs[2].status==='completed'));assert.ok(d.rounds.flat().some(t=>t.legs[2].status==='scheduled'));}
 else assert.ok(d.rounds.flat().some(t=>t.legs[1].ph!==null));
 assert.equal(playerStats(d).reduce((n,p)=>n+p.played,0),games.filter(m=>m.status==='completed').length*2);
 assert.deepEqual(referenceLeague(category,mode),d);assert.ok(d.players.every(p=>p.state&&/^[A-Z]{3}$/.test(p.clubNickname)));
 const before=JSON.stringify(d);const altered=referenceLeague(category,mode);altered.players[0].ign='Edited dummy';assert.equal(JSON.stringify(d),before);
}
console.log('PASS: isolated deterministic 32-player references for both arenas, 4×8 groups, T16→T8→T4→final, third/fourth, BO3 2–0/2–1, Aggregate penalties and completed-only statistics.');
