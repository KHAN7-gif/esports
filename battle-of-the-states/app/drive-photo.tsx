'use client';
import {useState} from 'react';
import {driveImage} from '../lib/drive-images';
export default function DrivePhoto({link='',alt,fallback,className='',feedback=false}:{link?:string;alt:string;fallback:string;className?:string;feedback?:boolean}){
return <Photo key={link.trim()} link={link} alt={alt} fallback={fallback} className={className} feedback={feedback}/>;
}
function Photo({link,alt,fallback,className,feedback}:{link:string;alt:string;fallback:string;className:string;feedback:boolean}){
const [attempt,setAttempt]=useState(0);const image=driveImage(link),failed=attempt>=2;const source=image&&(attempt===0?image.src:image.fallback);
return <span className={'photo-group '+className}><span className="photo-frame">{source&&!failed?<img src={source} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setAttempt(a=>a+1)}/>:<span className="photo-fallback" aria-label={alt}>{fallback}</span>}</span>{feedback&&link&&<span className="photo-status" role="status">{!image?'Pautan Google Drive tidak sah.':failed?'Gambar belum dapat dipaparkan. Semak pautan dan akses perkongsian.':''}</span>}</span>;
}
