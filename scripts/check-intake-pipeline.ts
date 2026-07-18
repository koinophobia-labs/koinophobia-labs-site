import assert from "node:assert/strict";
import { POST } from "../app/api/intake/route";
import { formatLeadEmailHtml, formatLeadEmailText } from "../lib/acquisition/intake";

const originalFetch=global.fetch;
const originalEnv={...process.env};
const fields={name:"Test Person",businessName:"Test Business",email:"test@example.com",phone:"312-555-0100",websiteOrSocial:"https://example.com",industry:"Services",serviceInterest:"Website Audit",budgetRange:"$500-$1,500",timeline:"This month",biggestProblem:"Needs leads",notes:"Test notes"};
function request(overrides:Record<string,string>={},ip=crypto.randomUUID()) { const form=new FormData(); for(const [k,v] of Object.entries({...fields,...overrides})) form.set(k,v); return new Request("http://localhost/api/intake",{method:"POST",body:form,headers:{"x-forwarded-for":ip}}) as never; }
async function json(response:Response) { return {response,payload:await response.json()}; }
async function run(name:string,fn:()=>Promise<void>|void){try{await fn();console.log(`PASS ${name}`);}catch(e){console.error(`FAIL ${name}`);throw e;}}

async function main() { try {
  Object.assign(process.env,{NODE_ENV:"production",RESEND_API_KEY:"test_key",CONTACT_TO_EMAIL:"koinophobia999@gmail.com"});
  await run("valid submission succeeds after provider acceptance",async()=>{global.fetch=async()=>new Response(JSON.stringify({id:"msg_123"}),{status:200});const {response,payload}=await json(await POST(request()));assert.equal(response.status,200);assert.equal(payload.ok,true);assert.equal(payload.emailSent,true);});
  await run("missing and invalid fields return 422",async()=>{const {response,payload}=await json(await POST(request({name:"",email:"invalid"})));assert.equal(response.status,422);assert.ok(payload.errors.name);assert.ok(payload.errors.email);});
  await run("honeypot is rejected",async()=>{const {response}=await json(await POST(request({companyWebsite:"spam.example"})));assert.equal(response.status,400);});
  await run("rate limit rejects sixth request",async()=>{const ip="203.0.113.42";global.fetch=async()=>new Response(JSON.stringify({id:"msg"}),{status:200});for(let i=0;i<5;i++) assert.equal((await POST(request({},ip))).status,200);assert.equal((await POST(request({},ip))).status,429);});
  await run("provider failure is non-2xx and never fake success",async()=>{global.fetch=async()=>new Response("rejected",{status:503});const {response,payload}=await json(await POST(request()));assert.equal(response.status,503);assert.equal(payload.ok,false);assert.ok(payload.requestId);});
  await run("all lead fields are included in text and HTML",()=>{const input={...fields,source:"website intake"};for(const output of [formatLeadEmailText(input),formatLeadEmailHtml(input)]) for(const value of Object.values(input)) assert.ok(output.includes(value),`missing ${value}`);});
} finally { global.fetch=originalFetch; process.env=originalEnv; } }

main().catch(()=>{ process.exitCode=1; });
