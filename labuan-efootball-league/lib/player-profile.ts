import {groupRounds,groupTable,winner,type Game,type League} from './league';
export type ProfileScope='all'|'groups'|'knockout';
export function playerRecord(data:League,pid:string,scope:ProfileScope='all'){
 const entries:{game:Game;stage:string;kind:'groups'|'knockout';order:number}[]=[];
 const add=(game:Game,stage:string,kind:'groups'|'knockout')=>{if(game.home===pid||game.away===pid)entries.push({game,stage,kind,order:entries.length})};
 for(const g of data.groups)for(const r of groupRounds(g))for(const m of r.games)add(m,g.name+' · ROUND '+r.number,'groups');
 const ties=data.rounds.flatMap(r=>r.map(t=>({tie:t,stage:r.length===1?'Final':'T'+r.length*2})));
 if(data.thirdPlace)ties.push({tie:data.thirdPlace,stage:'Tempat 3 / 4'});
 for(const {tie:t,stage} of ties)for(const [i,m] of t.legs.entries())if(!(t.mode==='bo3'&&winner(t)&&m.status==='scheduled'))add(m,stage+' · '+(t.mode==='bo3'?'Game ':'Leg ')+(i+1),'knockout');
 const selected=entries.filter(e=>scope==='all'||e.kind===scope);
 const history=selected.filter(({game:m})=>m.status==='completed'&&m.hs!==null&&m.as!==null).map(e=>{
  const m=e.game,home=m.home===pid,gf=(home?m.hs!:m.as!)+(home?m.eh??0:m.ea??0),ga=(home?m.as!:m.hs!)+(home?m.ea??0:m.eh??0);
  return {...e,gf,ga,opponent:home?m.away:m.home,result:gf>ga?'W' as const:gf<ga?'L' as const:'D' as const,motm:m.motm===pid};
 }).sort((a,b)=>b.game.date.localeCompare(a.game.date)||b.order-a.order);
 const played=history.length,wins=history.filter(m=>m.result==='W').length,draws=history.filter(m=>m.result==='D').length,losses=played-wins-draws,goals=history.reduce((s,m)=>s+m.gf,0),conceded=history.reduce((s,m)=>s+m.ga,0),motm=history.filter(m=>m.motm).length;
 let streak=0;for(const m of history){if(m.result!=='W')break;streak++}
 const bestWin=history.filter(m=>m.result==='W').sort((a,b)=>(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)[0];
 const group=data.groups.find(g=>g.members.includes(pid)),table=group?groupTable(group,data.players):[],position=table.findIndex(p=>p.id===pid)+1;
 const series=ties.filter(({tie:t})=>(t.a===pid||t.b===pid)&&winner(t));
 return {played,wins,draws,losses,goals,conceded,gd:goals-conceded,motm,winRate:played?Math.round(wins/played*100):0,average:played?(goals/played).toFixed(2):'0.00',streak,bestWin,history,form:history.slice(0,5).reverse(),upcoming:selected.filter(e=>e.game.status!=='completed').sort((a,b)=>(a.game.date||'9999').localeCompare(b.game.date||'9999')||a.order-b.order),group,position:position||null,points:table.find(p=>p.id===pid)?.pts??0,seriesPlayed:series.length,seriesWon:series.filter(({tie:t})=>winner(t)===pid).length};
}
