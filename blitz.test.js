import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('phone blitz uses the original desktop loop, stops on capture, rejects stale and duplicate commands',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const original=html.slice(html.indexOf('function blitzAttack() {'),html.indexOf('function cancelAttackTarget()'));
 const state={phase:'attack',currentPlayer:0,players:[{id:0,isHuman:true,name:'Human'},{id:1,name:'Enemy'}],map:{territories:[{id:0,name:'Home',owner:0,armies:8},{id:1,name:'Target',owner:1,armies:3}],adjacency:[[1],[0]]}};
 let rounds=0,truce=false;
 const c=vm.createContext({state,crypto:{randomUUID:()=> 'epoch'},window:{BorderforgeMultiplayer:{status:{mode:'local'}}},handoffPending:false,pendingAdvance:null,selected:null,attackTarget:null,blitzInProgress:false,hasTruce:()=>truce,render(){},log(){},attack(){rounds++;state.map.territories[1].armies--;if(!state.map.territories[1].armies){state.map.territories[1].owner=0;c.pendingAdvance={fromId:0,toId:1,minMove:1,maxMove:7};}}});
 vm.runInContext(original,c);
 vm.runInContext(await readFile(new URL('./game-bridge.js',import.meta.url),'utf8'),c);
 const b=c.window.BorderforgeControllerGame;b.assign('p',0);
 truce=true;assert.ok(!b.view('p').options.some(o=>o.kind==='blitz'));truce=false;
 const stale=b.view('p').ticket;state.map.territories[0].armies++;
 b.apply({id:'stale',playerId:'p',ticket:stale,option:'blitz-0-1'});assert.equal(rounds,0);
 const command={id:'blitz',playerId:'p',ticket:b.view('p').ticket,option:'blitz-0-1'};
 b.apply(command);assert.equal(rounds,3);assert.equal(state.map.territories[1].owner,0);assert.equal(b.view('p').options[0].kind,'advance');
 b.apply(command);assert.equal(rounds,3);
});

test('desktop blitz stops when attacker is exhausted',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const original=html.slice(html.indexOf('function blitzAttack() {'),html.indexOf('function cancelAttackTarget()'));
 const state={currentPlayer:0,players:[{id:0},{id:1,name:'Enemy'}],map:{territories:[{name:'Home',owner:0,armies:4},{name:'Target',owner:1,armies:10}]}};
 let rounds=0;const c=vm.createContext({state,selected:0,attackTarget:1,pendingAdvance:null,blitzInProgress:false,render(){},log(){},attack(){rounds++;state.map.territories[0].armies--;}});
 vm.runInContext(original,c);c.blitzAttack();assert.equal(rounds,3);assert.equal(c.selected,null);assert.equal(state.map.territories[1].owner,1);
});

test('advisor bookkeeping cannot invalidate a legal phone ticket on every poll',async()=>{
 const state={phase:'reinforce',currentPlayer:0,reinforcementsLeft:0,players:[{id:0,name:'Human',isHuman:true}],map:{territories:[],adjacency:[]}};
 let calls=0;const c=vm.createContext({state,crypto:{randomUUID:()=> 'epoch'},window:{BorderforgeMultiplayer:{status:{mode:'local'}}},handoffPending:false,mustTradeCards:()=>false,getNextMove(){state.players[0].campaignAxis={score:++calls};return {action:{type:'next_phase'}};},nextPhase(){state.phase='attack';}});
 vm.runInContext(await readFile(new URL('./game-bridge.js',import.meta.url),'utf8'),c);const b=c.window.BorderforgeControllerGame;b.assign('p',0);const ticket=b.view('p').ticket;
 state.players[0].campaignAxis={score:99};assert.equal(b.view('p').ticket,ticket);assert.equal(calls,1);
 b.apply({id:'next',playerId:'p',ticket,option:'next'});assert.equal(state.phase,'attack');
});
