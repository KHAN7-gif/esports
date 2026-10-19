import {z} from 'zod';
const id=z.string().min(1).max(100);
const image=z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v),'Gunakan pautan HTTPS.');
const score=z.number().int().min(0).max(99).nullable();
export const states=[['JHR','Johor'],['KDH','Kedah'],['KEL','Kelantan'],['MLK','Melaka'],['NSN','Negeri Sembilan'],['PHG','Pahang'],['PRK','Perak'],['PLS','Perlis'],['PNG','Pulau Pinang'],['SBH','Sabah'],['SWK','Sarawak'],['SEL','Selangor'],['TRG','Terengganu'],['KUL','WP Kuala Lumpur'],['LBN','WP Labuan'],['PJY','WP Putrajaya']] as const;
export const playerSchema=z.object({id,placeholder:z.boolean().optional(),rankingName:z.string().max(80).optional(),state:z.string().refine(v=>!v||states.some(([code])=>code===v),'Negeri tidak sah.').optional(),ign:z.string().trim().min(1).max(80),name:z.string().max(120),club:z.string().max(100),teamColor:z.string().regex(/^$|^#[0-9a-fA-F]{6}$/,'Gunakan warna HEX seperti #215ED8.').optional(),clubNickname:z.string().regex(/^$|^[A-Z]{3}$/,"Nickname mesti 3 huruf A–Z.").optional(),photo:image,logo:image});
export const gameSchema=z.object({id,home:id,away:id,hs:score,as:score,status:z.enum(['scheduled','live','completed']),date:z.string().max(30),motm:id.nullable(),eh:score,ea:score,ph:score,pa:score});
export const groupSchema=z.object({id,name:z.string().max(40),members:z.array(id).min(2).max(16),games:z.array(gameSchema).max(120)});
export const tieSchema=z.object({id,a:id,b:id,mode:z.enum(["bo3","aggregate"]).optional(),penalties:z.boolean().optional(),legs:z.array(gameSchema).min(1).max(3)});
export const leagueSchema=z.object({referenceOnly:z.boolean().optional(),demo:z.boolean().optional(),title:z.string().trim().min(1).max(100),season:z.string().trim().min(1).max(60),players:z.array(playerSchema).max(128),groupSlots:z.array(z.array(id).max(16)).max(8).optional(),groups:z.array(groupSchema).max(16),manualKnockout:z.boolean().optional(),drawLocked:z.boolean().optional(),thirdPlace:tieSchema.optional(),rounds:z.array(z.array(tieSchema).min(1).max(16)).max(5),settings:z.object({knockoutMode:z.enum(["bo3","aggregate"]).optional(),knockoutPenalties:z.boolean().optional(),thirdPlacePlayoff:z.boolean().optional(),autoAdvance:z.boolean().optional(),showClubNickname:z.boolean().optional(),sharedThird:z.boolean().optional(),finalPenalties:z.enum(['extra-time','direct']).optional(),showFlags:z.boolean().optional(),groupCount:z.number().int().min(1).max(16),qualify:z.union([z.literal(1),z.literal(2),z.literal(4)]),finalLegs:z.union([z.literal(1),z.literal(2)])})});
export type Player=z.infer<typeof playerSchema>;
export type Game=z.infer<typeof gameSchema>;
export type Group=z.infer<typeof groupSchema>;
export type Tie=z.infer<typeof tieSchema>;
export type League=z.infer<typeof leagueSchema>;
export type Category='mobile'|'console';
export const categories={mobile:'eFootball Mobile',console:'eFootball Konsol'} as const;
export const emptyLeague=():League=>({title:'Labuan eFootball League',season:'Season 1 / 2026',players:[],groups:[],rounds:[],settings:{groupCount:4,qualify:4,finalLegs:1}});
export function game(id:string,home:string,away:string):Game{return {id,home,away,hs:null,as:null,status:'scheduled',date:'',motm:null,eh:null,ea:null,ph:null,pa:null}}
// Circle scheduling partitions existing fixtures without changing IDs, scores or home/away.
export function groupRounds(g:Group){
 let ring:(string|null)[]=[...g.members];if(ring.length%2)ring.push(null);
 const key=(a:string,b:string)=>JSON.stringify([a,b].sort());
 const games=new Map(g.games.map(m=>[key(m.home,m.away),m]));
 const rounds:{number:number;games:Game[];bye:string|null}[]=[];
 for(let round=1;round<ring.length;round++){
  const row:{number:number;games:Game[];bye:string|null}={number:round,games:[],bye:null};
  for(let i=0;i<ring.length/2;i++){
   const a=ring[i],b=ring[ring.length-1-i];
   if(a===null||b===null){row.bye=a??b;continue}
   const m=games.get(key(a,b));if(m)row.games.push(m);
  }
  rounds.push(row);ring=[ring[0],ring[ring.length-1],...ring.slice(1,-1)];
 }
 return rounds;
}
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
export function tieGameScore(t:Tie,m:Game){
 const home=m.home===t.a,hs=m.hs===null?null:m.hs+(m.eh??0),as=m.as===null?null:m.as+(m.ea??0);
 return {a:home?hs:as,b:home?as:hs,pa:home?m.ph:m.pa,pb:home?m.pa:m.ph};
}
export function seriesScore(t:Tie){let a=0,b=0;for(const m of t.legs){if(m.status!=="completed"||m.hs===null||m.as===null||m.hs===m.as)continue;const w=m.hs>m.as?m.home:m.away;w===t.a?a++:b++}return {a,b}}
export function winner(t:Tie):string|null{
 if(t.mode==="bo3"){const s=seriesScore(t);return s.a>=2?t.a:s.b>=2?t.b:null;}
 if(t.legs.some(m=>m.status!=='completed'||m.hs===null||m.as===null))return null;
 const s=totals(t);if(s.a!==s.b)return s.a>s.b?t.a:t.b;
 const m=t.legs[t.legs.length-1];if(m.ph===null||m.pa===null||m.ph===m.pa)return null;
 return m.ph>m.pa?m.home:m.away;
}
function tie(a:string,b:string,index:number,round:number,count:number,d:League):Tie{const tid='r'+round+'t'+index,n=d.settings.knockoutMode?(d.settings.knockoutMode==="bo3"?3:2):(count===1?d.settings.finalLegs:2);return {id:tid,a,b,...(d.settings.knockoutMode?{mode:d.settings.knockoutMode,penalties:d.settings.knockoutPenalties??true}:{}),legs:Array.from({length:n},(_,l)=>game(tid+'l'+l,l%2===0?a:b,l%2===0?b:a))}}
export function nextRound(d:League):League{
 if(!d.groups.length&&!d.rounds.length)throw Error('Jana dan lengkapkan peringkat kumpulan dahulu.');
 let pairs:[string,string][]=[];
 if(!d.rounds.length){
  if(d.groups.some(g=>g.games.some(m=>m.status!=='completed')))throw Error('Semua perlawanan kumpulan mesti selesai dahulu.');
  const tables=d.groups.map(g=>groupTable(g,d.players)),q=d.settings.qualify;
  if(q>1&&d.groups.length>1){for(let i=0;i<tables.length;i+=2){for(let rank=0;rank<q;rank++)pairs.push(rank%2===0?[tables[i][rank].id,tables[i+1][q-1-rank].id]:[tables[i+1][q-1-rank].id,tables[i][rank].id])}}
  else{const seeds=tables.flatMap(t=>t.slice(0,q).map(p=>p.id));for(let i=0;i<seeds.length;i+=2)pairs.push([seeds[i],seeds[i+1]])}
 }else{const last=d.rounds[d.rounds.length-1];if(last.length===1)throw Error('Kejohanan sudah sampai ke final.');const winners=last.map(winner);if(winners.some(w=>!w))throw Error('Lengkapkan semua leg dan keputusan agregat/penalti dahulu.');for(let i=0;i<winners.length;i+=2)pairs.push([winners[i]!,winners[i+1]!])}
 if(!pairs.length||pairs.some(p=>!p[0]||!p[1]))throw Error('Bilangan peserta layak mesti 2, 4, 8, 16 atau 32.');
 if(d.settings.knockoutMode&&pairs.length>8)throw Error('Knockout baharu bermula maksimum T16. Tetapkan kelayakan kepada 16 peserta atau pilih cabutan manual.');
 return {...d,rounds:[...d.rounds,pairs.map(([a,b],i)=>tie(a,b,i,d.rounds.length,pairs.length,d))]};
}
export const roundName=(count:number)=>count===1?'Final':count===2?'Semi-finals':count===4?'Quarter-finals':'Round of '+count*2;
export function allGames(d:League){return [...d.groups.flatMap(g=>g.games),...d.rounds.flatMap(r=>r.flatMap(t=>t.legs)),...(d.thirdPlace?.legs||[])]}
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
 }else if(d.rounds.length&&!d.manualKnockout)throw Error('Kumpulan diperlukan.');
 if(d.manualKnockout||d.thirdPlace||d.rounds.some(r=>r.some(t=>t.mode))){validateKnockout(d,check);return d;}
 // Rebuild the expected bracket from preceding results to reject inconsistent progression.
 let base={...d,settings:{...d.settings,knockoutMode:undefined},rounds:[] as Tie[][]};
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

// Admin-only reference data, independent of live league storage.
export function referenceLeague(category:Category,mode:'bo3'|'aggregate'='aggregate'):League{
 let d=demoLeague(category);d.rounds=[];d.referenceOnly=true;
 d.title='LEL · Dummy 32 Pemain';d.season='Rujukan Admin · 2026';
 d.settings={...d.settings,knockoutMode:mode,knockoutPenalties:true,finalLegs:2,showFlags:true,showClubNickname:true,thirdPlacePlayoff:true,sharedThird:false,autoAdvance:false};
 d.players=d.players.map((p,i)=>({...p,name:'Pemain Dummy '+String(i+1).padStart(2,'0'),state:states[i%states.length][0],clubNickname:['ALP','BRV','CHR','DLT'][i%4]}));
 let clock=0;
 const stamp=(m:Game)=>{const day=String(1+Math.floor(clock/12)).padStart(2,'0'),hour=String(10+clock%12).padStart(2,'0');m.date='2026-10-'+day+'T'+hour+':00';clock++;m.motm=m.hs!>=m.as!?m.home:m.away;};
 d.groups.forEach(g=>g.games.forEach(stamp));
 function complete(t:Tie,index:number){
  if(t.mode==='bo3'){
   const target=index%2?t.b:t.a,decider=index%3===0;
   t.legs.slice(0,decider?3:2).forEach((m,i)=>{const w=decider&&i===1?(target===t.a?t.b:t.a):target;m.status='completed';m.hs=m.home===w?3:1;m.as=m.away===w?3:1;stamp(m)});
  }else{
   t.legs.forEach((m,i)=>{m.status='completed';m.hs=i===0?2:index%3===0?2:0;m.as=1;stamp(m)});
   if(!winner(t)){const m=t.legs.at(-1)!;m.ph=index%2?5:4;m.pa=index%2?4:5;}
  }
 }
 do{d=nextRound(d);d.rounds.at(-1)!.forEach((t,i)=>complete(t,i+d.rounds.length));d=syncThirdPlace(d);}while(d.rounds.at(-1)!.length>1);
 if(d.thirdPlace)complete(d.thirdPlace,0);
 return validateLeague(leagueSchema.parse(d));
}

// Members are ordered draw slots (A1, A2, ...), independently of standings rank.
export function manualGroups(d:League,slots:string[][]):League{
 const n=d.settings.groupCount,size=d.players.length/n;
 if(![1,2,4,8,16].includes(n)||!Number.isInteger(size)||size<2||size>16||slots.length!==n||slots.some(g=>g.length!==size))throw Error('Lengkapkan slot semua kumpulan dengan bilangan peserta yang sama.');
 const ids=slots.flat();if(ids.length!==d.players.length||new Set(ids).size!==ids.length||ids.some(id=>!d.players.some(p=>p.id===id)))throw Error('Setiap peserta mesti dipilih tepat sekali.');
 if(d.groups.length&&d.groups.every((g,i)=>g.members.length===slots[i].length&&g.members.every((id,j)=>id===slots[i][j])))return d;
 const groups:Group[]=slots.map((members,i)=>{const g:Group={id:'g'+i,name:'Group '+String.fromCharCode(65+i),members:[...members],games:[]};for(let a=0;a<members.length;a++)for(let b=a+1;b<members.length;b++)g.games.push(game(g.id+'-'+a+'-'+b,members[a],members[b]));return g});
 return validateLeague({...d,groups,groupSlots:slots.map(g=>[...g]),rounds:[],thirdPlace:undefined,manualKnockout:undefined,drawLocked:false});
}

export function sharedThirdPlayers(d:League):string[]{
 if(d.settings.thirdPlacePlayoff||(!d.settings.knockoutMode&&d.settings.sharedThird===false))return [];
 const semis=d.rounds.find(r=>r.length===2);
 if(!semis||semis.some(t=>!winner(t)))return [];
 return semis.map(t=>winner(t)===t.a?t.b:t.a);
}

// New-format brackets keep their own rules; existing ties retain their original format.
function validateKnockout(d:League,check:(m:Game)=>void){
 let eligible:string[]=[];
 for(let ri=0;ri<d.rounds.length;ri++){
  const round=d.rounds[ri],members=round.flatMap(t=>[t.a,t.b]);
  if(new Set(members).size!==members.length||![1,2,4,8,16].includes(round.length))throw Error('Slot knockout berulang atau bilangan tidak sah.');
  if(ri===0){
   if(d.manualKnockout){if(round.length>8||members.some(id=>!d.players.some(p=>p.id===id)))throw Error('Cabutan manual maksimum T16.');}
   else{const expected=nextRound({...d,rounds:[]}).rounds[0];if(JSON.stringify(members)!==JSON.stringify(expected.flatMap(t=>[t.a,t.b])))throw Error('Peserta bracket tidak sepadan dengan kelayakan.');}
  }else if(round.length*2!==d.rounds[ri-1].length||eligible.length!==members.length||members.some(id=>!eligible.includes(id)))throw Error('Hanya pemenang pusingan sebelumnya boleh mara.');
  for(const t of round)validateTie(t,check);
  eligible=round.map(winner).filter((id):id is string=>!!id);
 }
 if(d.thirdPlace){const semis=d.rounds.find(r=>r.length===2);if(!semis||semis.some(t=>!winner(t)))throw Error('Lengkapkan separuh akhir dahulu.');const losers=semis.map(t=>winner(t)===t.a?t.b:t.a);if(!losers.includes(d.thirdPlace.a)||!losers.includes(d.thirdPlace.b))throw Error('Tempat ketiga untuk peserta kalah separuh akhir sahaja.');validateTie(d.thirdPlace,check);}
}
function validateTie(t:Tie,check:(m:Game)=>void){
 if(t.a===t.b||t.legs.length!==(t.mode==='bo3'?3:t.mode==='aggregate'?2:t.legs.length))throw Error('Format pertemuan tidak sah.');
 let winsA=0,winsB=0;
 t.legs.forEach((m,i)=>{
  check(m);if(m.home!==(i%2===0?t.a:t.b)||m.away!==(i%2===0?t.b:t.a))throw Error('Home/Away tidak sah.');
  if(t.mode==='bo3'){
   if(m.eh!==null||m.ea!==null||m.ph!==null||m.pa!==null)throw Error('BO3 tidak menggunakan masa tambahan atau penalti.');
   if((winsA>=2||winsB>=2)&&(m.hs!==null||m.as!==null||m.status!=='scheduled'))throw Error('Siri BO3 telah selesai; game seterusnya tidak diperlukan.');
   if(m.status!=='scheduled'&&i>0&&t.legs[i-1].status!=='completed')throw Error('Lengkapkan game sebelumnya dahulu.');
   if(m.status==='completed'){if(m.hs===m.as)throw Error('Game BO3 mesti mempunyai pemenang.');const w=m.hs!>m.as!?m.home:m.away;w===t.a?winsA++:winsB++;}
  }else{
   if(i<t.legs.length-1&&(m.eh!==null||m.ph!==null))throw Error('Penentuan seri hanya pada leg terakhir.');
   if(m.eh!==null&&(t.legs.some(g=>g.status!=='completed')||t.legs.reduce((s,g)=>s+(g.home===t.a?1:-1)*((g.hs??0)-(g.as??0)),0)!==0))throw Error('Masa tambahan hanya apabila semua leg selesai dan agregat seri.');
   if(m.ph!==null){const s=totals(t);if(t.penalties===false||t.legs.some(g=>g.status!=='completed')||s.a!==s.b)throw Error('Penalti hanya apabila Aggregate seri dan penalti diaktifkan.');}
  }
 });
}
export function manualKnockout(d:League,seeds:string[]):League{
 if(d.rounds.length)throw Error('Bracket sudah wujud. Keputusan sedia ada dikekalkan.');
 if(![2,4,8,16].includes(seeds.length)||new Set(seeds).size!==seeds.length||seeds.some(id=>!d.players.some(p=>p.id===id)))throw Error('Pilih setiap peserta sekali untuk semua slot.');
 const base={...d,settings:{...d.settings,knockoutMode:d.settings.knockoutMode||'aggregate' as const}};
 return validateLeague({...base,manualKnockout:true,rounds:[Array.from({length:seeds.length/2},(_,i)=>tie(seeds[i*2],seeds[i*2+1],i,0,seeds.length/2,base))]});
}
export function assignKnockoutSlot(d:League,ri:number,tid:string,side:'a'|'b',pid:string):League{
 if(ri>0)throw Error('Peserta pusingan seterusnya ditentukan oleh pemenang secara automatik.');
 if(d.drawLocked)throw Error('Lock Draw aktif. Buka kunci untuk menukar slot.');
 const third=ri===-1,t=third?d.thirdPlace:d.rounds[ri]?.find(t=>t.id===tid);if(!t)throw Error('Slot tidak dijumpai.');
 const scored=(x:Tie)=>x.legs.some(m=>m.status!=='scheduled'||m.hs!==null||m.as!==null);
 if((!third&&ri<d.rounds.length-1)||scored(t))throw Error('Slot dikunci selepas keputusan dimasukkan atau pusingan seterusnya dijana.');
 if(t[side]===pid)return d;
 const round=third?[t]:d.rounds[ri],other=round.find(x=>x.a===pid||x.b===pid);
 if(other&&scored(other))throw Error('Peserta pilihan sudah mempunyai keputusan.');
 if(ri>0&&!d.rounds[ri-1].some(x=>winner(x)===pid))throw Error('Pilih pemenang pusingan sebelumnya.');
 const old=t[side],replacement=round.map(x=>{const next={...x};for(const key of ['a','b'] as const){if(x.id===t.id&&key===side)next[key]=pid;else if(x[key]===pid)next[key]=old;}next.legs=x.legs.map((m,i)=>({...m,home:i%2===0?next.a:next.b,away:i%2===0?next.b:next.a}));return next;});
 return validateLeague(third?{...d,thirdPlace:replacement[0]}:{...d,manualKnockout:true,rounds:d.rounds.map((r,i)=>i===ri?replacement:r)});
}
export function syncThirdPlace(d:League):League{
 if(!d.settings.thirdPlacePlayoff||d.thirdPlace)return d;
 const semis=d.rounds.find(r=>r.length===2);if(!semis||semis.some(t=>!winner(t)))return d;
 const losers=semis.map(t=>winner(t)===t.a?t.b:t.a),base={...d,settings:{...d.settings,knockoutMode:semis[0].mode||'aggregate' as const,knockoutPenalties:semis[0].penalties??d.settings.knockoutPenalties}},t=tie(losers[0],losers[1],0,0,1,base);
 t.id='third-place';t.legs=t.legs.map((m,i)=>({...m,id:'third-place-l'+i}));return {...d,thirdPlace:t};
}
export function advanceKnockout(d:League):League{
 let result=syncThirdPlace(d);
 // The opening draw defines the path and rules once. Never regenerate existing ties.
 const opening=result.rounds[0]?.[0];
 while(result.rounds.length&&result.rounds.at(-1)!.length>1&&result.rounds.at(-1)!.every(t=>winner(t))){
  const settings={...result.settings,knockoutMode:opening?.mode,knockoutPenalties:opening?.penalties??result.settings.knockoutPenalties};
  const next=nextRound({...result,settings});
  result=syncThirdPlace({...next,settings:result.settings});
 }
 return validateLeague(result);
}

// Project each resolved winner into the next fixed slot immediately, without
// inventing participants, fixtures, scores or writing incomplete ties to storage.
export function knockoutSlots(d:League,ri:number):(string|null)[]{
 if(ri===0)return d.rounds[0]?.flatMap(t=>[t.a,t.b])||[];
 const count=(d.rounds[0]?.length||8)/2**ri;
 return Array.from({length:count*2},(_,i)=>d.rounds[ri-1]?.[i]?winner(d.rounds[ri-1][i]):null);
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
