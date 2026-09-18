// Share the actual rendered game board as a restricted SVG drawing tree.
(() => {
  const tags=new Set(['svg','g','path','polygon','polyline','line','circle','ellipse','rect','text','tspan','defs','linearGradient','radialGradient','stop','clipPath']);
  const attrs=new Set(['viewBox','d','points','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','transform','id','data-id','offset','gradientUnits','gradientTransform']);
  const paints=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','font-size','font-family','font-weight','text-anchor','dominant-baseline','display','visibility','paint-order'];
  const safe=v=>!/[<>]|url\(|javascript:|data:/i.test(String(v));
  let last='',cached=null;
  window.captureGameBoard=()=>{
    const root=document.getElementById('mapSvg');if(!root)return null;
    if(root.outerHTML===last)return cached;last=root.outerHTML;
    const visit=el=>{
      if(!tags.has(el.localName))return null;
      const a={};for(const attr of el.attributes)if(attrs.has(attr.name)&&safe(attr.value))a[attr.name]=attr.value;
      const css=getComputedStyle(el);for(const p of paints){const value=css.getPropertyValue(p);if(value&&safe(value))a[p]=value;}
      return {tag:el.localName,a,text:['text','tspan'].includes(el.localName)?[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(''):'',children:[...el.children].map(visit).filter(Boolean)};
    };cached=visit(root);return cached;
  };
  window.restoreGameBoard=tree=>{
    let count=0;
    const visit=(n,depth=0)=>{if(!n||!tags.has(n.tag)||depth>30||++count>15000)return null;const el=document.createElementNS('http://www.w3.org/2000/svg',n.tag);
      for(const [k,v]of Object.entries(n.a||{}))if((attrs.has(k)||paints.includes(k))&&safe(v))el.setAttribute(k,String(v));
      if(['text','tspan'].includes(n.tag))el.textContent=String(n.text||'');
      for(const child of n.children||[]){const c=visit(child,depth+1);if(c)el.append(c);}return el;};return visit(tree);
  };
})();
