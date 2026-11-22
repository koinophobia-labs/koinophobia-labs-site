import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,openSync,writeFileSync,statfsSync} from 'node:fs';
import {createServer} from 'node:net';
import {Pool} from 'pg';
const root=process.env.WO0285_ROOT || '/Volumes/KoiArchive/WO-0285';
for(const [path,budget]of [[root,1_000_000_000],['/Users/koi',50_000_000]]){const s=statfsSync(path);assert.ok(s.bavail*s.bsize-budget>=10_000_000_000,'Infrastructure blocker: disk reserve at '+path);}
const dir=mkdtempSync(root+'/tmp/browser-db-');
async function port(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const dbport=await port(),webport=await port();let server;
execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
execFileSync('pg_ctl',['-D',dir,'-l',dir+'/postgres.log','-o',`-F -p ${dbport} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
try{
 const db=new Pool({host:'127.0.0.1',port:dbport,database:'postgres'});await db.query('create database wo0285_fixture');await db.end();
 const origin=`http://127.0.0.1:${webport}`,database=`postgresql://127.0.0.1:${dbport}/wo0285_fixture`;
 const env={...process.env,DATABASE_URL:database,VERCEL_ENV:'development',TMPDIR:root+'/tmp',RESEND_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_CONNECT_ENABLED:'false',CHROMIUM_PATH:'/Volumes/KoiArchive/WO-0267/cache/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',WO0285_BASE:origin,WO0285_DATABASE:database};
 const fd=openSync(dir+'/server.log','a');server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(webport)],{env,stdio:['ignore',fd,fd]});
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(origin+'/team')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}assert.ok(ready,'Local server did not start');
 const log=openSync(dir+'/browser.log','a'),child=spawn(process.execPath,['scripts/wo0285-browser.mjs'],{env,stdio:['ignore',log,log]});const code=await new Promise(r=>child.on('exit',r));assert.equal(code,0,'Browser acceptance failed; evidence retained');
 writeFileSync(dir+'/passed.json',JSON.stringify({passed:true,at:new Date().toISOString()}));console.log(JSON.stringify({passed:true,evidence:dir}));
}finally{server?.kill('SIGTERM');execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
