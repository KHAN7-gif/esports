import assert from 'node:assert/strict';
import {rankStatsRows,rankedPlayerStats} from '../.sites-runtime/stats-ranking.mjs';
import {emptyLeague,game} from '../.sites-runtime/league.mjs';

const row=(id,values={})=>({id,ign:id,name:'',photo:'',logo:'',club:'',played:1,goals:3,conceded:1,gd:2,clean:0,motm:0,leaguePosition:2,teamConceded:3,...values});
const ids=(rows,metric)=>rankStatsRows(rows,metric).map(p=>p.id);
assert.deepEqual(ids([row('zero',{goals:0}),row('scorer',{goals:1})],'goals'),['scorer']);
assert.deepEqual(ids([row('zero',{goals:0})],'goals'),[]);
assert.deepEqual(ids([row('less',{goals:2}),row('most',{goals:5,conceded:8})],'goals'),['most','less']);
assert.deepEqual(ids([row('more',{conceded:2}),row('fewer')],'goals'),['fewer','more']);
assert.deepEqual(ids([row('low',{gd:1}),row('high')],'goals'),['high','low']);
assert.deepEqual(ids([row('second'),row('first',{leaguePosition:1})],'goals'),['first','second']);
assert.deepEqual(ids([row('manyCS',{conceded:4,clean:5}),row('fewer',{conceded:0})],'clean'),['fewer','manyCS']);
assert.deepEqual(ids([row('low',{gd:1}),row('high')],'clean'),['high','low']);
assert.deepEqual(ids([row('teamMore',{teamConceded:5}),row('teamFewer')],'clean'),['teamFewer','teamMore']);
for(const metric of ['goals','clean']){
 const tied=rankStatsRows([row('Zulu'),row('Alpha'),row('NoGames',{played:0}),row('Third',{goals:1,conceded:3,gd:-2})],metric);
 assert.deepEqual(tied.map(p=>p.rank),[1,1,3]);
 assert.deepEqual(tied.map(p=>p.id),['Zulu','Alpha','Third']);
}
const data=emptyLeague();
data.players=['a','b','c','unplayed'].map(id=>({id,ign:id,name:'',club:id==='a'?' MAIDA ':id==='b'?'maida':'',photo:'',logo:''}));
data.groups=[{id:'g',name:'Group A',members:data.players.map(p=>p.id),games:[
 {...game('1','a','c'),hs:3,as:1,status:'completed'},
 {...game('2','b','c'),hs:0,as:2,status:'completed'},
 {...game('3','unplayed','a'),hs:99,as:0,status:'live'},
 {...game('4','unplayed','b'),hs:99,as:0,status:'scheduled'}
]}];
const before=JSON.stringify(data),ranked=rankedPlayerStats(data,'clean');
assert.equal(ranked.length,3);
assert.equal(ranked.find(p=>p.id==='a').teamConceded,3);
assert.equal(ranked.find(p=>p.id==='b').teamConceded,3);
assert.equal(ranked.find(p=>p.id==='a').goals,3);
assert.equal(ranked.find(p=>p.id==='a').gd,2);
assert.equal(ranked.find(p=>p.id==='a').leaguePosition,1);
assert.equal(ranked.find(p=>p.id==='c').teamConceded,3);
assert.equal(JSON.stringify(data),before);
console.log('PASS: every Goals/Clean Sheets criterion, shared ranks, no-games exclusion, completed-only counts, team totals and unchanged data.');
