import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('map selects only offered moves; attack requires source then target',async()=>{
 class Element{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};}append(...items){this.children.push(...items);}setAttribute(k,v){this.attrs[k]=v;}}
 const c=vm.createContext({window:{},document:{createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)}});
 vm.runInContext(await readFile(new URL('./phone-map.js',import.meta.url),'utf8'),c);
 const container=new Element('main'),chosen=[];
 c.window.renderPhoneMap(container,{seat:0,map:{territories:[{id:0,name:'Home',x:10,y:10,owner:0,armies:4,color:'red'},{id:1,name:'Enemy',x:60,y:60,owner:1,armies:2,color:'blue'}],edges:[[0,1]]},options:[{id:'a',kind:'attack',from:0,to:1}]},id=>chosen.push(id));
 const all=e=>[e,...e.children.flatMap(all)],nodes=all(container).filter(e=>e.tag==='g');
 nodes[1].onclick();assert.deepEqual(chosen,[]);nodes[0].onclick();nodes[1].onclick();assert.deepEqual(chosen,['a']);
});
test('advisor maps existing recommendation to a validated phone option and exports only public map fields',async()=>{
 const state={turn:1,phase:'reinforce',currentPlayer:0,reinforcementsLeft:5,players:[{id:0,name:'Commander',isHuman:true,color:'red',cards:['private']}],map:{territories:[{id:0,name:'Home',x:10,y:20,owner:0,armies:2,secret:'no'}],adjacency:[[]]}};
 const c=vm.createContext({state,crypto:{randomUUID:()=> 'e'},window:{BorderforgeMultiplayer:{status:{mode:'local'}}},handoffPending:false,getNextMove:()=>({label:'Defend Home',why:'Border threatened',action:{type:'place_armies',territoryId:0,count:3}})});
 vm.runInContext(await readFile(new URL('./game-bridge.js',import.meta.url),'utf8'),c);const b=c.window.BorderforgeControllerGame;b.assign('p',0);const v=b.view('p');assert.equal(v.advisor.option,'reinforce-0');assert.equal(v.advisor.amount,3);assert.equal(v.map.territories[0].secret,undefined);assert.equal(v.map.players,undefined);
});
