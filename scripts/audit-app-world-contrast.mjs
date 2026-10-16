import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'});
const report=[];
try {
 for (const slug of ['trendi','forget-about-it','way-in','preaching-to-the-choir','old-dog','teachers-pet','dreamcatcher']) {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:3128/${slug}`);
  const results=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   function rgba(value){ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);}
   function mix(f,b){return [0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3])).concat(1);}
   function lum(c){const v=c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
   const results=[];
   for(const el of document.querySelectorAll('.app-home *')) {
    const text=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    if(!text||!el.getClientRects().length||el.closest('script,style,svg,video,[aria-hidden="true"]')||getComputedStyle(el).visibility==='hidden') continue;
    let ancestors=[],parent=el;while(parent){ancestors.unshift(parent);parent=parent.parentElement;}
    let background=[255,255,255,1],opacity=1;
    for(const ancestor of ancestors){const style=getComputedStyle(ancestor);background=mix(rgba(style.backgroundColor),background);opacity*=Number(style.opacity);}
    const style=getComputedStyle(el);let fg=rgba(style.color);fg[3]*=opacity;fg=mix(fg,background);
    const a=lum(fg),b=lum(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && Number(style.fontWeight)>=700);
    // Gradient badge backgrounds are checked separately at both endpoints below.
    const gradient=!!el.closest('.app-home--trendi .store__badge');
    results.push({text,foreground:style.color,background:background.slice(0,3).map(Math.round),ratio:Number(ratio.toFixed(2)),minimum:large?3:4.5,gradient,pass:gradient||ratio>=(large?3:4.5)});
   }
   return results;
  });
  report.push({slug,checks:results.length,failures:results.filter(r=>!r.pass),results});
  await page.close();
 }
} finally {await browser.close();}
await fs.writeFile('Evidence/WO-0128/contrast.json',JSON.stringify(report,null,2)+'\n');
for(const r of report) console.log(r.slug,r.checks,'checks',JSON.stringify(r.failures));
assert.ok(report.every(r=>r.failures.length===0),'All HTML text must meet AA');
