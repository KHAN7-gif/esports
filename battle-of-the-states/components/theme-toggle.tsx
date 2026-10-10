'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
const storageKey='battle-states-theme';
export default function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const sync=()=>setDark(document.documentElement.dataset.theme==='dark');
  const followSystem=()=>{try{if(localStorage.getItem(storageKey))return}catch{}document.documentElement.dataset.theme=media.matches?'dark':'light';sync()};
  const stored=(e:StorageEvent)=>{if(e.key!==storageKey)return;document.documentElement.dataset.theme=e.newValue==='dark'||(!e.newValue&&media.matches)?'dark':'light';sync()};
  sync();media.addEventListener('change',followSystem);window.addEventListener('storage',stored);
  return()=>{media.removeEventListener('change',followSystem);window.removeEventListener('storage',stored)};
 },[]);
 function toggle(){const next=!dark;document.documentElement.dataset.theme=next?'dark':'light';setDark(next);try{localStorage.setItem(storageKey,next?'dark':'light')}catch{}}
 return <button className="theme-toggle" onClick={toggle} aria-pressed={dark} aria-label={dark?'Switch to Day Mode':'Switch to Night Mode'} title={dark?'Day Mode':'Night Mode'}>{dark?<Sun size={19}/>:<Moon size={19}/>}<span>{dark?'Day Mode':'Night Mode'}</span></button>;
}
