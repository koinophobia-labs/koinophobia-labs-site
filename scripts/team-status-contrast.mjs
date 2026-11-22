import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:3266/team');
 const tokens=await p.evaluate(()=>{
  const el=document.querySelector('.team-root'); const s=getComputedStyle(el);
  return Object.fromEntries(['--bg','--bg2','--panel','--panel2','--dim','--gold','--cyan','--text','--ink','--live','--void'].map(k=>[k,s.getPropertyValue(k).trim()]));
 });
 const rgb=h=>h.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
 const lum=arr=>arr.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
 const mix=(a,c,t)=>a.map((v,i)=>v*(1-t)+c[i]*t);
 const bases=['--bg','--bg2','--panel','--panel2'].map(k=>({name:k,rgb:rgb(tokens[k])}));
 bases.push({name:'cyan panel gradient maximum (8%)',rgb:mix(rgb(tokens['--panel']),rgb(tokens['--cyan']),.08)});
 bases.push({name:'login: conservative overlapping cyan 14% + gold 9% maximum',rgb:mix(mix(rgb(tokens['--bg2']),rgb(tokens['--gold']),.09),rgb(tokens['--cyan']),.14)});
 const checks=[];
 for(const [name,color] of Object.entries({owed:tokens['--gold'],paid:'#9ce5b5',lost:'#ffaaa5',body:tokens['--text'],secondary:tokens['--dim'],accent:tokens['--cyan']}))for(const bg of bases){const a=lum(rgb(color)),c=lum(bg.rgb),ratio=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);checks.push({name,foreground:color,background:bg.name,ratio:Number(ratio.toFixed(2)),pass:ratio>=4.5});}
 for(const [fg,bg] of [['#d4af37','#332d1d'],['#9ce5b5','#243127'],[tokens['--bg'],tokens['--gold']],[tokens['--bg'],tokens['--cyan']],[tokens['--ink'],'#08121a']]){const a=lum(rgb(fg)),c=lum(rgb(bg)),ratio=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);checks.push({name:'notice/tag/button',foreground:fg,background:bg,ratio:Number(ratio.toFixed(2)),pass:ratio>=4.5});}
 writeFileSync('../reports/WO-0265/contrast-matrix.json',JSON.stringify({tokens,checks},null,2)+'\n');
 console.log(JSON.stringify({checks:checks.length,minimum:Math.min(...checks.map(c=>c.ratio)),failures:checks.filter(c=>!c.pass)}));
 if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{await b.close()}
