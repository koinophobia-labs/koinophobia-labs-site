import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const required=['node_modules/playwright-core/browsers.json','node_modules/playwright-core/lib/serverRegistry.js','node_modules/@sparticuz/chromium/bin/chromium.br','node_modules/@koinophobia/site-auditor/dist/index.js'];
for(const route of ['api/jobs/tick','team/api/jobs']){
 const file=resolve(`.next/server/app/${route}/route.js.nft.json`);
 const paths=JSON.parse(readFileSync(file,'utf8')).files.map(f=>resolve(dirname(file),f));
 for(const asset of required)assert.ok(paths.includes(resolve(asset)),`${route} is missing ${asset}`);
}
console.log(JSON.stringify({fulfillment_cron_runtime_assets:true,owner_job_runtime_assets:true}));
