import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {snapshotResolution} from '../vendor/fulfillment-auditor/dist/browser.js';
test('positive resolution measures rendered content, loaded images and reachable mobile controls',async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',r=>r.abort());
  await page.setContent(`<style>body{margin:20px}a{display:inline-block;padding:16px}p{font-size:16px}</style><main><h1>Fictional bicycle repairs</h1><p>Book a bicycle repair appointment with our fictional workshop. We will make the agreed repair and show you the result.</p><a href="tel:3125550100">Call the workshop</a><a href="https://www.instagram.com/fictional">Instagram</a><img width="80" height="80" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></main>`);
  await page.waitForFunction(()=>document.images[0].complete);
  const good=await page.evaluate(snapshotResolution);
  assert.equal(good.finishedContent,true);assert.equal(good.loadedImages.length,1);assert.equal(good.socialLinks.length,1);assert.equal(good.contactAboveFold,true);assert.equal(good.primaryTargetsComfortable,true);assert.equal(good.primaryTextReadable,true);
  await page.setContent(`<main><h1>Coming soon</h1><p>Lorem ipsum</p><a style="position:absolute;top:1200px" href="tel:3125550100">Call us</a><img width="80" height="80" src="https://example.test/broken.jpg"></main>`);
  await page.waitForFunction(()=>document.images[0].complete);
  const bad=await page.evaluate(snapshotResolution);
  assert.equal(bad.finishedContent,false);assert.deepEqual(bad.loadedImages,[]);assert.deepEqual(bad.socialLinks,[]);assert.equal(bad.contactAboveFold,false);assert.equal(bad.primaryTargetsComfortable,false);assert.equal(bad.primaryTextReadable,false);
 }finally{await browser.close();}
});
