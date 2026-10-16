// Exact rectangular crops only: no retouching or reconstructed product UI.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const source = '/Users/koi/KoinophobiaLabs/reports/WO-0127/assets';
const crops = [
  ...[1,2,3].map(n => ({slug:'dreamcatcher', n, left:0, top:370, width:1320, height:1500, reason:'Exclude the top strip containing AssistiveTouch; retain the real app content.'})),
  {slug:'old-dog', n:5, left:0, top:0, width:1440, height:752, reason:'End above the Business / Courses planned row.'},
  {slug:'teachers-pet', n:1, left:350, top:120, width:930, height:245, reason:'Subjects heading and first subject title; exclude all content counts.'},
  {slug:'teachers-pet', n:2, left:150, top:50, width:1140, height:445, reason:'Course and adult review note; exclude course and unit counts below.'},
];
const records=[];
for(const {slug,n,reason,...rect} of crops){
 const input=`${source}/${slug}-shot-${n}.png`, output=`public/apps/${slug}/shot-${n}-crop.png`;
 await sharp(input).extract(rect).png().toFile(output);
 records.push({input,output,rect,reason,sourceSHA256:crypto.createHash('sha256').update(await fs.readFile(input)).digest('hex'),outputSHA256:crypto.createHash('sha256').update(await fs.readFile(output)).digest('hex')});
}
await fs.writeFile('Evidence/WO-0128/crops.json',JSON.stringify(records,null,2)+'\n');
