(() => {
  'use strict';
  const phone=!!document.querySelector('.bf-controller');
  if(!phone){
    const panel=document.createElement('details'); panel.id='bf-room-panel';
    panel.innerHTML='<summary>Phone controller · connection test</summary><section id="bf-room"><p>Computers show the full game. In-room phones send controls while players watch the TV.</p><button id="bf-create">Create test room</button><button id="bf-close" hidden>Close room</button><p id="bf-invite"></p><p id="bf-count"></p><p id="bf-status" role="status" aria-live="polite">This test does not change your game.</p></section>';
    document.body.append(panel);
  }
  const $=id=>document.getElementById(id);
  let session=null, timer=null, seen=0;
  const status=text=>$('bf-status').textContent=text;
  async function api(path, method='GET', body){
    const response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
    const data=await response.json(); if(!response.ok){const error=new Error(data.error); error.status=response.status; throw error;} return data;
  }
  function clear(){clearTimeout(timer);session=null;try{sessionStorage.removeItem('bf-controller-test-'+(phone?'phone':'host'));}catch{} if(phone){$('bf-join').hidden=false;$('bf-press').hidden=true;}else{$('bf-create').hidden=false;$('bf-close').hidden=true;$('bf-invite').textContent='';$('bf-count').textContent='';}}
  function save(){try{sessionStorage.setItem('bf-controller-test-'+(phone?'phone':'host'),JSON.stringify(session));}catch{}}
  function show(){
    if(phone){$('bf-join').hidden=true;$('bf-press').hidden=false;}
    else{
      $('bf-create').hidden=true;$('bf-close').hidden=false;
      const link=new URL('controller.html',location.href);link.searchParams.set('room',session.code);
      $('bf-invite').replaceChildren(document.createTextNode(`Room ${session.code} — On the phone, open: `));
      const a=document.createElement('a');a.href=link.href;a.textContent=link.href;$('bf-invite').append(a);
    }
  }
  async function poll(){
    const current=session;if(!current)return;
    try{
      const data=await api(`/api/rooms/${current.code}`);if(session!==current)return;
      status(`${data.players.length} controller(s) joined${data.players.length?': '+data.players.join(', '):''}.`);
      if(phone){$('bf-press').disabled=false;}else{
        $('bf-count').textContent=`Signals received: ${data.count}`;
        if(data.last) status(`${data.last.name} sent a test signal. ${data.players.length} controller(s) joined.`);
        if(data.count>seen){$('bf-room-panel').classList.add('signal');setTimeout(()=>$('bf-room-panel').classList.remove('signal'),700);}seen=data.count;
      }
    }catch(error){if(session!==current)return;if(error.status===404||error.status===403){clear();status(error.message);return;}status('Connection interrupted. Retrying…');if(phone)$('bf-press').disabled=true;}
    if(session===current)timer=setTimeout(poll,1000);
  }
  if(phone){
    $('bf-code').value=(new URLSearchParams(location.search).get('room')||'').toUpperCase();
    $('bf-join').onsubmit=async event=>{event.preventDefault();const btn=event.submitter;btn.disabled=true;try{session=await api(`/api/rooms/${$('bf-code').value.trim().toUpperCase()}/join`,'POST',{name:$('bf-name').value.trim()});save();show();poll();}catch(error){status(error.message);}finally{btn.disabled=false;}};
    $('bf-press').onclick=async()=>{const btn=$('bf-press');btn.disabled=true;try{const result=await api(`/api/rooms/${session.code}/press`,'POST',{id:crypto.randomUUID()});status(`Signal received by room service! Total: ${result.count}. Watch the host screen.`);}catch(error){status(error.message);}finally{btn.disabled=false;}};
  }else{
    $('bf-create').onclick=async()=>{
      if(location.protocol==='file:'){status('Open the hosted game website to create an internet room. The game itself still works in this file.');return;}
      $('bf-create').disabled=true;try{session=await api('/api/rooms','POST',{});save();show();poll();}catch{status('The room service is unavailable. Open the game on its room-service website and retry.');}finally{$('bf-create').disabled=false;}
    };
    $('bf-close').onclick=async()=>{try{await api(`/api/rooms/${session.code}`,'DELETE');clear();status('Room closed. Your game is unchanged.');}catch(error){status(error.message);}};
  }
  try{const saved=JSON.parse(sessionStorage.getItem('bf-controller-test-'+(phone?'phone':'host')));if(saved&&/^[A-Z2-9]{8}$/.test(saved.code)&&typeof saved.token==='string'){session=saved;show();poll();}}catch{}
})();
