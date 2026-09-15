import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('room input accepts copied formatting and links without guessing ambiguous digits',async()=>{
 const js=await readFile(new URL('./room.js',import.meta.url),'utf8');
 const fn=js.slice(js.indexOf('  function normalizeRoomEntry'),js.indexOf('  if(!phone)'));
 const context=vm.createContext({URL});vm.runInContext(fn,context);
 const normalize=context.normalizeRoomEntry;
 for(const input of [' abcd 2345 ','abcd-2345','ABCD\u200B2345','ＡＢＣＤ２３４５','https://example.com/controller.html?room=abcd2345'])assert.equal(normalize(input),'ABCD2345');
 assert.equal(normalize('ABCD0123'),'ABCD0123');
 assert.equal(normalize('https://example.com/'),'');
});
