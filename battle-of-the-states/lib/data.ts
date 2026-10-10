export const states=['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','WP KUALA LUMPUR','WP PUTRAJAYA','WP LABUAN'];
export const codes=['JHR','KDH','KEL','MLK','NSN','PHG','PRK','PLS','PNG','SBH','SWK','SEL','TRG','KUL','PJY','LBN'];
export type Team={id:number;name:string;code:string;manager:string;managerImage?:string;assistant:string;coach:string;logo?:string;players:{id:string;name:string;ign:string;image?:string;clubLogo?:string;clubName?:string}[]};
export type PlayerGame={homePlayer:string;awayPlayer:string;hs:number;as:number;played:boolean;live?:boolean;motm?:string};
export type Match={id:number;week:number;home:number;away:number;date:string;played:boolean;live?:boolean;hs:number;as:number;games?:PlayerGame[];gameCount?:number;cleanSheets?:string[];goals:{player:string;count:number}[]};
export type Advertisement={id:string;title:string;image:string};
export type Competition={id:string;name:string;season:string;format:string;status:"upcoming"|"ongoing"|"completed";logo:string;url:string};
export type Season={id:string;name:string;status:"upcoming"|"ongoing"|"completed";url:string};
export type Data={seasons?:Season[];competitions?:Competition[];ads?:Advertisement[];teams:Team[];matches:Match[];demo:boolean;demoScenario?:string};
export function seed():Data {
const teams=states.map((name,id)=>({id,name,code:codes[id],manager:'Manager '+codes[id],assistant:'Penolong '+codes[id],coach:'Coach '+codes[id],players:Array.from({length:16},(_,p)=>({id:`${id}-${p}`,name:`Pemain ${String(p+1).padStart(2,'0')}`,ign:`${id===15?'LBU':codes[id]}${String(p+1).padStart(2,'0')}`}))}));
const matches:Match[]=[];const ring=teams.map(t=>t.id);
for(let w=1;w<=15;w++){for(let i=0;i<8;i++){const home=w%2?ring[i]:ring[15-i],away=w%2?ring[15-i]:ring[i];const played=w<=2,hs=(i+w)%4,as=(i*2+w)%3;matches.push({id:matches.length,week:w,home,away,date:'',played,hs:played?hs:0,as:played?as:0,goals:played?[...(hs?[{player:`${home}-0`,count:hs}]:[]),...(as?[{player:`${away}-0`,count:as}]:[])]:[]});}ring.splice(1,0,ring.pop()!);}
for(const m of matches){const example=m.week===1&&m.home===0&&m.away===15;const count=example?5:16;m.gameCount=count;m.games=Array.from({length:count},(_,i)=>({homePlayer:teams[m.home].players[example?4-i:i].id,awayPlayer:teams[m.away].players[i].id,hs:example?[1,2,0,3,0][i]:m.played?(i+m.week)%4:0,as:example?[2,3,0,2,4][i]:m.played?(i*2+m.week)%3:0,played:m.played}));Object.assign(m,seriesSummary(m));}
return updateDummyResults({teams,matches,demo:true});}
export function standings(input:Data, options:{week?:number;venue?:string;live?:boolean}={}){const d={...input,matches:input.matches.map(m=>{const active=options.live&&isMatchLive(m);const summary=seriesSummary(active?{...m,games:m.games?.map(g=>({...g,played:g.played||g.live===true}))}:m);return {...m,...summary,played:summary.played||!!active}})};return d.teams.map(t=>{let p=0,w=0,draw=0,l=0,gf=0,ga=0;const form:string[]=[];d.matches.filter(m=>m.played&&(!options.week||m.week<=options.week)&&(options.venue==='home'?m.home===t.id:options.venue==='away'?m.away===t.id:(m.home===t.id||m.away===t.id))).sort((a,b)=>a.week-b.week||a.date.localeCompare(b.date)||a.id-b.id).forEach(m=>{const h=m.home===t.id,a=h?m.hs:m.as,b=h?m.as:m.hs;p++;gf+=a;ga+=b;if(a>b){w++;form.push('W')}else if(a===b){draw++;form.push('D')}else{l++;form.push('L')}});return {...t,p,w,draw,l,gf,ga,gd:gf-ga,pts:w*3+draw,form:form.slice(-5)};}).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name));}

