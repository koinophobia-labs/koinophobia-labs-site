import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const slugs=['trendi','forget-about-it','way-in','preaching-to-the-choir','old-dog','teachers-pet','dreamcatcher'];
const folder=process.argv[2] || 'shots';
const output=path.resolve('Evidence/WO-0128',folder);
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
process.on('SIGTERM', async()=>{await browser.close();process.exit(0);});
const results=[];
const claims={};
try {
for(const width of [1440,390]) for(const reducedMotion of ['no-preference','reduce']) {
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},deviceScaleFactor:1,reducedMotion});
 for(const slug of slugs) {
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`http://127.0.0.1:3128/${slug}`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete),{},{timeout:30000});
  // Trigger all lazy images and entry states before taking a full page record.
  const height=await page.locator('body').evaluate(e=>e.scrollHeight);
  for(let y=0;y<height;y+=700) {await page.evaluate(y=>window.scrollTo(0,y),y); await page.waitForTimeout(70);}
  await page.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    h1:document.querySelector('h1')?.textContent,
    clippedHeadings:[...document.querySelectorAll('h1,h2,h3,.world-action')].filter(e=>{const r=e.getBoundingClientRect();return !e.closest('.swipe')&&(r.left < -1 || r.right > innerWidth+1)}).map(e=>e.textContent),
    brokenImages:[...document.images].filter(i=>i.getClientRects().length && !i.naturalWidth).map(i=>i.src),
    images:[...document.querySelectorAll('.world-shot img')].map(i=>({src:i.getAttribute('src'),alt:i.alt})),
    status:[...document.querySelectorAll('.app-home__coming')].map(e=>({tag:e.tagName,insideLink:!!e.closest('a,button'),background:getComputedStyle(e).backgroundColor,borderRadius:getComputedStyle(e).borderRadius})),
    animations:document.getAnimations().map(a=>({state:a.playState,timeline:a.timeline?.constructor.name})),
    nav:[...document.querySelectorAll('.world-studio-bar nav a')].map(a=>a.textContent),
    otherIcons:document.querySelectorAll('.app-home__other img').length,
    heroFamily:getComputedStyle(document.querySelector('h1')).fontFamily,
    bodyFamily:getComputedStyle(document.querySelector('.app-home')).fontFamily,
    fontResources:performance.getEntriesByType('resource').filter(e=>/\.woff/.test(e.name)).length,
    video:[...document.querySelectorAll('video')].map(v=>({paused:v.paused,hidden:v.hidden})),
  }));
  assert.equal(response.status(),200,slug);
  assert.ok(state.scrollWidth<=width,`${slug} overflow ${state.scrollWidth}/${width}`);
  assert.deepEqual(state.clippedHeadings,[],`${slug} clipped heading or action`);
  assert.deepEqual(state.brokenImages,[],`${slug} broken images`);
  assert.deepEqual(errors,[],`${slug} browser errors`);
  assert.equal(state.otherIcons,6);
  assert.deepEqual(state.nav,['Apps','Blake','Work with me']);
  if(reducedMotion==='reduce') { assert.equal(state.animations.length,0,`${slug} reduced-motion animations`); assert.ok(state.video.every(v=>v.paused)); }
  if(slug==='way-in') assert.equal(state.animations.length,0,'Way In must be still');
  if(width===1440&&reducedMotion==='reduce') claims[slug]=await page.evaluate(()=>{
    const root=document.querySelector('.app-home');const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const items=[];
    while(walker.nextNode()) { const node=walker.currentNode,el=node.parentElement;const text=node.textContent.replace(/\s+/g,' ').trim(); if(!text||!el||el.closest('script,style,[aria-hidden="true"]')||!el.getClientRects().length||getComputedStyle(el).display==='none') continue;
      const block=el.closest('p,h1,h2,h3,figcaption,dt,dd,a,li')||el;
      const sentence=block.innerText.replace(/\s+/g,' ').trim();const source=block.closest('[data-source]')?.getAttribute('data-source')||'UNSOURCED';
      if(!items.some(i=>i.text===sentence))items.push({text:sentence,source});
    }return items;
  });
  const stem=`${slug}-${width}${reducedMotion==='reduce'?'-reduced':''}`;
  await page.screenshot({path:path.join(output,`${stem}.png`),fullPage:true});
  if(reducedMotion==='no-preference') await page.screenshot({path:path.join(output,`${stem}-hero.png`)});
  if(slug==='teachers-pet') {
    await page.locator('.school-stepper a[href="#get-help"]').click();await page.waitForTimeout(200);
    assert.equal(await page.locator('.school-stepper a[href="#get-help"]').getAttribute('aria-current'),'step');
  }
  results.push({slug,width,reducedMotion,status:response.status(),...state,errors});
  console.log(`${stem}: OK`);
  await page.close();
 }
 await context.close();
}
} finally { await browser.close(); }
await fs.writeFile(path.join(output,'browser-qa.json'),JSON.stringify(results,null,2)+'\n');
await fs.writeFile(path.join(output,'visible-copy.json'),JSON.stringify(claims,null,2)+'\n');
