// Run after next build. Reproduce the deployment's isolated file inventory,
// never allowing the checkout's full node_modules to mask missing runtime assets.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, lstatSync, readlinkSync, symlinkSync, mkdtempSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd();
const trace=resolve('.next/server/app/team/api/[action]/route.js.nft.json');
const files=JSON.parse(readFileSync(trace,'utf8')).files.map(f=>resolve(dirname(trace),f));
for(const required of ['node_modules/playwright-core/browsers.json','node_modules/playwright-core/lib/serverRegistry.js','node_modules/@sparticuz/chromium/bin/chromium.br','node_modules/@koinophobia/site-auditor/dist/index.js'])assert.ok(files.includes(resolve(required)),`Trace omitted ${required}`);
const teamPage=JSON.parse(readFileSync('.next/server/app/team/page.js.nft.json','utf8'));
assert.ok(!teamPage.files.some(f=>f.includes('playwright-core')),'Team landing page unexpectedly loads the browser');
if(process.argv.includes('--inventory-only')){console.log(JSON.stringify({traced_runtime_assets:true,team_page_browser_free:true}));process.exit(0);}
const scratch=process.env.AUDITOR_TRACE_SCRATCH;
assert.ok(scratch,'Set AUDITOR_TRACE_SCRATCH to an archive workspace outside this checkout');
assert.ok(process.env.AUDITOR_TEST_CHROMIUM,'Set AUDITOR_TEST_CHROMIUM to the installed test Chromium executable');
mkdirSync(scratch,{recursive:true});
const dir=mkdtempSync(join(scratch,'traced-runtime-'));
const bytes=files.reduce((n,f)=>n+(lstatSync(f).isFile()?statSync(f).size:0),0);
assert.ok(bytes<500_000_000,'Bounded runtime fixture exceeded 500 MB');
for(const source of files){
 const rel=relative(root,source);assert.ok(!rel.startsWith('..'),`Trace escaped project: ${rel}`);
 const dest=join(dir,rel);mkdirSync(dirname(dest),{recursive:true});
 if(lstatSync(source).isSymbolicLink()){
  const target=resolve(dirname(source),readlinkSync(source));const targetRel=relative(root,target);
  assert.ok(!targetRel.startsWith('..'),'Symlink escaped project');
  symlinkSync(relative(dirname(dest),join(dir,targetRel)),dest);
 }else if(lstatSync(source).isDirectory())mkdirSync(dest,{recursive:true});
 else copyFileSync(source,dest);
}
const moduleOnly=mkdtempSync(join(scratch,'model-only-'));
for(const f of ['package.json','dist/model.js']){const target=join(moduleOnly,'node_modules/@koinophobia/site-auditor',f);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,'node_modules/@koinophobia/site-auditor',f),target);}
const isolatedEnv={...process.env,NODE_PATH:'',NODE_OPTIONS:''};
const model=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`const m=await import('@koinophobia/site-auditor/model');if(typeof m.isConfirmed!=='function')throw Error('Missing validator');console.log(JSON.stringify({version:m.VERSION,model_without_browser:true}));`],{cwd:moduleOnly,env:isolatedEnv,encoding:'utf8'}));
const runtime=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
const shared=await import('@koinophobia/site-auditor');
if(typeof shared.auditSite!=='function')throw Error('Missing checker');
const {chromium}=await import('playwright-core');
const serverless=(await import('@sparticuz/chromium')).default;
if(!Array.isArray(serverless.args))throw Error('Missing serverless runtime');
const browser=await chromium.launch({headless:true,executablePath:process.env.AUDITOR_TEST_CHROMIUM});
try{const page=await browser.newPage({viewport:{width:390,height:844}});await page.setContent('<h1>Fictional traced runtime</h1>');if(await page.locator('h1').innerText()!=='Fictional traced runtime')throw Error('Browser failed');console.log(JSON.stringify({shared_import:true,serverless_import:true,chromium_render:true}));}finally{await browser.close();}
`],{cwd:dir,env:isolatedEnv,encoding:'utf8',timeout:60000}));
const output={time:new Date().toISOString(),...model,...runtime,files:files.length,bytes,fixture:dir,model_fixture:moduleOnly};
mkdirSync('reports/WO-0267',{recursive:true});writeFileSync('reports/WO-0267/traced-runtime-'+Date.now()+'.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