// A team earns one series point per player-game victory. Drawn games earn none.
export function seriesSummary(m:Match){if(!m.games)return {hs:m.hs,as:m.as,played:m.played,goals:m.goals,cleanSheets:m.cleanSheets||[]};const games=m.games.filter(g=>g.played);const goalMap=new Map<string,number>();const cleanSheets:string[]=[];for(const g of games){goalMap.set(g.homePlayer,(goalMap.get(g.homePlayer)||0)+g.hs);goalMap.set(g.awayPlayer,(goalMap.get(g.awayPlayer)||0)+g.as);if(g.as===0)cleanSheets.push(g.homePlayer);if(g.hs===0)cleanSheets.push(g.awayPlayer);}return {hs:games.filter(g=>g.hs>g.as).length,as:games.filter(g=>g.as>g.hs).length,played:m.games.length===(m.gameCount||16)&&m.games.every(g=>g.played),goals:Array.from(goalMap,([player,count])=>({player,count})).filter(g=>g.count>0),cleanSheets};}
export function playerStats(d:Data){return d.teams.flatMap(t=>t.players.map(p=>({...p,team:t.name,code:t.code,teamId:t.id,...playerDefence(d,p.id),goals:d.matches.reduce((n,m)=>n+(m.games?m.games.filter(g=>g.played).reduce((a,g)=>a+(g.homePlayer===p.id?g.hs:g.awayPlayer===p.id?g.as:0),0):m.played?m.goals.filter(g=>g.player===p.id).reduce((a,g)=>a+g.count,0):0),0),clean:d.matches.reduce((n,m)=>n+(m.games?m.games.filter(g=>g.played&&((g.homePlayer===p.id&&g.as===0)||(g.awayPlayer===p.id&&g.hs===0))).length:m.played&&m.cleanSheets?.includes(p.id)?1:0),0)})));}
export function clubStats(d:Data){return d.teams.map(t=>({...t,...clubDefence(d,t.id),goals:d.matches.reduce((n,m)=>n+(m.games?m.games.filter(g=>g.played).reduce((a,g)=>a+(m.home===t.id?g.hs:m.away===t.id?g.as:0),0):m.played?(m.home===t.id?m.hs:m.away===t.id?m.as:0):0),0),clean:d.matches.reduce((n,m)=>n+(m.games?m.games.filter(g=>g.played&&((m.home===t.id&&g.as===0)||(m.away===t.id&&g.hs===0))).length:m.played&&((m.home===t.id&&m.as===0)||(m.away===t.id&&m.hs===0))?1:0),0)}));}

export function motmAwards(d:Data){return d.matches.flatMap(m=>(m.games||[]).flatMap((g,index)=>{if(!g.motm||![g.homePlayer,g.awayPlayer].includes(g.motm))return [];const team=d.teams.find(t=>[m.home,m.away].includes(t.id)&&t.players.some(p=>p.id===g.motm));const player=team?.players.find(p=>p.id===g.motm);return team&&player?[{match:m,game:index+1,team,player}]:[]}));}
export function motmLeaders(d:Data){const awards=motmAwards(d);const goals=new Map(playerStats(d).map(p=>[p.id,p.goals]));const counts=new Map<string,number>();for(const a of awards)counts.set(a.player.id,(counts.get(a.player.id)||0)+1);return d.teams.flatMap(team=>team.players.filter(p=>counts.has(p.id)).map(player=>({team,player,count:counts.get(player.id)!,goals:goals.get(player.id)||0}))).sort((a,b)=>b.goals-a.goals||b.count-a.count||a.player.ign.localeCompare(b.player.ign));}

// Apply this sample-results revision once; later admin edits remain authoritative.
export function updateDummyResults(data:Data):Data {
 if(!data.demo||data.demoScenario==='labuan-leader-v1')return data;
 const labuan=data.teams.find(t=>t.code==='LBN');
 if(!labuan)return data;
 const matches=data.matches.map(m=>{
  if(m.week>2||![m.home,m.away].includes(labuan.id))return m;
  const home=data.teams.find(t=>t.id===m.home)!,away=data.teams.find(t=>t.id===m.away)!;
  const games=Array.from({length:16},(_,i)=>({homePlayer:home.players[i].id,awayPlayer:away.players[i].id,hs:m.home===labuan.id?2+i%3:i%2,as:m.away===labuan.id?2+i%3:i%2,played:true}));
  const updated={...m,gameCount:16,games};
  return {...updated,...seriesSummary(updated)};
 });
 return {...data,matches,demoScenario:'labuan-leader-v1'};
}

export function playerDefence(d:Data,id:string){
 let conceded=0,appearances=0;
 for(const m of d.matches)for(const g of m.games||[]){
  if(!g.played)continue;
  if(g.homePlayer===id){conceded+=g.as;appearances++;}
  else if(g.awayPlayer===id){conceded+=g.hs;appearances++;}
 }
 return {conceded,appearances};
}
export function clubDefence(d:Data,id:number){
 let conceded=0,appearances=0;
 for(const m of d.matches){
  if(m.home!==id&&m.away!==id)continue;
  if(m.games){for(const g of m.games){if(g.played){conceded+=m.home===id?g.as:g.hs;appearances++;}}}
  else if(m.played){conceded+=m.home===id?m.as:m.hs;appearances++;}
 }
 return {conceded,appearances};
}

// Keep federal-territory names consistent for existing and new records.
export function federalTerritoryNames(data:Data):Data {
 const names:Record<string,string>={'KUALA LUMPUR':'WP KUALA LUMPUR','LABUAN':'WP LABUAN','PUTRAJAYA':'WP PUTRAJAYA'};
 return {...data,teams:data.teams.map(team=>{const name=names[team.name.trim().replace(/^WP\s+/i,'').toUpperCase()];return name?{...team,name}:team})};
}

// LIVE never counts an unfinished player game toward standings or player totals.
export function isMatchLive(m:Match){return !seriesSummary(m).played&&(m.live===true||!!m.games?.some(g=>g.live||g.played));}
export function selectMatchMotm(games:PlayerGame[],index:number,player:string){return games.map((g,i)=>({...g,motm:i===index?player:''}));}
