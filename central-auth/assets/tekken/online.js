(()=>{
 const isBracket=!!document.getElementById('auth'),base='/api/tekken',prefix='esports-tekken-selection-';let version=0,baseline='',loaded=false;
 const bar=document.createElement('section');bar.style.cssText='position:sticky;top:0;z-index:10;background:#11233e;color:white;padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #425675';
 const home=document.createElement('a');home.href='/';home.textContent='← Semua kejohanan';home.style.color='#a5ceff';bar.append(home);
 const save=document.createElement('button');save.textContent='Simpan ke server';save.hidden=true;bar.append(save);
 const reload=document.createElement('button');reload.textContent='Muat semula';bar.append(reload);
 const message=document.createElement('span');message.setAttribute('role','status');message.style.fontSize='13px';bar.append(message);document.body.prepend(bar);
 const info=text=>message.textContent=text;
 async function api(path,method='GET',payload){const r=await fetch(path,{method,cache:'no-store',headers:{'Content-Type':'application/json'},...(payload===undefined?{}:{body:JSON.stringify(payload)})});let body;try{body=await r.json()}catch{throw Error('Backend tidak tersedia. Buka Tekken melalui esports-login.apengtakahashi.chatgpt.site/tekken/.')}if(!r.ok)throw Error(body.error||'Permintaan gagal.');return body}
 function choices(){const out={};for(const id of Object.keys(matches)){try{const value=JSON.parse(localStorage.getItem(prefix+id)||'{}');if(Object.keys(value).length)out[id]=value}catch{}}return out}
 function snapshot(){return isBracket?{n,need,names,scores,roundSettings,liveMatches,playerPhotos,selections:choices(),demo:dummyActive}:selections}
 function dirty(){return loaded&&JSON.stringify(snapshot())!==baseline}
 window.tekkenAuth=async()=>{if(!admin){location.assign('/login?return_to=%2Ftekken%2F');return}try{await api('/api/admin/logout','POST',{});location.assign('/')}catch(error){info(error.message)}};
 async function load(){try{
  const auth=await api('/api/admin/session');admin=auth.admin===true;save.hidden=!admin;
  if(isBracket){const response=await api(base+'/tournament');version=response.version;if(response.data){const value=response.data;n=value.n;need=value.need;names=value.names;scores=value.scores;roundSettings=value.roundSettings;liveMatches=value.liveMatches;playerPhotos=value.playerPhotos;dummyActive=value.demo;dummyKeys=Object.keys(value.selections);$('count').value=String(n);$('format').value=String(need);$('names').value=names.join('\n');build();for(const id of Object.keys(matches)){if(value.selections[id])localStorage.setItem(prefix+id,JSON.stringify(value.selections[id]));else localStorage.removeItem(prefix+id)}$('clearDummy').hidden=!dummyActive;}toggleAdmin(admin);
  }else{if(!data?.id)throw Error('Buka perlawanan melalui bracket.');const response=await api(base+'/match?id='+encodeURIComponent(data.id));version=response.version;data=response.data;selections=data.selection||{};localStorage.setItem(prefix+data.id,JSON.stringify(selections));document.body.classList.toggle('admin',admin);$('adminToggle').textContent=admin?'Log out':'Admin Login';apply();}
  loaded=true;baseline=JSON.stringify(snapshot());info(admin?'Akaun pusat aktif. Tekan Simpan ke server selepas perubahan.':'Paparan awam · Log masuk pusat untuk menyunting.');
 }catch(error){info(error.message);save.hidden=true;loaded=false}}
 save.onclick=async()=>{if(!loaded||!admin)return;save.disabled=true;try{const body=isBracket?{data:snapshot(),version}:{matchId:data.id,data:selections,version};const result=await api(base+(isBracket?'/tournament':'/selection'),'PUT',body);version=result.version;baseline=JSON.stringify(snapshot());info('Perubahan disimpan ke server.')}catch(error){info(error.message)}finally{save.disabled=false}};
 reload.onclick=()=>{if(dirty()&&!confirm('Buang perubahan belum disimpan dan muat semula data server?'))return;load()};
 window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue=''}});
 load();
})();
