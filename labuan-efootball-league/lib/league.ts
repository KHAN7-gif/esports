import {z} from 'zod';
const id=z.string().min(1).max(100);
const image=z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v),'Gunakan pautan HTTPS.');
const score=z.number().int().min(0).max(99).nullable();
export const states=[['JHR','Johor'],['KDH','Kedah'],['KEL','Kelantan'],['MLK','Melaka'],['NSN','Negeri Sembilan'],['PHG','Pahang'],['PRK','Perak'],['PLS','Perlis'],['PNG','Pulau Pinang'],['SBH','Sabah'],['SWK','Sarawak'],['SEL','Selangor'],['TRG','Terengganu'],['KUL','WP Kuala Lumpur'],['LBN','WP Labuan'],['PJY','WP Putrajaya']] as const;
export const playerSchema=z.object({id,placeholder:z.boolean().optional(),rankingName:z.string().max(80).optional(),state:z.string().refine(v=>!v||states.some(([code])=>code===v),'Negeri tidak sah.').optional(),ign:z.string().trim().min(1).max(80),name:z.string().max(120),club:z.string().max(100),photo:image,logo:image});
export const gameSchema=z.object({id,home:id,away:id,hs:score,as:score,status:z.enum(['scheduled','live','completed']),date:z.string().max(30),motm:id.nullable(),eh:score,ea:score,ph:score,pa:score});
export const groupSchema=z.object({id,name:z.string().max(40),members:z.array(id).min(2).max(16),games:z.array(gameSchema).max(120)});
export const tieSchema=z.object({id,a:id,b:id,legs:z.array(gameSchema).min(1).max(2)});
export const leagueSchema=z.object({demo:z.boolean().optional(),title:z.string().trim().min(1).max(100),season:z.string().trim().min(1).max(60),players:z.array(playerSchema).max(128),groupSlots:z.array(z.array(id).max(16)).max(8).optional(),groups:z.array(groupSchema).max(16),rounds:z.array(z.array(tieSchema).min(1).max(16)).max(5),settings:z.object({sharedThird:z.boolean().optional(),finalPenalties:z.enum(['extra-time','direct']).optional(),showFlags:z.boolean().optional(),groupCount:z.number().int().min(1).max(16),qualify:z.union([z.literal(1),z.literal(2),z.literal(4)]),finalLegs:z.union([z.literal(1),z.literal(2)])})});
export type Player=z.infer<typeof playerSchema>;
export type Game=z.infer<typeof gameSchema>;
export type Group=z.infer<typeof groupSchema>;
export type Tie=z.infer<typeof tieSchema>;
export type League=z.infer<typeof leagueSchema>;
export type Category='mobile'|'console';
export const categories={mobile:'eFootball Mobile',console:'eFootball Konsol'} as const;
export const emptyLeague=():League=>({title:'Labuan eFootball League',season:'Season 1 / 2026',players:[],groups:[],rounds:[],settings:{groupCount:4,qualify:4,finalLegs:1}});
export function game(id:string,home:string,away:string):Game{return {id,home,away,hs:null,as:null,status:'scheduled',date:'',motm:null,eh:null,ea:null,ph:null,pa:null}}
export function groupTable(g:Group,players:Player[]){
 const rows=g.members.map(id=>({id,ign:players.find(p=>p.id===id)?.ign||'—',rankingName:players.find(p=>p.id===id)?.rankingName||players.find(p=>p.id===id)?.ign||'—',p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0}));
 for(const m of g.games){if(m.status!=='completed'||m.hs===null||m.as===null)continue;const a=rows.find(x=>x.id===m.home)!,b=rows.find(x=>x.id===m.away)!;a.p++;b.p++;a.gf+=m.hs;b.gf+=m.as;a.ga+=m.as;b.ga+=m.hs;if(m.hs>m.as){a.w++;b.l++;a.pts+=3}else if(m.hs<m.as){b.w++;a.l++;b.pts+=3}else{a.d++;b.d++;a.pts++;b.pts++}}
 return rows.map(r=>({...r,gd:r.gf-r.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.rankingName.localeCompare(b.rankingName)||a.id.localeCompare(b.id));
}
export function drawGroups(d:League,random:()=>number=Math.random):League{
 const n=d.settings.groupCount,qualify=d.settings.qualify;
 if(d.groups.length||d.rounds.length)throw Error('Padam jadual sedia ada dahulu untuk cabutan baharu.');
 if(![1,2,4,8,16].includes(n)||d.players.length%n||d.players.length/n<2||d.players.length/n>16)throw Error('Bilangan peserta mesti boleh dibahagi sama rata kepada kumpulan (2–16 peserta setiap kumpulan).');
 if(qualify>=d.players.length/n||n*qualify<2||n*qualify>32)throw Error('Tetapkan 2–32 peserta layak dan sekurang-kurangnya seorang tidak layak dalam setiap kumpulan.');
 const ids=d.players.map(p=>p.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
 const groups:Group[]=Array.from({length:n},(_,i)=>({id:'g'+i,name:'Group '+String.fromCharCode(65+i),members:[],games:[]}));
 ids.forEach((v,i)=>groups[i%n].members.push(v));
 for(const g of groups){for(let i=0;i<g.members.length;i++)for(let j=i+1;j<g.members.length;j++)g.games.push(game(g.id+'-'+i+'-'+j,g.members[i],g.members[j]))}
 return {...d,groups,groupSlots:groups.map(g=>[...g.members])};
}
export function totals(t:Tie){let a=0,b=0;for(const m of t.legs){if(m.hs===null||m.as===null)continue;if(m.home===t.a){a+=m.hs+(m.eh||0);b+=m.as+(m.ea||0)}else{a+=m.as+(m.ea||0);b+=m.hs+(m.eh||0)}}return {a,b}}
export function winner(t:Tie):string|null{
 if(t.legs.some(m=>m.status!=='completed'||m.hs===null||m.as===null))return null;
 const s=totals(t);if(s.a!==s.b)return s.a>s.b?t.a:t.b;
 const m=t.legs[t.legs.length-1];if(m.ph===null||m.pa===null||m.ph===m.pa)return null;
 return m.ph>m.pa?m.home:m.away;
}
function tie(a:string,b:string,index:number,round:number,count:number,d:League):Tie{const tid='r'+round+'t'+index,n=count===1?d.settings.finalLegs:2;return {id:tid,a,b,legs:Array.from({length:n},(_,l)=>game(tid+'l'+l,l===0?a:b,l===0?b:a))}}
export function nextRound(d:League):League{
 if(!d.groups.length)throw Error('Jana dan lengkapkan peringkat kumpulan dahulu.');
 let pairs:[string,string][]=[];
 if(!d.rounds.length){
  if(d.groups.some(g=>g.games.some(m=>m.status!=='completed')))throw Error('Semua perlawanan kumpulan mesti selesai dahulu.');
  const tables=d.groups.map(g=>groupTable(g,d.players)),q=d.settings.qualify;
  if(q>1&&d.groups.length>1){for(let i=0;i<tables.length;i+=2){for(let rank=0;rank<q;rank++)pairs.push(rank%2===0?[tables[i][rank].id,tables[i+1][q-1-rank].id]:[tables[i+1][q-1-rank].id,tables[i][rank].id])}}
  else{const seeds=tables.flatMap(t=>t.slice(0,q).map(p=>p.id));for(let i=0;i<seeds.length;i+=2)pairs.push([seeds[i],seeds[i+1]])}
 }else{const last=d.rounds[d.rounds.length-1];if(last.length===1)throw Error('Kejohanan sudah sampai ke final.');const winners=last.map(winner);if(winners.some(w=>!w))throw Error('Lengkapkan semua leg dan keputusan agregat/penalti dahulu.');for(let i=0;i<winners.length;i+=2)pairs.push([winners[i]!,winners[i+1]!])}
 if(!pairs.length||pairs.some(p=>!p[0]||!p[1]))throw Error('Bilangan peserta layak mesti 2, 4, 8, 16 atau 32.');
 return {...d,rounds:[...d.rounds,pairs.map(([a,b],i)=>tie(a,b,i,d.rounds.length,pairs.length,d))]};
}
export const roundName=(count:number)=>count===1?'Final':count===2?'Semi-finals':count===4?'Quarter-finals':'Round of '+count*2;
export function allGames(d:League){return [...d.groups.flatMap(g=>g.games),...d.rounds.flatMap(r=>r.flatMap(t=>t.legs))]}
export function playerStats(d:League){const rows=d.players.map(p=>({...p,played:0,goals:0,conceded:0,clean:0,motm:0}));for(const m of allGames(d)){if(m.status!=='completed'||m.hs===null||m.as===null)continue;for(const [pid,gf,ga] of [[m.home,m.hs+(m.eh||0),m.as+(m.ea||0)],[m.away,m.as+(m.ea||0),m.hs+(m.eh||0)]] as [string,number,number][]){const r=rows.find(r=>r.id===pid)!;r.played++;r.goals+=gf;r.conceded+=ga;if(ga===0)r.clean++;if(m.motm===pid)r.motm++}}return rows}
export function validateLeague(d:League){
 const ids=new Set(d.players.map(p=>p.id));if(ids.size!==d.players.length)throw Error('ID peserta berulang.');
 const igns=d.players.map(p=>p.ign.toLocaleLowerCase());if(new Set(igns).size!==igns.length)throw Error('IGN peserta mesti unik.');
 if(d.groupSlots){const assigned=d.groupSlots.flat();if(d.groupSlots.length!==d.settings.groupCount||new Set(assigned).size!==assigned.length||assigned.some(id=>!ids.has(id)))throw Error('Slot kumpulan tidak sah.');}
 const seen=new Set<string>();
 const check=(m:Game)=>{if(seen.has(m.id))throw Error('ID perlawanan berulang.');seen.add(m.id);if(!ids.has(m.home)||!ids.has(m.away)||m.home===m.away)throw Error('Peserta perlawanan tidak sah.');if(m.status!=='scheduled'&&(m.hs===null||m.as===null))throw Error('Skor diperlukan.');if(m.motm&&(![m.home,m.away].includes(m.motm)||m.status!=='completed'))throw Error('MOTM mesti peserta perlawanan yang selesai.');if((m.eh===null)!==(m.ea===null)||(m.ph===null)!==(m.pa===null))throw Error('Lengkapkan kedua-dua skor tambahan/penalti.');if(m.ph!==null&&m.ph===m.pa)throw Error('Skor penalti mesti menghasilkan pemenang.');if(m.date&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m.date))throw Error('Tarikh tidak sah.');};
 if(d.groups.length){
  if(d.groups.length!==d.settings.groupCount)throw Error('Bilangan kumpulan tidak sepadan.');
  const members=d.groups.flatMap(g=>g.members);if(members.length!==ids.size||new Set(members).size!==ids.size||members.some(id=>!ids.has(id)))throw Error('Setiap peserta mesti dalam satu kumpulan.');
  const sizes=d.groups.map(g=>g.members.length);if(new Set(sizes).size!==1||d.settings.qualify>=sizes[0]||![2,4,8,16,32].includes(d.groups.length*d.settings.qualify))throw Error('Konfigurasi kelayakan tidak sah.');
  for(const g of d.groups){const pairs=new Set<string>();for(const m of g.games){check(m);if(!g.members.includes(m.home)||!g.members.includes(m.away)||m.eh!==null||m.ea!==null||m.ph!==null||m.pa!==null)throw Error('Kumpulan BO1 tidak mempunyai masa tambahan atau penalti.');const pair=[m.home,m.away].sort().join('|');if(pairs.has(pair))throw Error('Perlawanan kumpulan berulang.');pairs.add(pair)}if(pairs.size!==g.members.length*(g.members.length-1)/2)throw Error('Jadual kumpulan tidak lengkap.')}
 }else if(d.rounds.length)throw Error('Kumpulan diperlukan.');
 // Rebuild the expected bracket from preceding results to reject inconsistent progression.
 let base={...d,rounds:[] as Tie[][]};
 for(let ri=0;ri<d.rounds.length;ri++){const expected=nextRound(base).rounds[ri],round=d.rounds[ri];if(round.length!==expected.length)throw Error('Bracket tidak sah.');
  round.forEach((t,i)=>{const exp=expected[i];if(t.a!==exp.a||t.b!==exp.b||t.id!==exp.id||t.legs.length!==exp.legs.length)throw Error('Peserta bracket tidak sepadan dengan kelayakan.');t.legs.forEach((m,l)=>{check(m);if(m.home!==exp.legs[l].home||m.away!==exp.legs[l].away||m.id!==exp.legs[l].id)throw Error('Home/Away tidak sah.');if(l<t.legs.length-1&&(m.eh!==null||m.ph!==null))throw Error('Masa tambahan hanya pada leg terakhir.');if(l===t.legs.length-1){const before=t.legs.reduce((s,x)=>{if(x.hs!==null&&x.as!==null){s.a+=x.home===t.a?x.hs:x.as;s.b+=x.home===t.a?x.as:x.hs}return s},{a:0,b:0});if(round.length===1&&d.settings.finalPenalties==='direct'&&m.eh!==null)throw Error('Final ditetapkan kepada penalti terus tanpa masa tambahan.');if(m.eh!==null&&(before.a!==before.b||t.legs.some(x=>x.status!=='completed')))throw Error('Masa tambahan hanya apabila agregat seri selepas semua leg selesai.');if(m.ph!==null){if(m.eh===null&&!(round.length===1&&d.settings.finalPenalties==='direct'))throw Error('Lengkapkan masa tambahan sebelum penalti.');const sum=totals(t);if(sum.a!==sum.b)throw Error('Penalti hanya apabila agregat masih seri selepas masa tambahan.')}}})});base={...base,rounds:[...base.rounds,round]};
 }
 return d;
}

export function demoLeague(category:Category):League{
 const handles=['Aero','Blaze','Comet','Drift','Echo','Frost','Ghost','Havoc','Ion','Jett','Knight','Lynx','Maverick','Nova','Onyx','Phantom','Quake','Raven','Storm','Titan','Ultra','Viper','Wolf','Xeno','Yuri','Zenith','Apex','Bolt','Cipher','Dash','Enzo','Flux'];
 let d=emptyLeague();d.demo=true;d.players=handles.map((ign,i)=>({id:category+'-p-'+String(i+1).padStart(2,'0'),ign:ign+'.'+(category==='mobile'?'M':'C'),name:'Peserta Contoh '+String(i+1).padStart(2,'0'),club:['Team Alpha','Team Bravo','Team Charlie','Team Delta'][i%4],photo:'',logo:''}));
 let seed=category==='mobile'?2026:2027;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};d=drawGroups(d,rng);
 for(const g of d.groups){for(const m of g.games){m.hs=Math.floor(rng()*6);m.as=Math.floor(rng()*5);m.status='completed';m.motm=m.hs>=m.as?m.home:m.away;}}
 d=nextRound(d);return validateLeague(leagueSchema.parse(d));
}

// Members are ordered draw slots (A1, A2, ...), independently of standings rank.
export function manualGroups(d:League,slots:string[][]):League{
 const n=d.settings.groupCount,size=d.players.length/n;
 if(![1,2,4,8,16].includes(n)||!Number.isInteger(size)||size<2||size>16||slots.length!==n||slots.some(g=>g.length!==size))throw Error('Lengkapkan slot semua kumpulan dengan bilangan peserta yang sama.');
 const ids=slots.flat();if(ids.length!==d.players.length||new Set(ids).size!==ids.length||ids.some(id=>!d.players.some(p=>p.id===id)))throw Error('Setiap peserta mesti dipilih tepat sekali.');
 if(d.groups.length&&d.groups.every((g,i)=>g.members.length===slots[i].length&&g.members.every((id,j)=>id===slots[i][j])))return d;
 const groups:Group[]=slots.map((members,i)=>{const g:Group={id:'g'+i,name:'Group '+String.fromCharCode(65+i),members:[...members],games:[]};for(let a=0;a<members.length;a++)for(let b=a+1;b<members.length;b++)g.games.push(game(g.id+'-'+a+'-'+b,members[a],members[b]));return g});
 return validateLeague({...d,groups,groupSlots:slots.map(g=>[...g]),rounds:[]});
}

export function sharedThirdPlayers(d:League):string[]{
 if(d.settings.sharedThird===false)return [];
 const semis=d.rounds.find(r=>r.length===2);
 if(!semis||semis.some(t=>!winner(t)))return [];
 return semis.map(t=>winner(t)===t.a?t.b:t.a);
}

// Registration slots exist independently of fixtures, so profiles can be entered first.
export function registrationLeague(input:League):League{
 const d=structuredClone(input),n=d.settings.groupCount;
 const slots=d.groupSlots|| (d.groups.length?d.groups.map(g=>[...g.members]):Array.from({length:n},(_,gi)=>d.players.slice(gi*Math.ceil(d.players.length/n),(gi+1)*Math.ceil(d.players.length/n)).map(p=>p.id)));
 const capacity=d.players.length?Math.max(2,...slots.map(g=>g.length)):8;
 for(let gi=0;gi<n;gi++){
  slots[gi]??=[];
  while(!input.groupSlots&&slots[gi].length<capacity){const si=slots[gi].length,code=String.fromCharCode(65+gi)+(si+1);let pid='slot-'+gi+'-'+si;while(d.players.some(p=>p.id===pid))pid+='x';d.players.push({id:pid,ign:code,name:'',club:'',photo:'',logo:'',placeholder:true});slots[gi].push(pid)}
  slots[gi].forEach((id,si)=>{const p=d.players.find(p=>p.id===id);if(p&&(p.placeholder||(d.demo&&/^Peserta Contoh \d+$/.test(p.name)))){if(!p.placeholder)p.rankingName=p.ign;p.ign=String.fromCharCode(65+gi)+(si+1);p.placeholder=true;p.name=''}});
 }
 d.groupSlots=slots;return d;
}
export function addGroupPlayer(d:League,group:number):{data:League;player:Player}{
 const next=registrationLeague(d),members=next.groupSlots?.[group];if(!members)throw Error('Kumpulan tidak sah.');
 const empty=members.map(id=>next.players.find(p=>p.id===id)!).find(p=>p.placeholder);if(empty)return {data:next,player:empty};
 if(next.groups.length)throw Error('Semua slot telah diisi. Padam jadual sebelum menambah slot baharu.');
 if(members.length>=16||next.players.length>=128)throw Error('Had peserta telah dicapai.');
 const code=String.fromCharCode(65+group)+(members.length+1);let id='added-'+group+'-'+members.length;while(next.players.some(p=>p.id===id))id+='x';const p:Player={id,ign:code,name:'',club:'',photo:'',logo:'',placeholder:true};next.players.push(p);members.push(id);return {data:next,player:p};
}
