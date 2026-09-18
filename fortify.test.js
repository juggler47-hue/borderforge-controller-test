import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('phone fortification uses real pathfinding and movement, validates amounts and only moves once',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const pathfinding=html.slice(html.indexOf('function reachableFriendlyTerritories('),html.indexOf('function canFortify('));
 const movement=html.slice(html.indexOf('window.v51ExecuteFortifyMove = function'),html.indexOf('const _v51BaseEndTurn = endTurn;'));
 const state={phase:'fortify',currentPlayer:0,turn:1,players:[{id:0,name:'Human',isHuman:true},{id:1,name:'Enemy'}],map:{territories:[{id:0,name:'Source',owner:0,armies:6},{id:1,name:'Link',owner:0,armies:1},{id:2,name:'Front',owner:0,armies:2},{id:3,name:'Enemy',owner:1,armies:3},{id:4,name:'Isolated',owner:0,armies:2}],adjacency:[[1],[0,2],[1,3],[2,4],[3]]}};
 let finish,ended=0,specialists=0;
 const c=vm.createContext({state,crypto:{randomUUID:()=> 'epoch'},window:{BorderforgeMultiplayer:{status:{mode:'local'}}},handoffPending:false,selected:null,attackTarget:null,pendingFortify:null,document:{querySelector:()=>null,getElementById:()=>null},setTimeout(fn){finish=fn;},endTurn(){ended++;},moveSpecialistsProportional(){specialists++;},capSpecialists(){},render(){},log(){},getNextMove:()=>({label:'Defend Front',action:{type:'fortify_setup',fromId:0,toId:2,amount:4}})});
 vm.runInContext(pathfinding+movement,c);
 vm.runInContext(await readFile(new URL('./game-bridge.js',import.meta.url),'utf8'),c);
 const b=c.window.BorderforgeControllerGame;b.assign('p',0);let v=b.view('p');
 assert.equal(v.advisor.option,'fortify-0-2');assert.equal(v.advisor.amount,4);
 assert.equal(v.options.find(o=>o.id==='fortify-0-2').max,5);
 assert.ok(!v.options.some(o=>o.kind==='fortify'&&(o.from===1||o.from===o.to||o.to===3||o.to===4)));
 for(const [id,amount]of [['zero',0],['fraction',1.5],['too-many',6]])b.apply({id,playerId:'p',ticket:v.ticket,option:'fortify-0-2',amount});
 assert.equal(state.map.territories[0].armies,6);
 b.apply({id:'wrong-seat',playerId:'other',ticket:v.ticket,option:'fortify-0-2',amount:2});assert.equal(specialists,0);
 const old=v.ticket;state.map.territories[1].owner=1;
 b.apply({id:'broken-chain',playerId:'p',ticket:old,option:'fortify-0-2',amount:2});assert.equal(specialists,0);
 state.map.territories[1].owner=0;v=b.view('p');
 const command={id:'valid',playerId:'p',ticket:v.ticket,option:'fortify-0-2',amount:5};
 b.apply(command);assert.equal(state.map.territories[0].armies,1);assert.equal(state.map.territories[2].armies,7);assert.equal(specialists,1);
 b.apply(command);assert.equal(specialists,1);assert.equal(b.view('p').ticket,null);assert.equal(b.view('p').options.length,0);
 finish();assert.equal(ended,1);
});

test('fortification map highlights connected destination and sends source/target selection',async()=>{
 class Element{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};}append(...els){this.children.push(...els);}setAttribute(k,v){this.attrs[k]=v;}}
 const c=vm.createContext({window:{},document:{createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)}});
 vm.runInContext(await readFile(new URL('./phone-map.js',import.meta.url),'utf8'),c);
 const root=new Element('main'),chosen=[];
 c.window.renderPhoneMap(root,{seat:0,map:{territories:[0,1,2].map(id=>({id,name:String(id),x:id*50,y:20,owner:0,armies:3})),edges:[[0,1]]},options:[{id:'fortify-0-1',kind:'fortify',from:0,to:1}]},id=>chosen.push(id));
 const all=e=>[e,...e.children.flatMap(all)],nodes=all(root).filter(e=>e.tag==='g');
 nodes[0].onclick();assert.equal(nodes[1].children[0].attrs.stroke,'#ffe080');assert.notEqual(nodes[2].children[0].attrs.stroke,'#ffe080');nodes[1].onclick();assert.deepEqual(chosen,['fortify-0-1']);
});
