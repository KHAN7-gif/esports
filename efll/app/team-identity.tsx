'use client';
import DrivePhoto from './drive-photo';
import {type Team,flagCode,codes,states} from '../lib/data';

export default function TeamIdentity({team,hero=false,compact=false}:{team:Team;hero?:boolean;compact?:boolean}){
 const abbreviation=team.code.trim().toUpperCase().slice(0,3),state=flagCode(team),stateName=states[codes.indexOf(state)]||state;
 const Wrapper=hero?'div':'span',Text=hero?'div':'span',Name=hero?'h2':'span';
 return <Wrapper className={'club-identity'+(hero?' club-identity-hero':'')+(compact?' club-identity-compact':'')}>
  <DrivePhoto link={team.logo} alt={`Logo ${team.name}`} fallback={abbreviation} className="club-identity-logo"/>
  <Text className="club-identity-text">
   {hero&&<span className="eyebrow">KELAB LABUAN</span>}
   <Name className="club-identity-name">{team.name}</Name>
  </Text>
  <span className="club-state-flag"><img src={'/flags/'+state+'.svg'} alt={'Bendera '+stateName} width={24} height={16}/></span>
  <span className="club-abbreviation">{abbreviation}</span>
  {hero&&<p className="club-identity-members">{team.players.length} players · 1 manager</p>}
 </Wrapper>;
}
