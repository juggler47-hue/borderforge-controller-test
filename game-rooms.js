// Controller identities and a bounded host-authorized action mailbox.
export function gameRoomAction(room, action, body, player, isHost) {
  room.game ??= {views:{},pending:[],results:{}};
  const g=room.game;
  if(action==='sync' && isHost){
    if(!body.views || typeof body.views!=='object' || Array.isArray(body.views)) return [400,{error:'Invalid game update.'}];
    g.views=body.views;
    for(const ack of (Array.isArray(body.acks)?body.acks:[])){
      const pending=g.pending.find(p=>p.id===ack.id);
      if(pending){g.results[pending.playerId]={id:ack.id,message:String(ack.message).slice(0,160)};g.pending=g.pending.filter(p=>p.id!==ack.id);}
    }
    return [200,{pending:g.pending}];
  }
  if(action==='capital' && player){
    const v=g.views[player.id];
    if(!v || !v.ticket || body.ticket!==v.ticket || !v.options?.some(o=>o.id===body.territory))return [409,{error:'That choice is no longer available. Wait for the host update.'}];
    if(g.pending.some(p=>p.playerId===player.id))return [409,{error:'Your choice is already waiting for the host.'}];
    if(typeof body.id!=='string'|| !/^[a-zA-Z0-9-]{1,64}$/.test(body.id))return [400,{error:'Invalid action.'}];
    if(g.results[player.id]?.id===body.id)return [200,{queued:false}];
    g.pending.push({id:body.id,playerId:player.id,territory:body.territory,ticket:body.ticket});
    // Consume the offered choice immediately, preventing double taps.
    g.views[player.id]={...v,ticket:null,options:[],message:'Waiting for host confirmation…'};
    return [202,{queued:true}];
  }
  return [405,{error:'Action not allowed.'}];
}
