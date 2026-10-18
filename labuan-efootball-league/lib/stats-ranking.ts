import {groupTable,playerStats,type League} from './league';

export type StatsMetric='goals'|'clean';
export type RankedStatsInput=ReturnType<typeof playerStats>[number]&{gd:number;leaguePosition:number;teamConceded:number};

export function compareStats(a:RankedStatsInput,b:RankedStatsInput,metric:StatsMetric){
 return metric==='goals'
  ?b.goals-a.goals||a.conceded-b.conceded||b.gd-a.gd||a.leaguePosition-b.leaguePosition
  :a.conceded-b.conceded||b.gd-a.gd||a.teamConceded-b.teamConceded;
}

export function rankStatsRows(rows:RankedStatsInput[],metric:StatsMetric){
 const sorted=rows.filter(p=>p.played>0).sort((a,b)=>compareStats(a,b,metric));
 let rank=0;
 return sorted.map((p,index)=>{
  if(index===0||compareStats(sorted[index-1],p,metric)!==0)rank=index+1;
  return {...p,rank};
 });
}

export function rankedPlayerStats(data:League,metric:StatsMetric){
 const stats=playerStats(data),positions=new Map<string,number>(),teamTotals=new Map<string,number>();
 // LEL entrants play individually: league position is their current group position.
 for(const group of data.groups)groupTable(group,data.players).forEach((p,index)=>positions.set(p.id,index+1));
 const teamKey=(p:typeof stats[number])=>p.club.trim()?p.club.trim().toLocaleLowerCase():'player:'+p.id;
 for(const p of stats)teamTotals.set(teamKey(p),(teamTotals.get(teamKey(p))||0)+p.conceded);
 return rankStatsRows(stats.map(p=>({...p,gd:p.goals-p.conceded,leaguePosition:positions.get(p.id)??Number.MAX_SAFE_INTEGER,teamConceded:teamTotals.get(teamKey(p))||0})),metric);
}
