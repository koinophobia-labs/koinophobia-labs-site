import test from 'node:test';
import assert from 'node:assert/strict';
import {plainFinding, sayFinding, slowSeconds, storedProblemFinding, TECHNICAL_WORDS, type DisplayFinding} from '../lib/team/plain-findings';
import {SCRIPTS, renderScript} from '../lib/team/scripts';
import {findingSummary} from '../lib/team/leverage';
import {confirmedEvidence} from './auditor-fixtures';
const slow = {check:'Slow page', measurement:'Three fresh Chromium loads: median LCP 5275 ms; median load 9882 ms. Thresholds: LCP >4000 ms or load >8000 ms. Lab measurements, not field Core Web Vitals.'};
const fixtures: [DisplayFinding, RegExp][] = [
 [slow, /main content takes about 5 seconds/],
 [{...slow,measurement:slow.measurement.replace('5275','5500')}, /about 6 seconds/],
 [{...slow,measurement:slow.measurement.replace('5275 ms','unavailable')}, /about 10 seconds to finish loading/],
 [{check:'Dead contact / booking / order link',label:'Book now'}, /'Book now' button/],
 [{check:'Dead contact / booking / order link'}, /^A link on your site/],
 [{check:'HTTPS failure',key:'CERT_HAS_EXPIRED'}, /security warning/],
 [{check:'HTTPS failure',key:'mixed-content'}, /blocks some images/],
 [{check:'HTTPS failure',key:'https-refused'}, /secure address doesn't work/],
 [{check:'Expiring certificate',measurement:'The currently served TLS certificate expires on 2026-11-20 (within 14 days). Renewal was not predicted.'}, /2026-11-20; if it is not renewed/],
 [{check:'Mobile layout',key:'horizontal-overflow'}, /scroll sideways/],
 [{check:'Mobile layout',key:'overlapping-targets'}, /buttons overlap/],
 [{check:'Mobile layout',key:'tiny-primary-text'}, /text is very small/],
 [{check:'Mobile layout',key:'zoomed-out'}, /shrunk down/],
 [{check:'Mobile contact route'}, /until you scroll down/],
 [{check:'Closed Google Form'}, /no longer accepting responses/],
 [{check:'Unfinished content',measurement:'The primary page heading says the site is coming soon or under construction.'}, /coming soon/],
 [{check:'Unfinished content'}, /unfinished template text/],
 [{check:'Wrong key link'}, /homepage instead of your profile/],
 [{check:'Broken image'}, /image on your page doesn't load/],
 [{check:'Booking widget failure'}, /booking tool.*error/],
 [{check:'Insecure form'}, /haven't submitted it/],
 [{check:'Lighthouse mobile performance'}, /phone speed check/],
];
for (const [finding,expected] of fixtures) test(`plain fixture: ${finding.check} ${finding.key ?? finding.label ?? finding.measurement ?? ''}`,()=>{
 const before=JSON.stringify(finding);assert.match(plainFinding(finding),expected);
 assert.doesNotMatch(plainFinding(finding),TECHNICAL_WORDS);assert.doesNotMatch(sayFinding(finding),TECHNICAL_WORDS);
 assert.equal(JSON.stringify(finding),before);
});
test('unknown check preserves existing honest text, but technical-only fallback never leaks jargon',()=>{
 assert.equal(plainFinding({check:'Future check',measurement:'The menu could not be opened.'}),'The menu could not be opened.');
 for(const word of ['LCP','ms','Chromium','Core Web Vitals','lab']) assert.doesNotMatch(plainFinding({measurement:`Unknown ${word} result`}),TECHNICAL_WORDS);
 assert.doesNotMatch(plainFinding({check:'Dead contact / booking / order link',label:'Chromium lab'}),TECHNICAL_WORDS);
 assert.equal(slowSeconds({...slow,measurement:'median LCP unavailable; median load 9882 ms'}),null);
 assert.equal(slowSeconds({...slow,measurement:'median LCP -5000 ms'}),null);
 assert.doesNotMatch(plainFinding({check:'Expiring certificate',measurement:'No date was recorded.'}),/expires on/);
});
test('legacy stored public measurement and live finding produce the identical line',()=>{
 assert.equal(plainFinding(storedProblemFinding(slow.measurement)),plainFinding(slow));
 const f={...confirmedEvidence(),...slow,check:'Slow page' as const};const summary=findingSummary(f);
 assert.equal(summary.measurement,f.measurement);assert.equal(summary.plain,plainFinding(slow));
});
test('scripts use visible breaks and never promise a video or a text after voicemail',()=>{
 const finding={check:'Dead contact / booking / order link',label:'Book Now',key:'http-404',measured_at:new Date().toISOString()};
 const vm=renderScript(SCRIPTS.find(s=>s.id==='Voicemail')!.body,finding);
 assert.match(vm,/Book Now/);assert.doesNotMatch(vm,/I'll text|video|recording/);
 const call=renderScript(SCRIPTS.find(s=>s.id==='Call')!.body,finding,'Fictional Partner');
 assert.match(call,/Fictional Partner/);assert.match(call,/refunds you/);assert.match(call,/Did it do that for you/);
 assert.doesNotMatch(SCRIPTS.map(s=>s.body).join(' '),/2-minute|two-minute|recording/i);
});
