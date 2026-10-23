/**
 * Playable verification pass. Drives the real prototype in a real browser.
 *   node games/path-of-the-martial-god/verify.mjs   (with serve.mjs already running)
 */
import { chromium } from 'playwright';
const OUT = new URL('./shots/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()); });
pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await pg.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
await pg.screenshot({ path: `${OUT}/shot-0-title.png` });
await pg.click('#start');
await pg.waitForTimeout(500);

const tap = async (c, ms=70) => { await pg.keyboard.down(c); await pg.waitForTimeout(ms); await pg.keyboard.up(c); };
const hold = async (c, ms) => { await pg.keyboard.down(c); await pg.waitForTimeout(ms); await pg.keyboard.up(c); };

// mid range, squared off
await hold('KeyW', 240);
await pg.waitForTimeout(200);
await pg.screenshot({ path: `${OUT}/shot-1-midrange.png` });

// catch an attack mid-extension
await pg.keyboard.down('KeyK'); await pg.waitForTimeout(230);
await pg.screenshot({ path: `${OUT}/shot-2-commit.png` });
await pg.keyboard.up('KeyK');
await pg.waitForTimeout(260);
await pg.screenshot({ path: `${OUT}/shot-3-recovery.png` });

// circle to the flank and commit into the side he is not guarding
await pg.keyboard.down('KeyD'); await pg.waitForTimeout(850); await pg.keyboard.up('KeyD');
await pg.screenshot({ path: `${OUT}/shot-4-angle.png` });

for (let i=0;i<60;i++){
  await hold('KeyW', 130);
  await tap('KeyK', 120); await pg.waitForTimeout(170);
  if (i%5===4) { await hold('KeyD', 220); }
  if (await pg.evaluate(() => document.getElementById('outcome').classList.contains('shown'))) break;
}
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${OUT}/shot-5-end.png` });
const outcome = await pg.evaluate(() => document.getElementById('outcome').innerText);
await pg.keyboard.press('Backquote'); await pg.waitForTimeout(350);
await pg.screenshot({ path: `${OUT}/shot-6-debug.png` });
console.log('OUTCOME:', JSON.stringify(outcome));
console.log('ERRORS:', errs.length ? errs.slice(0,5) : 'none');
await b.close();
