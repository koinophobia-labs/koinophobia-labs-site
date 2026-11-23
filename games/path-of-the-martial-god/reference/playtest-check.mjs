/**
 * Playtest harness: checks the first-run text reveals nothing, the questionnaire
 * appears, telemetry records, and the event log stays hidden until a fight ends.
 *   node playtest-check.mjs            (serve.mjs running)
 *   URL=http://localhost:5179/ node playtest-check.mjs   (against dist/)
 */
import { chromium } from 'playwright';
const OUT = new URL('./shots/', import.meta.url).pathname;
const TARGET = process.env.URL ?? 'http://localhost:5173/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()); });
pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await pg.goto(TARGET, { waitUntil: 'networkidle' });

// What does a first-time player actually see?
const firstRun = await pg.evaluate(() => document.getElementById('overlay').innerText);
console.log('--- FIRST RUN TEXT ---\n' + firstRun + '\n----------------------');
await pg.screenshot({ path: `${OUT}/pt-0-title.png` });

await pg.click('#start');
await pg.waitForTimeout(400);
const tap = async (c, ms=70) => { await pg.keyboard.down(c); await pg.waitForTimeout(ms); await pg.keyboard.up(c); };
const hold = async (c, ms) => { await pg.keyboard.down(c); await pg.waitForTimeout(ms); await pg.keyboard.up(c); };
for (let i=0;i<70;i++){
  await hold('KeyW', 120);
  await tap('KeyK', 110); await pg.waitForTimeout(150);
  if (i%4===3) await hold('KeyD', 240);
  if (i%7===6) await hold('ShiftLeft', 260);
  if (await pg.evaluate(() => !!document.querySelector('.survey'))) break;
}
await pg.waitForTimeout(2600);
const hasSurvey = await pg.evaluate(() => !!document.querySelector('.survey'));
console.log('survey appeared:', hasSurvey);
await pg.screenshot({ path: `${OUT}/pt-1-survey.png`, fullPage: false });

if (hasSurvey) {
  await pg.fill('#q-strategy', 'walked him down and threw heavy things');
  await pg.click('#control-0');
  await pg.click('#danger-1');
  await pg.click('[data-skip]');
  await pg.waitForTimeout(500);
}
const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('pomg.m1.playtest') ?? '[]'));
console.log('records stored:', saved.length);
if (saved.length) {
  const m = saved[0].metrics;
  console.log('metrics sample:', JSON.stringify({
    duration_s: m.duration_s, winner: m.winner, terminal: m.terminal,
    attempted: m.techniques_attempted, landed: m.techniques_landed,
    guarded: m.attacks_guarded, breaks: m.structure_breaks_caused,
    inch: m.final_inch_openings, bypass_angle: m.guard_bypassed_by_angle,
    bands: m.distance_band_seconds, staggered: m.seconds_staggered,
  }, null, 0));
}
// debug toggle + event log after fight
await pg.keyboard.press('KeyR'); await pg.waitForTimeout(300);
await pg.keyboard.press('Backquote'); await pg.waitForTimeout(300);
const dbgOnDuringFight = await pg.evaluate(() => !!document.querySelector('.dbg-log'));
console.log('event log hidden mid-fight (expected true=hidden):', !dbgOnDuringFight);
console.log('ERRORS:', errs.length ? errs.slice(0,5) : 'none');
await b.close();
