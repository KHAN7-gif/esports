'use client';
import {useState} from 'react';
import {driveImage,clubLogoImage} from '../lib/drive-images';
export default function DrivePhoto({link='',alt,fallback,className='',feedback=false,clubLogo=false,player=false}:{link?:string;alt:string;fallback:string;className?:string;feedback?:boolean;clubLogo?:boolean;player?:boolean}){
return <Photo key={link.trim()} link={link} alt={alt} fallback={fallback} className={className} feedback={feedback} clubLogo={clubLogo} player={player}/>;
}
function Photo({link,alt,fallback,className,feedback,clubLogo,player}:{link:string;alt:string;fallback:string;className:string;feedback:boolean;clubLogo:boolean;player:boolean}){
const [attempt,setAttempt]=useState(0);const image=clubLogo?clubLogoImage(link):driveImage(link),failed=attempt>=2;const source=image&&(attempt===0?image.src:image.fallback);
return <span className={'photo-group '+className+(player?' player-portrait':'')}><span className="photo-frame">{source&&!failed?<img src={source} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setAttempt(a=>a+1)}/>:<span className="photo-fallback" aria-label={alt}>{player?<img src="/player-avatar.png" alt={alt} loading="lazy" decoding="async"/>:fallback}</span>}</span>{feedback&&link&&<span className="photo-status" role="status">{!image?(clubLogo?'Gunakan pautan HTTPS imej atau fail Google Drive.':'Pautan Google Drive tidak sah.'):failed?'Gambar belum dapat dipaparkan. Semak pautan dan akses perkongsian.':''}</span>}</span>;
}
