import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,flagCode,normalizeClubs,standings,playerStats,statsRankings,motmAwards} from '../lib/data.ts';

test('legacy demo keeps 16 teams, 256 players and 120 fixtures',()=>{
 const data=seed();assert.equal(data.teams.length,16);assert.equal(data.teams.flatMap(t=>t.players).length,256);assert.equal(data.matches.length,120);assert.equal(data.demo,true);
});
test('renaming club and abbreviation preserves flag across save/reload',()=>{
 const data=normalizeClubs(seed());const team=data.teams[15];
 team.name='Labuan United';team.code='LUFC';
 const loaded=normalizeClubs(JSON.parse(JSON.stringify(data)));
 assert.equal(loaded.teams[15].name,'Labuan United');assert.equal(loaded.teams[15].code,'LUFC');assert.equal(flagCode(loaded.teams[15]),'LBN');
 loaded.teams[15].stateCode='SBH';assert.equal(flagCode(loaded.teams[15]),'SBH');
});
test('legacy names are never rewritten and missing flag falls back safely',()=>{
 const data=seed();data.teams[15].name='Labuan';data.teams[15].code='LUFC';
 const loaded=normalizeClubs(data);assert.equal(loaded.teams[15].name,'Labuan');assert.equal(flagCode(loaded.teams[15]),'LBN');
});
test('club edits preserve standings, scoring and fixture/player identities',()=>{
 const data=seed();const before=standings(data).map(t=>[t.id,t.pts,t.gf,t.ga]);
 const loaded=normalizeClubs(data);loaded.teams[15].name='Labuan United';loaded.teams[15].code='LUFC';
 assert.deepEqual(standings(loaded).map(t=>[t.id,t.pts,t.gf,t.ga]),before);
 assert.deepEqual(loaded.matches,data.matches);assert.equal(playerStats(loaded).reduce((n,p)=>n+p.goals,0),playerStats(data).reduce((n,p)=>n+p.goals,0));
 assert.ok(playerStats(loaded).filter(p=>p.teamId===15).every(p=>p.team==='Labuan United'));
});
test('MOTM and statistics continue to resolve club by stable ID',()=>{
 const data=normalizeClubs(seed());const m=data.matches[0];m.games[0].motm=m.games[0].homePlayer;
 const team=data.teams.find(t=>t.id===m.home);team.name='Kelab Labuan';team.code='KLAB';
 assert.equal(motmAwards(data)[0].team.name,'Kelab Labuan');assert.doesNotThrow(()=>statsRankings(data));
});
