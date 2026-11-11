/** Local preparation only: cache authentic Google fonts without editing product sources.
 * node scripts/wo0272-font-cache.mjs prepare
 * node scripts/wo0272-font-cache.mjs verify
 * node scripts/wo0272-font-cache.mjs serve  (leave running during a later build)
 * Turbopack: NEXT_FONT_GOOGLE_MOCKED_RESPONSES=<cache>/turbopack.cjs npm run build
 * Webpack: NEXT_FONT_GOOGLE_MOCKED_RESPONSES=<cache>/webpack.cjs npx next build --webpack
 * Neither build command is executed by this script. Cache files retain original CSS,
 * upstream URLs, byte lengths and SHA-256. Only src URLs change in the derived CSS.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import ts from 'typescript';
const require=createRequire(import.meta.url),run=promisify(execFile);
const cache='/Volumes/KoiArchive/WO-0272/tmp/font-cache';
const cap=25_000_000,port=32721,origin=`http://127.0.0.1:${port}`;
const sha=b=>createHash('sha256').update(b).digest('hex');
const ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
const base='next/dist/compiled/@next/font/dist/google/';
const {validateGoogleFontFunctionCall:validate}=require(base+'validate-google-font-function-call.js');
const {getFontAxes}=require(base+'get-font-axes.js');
const {getGoogleFontsUrl}=require(base+'get-google-fonts-url.js');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function size(){return fs.existsSync(cache)?walk(cache).reduce((n,f)=>n+fs.statSync(f).size,0):0;}
function save(name,content){const target=path.join(cache,name),bytes=Buffer.byteLength(content),old=fs.existsSync(target)?fs.statSync(target).size:0;assert.ok(size()-old+bytes<=cap,'25 MB cache limit exceeded');fs.writeFileSync(target,content);}
function literal(n){if(ts.isStringLiteral(n))return n.text;if(ts.isArrayLiteralExpression(n))return n.elements.map(literal);if(ts.isObjectLiteralExpression(n))return Object.fromEntries(n.properties.map(p=>{assert.ok(ts.isPropertyAssignment(p));return [p.name.text,literal(p.initializer)];}));if(n.kind===ts.SyntaxKind.TrueKeyword)return true;if(n.kind===ts.SyntaxKind.FalseKeyword)return false;throw Error('Unsupported font argument; inspect source rather than guessing');}
function fontRequests(){
  const result=new Map();
  for(const file of walk('app').filter(f=>/\.[jt]sx?$/.test(f))){
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),names=new Map();
    for(const stmt of source.statements)if(ts.isImportDeclaration(stmt)&&stmt.moduleSpecifier.text==='next/font/google')for(const e of stmt.importClause.namedBindings.elements)names.set(e.name.text,e.propertyName?.text??e.name.text);
    function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&names.has(n.expression.text)){
      assert.equal(n.arguments.length,1);const v=validate(names.get(n.expression.text),literal(n.arguments[0]));
      const url=getGoogleFontsUrl(v.fontFamily,getFontAxes(v.fontFamily,v.weights,v.styles,v.selectedVariableAxes),v.display);
      result.set(url,{family:v.fontFamily,url,source:file});
    }ts.forEachChild(n,visit);}visit(source);
  }assert.ok(result.size>0);return [...result.values()];
}
async function download(url,limit){
  const u=new URL(url);assert.equal(u.protocol,'https:');assert.ok(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname));
  // No redirects: unexpected hosts or HTML must fail instead of entering the cache.
  const r=await run('curl',['--fail','--silent','--show-error','--retry','2','--connect-timeout','10','--max-time','40','--max-filesize',String(limit),'--user-agent',ua,url],{encoding:'buffer',maxBuffer:limit});return r.stdout;
}
async function prepare(){
  fs.mkdirSync(cache,{recursive:true});const free=fs.statfsSync(cache);assert.ok(free.bavail*free.bsize-cap>10_000_000_000,'Archive headroom reserve');
  const manifest={version:1,next:require('next/package.json').version,created_at:new Date().toISOString(),userAgent:ua,stylesheets:[],assets:[]};
  const assets=new Map(),turbo={},webpack={};
  for(const request of fontRequests()){
    const cssBytes=await download(request.url,300_000),css=cssBytes.toString('utf8');assert.ok(css.includes('@font-face')&&css.includes(`font-family: '${request.family}'`));
    const cssFile=sha(request.url)+'.original.css';save(cssFile,cssBytes);const urls=[...new Set([...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/g)].map(m=>m[1]))];assert.ok(urls.length>0,'Expected WOFF2 sources');
    assert.equal([...css.matchAll(/src:\s*url\(/g)].length,[...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/g)].length,'Unsupported CSS source format');
    let local=css,disk=css;
    for(const url of urls){
      if(!assets.has(url)){
        const bytes=await download(url,1_500_000);assert.equal(bytes.subarray(0,4).toString(),'wOF2','Authentic WOFF2 magic required');assert.equal(bytes.readUInt32BE(8),bytes.length,'WOFF2 length mismatch');
        const hash=sha(bytes),file=hash+'.woff2';save(file,bytes);const asset={url,file,sha256:hash,bytes:bytes.length};assets.set(url,asset);manifest.assets.push(asset);
      }
      const asset=assets.get(url);local=local.replaceAll(url,origin+'/'+asset.file);disk=disk.replaceAll(url,path.join(cache,asset.file));
    }
    turbo[request.url]=local;webpack[request.url]=disk;manifest.stylesheets.push({...request,file:cssFile,sha256:sha(cssBytes),assets:urls.map(u=>assets.get(u).file)});
    console.log(`Cached ${request.family}`);
  }
  save('turbopack.cjs','module.exports = '+JSON.stringify(turbo,null,2)+';\n');save('webpack.cjs','module.exports = '+JSON.stringify(webpack,null,2)+';\n');save('manifest.json',JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({cache,stylesheets:manifest.stylesheets.length,assets:manifest.assets.length,bytes:size(),buildExecuted:false}));
}
function checkedManifest(){const m=JSON.parse(fs.readFileSync(path.join(cache,'manifest.json'),'utf8'));for(const a of m.assets){assert.match(a.file,/^[a-f0-9]{64}\.woff2$/);const bytes=fs.readFileSync(path.join(cache,a.file));assert.equal(sha(bytes),a.sha256);assert.equal(bytes.length,a.bytes);}assert.ok(size()<=cap);return m;}
async function server(){
  const m=checkedManifest(),allowed=new Set(m.assets.map(a=>'/'+a.file));
  const s=createServer((req,res)=>{
    if(req.method!=='GET'||!allowed.has(req.url)){res.writeHead(404);res.end();return;}
    const bytes=fs.readFileSync(path.join(cache,req.url.slice(1)));res.writeHead(200,{'Content-Type':'font/woff2','Content-Length':bytes.length,'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=31536000, immutable'});res.end(bytes);
  });await new Promise((yes,no)=>{s.once('error',no);s.listen(port,'127.0.0.1',yes);});return {s,m};
}
async function verify(){
  const {s,m}=await server();let browser;
  try{
    const {chromium}=await import('playwright');process.env.TMPDIR='/Volumes/KoiArchive/WO-0272/tmp';
    browser=await chromium.launch({headless:true,executablePath:process.env.WO0272_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
    const page=await browser.newPage({viewport:{width:1000,height:1000}});await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    const decoded=await page.evaluate(async({assets,origin})=>{let count=0;for(const a of assets){const font=new FontFace('verify'+count,`url(${origin}/${a.file})`);await font.load();if(font.status!=='loaded')throw Error('Font decode failed');count++;}return count;},{assets:m.assets,origin});
    const css=Object.values(require(path.join(cache,'turbopack.cjs'))).join('\n');const families=[...new Set(m.stylesheets.map(x=>x.family))];
    await page.setContent('<style>'+css+'</style><h1>WO-0272 authentic cached font verification</h1>'+families.map(f=>`<p style="font:24px '${f}'">${f}: Booking 0123456789 — Aa Bb Cc</p>`).join(''));
    await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(cache,'render-verification.png'),fullPage:true});
    save('verification.json',JSON.stringify({decodedWoff2:decoded,renderedFamilies:families,verifiedAt:new Date().toISOString(),buildExecuted:false},null,2));assert.ok(size()<=cap);
    console.log(JSON.stringify({decodedWoff2:decoded,families:families.length,bytes:size(),buildExecuted:false}));
  }finally{await browser?.close();await new Promise(r=>s.close(r));}
}
const mode=process.argv[2];
if(mode==='prepare')await prepare();else if(mode==='verify')await verify();else if(mode==='serve'){await server();console.log('Authentic local font cache listening at '+origin);}else throw Error('Use prepare, verify, or serve');
