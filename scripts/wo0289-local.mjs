// Isolated fictional release acceptance. No production identity or sends.
import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,openSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:net';
import {join} from 'node:path';
import {Pool} from 'pg';
const root=process.env.WO0289_ROOT || '/Volumes/KoiArchive/WO-0289';
const dir=mkdtempSync(root+'/tmp/evening-browser-');
const evidence=mkdtempSync(root+'/evidence/browser-');
async function port(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const dbport=await port(),webport=await port();
const database=`postgresql://127.0.0.1:${dbport}/wo0274_fixture`,base=`http://127.0.0.1:${webport}`;
execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${dbport} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
const env={...process.env,DATABASE_URL:database,VERCEL_ENV:'development',TMPDIR:root+'/tmp',RESEND_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_CONNECT_ENABLED:'false',WO0274_BASE:base,WO0274_EVIDENCE:evidence,WO0288_BASE:base,WO0288_EVIDENCE:evidence,QA_BASE_URL:base,CHROMIUM_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'};
for(const k of Object.keys(env))if(/CRON_SECRET|DATABASE_URL_UNPOOLED|VERCEL_TOKEN|AUTH_SECRET/.test(k))delete env[k];
delete env.VERCEL;
let server;
async function run(name,args,extra={}){
 const fd=openSync(join(evidence,name+'.log'),'a');const child=spawn(process.execPath,args,{env:{...env,...extra},stdio:['ignore',fd,fd]});
 const code=await new Promise(r=>child.on('exit',r));console.log(JSON.stringify({suite:name,exit:code,evidence}));if(code!==0)throw Error(name+' acceptance failed');
}
try{
 const db=new Pool({host:'127.0.0.1',port:dbport,database:'postgres'});await db.query('create database wo0274_fixture');await db.end();
 await run('seed',['--import','tsx','scripts/seed-team-local.ts'],{NODE_ENV:'test'});
 await run('paid-fixture',['--import','tsx','scripts/wo0274-browser.mjs','seed'],{NODE_ENV:'test'});
 const fd=openSync(join(evidence,'server.log'),'a');server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(webport)],{env,stdio:['ignore',fd,fd]});
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/team')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}if(!ready)throw Error('Local server startup failed');
 await run('fulfillment',['--import','tsx','scripts/wo0274-browser.mjs'],{NODE_ENV:'test'});
 await run('visibility',['--import','tsx','scripts/wo0289-browser.mjs']);
 await run('call-lockout',['scripts/wo0288-browser.mjs']);
 await run('release',['scripts/blake-release-qa.mjs']);
 writeFileSync(join(evidence,'passed.json'),JSON.stringify({at:new Date().toISOString(),passed:['fulfillment','visibility','call-lockout','release'],synthetic:true}));
}finally{server?.kill('SIGTERM');execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
