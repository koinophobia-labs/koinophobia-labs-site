import {chromium} from 'playwright';
import axe from 'axe-core';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const screen of ['login','leads','check','quote','pipeline','commissions','scripts','admin','account']){
   if(screen==='leads'){await page.getByRole('button',{name:'Explore owner view'}).click();await page.waitForURL('**/team/leads');}
   await page.goto('http://127.0.0.1:3266/team'+(screen==='login'?'':'/'+screen));
   await page.evaluate(()=>document.fonts.ready);
   await page.addScriptTag({content:axe.source});
   const a=await page.evaluate(()=>window.axe.run(document.querySelector('.team-root'),{runOnly:{type:'rule',values:['color-contrast']}}));
   results.push({screen,width,violations:a.violations,incomplete:a.incomplete.map(x=>({id:x.id,nodes:x.nodes.map(n=>({target:n.target,reason:n.failureSummary}))}))});
  }
  await page.close();
 }
 writeFileSync('../reports/WO-0265/contrast.json',JSON.stringify(results,null,2)+'\n');
 const bad=results.filter(x=>x.violations.length);
 console.log(JSON.stringify(bad.map(x=>({screen:x.screen,width:x.width,violations:x.violations.map(v=>v.nodes.map(n=>({target:n.target,reason:n.failureSummary})))})),null,2));
 if(bad.length)process.exitCode=1;
}finally{await browser.close()}
