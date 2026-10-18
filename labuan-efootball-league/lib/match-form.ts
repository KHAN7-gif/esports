import {groupRounds,type Group} from './league';

// Oldest to newest round, with the latest result at the right.
export function matchForm(group:Group,playerId:string){
 return groupRounds(group).flatMap(round=>round.games)
  .filter(game=>game.status==='completed'&&game.hs!==null&&game.as!==null&&(game.home===playerId||game.away===playerId))
  .slice(-5).map(game=>{
   const own=game.home===playerId?game.hs!:game.as!;
   const other=game.home===playerId?game.as!:game.hs!;
   return own===other?'D':own>other?'W':'L';
  });
}
