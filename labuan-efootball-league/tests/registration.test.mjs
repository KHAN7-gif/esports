import assert from 'node:assert/strict';
import {registrationLeague,addGroupPlayer,emptyLeague,demoLeague,validateLeague,manualGroups} from '../.sites-runtime/league.mjs';
for(const n of [2,4,8]){const empty=emptyLeague();empty.settings.groupCount=n;const d=registrationLeague(empty);assert.equal(d.groups.length,0);assert.equal(d.players.length,n*8);for(let i=0;i<n;i++)for(let j=0;j<8;j++)assert.equal(d.players.find(p=>p.id===d.groupSlots[i][j]).ign,String.fromCharCode(65+i)+(j+1));validateLeague(d);assert.deepEqual(registrationLeague(d),d)}
const original=demoLeague('mobile'),d=registrationLeague(original);validateLeague(d);assert.deepEqual(d.rounds,original.rounds);assert.equal(d.players.filter(p=>p.placeholder).length,32);assert.deepEqual(registrationLeague(d),d);
let e=registrationLeague(emptyLeague());const added=addGroupPlayer(e,3);assert.equal(added.player.ign,'D1');assert.equal(added.data.players.length,32);added.player.ign='Real.Player';added.player.placeholder=false;const again=addGroupPlayer(added.data,3);assert.equal(again.player.ign,'D2');assert.equal(registrationLeague(again.data).players.find(p=>p.id===added.player.id).ign,'Real.Player');
const fixtures=manualGroups(e,e.groupSlots);assert.equal(fixtures.groups.flatMap(g=>g.games).length,112);validateLeague(fixtures);
for(const id of e.groupSlots[0])e.players.find(p=>p.id===id).placeholder=false;
const extra=addGroupPlayer(e,0);assert.equal(extra.player.ign,'A9');assert.equal(extra.data.groupSlots[0].length,9);assert.throws(()=>manualGroups(extra.data,extra.data.groupSlots));assert.equal(registrationLeague(extra.data).groupSlots[1].length,8);
console.log('PASS: temporary group names, idempotent registration, real player replacement, per-group addition and pre-fixture validation.');
