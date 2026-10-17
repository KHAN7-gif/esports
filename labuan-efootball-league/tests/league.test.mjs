import assert from 'node:assert/strict';
import {emptyLeague,drawGroups,groupTable,nextRound,winner,totals,validateLeague,leagueSchema,playerStats} from '../.sites-runtime/league.mjs';
let d=emptyLeague();d.settings.qualify=2;
d.players=Array.from({length:16},(_,i)=>({id:'p'+i,ign:'Player '+String(i).padStart(2,'0'),name:'',club:'',photo:'',logo:''}));
d=drawGroups(d,()=>.5);validateLeague(leagueSchema.parse(d));
assert.equal(d.groups.length,4);assert.equal(d.groups.flatMap(g=>g.games).length,24);
assert.equal(new Set(d.groups.flatMap(g=>g.members)).size,16);
assert.throws(()=>nextRound(d));
for(const g of d.groups)for(const m of g.games){m.hs=2;m.as=1;m.status='completed'}
assert.equal(groupTable(d.groups[0],d.players).reduce((n,p)=>n+p.pts,0),18);
d=nextRound(d);validateLeague(d);assert.equal(d.rounds[0].length,4);
const t=d.rounds[0][0];assert.equal(t.legs[0].home,t.a);assert.equal(t.legs[1].home,t.b);
t.legs[0]={...t.legs[0],status:'completed',hs:2,as:1};
t.legs[1]={...t.legs[1],status:'completed',hs:2,as:1};
assert.deepEqual(totals(t),{a:3,b:3});assert.equal(winner(t),null);
// No away-goal tiebreaker. Extra time uses the second leg's home/away orientation.
t.legs[1].eh=1;t.legs[1].ea=0;assert.equal(winner(t),t.b);validateLeague(d);
t.legs[1].eh=0;t.legs[1].ea=0;t.legs[1].ph=4;t.legs[1].pa=5;
assert.equal(winner(t),t.a);validateLeague(d);
assert.equal(playerStats(d).find(p=>p.id===t.a).goals,groupTable(d.groups.find(g=>g.members.includes(t.a)),d.players).find(p=>p.id===t.a).gf+3);
const invalid=structuredClone(d);invalid.rounds[0][0].legs[0].eh=1;invalid.rounds[0][0].legs[0].ea=0;assert.throws(()=>validateLeague(invalid));
const dup=structuredClone(d);dup.groups[0].members[0]=dup.groups[0].members[1];assert.throws(()=>validateLeague(dup));
const badPenalty=structuredClone(d);badPenalty.rounds[0][0].legs[1].ph=5;assert.throws(()=>validateLeague(badPenalty));
// Complete all remaining ties, generate semis, then final.
for(const tie of d.rounds[0].slice(1)){tie.legs.forEach((m,i)=>Object.assign(m,{status:'completed',hs:i===0?3:0,as:i===0?0:1}))}
d=nextRound(d);assert.equal(d.rounds[1].length,2);validateLeague(d);
for(const tie of d.rounds[1])tie.legs.forEach((m,i)=>Object.assign(m,{status:'completed',hs:i===0?2:0,as:i===0?0:1}));
d=nextRound(d);assert.equal(d.rounds[2].length,1);assert.equal(d.rounds[2][0].legs.length,1);validateLeague(d);
const final=d.rounds[2][0];Object.assign(final.legs[0],{status:'completed',hs:1,as:1,eh:0,ea:0,ph:3,pa:4,motm:final.b});validateLeague(d);assert.equal(winner(final),final.b);assert.throws(()=>nextRound(d));
assert.equal(playerStats(d).find(p=>p.id===final.b).motm,1);
const stale=structuredClone(d);stale.rounds[1][0].a='unknown';assert.throws(()=>validateLeague(stale));
const settings=emptyLeague();settings.players=structuredClone(d.players);settings.settings={groupCount:2,qualify:2,finalLegs:2};const drawn=drawGroups(settings,()=>.3);drawn.groups.forEach(g=>g.games.forEach(m=>Object.assign(m,{status:'completed',hs:0,as:0})));validateLeague(drawn);const semi=nextRound(drawn);assert.equal(semi.rounds[0].length,2);
assert.equal(emptyLeague().players.length,0);
assert.equal(leagueSchema.safeParse({...emptyLeague(),players:[{...d.players[0],photo:'javascript:alert(1)'}]}).success,false);
console.log('PASS: group draw, BO1, ranking, knockout progression, reversed home/away, aggregates, extra time, penalties, final, MOTM, invalid data and empty start.');
