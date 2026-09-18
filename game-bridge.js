(() => {
  const epoch=crypto.randomUUID(),assignments=new Map(),handled=new Map();
  let campaign=null,serial=0,revision=0,last='',advisorKey='',cachedAdvisor=null;
  function game(){return typeof state!=='undefined'?state:null;}
  function refresh(){if(game()!==campaign){campaign=game();serial++;assignments.clear();}const fingerprint=JSON.stringify(game(),(key,value)=>key==='campaignAxis'?undefined:value);if(fingerprint!==last){last=fingerprint;revision++;}}
  function local(){return window.BorderforgeMultiplayer?.status?.mode==='local';}
  function view(id){
    refresh();const s=game(),seat=assignments.get(id),p=s?.players[seat];
    const map=s&&seat!==undefined?{territories:s.map.territories.map(t=>({id:t.id,name:t.name,x:t.x,y:t.y,owner:t.owner,armies:t.armies,terrain:t.terrain,capital:!!t.isCapital,color:s.players[t.owner]?.color||'#65778b'})),edges:s.map.territories.flatMap(t=>(s.map.adjacency?.[t.id]||[]).filter(id=>id>t.id).map(id=>[t.id,id]))}:null;
    if(map&&typeof window.captureGameBoard==='function')map.board=window.captureGameBoard();
    const base={seat:seat??null,commander:p?.name||'',map,message:'Start a Local / Hot-Seat game on the computer.',options:[],ticket:null};
    if(!s||seat===undefined)return base;
    if(!local())return {...base,message:'Use Local / Hot-Seat for phone-controlled games in this version.'};
    if(s.gameOver||!p?.isHuman||p.eliminated)return {...base,message:'Game ended or commander unavailable.'};
    if(s.currentPlayer!==seat)return {...base,message:`Waiting for ${s.players[s.currentPlayer]?.name||'the next commander'}. Watch the shared screen.`};
    if(handoffPending)return {...base,message:'Confirm the commander handoff on the computer.'};
    if(typeof autopilotActive!=='undefined'&&autopilotActive)return {...base,message:'Pause autoplay on the computer to use phone controls.'};
    if(typeof document!=='undefined'&&document.querySelector('.modal-backdrop.show:not(#advanceModal):not(#setupModal)'))return {...base,message:'Finish the open dialog on the computer first.'};
    const options=[],owned=s.map.territories.filter(t=>t.owner===seat);
    let message='Use the computer for this step.';
    const advance=typeof pendingAdvance!=='undefined'?pendingAdvance:null;
    if(advance){message='Territory captured! Choose how many armies to advance.';options.push({id:'advance',kind:'advance',name:`Advance into ${s.map.territories[advance.toId].name}`,min:advance.minMove,max:advance.maxMove});}
    else if(s.phase==='capital'&&s.pregameStage==='capital'){message='Choose your capital.';owned.forEach(t=>options.push({id:t.id,kind:'capital',territory:t.id,name:t.name}));}
    else if(s.phase==='reinforce'){
      message=`Your turn: place ${s.reinforcementsLeft} armies.`;
      if(s.reinforcementsLeft>0)owned.forEach(t=>options.push({id:`reinforce-${t.id}`,kind:'reinforce',territory:t.id,name:`${t.name} (${t.armies} armies)`,min:1,max:s.reinforcementsLeft}));
      else if(typeof mustTradeCards==='function'&&mustTradeCards(p))message='Trade your required cards on the computer before attacking.';
      else options.push({id:'next',kind:'next',name:'Continue to attacks'});
    }else if(s.phase==='attack'){
      message='Tap your army, then an enemy. Choose one round or blitz until exhausted.';
      owned.filter(t=>t.armies>=2).forEach(from=>(s.map.adjacency[from.id]||[]).forEach(toId=>{const to=s.map.territories[toId];if(to&&to.owner!==seat&&!hasTruce(seat,to.owner))options.push({id:`attack-${from.id}-${to.id}`,kind:'attack',from:from.id,to:to.id,name:`${from.name} (${from.armies}) → ${to.name} (${to.armies})`});}));
      for(const attack of [...options])options.push({...attack,id:`blitz-${attack.from}-${attack.to}`,kind:'blitz'});
      options.push({id:'next',kind:'next',name:'Finish attacking'});
    }else if(s.phase==='fortify'){message='Fortify on the computer, or finish your turn here.';options.push({id:'next',kind:'next',name:'End turn without further fortification'});}
    let advisor=null;
    if(!advance&&typeof getNextMove==='function'&&['reinforce','attack','fortify'].includes(s.phase)){
      try{const key=`${serial}:${revision}:${seat}`;if(key!==advisorKey){cachedAdvisor=getNextMove();refresh();advisorKey=`${serial}:${revision}:${seat}`;}const rec=cachedAdvisor;if(rec){const a=rec.action||{};let match;
        if(a.type==='place_armies')match=options.find(o=>o.kind==='reinforce'&&o.territory===a.territoryId);
        if(a.type==='attack_setup')match=options.find(o=>o.kind==='attack'&&o.from===a.fromId&&o.to===a.toId);
        if(a.type==='next_phase')match=options.find(o=>o.kind==='next');
        advisor={label:rec.label,why:rec.why,option:match?.id,amount:match?.max?Math.max(match.min,Math.min(match.max,Number(a.count)||1)):undefined};
      }}catch{advisor={label:'Advisor unavailable for this step.',why:'Continue with a legal move below.'};}
    }
    return {...base,message,advisor,ticket:`${epoch}:${serial}:${revision}:${seat}`,options};
  }
  window.BorderforgeControllerGame={
    seats(){refresh();return local()?(game()?.players||[]).filter(p=>p.isHuman&&!p.eliminated).map(p=>({id:p.id,name:p.name})):[];},
    assign(id,seat){refresh();if(seat===null){assignments.delete(id);return;}if(!this.seats().some(p=>p.id===seat))throw Error('Choose a human commander.');if([...assignments].some(([other,s])=>other!==id&&s===seat))throw Error('That commander already has a phone.');assignments.set(id,seat);},view,
    apply(command){
      if(handled.has(command.id))return handled.get(command.id);
      const v=view(command.playerId),o=v.options.find(o=>o.id===(command.option??command.territory));let message='The game changed. Please choose again.';
      if(v.ticket&&v.ticket===command.ticket&&o){
        const s=game(),seat=s.currentPlayer,amount=command.amount;
        if(o.max!==undefined&&(!Number.isInteger(amount)||amount<o.min||amount>o.max))message='Choose an army count within the displayed limits.';
        else if(o.kind==='capital'){onTerritoryClick(o.territory);message=s.players[seat].capitalId===o.territory?'Capital established.':'Capital choice was not accepted.';}
        else if(o.kind==='reinforce'){const before=s.reinforcementsLeft;for(let n=0;n<amount;n++)onTerritoryClick(o.territory);message=`Placed ${before-s.reinforcementsLeft} armies at ${s.map.territories[o.territory].name}.`;}
        else if(o.kind==='attack'){selected=o.from;attackTarget=o.to;confirmAttack();message='Attack round resolved. Check the updated armies on screen.';}
        else if(o.kind==='blitz'){selected=o.from;attackTarget=o.to;blitzAttack();message='Blitz finished. Check the board and advance armies if prompted.';}
        else if(o.kind==='advance'){document.getElementById('advanceSlider').value=amount;confirmAdvance();message=`Advanced ${amount} armies.`;}
        else if(o.kind==='next'){nextPhase();message='Turn step updated.';}
      }
      const ack={id:command.id,message};handled.set(command.id,ack);if(handled.size>1000)handled.delete(handled.keys().next().value);return ack;
    },reset(){assignments.clear();}
  };
})();
