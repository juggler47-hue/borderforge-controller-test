import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.js';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('room lifecycle, role boundaries, isolation and duplicate protection',async t=>{
 const app=createApp();await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>app.close(r)));
 const base=`http://127.0.0.1:${app.address().port}`;
 async function call(path,method='GET',body,key){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
 const host=(await call('/api/rooms','POST',{})).data, room='/api/rooms/'+host.code;
 const other=(await call('/api/rooms','POST',{})).data;
 assert.equal((await call(room)).status,403);
 assert.equal((await call(room+'/join','POST',{name:''})).status,400);
 const phone=(await call(room+'/join','POST',{name:'Family player'})).data;
 assert.equal((await call(room+'/press','POST',{id:'test'},host.token)).status,405);
 assert.equal((await call('/api/rooms/'+other.code+'/press','POST',{id:'test'},phone.token)).status,403);
 assert.equal((await call(room+'/press','POST',{id:'test'},phone.token)).data.count,1);
 assert.equal((await call(room+'/press','POST',{id:'test'},phone.token)).data.count,1);
 const snapshot=(await call(room,'GET',null,host.token)).data;
 assert.equal(snapshot.count,1);assert.equal(snapshot.last.name,'Family player');assert.deepEqual(snapshot.players,['Family player']);
 assert.equal((await call(room,'DELETE',null,phone.token)).status,405);
 assert.equal((await call(room,'DELETE',null,host.token)).status,200);
 assert.equal((await call(room,'GET',null,phone.token)).status,404);
 assert.equal((await fetch(base+'/./server.js')).status,404);
 assert.equal((await fetch(base+'/controller.html')).status,200);
});
test('inactive rooms expire',async t=>{
 const app=createApp({ttl:1});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>app.close(r)));
 const base=`http://127.0.0.1:${app.address().port}`;
 const host=await (await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
 await new Promise(r=>setTimeout(r,15));assert.equal((await fetch(base+'/api/rooms/'+host.code,{headers:{Authorization:`Bearer ${host.token}`}})).status,404);
});
test('existing game scripts are preserved exactly and still parse',async()=>{
 const original=await readFile(new URL('./original-game.html',import.meta.url),'utf8');
 const current=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const scripts=html=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
 assert.deepEqual(scripts(current),scripts(original));
 for(const script of scripts(current))new vm.Script(script);
 assert.ok(!current.includes('id="bf-mobile-compat"'));
});
