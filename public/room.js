(() => {
  'use strict';
  const phone=!!document.querySelector('.bf-controller');
  if(!phone){
    const panel=document.createElement('details'); panel.id='bf-room-panel';panel.open=true;
    panel.innerHTML='<summary>Phone controller · connection test</summary><section id="bf-room"><p>Computers show the full game. In-room phones send controls while players watch the TV.</p><button id="bf-create">Create test room</button><button id="bf-close" hidden>Close room</button><p id="bf-invite"></p><p id="bf-count"></p><p id="bf-status" role="status" aria-live="polite">Stage 2: assign a commander and choose a capital from the phone.</p></section>';
    document.body.append(panel);
    panel.querySelector('summary').textContent='Phone setup';
    document.getElementById('bf-create').textContent='Connect a phone';
    const launcher=document.createElement('button');launcher.textContent='Phone setup';launcher.className='hdr-save-btn';launcher.onclick=()=>{panel.open=true;panel.scrollIntoView({block:'nearest'});};
    (document.querySelector('header')||document.body).append(launcher);
  }
  const $=id=>document.getElementById(id);
  const gameBox=document.createElement('section');gameBox.id='bf-game-controls';$('bf-room').append(gameBox);
  let rosterKey='',choiceKey='',acks=[];
  async function syncGame(data){
    if(phone){
      const v=data.view;
      const key=JSON.stringify([v,data.result]);
      if(key===choiceKey)return;choiceKey=key;gameBox.replaceChildren();
      const info=document.createElement('p');info.textContent=v?`${v.commander? v.commander+' — ':''}${v.message}`:'Waiting for the host to assign your commander.';gameBox.append(info);
      if(data.result){const result=document.createElement('p');result.textContent=data.result.message;gameBox.append(result);}
      for(const option of v?.options||[]){const button=document.createElement('button');button.textContent=`Capital: ${option.name}`;button.onclick=async()=>{
        gameBox.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{await api(`/api/rooms/${session.code}/capital`,'POST',{id:crypto.randomUUID(),ticket:v.ticket,territory:option.id});info.textContent='Choice sent. Waiting for host confirmation…';}catch(e){info.textContent=e.message;choiceKey='';}
      };gameBox.append(button);}
      return;
    }
    const bridge=window.BorderforgeControllerGame;if(!bridge)return;
    const identities=data.identities||[],seats=bridge.seats();
    if(identities.length===1&&seats.length===1&&bridge.view(identities[0].id).seat===null)bridge.assign(identities[0].id,seats[0].id);
    const key=JSON.stringify([identities,seats]);
    if(key!==rosterKey){rosterKey=key;gameBox.replaceChildren();
      const help=document.createElement('p');help.textContent=seats.length===0?'Next: start a Local / Hot-Seat game with Frontier Command and Quick Deploy. Your phone can wait here while you set up.':identities.length===1&&seats.length===1?'Your phone is assigned automatically. Choose your capital on the phone when it is your turn.':'Assign each phone to its human commander below.';gameBox.append(help);
      for(const identity of identities){const label=document.createElement('label');label.textContent=identity.name+' — commander';const select=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Not assigned';select.append(empty);
        for(const seat of seats){const option=document.createElement('option');option.value=seat.id;option.textContent=seat.name;select.append(option);}
        select.value=bridge.view(identity.id).seat??'';
        select.onchange=()=>{try{bridge.assign(identity.id,select.value===''?null:Number(select.value));}catch(e){status(e.message);select.value=bridge.view(identity.id).seat??'';}};label.append(select);gameBox.append(label);
      }
    }
    const views=Object.fromEntries(identities.map(p=>[p.id,bridge.view(p.id)]));
    const response=await api(`/api/rooms/${session.code}/sync`,'POST',{views,acks});
    acks=response.pending.map(command=>bridge.apply(command));
  }
  let session=null, timer=null, seen=0;
  const status=text=>$('bf-status').textContent=text;
  async function api(path, method='GET', body){
    const response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
    const data=await response.json(); if(!response.ok){const error=new Error(data.error); error.status=response.status; throw error;} return data;
  }
  function clear(){clearTimeout(timer);session=null;gameBox.replaceChildren();rosterKey='';choiceKey='';acks=[];window.BorderforgeControllerGame?.reset();try{sessionStorage.removeItem('bf-controller-test-'+(phone?'phone':'host'));}catch{} if(phone){$('bf-join').hidden=false;$('bf-press').hidden=true;}else{$('bf-create').hidden=false;$('bf-close').hidden=true;$('bf-invite').textContent='';$('bf-count').textContent='';}}
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
      await syncGame(data);if(session!==current)return;
      status(`${data.players.length} controller(s) joined${data.players.length?': '+data.players.join(', '):''}.`);
      if(phone){$('bf-press').disabled=false;}else{
        $('bf-count').textContent=`Signals received: ${data.count}`;
        if(data.last) status(`${data.last.name} sent a test signal. ${data.players.length} controller(s) joined.`);
        if(data.count>seen){$('bf-room-panel').classList.add('signal');setTimeout(()=>$('bf-room-panel').classList.remove('signal'),700);}seen=data.count;
      }
    }catch(error){if(session!==current)return;if(error.status===404||error.status===403){clear();if(phone){$('bf-code').value='';history.replaceState(null,'',location.pathname);status('This room has ended. On the computer choose Connect a phone, then enter its new code here. Your name is kept.');}else{$('bf-room-panel').open=true;status('The phone room ended. Your game can continue. Choose Connect a phone for a new code.');}return;}status('Connection interrupted. Keep this page open; reconnecting automatically…');if(phone){$('bf-press').disabled=true;gameBox.querySelectorAll('button').forEach(b=>b.disabled=true);choiceKey='';}}
    if(session===current)timer=setTimeout(poll,1000);
  }
  if(phone){
    const leave=document.createElement('button');leave.textContent='Use a different room';leave.onclick=()=>{clear();$('bf-code').value='';history.replaceState(null,'',location.pathname);status('Enter the room code currently shown on the computer.');};$('bf-room').append(leave);
    $('bf-code').value=(new URLSearchParams(location.search).get('room')||'').toUpperCase();
    $('bf-join').onsubmit=async event=>{event.preventDefault();const btn=event.submitter;btn.disabled=true;try{session=await api(`/api/rooms/${$('bf-code').value.trim().toUpperCase()}/join`,'POST',{name:$('bf-name').value.trim()});save();show();poll();}catch(error){status(error.message);}finally{btn.disabled=false;}};
    $('bf-press').onclick=async()=>{const btn=$('bf-press');btn.disabled=true;try{const result=await api(`/api/rooms/${session.code}/press`,'POST',{id:crypto.randomUUID()});status(`Signal received by room service! Total: ${result.count}. Watch the host screen.`);}catch(error){status(error.message);}finally{btn.disabled=false;}};
  }else{
    $('bf-create').onclick=async()=>{
      if(location.protocol==='file:'){status('Open the hosted game website to create an internet room. The game itself still works in this file.');return;}
      $('bf-create').disabled=true;status('Connecting… the service may need a moment to wake up.');try{session=await api('/api/rooms','POST',{});save();show();poll();}catch{status('Could not reach the room service. Wait a moment, then choose Connect a phone again.');}finally{$('bf-create').disabled=false;}
    };
    $('bf-close').onclick=async()=>{try{await api(`/api/rooms/${session.code}`,'DELETE');clear();status('Room closed. Your game is unchanged.');}catch(error){status(error.message);}};
  }
  try{const saved=JSON.parse(sessionStorage.getItem('bf-controller-test-'+(phone?'phone':'host')));if(saved&&/^[A-Z2-9]{8}$/.test(saved.code)&&typeof saved.token==='string'){session=saved;show();poll();}}catch{}
})();
