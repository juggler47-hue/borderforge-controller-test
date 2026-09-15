// A lightweight public board; actions still use the validated option list.
window.renderPhoneMap=function(container,view,onChoose){
  if(!view?.map?.territories?.length)return;
  const section=document.createElement('section');section.className='phone-map';
  const heading=document.createElement('h2');heading.textContent='Battlefield';section.append(heading);
  const hint=document.createElement('p');hint.textContent='Tap a territory to inspect it. To attack, tap your army, then a highlighted enemy.';section.append(hint);
  const toolbar=document.createElement('div'),scroll=document.createElement('div');scroll.className='phone-map-scroll';
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1000 700');svg.setAttribute('aria-label','Battlefield territory map');
  let zoom=1,source=null;
  for(const [label,delta] of [['Zoom in',.5],['Zoom out',-.5]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{zoom=Math.max(1,Math.min(3,zoom+delta));svg.style.width=`${zoom*100}%`;};toolbar.append(b);}
  const info=document.createElement('p');info.setAttribute('aria-live','polite');
  const ts=view.map.territories,byId=new Map(ts.map(t=>[t.id,t])),nodes=new Map();
  const make=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
  for(const [a,b]of view.map.edges){const f=byId.get(a),t=byId.get(b);if(f&&t)svg.append(make('line',{x1:f.x,y1:f.y,x2:t.x,y2:t.y,stroke:'#52677b','stroke-width':2}));}
  const highlight=()=>{for(const [id,node]of nodes){const possible=source!==null?(view.options||[]).some(o=>o.kind==='attack'&&o.from===source&&o.to===id):(view.options||[]).some(o=>o.territory===id||o.from===id);node.setAttribute('stroke',id===source?'#fff':possible?'#ffe080':'#617184');node.setAttribute('stroke-width',id===source||possible?5:1);}};
  for(const t of ts){
    if(!Number.isFinite(t.x)||!Number.isFinite(t.y))continue;
    const g=make('g',{role:'button',tabindex:0,'aria-label':`${t.name}, ${t.armies} armies${t.owner===view.seat?', yours':''}`});
    const circle=make('circle',{cx:t.x,cy:t.y,r:22,fill:t.color});nodes.set(t.id,circle);g.append(circle);
    const count=make('text',{x:t.x,y:t.y+5,'text-anchor':'middle',fill:'white','font-size':17,'font-weight':'bold'});count.textContent=t.armies;g.append(count);
    const name=make('text',{x:t.x,y:t.y+36,'text-anchor':'middle',fill:'#eaf1f8','font-size':11});name.textContent=t.name+(t.capital?' ★':'');g.append(name);
    const click=()=>{info.textContent=`${t.name}: ${t.armies} armies${t.owner===view.seat?' · Your territory':''}${t.terrain?' · '+t.terrain:''}`;
      const direct=(view.options||[]).find(o=>o.territory===t.id);if(direct){source=null;onChoose(direct.id);}
      else{const attack=(view.options||[]).find(o=>o.kind==='attack'&&o.from===source&&o.to===t.id);if(attack){onChoose(attack.id);source=null;}else if((view.options||[]).some(o=>o.kind==='attack'&&o.from===t.id)){source=t.id;info.textContent+=' · Now tap a highlighted enemy.';}else source=null;}highlight();};
    g.onclick=click;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click();}};svg.append(g);
  }
  highlight();scroll.append(svg);section.append(toolbar,scroll,info);container.append(section);
};
