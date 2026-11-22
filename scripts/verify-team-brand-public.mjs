import {chromium} from 'playwright';
import {load} from 'cheerio';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.BRAND_VERIFY_URL || 'https://koinophobialabs.com';
const output=process.env.BRAND_VERIFY_OUTPUT;if(!output)throw Error('A fresh evidence output directory is required');
mkdirSync(output,{recursive:true});
const results=[];
for(const path of ['/','/shipped','/team','/team/account','/team/commissions','/pay/fix','/pay/tune-up','/pay/care','/pay/success','/pay/cancel']){
 console.log('GET '+path);
 const r=await fetch(base+path,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,path);
 const html=await r.text(),$=load(html);
 if(path.startsWith('/team')){
  assert.equal(new URL(r.url).pathname,'/team');
  assert.equal($('input[type=password]').length,1);
  assert.match(r.headers.get('x-robots-tag')||'',/noindex/);
  assert.match($('meta[name=robots]').attr('content')||'',/noindex/);
 }
 const icons=$('.pcard__icon').map((_,e)=>({src:$(e).attr('src'),alt:$(e).attr('alt')})).get();
 if(path==='/')assert.ok(icons.length>=3,'Shipped icons present');
 results.push({path,status:r.status,finalPath:new URL(r.url).pathname,heading:$('h1').first().text(),icons});
}
const assets=[...new Set(['/brand/koi-emblem.svg','/brand/koinophobia-lockup.svg',...results.flatMap(r=>r.icons.map(i=>i.src))])];
const hashes=[];
for(const path of assets){console.log('GET '+path);
 const r=await fetch(base+path,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);const bytes=Buffer.from(await r.arrayBuffer());hashes.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});}
if(process.env.BRAND_VERIFY_BEFORE){const old=JSON.parse(readFileSync(process.env.BRAND_VERIFY_BEFORE));assert.deepEqual(hashes,old.hashes,'Brand and shipped logo assets unchanged');}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().method()==='GET'?route.continue():route.abort());
  for(const path of ['/','/team','/pay/fix','/pay/tune-up','/pay/care']){
   console.log('Browser '+width+' '+path);
   await page.goto(base+path);await page.evaluate(()=>document.fonts.ready);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' overflow');
   if(path==='/'){
    await page.locator('.pcard__icon').first().scrollIntoViewIfNeeded();
    const logos=await page.locator('.pcard__icon').evaluateAll(async es=>{await Promise.all(es.map(e=>{e.loading='eager';return e.decode()}));return es.map(e=>({alt:e.alt,loaded:e.naturalWidth>0}));});
    assert.ok(logos.every(l=>l.loaded));
    await page.screenshot({path:output+`/shipped-${width}.png`,fullPage:true});
   }else await page.screenshot({path:output+`/${path.replaceAll('/','-').slice(1)}-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close()}
writeFileSync(output+'/verification.json',JSON.stringify({base,at:new Date().toISOString(),results,hashes,productionLogins:0,productionPostRequests:0},null,2)+'\n');
console.log(JSON.stringify({paths:results.length,assets:hashes.length,viewportChecks:10,postRequests:0,passed:true}));
