/**
 * The loop. Fixed 60Hz simulation, decoupled from render.
 *
 * Nothing in sim/ knows this file exists. Replacing it with an Unreal presentation
 * layer is the whole of the port (IMPLEMENTATION_LEDGER.md, ruling C-2).
 */
import { TICK_MS, INCH } from '../sim/constants.js';
import { makeFight, step, reset } from '../sim/fight.js';
import { neutralIntent } from '../sim/formMachine.js';
import { makeRenderer } from './render.js';
import { makeAudio } from './audio.js';
import { makeInput, CONTROLS } from './input.js';
import { drawDebug } from './debug.js';

const canvas = document.getElementById('stage');
const renderer = makeRenderer(canvas);
const audio = makeAudio();
const input = makeInput(window);

let fight = makeFight();
let debugOn = false;
let started = false;
let acc = 0;
let last = performance.now();

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

// ---- chrome that is NOT a HUD: it is gone the moment the fight starts ----------
const overlay = document.getElementById('overlay');
const outcomeEl = document.getElementById('outcome');
const controlsEl = document.getElementById('controls');
controlsEl.innerHTML = CONTROLS
  .map(([k, d]) => `<dt>${k}</dt><dd>${d}</dd>`).join('');

function begin() {
  if (started) return;
  started = true;
  overlay.classList.add('gone');
  audio.enable();
  input.clear();
}

function restart() {
  fight = reset(fight, {});
  outcomeEl.classList.remove('shown');
  renderer.fx.hold = 0;
  renderer.cam.push = 0;
  input.clear();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && !started) { begin(); return; }
  if (e.code === 'KeyR') restart();
  if (e.code === 'Backquote' || e.code === 'Tab') { e.preventDefault(); debugOn = !debugOn; }
  if (e.code === 'KeyM') audio.toggle();
});
canvas.addEventListener('pointerdown', begin);

// ---- events -> sound and impact ------------------------------------------------
function consume(events) {
  for (const e of events) {
    switch (e.type) {
      case 'hit':
      case 'guarded':
        renderer.addHit(e, fight);
        audio.impact(e.type, e.force ?? 10, e.region);
        break;
      case 'deflected':
        audio.impact('deflected', 0);
        renderer.cam.shake = 3;
        break;
      case 'whiff': audio.whiff(); break;
      case 'break':
        audio.structureBreak();
        renderer.cam.shake = 12;
        renderer.fx.hold = 140;
        break;
      case 'rise': audio.scuff(1.4); break;
      case 'over':
        showOutcome(e);
        break;
      default: break;
    }
  }
}

function showOutcome(e) {
  const who = e.winnerId === 'player' ? 'You' : 'He';
  const verb = {
    finished: 'finished it', stopped: 'held the finish and did not take it',
    unconscious: 'could not continue', yielded: 'stopped',
  }[e.reason] ?? e.reason;
  outcomeEl.innerHTML = `<b>${who} ${verb}.</b><span>R to fight again</span>`;
  outcomeEl.classList.add('shown');
}

// ---- the loop ------------------------------------------------------------------
function frame(now) {
  const dt = Math.min(64, now - last);
  last = now;

  if (started) {
    // Hitstop. A frame-hold is the most effective impact tool there is (ART §8).
    if (renderer.fx.hold > 0) {
      renderer.fx.hold -= dt;
    } else {
      // The only time dilation in the game is the Final Inch, so when time bends
      // it always means something (ART_DIRECTION.md §8).
      const rate = fight.inch ? INCH.dilation : 1;
      acc += dt * rate;
      let guard = 0;
      while (acc >= TICK_MS && guard++ < 6) {
        acc -= TICK_MS;
        const intent = fight.over ? neutralIntent() : input.sample();
        step(fight, intent, {});
        consume(fight.events);
        if (fight.over) break;
      }
    }
    audio.breath(fight.a, now / 1000);
    audio.breath(fight.b, now / 1000);
  }

  renderer.draw(fight, now / 1000);
  if (debugOn) drawDebug(renderer.ctx, fight, canvas.width, canvas.height);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
