(() => {
  const epoch=crypto.randomUUID();
  const assignments=new Map(), handled=new Map();
  let campaign=null, serial=0;
  function game(){return typeof state!=='undefined'?state:null;}
  function refresh(){if(game()!==campaign){campaign=game();serial++;assignments.clear();}}
  function local(){return window.BorderforgeMultiplayer?.status?.mode==='local';}
  function ticket(seat){const s=game();return `${epoch}:${serial}:${s?.turn}:${s?.phase}:${s?.pregameIndex}:${seat}`;}
  function view(id){
    refresh();const s=game(),seat=assignments.get(id),p=s?.players[seat];
    const base={seat:seat??null,commander:p?.name||'',message:'Host: start a local game, then assign this controller.',options:[],ticket:null};
    if(!s || seat===undefined)return base;
    if(!local())return {...base,message:'Controller actions require Local / Hot-Seat mode in this stage.'};
    if(s.gameOver||!p?.isHuman||p.eliminated)return {...base,message:'Commander unavailable.'};
    if(s.currentPlayer!==seat)return {...base,message:'Watch the shared screen. Waiting for your commander.'};
    if(s.phase!=='capital'||s.pregameStage!=='capital')return {...base,message:'Capital selection is not active. Other moves use the computer in this stage.'};
    if(handoffPending)return {...base,message:'Host: confirm the commander handoff on the computer.'};
    return {...base,message:'Choose your capital. Watch the shared screen.',ticket:ticket(seat),options:s.map.territories.filter(t=>t.owner===seat).map(t=>({id:t.id,name:t.name}))};
  }
  window.BorderforgeControllerGame={
    seats(){refresh();return local()?(game()?.players||[]).filter(p=>p.isHuman&&!p.eliminated).map(p=>({id:p.id,name:p.name})):[];},
    assign(id,seat){refresh();if(seat===null){assignments.delete(id);return;}if(!this.seats().some(p=>p.id===seat))throw Error('Choose an available human commander.');if([...assignments].some(([other,s])=>other!==id&&s===seat))throw Error('That commander already has a controller.');assignments.set(id,seat);},
    view,
    apply(command){
      if(handled.has(command.id))return handled.get(command.id);
      const v=view(command.playerId);let message='Choice expired; check your controller again.';
      if(v.ticket&&v.ticket===command.ticket&&v.options.some(o=>o.id===command.territory)){
        const s=game(),seat=s.currentPlayer;
        onTerritoryClick(command.territory);
        message=s.players[seat].capitalId===command.territory?'Capital established. Watch the shared screen.':'The game did not accept this choice.';
      }
      const ack={id:command.id,message};handled.set(command.id,ack);return ack;
    },
    reset(){assignments.clear();}
  };
})();
