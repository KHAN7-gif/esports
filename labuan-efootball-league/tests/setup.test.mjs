import assert from 'node:assert/strict';
import {demoLeague,nextRound,validateLeague,winner,sharedThirdPlayers,leagueSchema,drawGroups,emptyLeague} from '../.sites-runtime/league.mjs';
for(const n of [2,4,8]){let d=emptyLeague();d.players=demoLeague('mobile').players;d.settings.groupCount=n;d.settings.qualify=2;d=drawGroups(d);validateLeague(d);assert.equal(d.groups.length,n)}
for(const finalLegs of [1,2]){
 let d=demoLeague('mobile');d.settings.finalLegs=finalLegs;d.settings.finalPenalties='direct';
 while(d.rounds.at(-1).length>2){for(const t of d.rounds.at(-1))for(const m of t.legs)Object.assign(m,{hs:m.home===t.a?1:0,as:m.away===t.a?1:0,status:'completed'});d=nextRound(d)}
 assert.deepEqual(sharedThirdPlayers(d),[]);
 for(const t of d.rounds.at(-1))for(const m of t.legs)Object.assign(m,{hs:m.home===t.a?1:0,as:m.away===t.a?1:0,status:'completed'});
 const losers=d.rounds.at(-1).map(t=>t.b);assert.deepEqual(sharedThirdPlayers(d),losers);
 d=nextRound(d);const final=d.rounds.at(-1)[0];assert.equal(final.legs.length,finalLegs);
 for(const m of final.legs)Object.assign(m,{hs:1,as:1,status:'completed'});
 Object.assign(final.legs.at(-1),{ph:5,pa:4});validateLeague(leagueSchema.parse(d));assert.equal(winner(final),final.legs.at(-1).home);
 const extra=structuredClone(d);Object.assign(extra.rounds.at(-1)[0].legs.at(-1),{eh:0,ea:0});assert.throws(()=>validateLeague(extra));
 const et=structuredClone(d);et.settings.finalPenalties='extra-time';assert.throws(()=>validateLeague(et));Object.assign(et.rounds.at(-1)[0].legs.at(-1),{eh:0,ea:0});validateLeague(et);
 d.settings.sharedThird=false;assert.deepEqual(sharedThirdPlayers(d),[]);assert.equal(leagueSchema.parse(d).settings.sharedThird,false);
}
console.log('PASS: 2/4/8 groups, BO1 and home/away final penalties, extra-time policy and joint third places.');
