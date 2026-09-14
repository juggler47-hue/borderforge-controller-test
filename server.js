import http from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function createApp({ttl = 30 * 60_000} = {}) {
  const rooms = new Map();
  const token = () => randomBytes(24).toString('hex');
  const send = (res, status, value) => { res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Referrer-Policy','no-referrer');
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path === '/health') return send(res,200,{ok:true});
      if (!path.startsWith('/api/')) {
        const files = {'/':'index.html','/index.html':'index.html','/controller.html':'controller.html','/room.js':'room.js','/room.css':'room.css'};
        const file = files[path];
        if (!file || req.method !== 'GET') return send(res,404,{error:'Page not found.'});
        const data = await readFile(new URL(`./public/${file}`,import.meta.url));
        res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','Cache-Control':'no-cache'});
        return res.end(data);
      }
      for (const [code, room] of rooms) if (Date.now()-room.touched > ttl) rooms.delete(code);
      let body = {};
      if (req.method === 'POST') {
        if (!(req.headers['content-type'] || '').startsWith('application/json')) return send(res,415,{error:'JSON required.'});
        let raw='';
        for await (const chunk of req) { raw+=chunk; if (raw.length>2048) return send(res,413,{error:'Request too large.'}); }
        try { body=JSON.parse(raw); } catch { return send(res,400,{error:'Invalid request.'}); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res,400,{error:'Invalid request.'});
      }
      if (req.method === 'POST' && path === '/api/rooms') {
        if (rooms.size>=500) return send(res,503,{error:'Room service is full. Try later.'});
        let code; do { code=Array.from({length:8},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(31)]).join(''); } while(rooms.has(code));
        const hostToken=token();
        rooms.set(code,{hostToken,players:new Map(),count:0,last:null,touched:Date.now()});
        return send(res,201,{code,token:hostToken});
      }
      const match=path.match(/^\/api\/rooms\/([A-Z2-9]{8})(?:\/(join|press))?$/);
      const room=match && rooms.get(match[1]);
      if (!room) return send(res,404,{error:'Room has closed or expired. Ask the host for a new code.'});
      const action=match[2];
      if (req.method==='POST' && action==='join') {
        const name=typeof body.name==='string'?body.name.trim():'';
        if (!name || name.length>30) return send(res,400,{error:'Enter a name of 1–30 characters.'});
        if (room.players.size>=12) return send(res,409,{error:'This test room is full.'});
        const key=token(); room.players.set(key,{name,lastPress:0,ids:new Map()});
        return send(res,201,{code:match[1],token:key,name});
      }
      const key=(req.headers.authorization || '').replace(/^Bearer /,'');
      const isHost=key===room.hostToken;
      const player=room.players.get(key);
      if (!isHost && !player) return send(res,403,{error:'Please join the room again.'});
      if (req.method==='DELETE' && !action && isHost) { rooms.delete(match[1]); return send(res,200,{closed:true}); }
      if (req.method==='GET' && !action) {
        if (isHost) room.touched=Date.now();
        return send(res,200,{code:match[1],count:room.count,last:room.last,players:[...room.players.values()].map(p=>p.name)});
      }
      if (req.method==='POST' && action==='press' && player) {
        if (typeof body.id!=='string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.id)) return send(res,400,{error:'Invalid action.'});
        if (player.ids.has(body.id)) return send(res,200,{count:player.ids.get(body.id)});
        if (Date.now()-player.lastPress<250) return send(res,429,{error:'Please wait a moment between presses.'});
        player.lastPress=Date.now(); room.count++; room.last={name:player.name,at:Date.now()};
        player.ids.set(body.id,room.count); if(player.ids.size>100) player.ids.delete(player.ids.keys().next().value);
        return send(res,200,{count:room.count});
      }
      send(res,405,{error:'Action not allowed.'});
    } catch { if(!res.headersSent) send(res,500,{error:'Room service unavailable. Please retry.'}); else res.end(); }
  });
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) createApp().listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Borderforge ready'));
