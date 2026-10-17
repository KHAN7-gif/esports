import assert from 'node:assert/strict';
import {game,groupRounds,demoLeague} from '../.sites-runtime/league.mjs';

for(let n=2;n<=16;n++){
 const members=Array.from({length:n},(_,i)=>'p'+i),games=[];
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)games.push({...game(i+'-'+j,members[i],members[j]),hs:i,as:j,status:'completed'});
 const g={id:'g',name:'Group A',members,games},before=JSON.stringify(g),rounds=groupRounds(g);
 assert.equal(rounds.length,n%2?n:n-1);
 assert.equal(rounds.flatMap(r=>r.games).length,games.length);
 assert.equal(new Set(rounds.flatMap(r=>r.games.map(m=>m.id))).size,games.length);
 for(const round of rounds){
  assert.equal(round.games.length,Math.floor(n/2));
  const playing=round.games.flatMap(m=>[m.home,m.away]);
  assert.equal(new Set(playing).size,playing.length);
  if(n%2){assert.ok(members.includes(round.bye));assert.ok(!playing.includes(round.bye))}else assert.equal(round.bye,null);
  for(const m of round.games)assert.equal(m,games.find(x=>x.id===m.id));
 }
 if(n%2)assert.equal(new Set(rounds.map(r=>r.bye)).size,n);
 assert.equal(JSON.stringify(g),before);
 assert.deepEqual(groupRounds({...g,games:[...games].reverse()}).map(r=>r.games.map(m=>m.id)),rounds.map(r=>r.games.map(m=>m.id)));
}
for(const category of ['mobile','console']){
 const d=demoLeague(category),before=JSON.stringify(d);
 for(const g of d.groups){const rounds=groupRounds(g);assert.equal(rounds.length,7);assert.ok(rounds.every(r=>r.games.length===4));assert.equal(rounds[0].games.length,4);assert.equal(rounds.flatMap(r=>r.games).length,28)}
 assert.equal(JSON.stringify(d),before);
}
console.log('PASS: complete BO1 rounds, one match/player/round, odd-player byes, stable scheduling and preserved scores/IDs.');
