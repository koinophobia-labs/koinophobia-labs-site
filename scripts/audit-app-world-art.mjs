import sharp from 'sharp';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
function lum(c) {c=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function ratio(a,b) {const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function hex(h) {return h.match(/\w\w/g).map(x=>parseInt(x,16));}
const checks=[];
for(const [slug,file,ground,alpha,colors] of [
 ['trendi','trendi-greenroom.png','151017',.75,['F7F2EC','CD9CB6']],
 ['preaching-to-the-choir','ptc-loft.png','F4F0E7',.82,['171B25','6B131B']],
 ['dreamcatcher','dreamcatcher-3am.png','0B0E1F',.82,['F1E6D7','E7B76A']],
]) {
 const {data,info}=await sharp(`public/apps/${slug}/${file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const base=hex(ground);
 for(const color of colors) {
  let min=100;
  for(let i=0;i<data.length;i+=info.channels) min=Math.min(min,ratio(hex(color),base.map((x,j)=>x*alpha+data[i+j]*(1-alpha))));
  checks.push({slug,foreground:'#'+color,scrim:alpha,minRatio:+min.toFixed(2),minimum:4.5,pass:min>=4.5});
 }
}
for(const c of ['D95BA2','D6C5D9']) {const r=ratio(hex('151017'),hex(c));checks.push({kind:'Trendi CTA gradient endpoint',background:'#'+c,foreground:'#151017',ratio:r,minimum:4.5,pass:r>=4.5});}
const a=hex('151017'),b=hex('F7F2EC');const r=ratio(a.map((v,i)=>v*.55+b[i]*.45),a);
checks.push({kind:'Trendi inactive large heading',opacity:.45,ratio:r,minimum:3,pass:r>=3});
await fs.writeFile('Evidence/WO-0128/contrast-art-final.json',JSON.stringify(checks,null,2)+'\n');
assert.ok(checks.every(c=>c.pass));
console.log(`${checks.length} image / gradient / motion contrast checks passed.`);
