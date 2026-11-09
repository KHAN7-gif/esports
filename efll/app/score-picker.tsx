'use client';
import {useEffect,useRef,useState} from 'react';
import {Plus,X} from 'lucide-react';
export default function ScorePicker({label,value,onChoose,onClose}:{label:string;value:number;onChoose:(value:number)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),manualInput=useRef<HTMLInputElement>(null);
 const [manual,setManual]=useState(false),[amount,setAmount]=useState(String(value)),[error,setError]=useState('');
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[]);
 useEffect(()=>{if(manual)manualInput.current?.focus()},[manual]);
 function submit(e:React.FormEvent){e.preventDefault();const n=Number(amount);if(!amount.trim()||!Number.isInteger(n)||n<0||n>99){setError('Masukkan skor bulat antara 0 dan 99.');return}onChoose(n)}
 return <dialog ref={dialog} className="score-picker" aria-labelledby="score-picker-title" onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><section><div className="score-picker-heading"><div><span className="eyebrow">KEY IN SCORE</span><h3 id="score-picker-title">{label}</h3></div><button type="button" aria-label="Tutup pilihan skor" onClick={onClose}><X size={20}/></button></div><p>Pilih skor atau tekan + untuk input manual.</p><div className="score-picker-grid">{[1,2,3,4,5,6,7,8,9,10,0].map(n=><button type="button" key={n} className={value===n?'selected':''} aria-pressed={value===n} onClick={()=>onChoose(n)}>{n}</button>)}<button type="button" className="score-manual-toggle" aria-label="Input skor manual" aria-expanded={manual} onClick={()=>setManual(!manual)}><Plus size={22}/><small>Manual</small></button></div>{manual&&<form className="score-manual-form" onSubmit={submit}><label>Skor manual (0–99)<input ref={manualInput} type="number" inputMode="numeric" min={0} max={99} step={1} value={amount} onChange={e=>{setAmount(e.target.value);setError('')}} required/></label><button type="submit" className="gold-btn">Tetapkan skor</button>{error&&<p role="alert" className="alert error">{error}</p>}</form>}</section></dialog>
}
