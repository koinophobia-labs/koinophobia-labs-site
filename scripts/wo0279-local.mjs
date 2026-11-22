// Isolated fictional acceptance, with all retained DB/browser evidence on archive.
import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,openSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:net';
import {join} from 'node:path';
import {Pool} from 'pg';
const root='/Volumes/KoiArchive/WO-0279';
const dir=mkdtempSync(root+'/tmp/local-acceptance-');
async function port(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const dbport=await port(),webport=await port();
execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${dbport} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
let server;
try{
 const db=new Pool({host:'127.0.0.1',port:dbport,database:'postgres'});
 await db.query('create database wo0279_fixture');await db.end();
 const origin=`http://127.0.0.1:${webport}`,database=`postgresql://127.0.0.1:${dbport}/wo0279_fixture`;
 const chromium='/Volumes/KoiArchive/WO-0267/cache/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
 const env={...process.env,DATABASE_URL:database,VERCEL_ENV:'development',TMPDIR:root+'/tmp',RESEND_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_CONNECT_ENABLED:'false',PLAYWRIGHT_BROWSERS_PATH:'/Volumes/KoiArchive/WO-0267/cache/ms-playwright',WO0279_CHROME:chromium,CHROMIUM_PATH:chromium,WO0279_BROWSER_BASE_URL:origin,WO0279_BROWSER_DATABASE:database,QA_BASE_URL:origin};
 const fd=openSync(join(dir,'server.log'),'a');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(webport)],{env,stdio:['ignore',fd,fd]});
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(origin+'/team')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}
 if(!ready)throw Error('Local server failed to start');
 for(const [name,args]of [['plain',['scripts/wo0279-browser.mjs']],['release',['scripts/blake-release-qa.mjs']]]){
  const output=openSync(join(dir,name+'.log'),'a');
  const child=spawn(process.execPath,args,{env,stdio:['ignore',output,output]});
  const code=await new Promise(r=>child.on('exit',r));
  console.log(JSON.stringify({suite:name,exit:code,evidence:dir}));if(code!==0)throw Error(name+' acceptance failed');
 }
 writeFileSync(join(dir,'passed.json'),JSON.stringify({at:new Date().toISOString(),passed:['plain','release'],dbport,webport}));
}finally{
 server?.kill('SIGTERM');
 execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});
}
