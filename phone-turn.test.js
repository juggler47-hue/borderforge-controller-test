import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('phone turn: amounts, stale actions, adjacency, truces, advance and phase progression',async()=>{
 const state={turn:1,phase:'reinforce',currentPlayer:0,reinforcementsLeft:3,players:[{id:0,name:'Human',isHuman:true},{id:1,name:'Enemy'}],map:{territories:[{id:0,name:'Home',owner:0,armies:2},{id:1,name:'Border',owner:1,armies:1},{id:2,name:'Distant',owner:1,armies:3}],adjacency:[[1],[0],[]]}};
 const slider={value:0};let attacks=0,truce=false;
 const c=vm.createContext({state,crypto:{randomUUID:()=> 'epoch'},window:{BorderforgeMultiplayer:{status:{mode:'local'}}},handoffPending:false,pendingAdvance:null,selected:null,attackTarget:null,document:{querySelector:()=>null,getElementById:()=>slider},hasTruce:()=>truce,mustTradeCards:()=>false,onTerritoryClick(id){state.map.territories[id].armies++;state.reinforcementsLeft--;},nextPhase(){state.phase=state.phase==='reinforce'?'attack':state.phase==='attack'?'fortify':'reinforce';},confirmAttack(){attacks++;state.map.territories[1].owner=0;c.pendingAdvance={fromId:0,toId:1,minMove:1,maxMove:4};},confirmAdvance(){state.map.territories[0].armies-=Number(slider.value);state.map.territories[1].armies=Number(slider.value);c.pendingAdvance=null;}});
 vm.runInContext(await readFile(new URL('../public/game-bridge.js',import.meta.url),'utf8'),c);const b=c.window.BorderforgeControllerGame;b.assign('p',0);let n=0;
 const send=(option,amount)=>b.apply({id:String(++n),playerId:'p',ticket:b.view('p').ticket,option,amount});
 send('reinforce-0',4);assert.equal(state.reinforcementsLeft,3);
 const stale=b.view('p').ticket;send('reinforce-0',3);assert.equal(state.map.territories[0].armies,5);assert.equal(state.reinforcementsLeft,0);
 b.apply({id:'stale',playerId:'p',ticket:stale,option:'reinforce-0',amount:1});assert.equal(state.map.territories[0].armies,5);
 send('next');truce=true;assert.ok(!b.view('p').options.some(o=>o.kind==='attack'));truce=false;
 assert.ok(!b.view('p').options.some(o=>o.to===2));send('attack-0-2');assert.equal(attacks,0);
 send('attack-0-1');assert.equal(attacks,1);assert.equal(b.view('p').options[0].kind,'advance');send('advance',5);assert.ok(c.pendingAdvance);send('advance',2);assert.equal(c.pendingAdvance,null);assert.equal(state.map.territories[1].armies,2);
 send('next');assert.equal(state.phase,'fortify');send('next');assert.equal(state.phase,'reinforce');state.currentPlayer=1;assert.equal(b.view('p').ticket,null);
});
