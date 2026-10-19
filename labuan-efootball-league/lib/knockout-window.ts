export type RoundWindow={start:number;end:number};
export function normalizeRoundWindow(value:RoundWindow,count:number):RoundWindow{
 const max=Math.max(0,count-1),start=Math.max(0,Math.min(max,Math.floor(value.start)));
 return {start,end:Math.max(start,Math.min(max,Math.floor(value.end)))};
}
export function resizeRoundWindow(value:RoundWindow,edge:'start'|'end',index:number,count:number):RoundWindow{
 const current=normalizeRoundWindow(value,count),target=Math.max(0,Math.min(count-1,index));
 return edge==='start'?{start:Math.min(target,current.end),end:current.end}:{start:current.start,end:Math.max(target,current.start)};
}
export function roundAtPointer(clientX:number,left:number,width:number,count:number){
 return Math.max(0,Math.min(count-1,Math.floor((clientX-left)/Math.max(1,width)*count)));
}
