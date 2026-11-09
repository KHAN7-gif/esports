import {type Season} from './data';
export function seasonList(items?:Season[]):Season[]{const defaults:Season[]=[{id:'season-1',name:'Season 1 / 2026',status:'ongoing',url:'',visible:true},{id:'season-2',name:'Season 2 / 2026',status:'upcoming',url:'',visible:false}];const all=items?.length?items:defaults;return [...all,...defaults.filter(d=>!all.some(s=>s.id===d.id))].map(s=>({...s,visible:s.id==='season-1'?true:s.visible??s.id!=='season-2'}));}
export function publicSeason(items?:Season[]){return seasonList(items).filter(s=>s.visible);}
