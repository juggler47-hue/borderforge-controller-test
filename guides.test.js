import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.js';
test('guides and PDFs are served with correct types and private files remain blocked',async t=>{
 const app=createApp();await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>app.close(r)));
 const base=`http://127.0.0.1:${app.address().port}`;
 for(const path of ['/help','/help.html','/quick-start.html','/manual.html']){const r=await fetch(base+path);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);assert.match(await r.text(),/Border Forge/);}
 for(const path of ['/quick-start.pdf','/manual.pdf']){const r=await fetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/pdf');assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0,5).toString(),'%PDF-');}
 for(const path of ['/server.js','/README.md','/package.json','/constructor'])assert.equal((await fetch(base+path)).status,404);
});
