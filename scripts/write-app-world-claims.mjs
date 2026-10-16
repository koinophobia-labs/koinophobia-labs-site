import fs from 'node:fs/promises';
const base='Evidence/WO-0128';
const capture=process.argv[2] || 'shots/final';
const pages=JSON.parse(await fs.readFile(`${base}/${capture}/visible-copy.json`,'utf8'));
const ocr=JSON.parse(await fs.readFile(`${base}/screenshot-ocr.json`,'utf8'));
const sources={};
for(const name of ['INVENTORY.md','WORLDS.md'])sources[name]=(await fs.readFile(`${base}/sources/${name}`,'utf8')).split('\n');
const norm=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/[^\p{L}\p{N}\s$]/gu,' ').replace(/\s+/g,' ').trim();
const escape=s=>s.replace(/\|/g,'\\|').replace(/\n/g,' ');
const rasterLines={trendi:93,'way-in':166,'forget-about-it':236,'preaching-to-the-choir':300,'old-dog':368,'teachers-pet':435,dreamcatcher:493};
function attribution(text,fallback){
 const needle=norm(text);
 if(needle.length>18) for(const [file,lines] of Object.entries(sources)) {
  const index=lines.findIndex(line=>norm(line).includes(needle));
  if(index>=0)return `[${file}:${index+1}](sources/${file}) — verbatim or punctuation/case normalization`;
 }
 return fallback.replace(/(WORLDS|INVENTORY)\.md:([\d–]+)/g,(_,file,range)=>`[${file}.md:${range}](sources/${file}.md)`)+' — sourced paraphrase or interface label';
}
let md='# WO-0128 visible-copy ledger\n\nThe sources are preserved verbatim in [sources/INVENTORY.md](sources/INVENTORY.md) and [sources/WORLDS.md](sources/WORLDS.md), with their original line numbering. INVENTORY wins conflicts. Prices are USA prices, unchanged from the inventory. Renewal disclosures implement WORLDS line 20.\n\nEach page table enumerates the rendered copy from the production browser, deduplicating repeated sentences. Raster tables transcribe the exact store images displayed on that page; their source line identifies the inventory’s listing asset record. OCR preserves line wraps and may misread punctuation; the PNG is authoritative. Image text is retained listing content, not a new outcome or marketing claim. Crop rectangles and original/output SHA-256 values are in [crops.json](crops.json). Decorative art and marks carry no claims.\n\nShared navigation and accessibility labels (including “Skip to app”, “Support”, “Privacy”, “USA pricing”, and arrows) are interface labels implementing WORLDS lines 14–20. Other-app names/icons are INVENTORY summary lines 20–26. The factual receipt comes from INVENTORY lines 524 and 528.\n\n';
for(const [slug,items] of Object.entries(pages)) {
 md+=`## /${slug}\n\n### Page copy\n\n| Visible sentence / label | Source |\n| --- | --- |\n`;
 for(const item of items){if(item.source==='UNSOURCED')throw Error(`${slug}: ${item.text}`);md+=`| ${escape(item.text)} | ${attribution(item.text,item.source)} |\n`;}
 if(slug==='forget-about-it')for(const t of ['Today','A thought','Earlier','Still open','The price','Later'])md+=`| ${t} (margin label) | [WORLDS.md:64–85](sources/WORLDS.md) — diary-entry navigation |\n`;
 md+='\n### Text in the displayed listing screenshots\n\n';
 for(const record of ocr.filter(r=>r.path.includes(`/apps/${slug}/`))) {
  md+=`#### ${record.path.split('/').pop()}\n\n| Visible screenshot text | Asset provenance |\n| --- | --- |\n`;
  for(const line of record.lines) md+=`| ${escape(line)} | [INVENTORY.md:${slug==='dreamcatcher'?492+Number(record.path.match(/shot-(\d)/)[1]):rasterLines[slug]}](sources/INVENTORY.md) — ${record.path.split('/').pop()}${record.path.includes('crop')?'; exact rectangular crop, WORLDS defects 2–4':''} |\n`;
  md+='\n';
 }
}
md+='## Additional verification\n\nDreamcatcher “Morning review” is visible in the original listing shot 1 (INVENTORY lines 492–496) and in `App/Journal/JournalViews.swift:67–71`, which routes to `MorningReviewQueue(model:)`. This source was read without modification. No stronger claim about morning marks, privacy, speech processing, Face ID, sleep, or dream interpretation is made. The four Toolkit tool names are transcribed verbatim from inventory shot 4; that image is not displayed because of its accessibility overlay.\n\nTeacher’s Pet omits curriculum totals, including those embedded in listing shots 1 and 2. The remaining numbers in lesson screenshots are lesson steps or mathematical examples, not claims about curriculum completeness. Old Dog subject names and “2 units · 4 objectives” are INVENTORY lines 348–351 and WORLDS line 125.\n';
await fs.writeFile(`${base}/CLAIMS.md`,md);
console.log(Object.entries(pages).map(([s,i])=>`${s}: ${i.length} rendered copy blocks`).join('\n'));
