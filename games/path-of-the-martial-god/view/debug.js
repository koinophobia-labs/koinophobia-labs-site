/**
 * Debug instrumentation.
 *
 * Permitted during development, REQUIRED to be removable: the milestone's exit
 * condition is that the fight reads with this off. It is off by default and nothing
 * in view/ or sim/ depends on it. Deleting this file would cost one import in main.js.
 */
import { QUADRANTS, bandFor } from '../sim/constants.js';
import { phaseOf } from '../sim/formMachine.js';
import { technique, frames } from '../sim/techniques.js';
import { distance, vitalityFraction } from '../sim/fighter.js';

const MONO = '11px ui-monospace, SFMono-Regular, Menlo, monospace';

export function drawDebug(ctx, fight, w, h, telemetry) {
  ctx.save();
  ctx.font = MONO;
  ctx.textBaseline = 'top';

  panel(ctx, 10, 10, 250, 168, () => {
    let y = 16;
    const line = (s, c = '#cfd4d0') => { ctx.fillStyle = c; ctx.fillText(s, 20, y); y += 14; };
    line(`tick ${fight.tick}   d=${distance(fight.a, fight.b).toFixed(2)}m  ${bandFor(distance(fight.a, fight.b))}`, '#8a9298');
    for (const f of [fight.a, fight.b]) {
      const ph = phaseOf(f);
      const t = f.form.techniqueId ? technique(f.form.techniqueId) : null;
      const fr = t ? frames(t) : null;
      line(`${f.id}`, f.id === 'player' ? '#d8dbd4' : '#9aa3a8');
      line(`  ${f.state}${ph ? '/' + ph : ''} ${t ? t.name : ''}${fr ? ` [${f.form.tick}/${fr.startup}+${fr.active}+${fr.recovery}]` : ''}`, '#8a9298');
      line(`  ${QUADRANTS.map((q) => `${q[0]}${q.includes('S') ? q[4] : ''}:${f.structure[q].toFixed(0)}${f.structure.collapse[q] > 0 ? '!' : ''}`).join(' ')}`, '#a8b0a8');
      line(`  breath ${f.breath.toFixed(0)}  will ${f.will.toFixed(0)}  vit ${(vitalityFraction(f) * 100).toFixed(0)}%  line ${f.line.toFixed(2)}`, '#8a9298');
    }
  });

  // The AI's full scoring breakdown — "deliberately small and inspectable".
  const scores = fight.brain.lastScores ?? [];
  if (scores.length) {
    panel(ctx, w - 322, 10, 312, 22 + scores.length * 26, () => {
      let y = 16;
      ctx.fillStyle = '#8a9298';
      ctx.fillText('opponent decision', w - 312, y); y += 16;
      for (const s of scores) {
        ctx.fillStyle = s === scores[0] ? '#d8dbd4' : '#79828a';
        ctx.fillText(`${s.id.padEnd(14)} ${s.score >= 0 ? ' ' : ''}${s.score.toFixed(2)}`, w - 312, y);
        y += 12;
        const terms = Object.entries(s.terms).filter(([, v]) => Math.abs(v) > 0.001)
          .map(([k, v]) => `${k}:${v > 0 ? '+' : ''}${v.toFixed(1)}`).join(' ');
        ctx.fillStyle = '#5d666d';
        ctx.fillText(`   ${terms}`, w - 312, y);
        y += 14;
      }
    });
  }

  // Live playtest tally. Debug-only: these never appear as gameplay meters.
  if (telemetry) {
    const t = telemetry;
    panel(ctx, 10, 188, 250, 92, () => {
      let y = 194;
      const line = (s2, c = '#8a9298') => { ctx.fillStyle = c; ctx.fillText(s2, 20, y); y += 13; };
      line('playtest tally            you / him', '#8a7a4e');
      line(`thrown      ${String(t.attempted.player).padStart(3)} / ${t.attempted.opponent}`);
      line(`landed      ${String(t.landed.player).padStart(3)} / ${t.landed.opponent}`);
      line(`breaks      ${String(t.breaksCaused.player).padStart(3)} / ${t.breaksCaused.opponent}`);
      line(`bypass/angle${String(t.guardBypassByAngle.player).padStart(3)} / ${t.guardBypassByAngle.opponent}`);
      line(`staggered s ${(t.staggeredTicks.player / 60).toFixed(1).padStart(4)} / ${(t.staggeredTicks.opponent / 60).toFixed(1)}`);
    });
  }

  if (fight.inch) {
    panel(ctx, 10, h - 56, 300, 46, () => {
      ctx.fillStyle = '#c1272d';
      ctx.fillText(`FINAL INCH  ${fight.inch.ticksLeft}/${fight.inch.total} ticks`, 20, h - 50);
      ctx.fillStyle = '#8a9298';
      ctx.fillText(`actor=${fight.inch.actorId}  terminals=${fight.inch.terminals.map((t) => t.id).join(',')}`, 20, h - 36);
    });
  }
  ctx.restore();
}

function panel(ctx, x, y, w, h, body) {
  ctx.fillStyle = 'rgba(10,13,15,0.78)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(120,130,136,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  body();
}


/* ---------------------------------------------------------------------------
 * The complete event log, available through debug mode after a fight.
 * DOM rather than canvas so it can be scrolled, selected and copied. Created on
 * demand and removed with the overlay; nothing else depends on it.
 * ------------------------------------------------------------------------- */
let logEl = null;

export function showEventLog(telemetry) {
  if (logEl || !telemetry) return;
  logEl = document.createElement('div');
  logEl.className = 'dbg-log';
  const rows = telemetry.log.map((e) => {
    const { type, tick, ...rest } = e;
    const detail = Object.entries(rest)
      .map(([k, v]) => `${k}=${typeof v === 'number' ? Number(v.toFixed?.(2) ?? v) : v}`)
      .join(' ');
    return `<tr><td>${String(tick).padStart(5)}</td><td class="t-${type}">${type}</td><td>${detail}</td></tr>`;
  }).join('');
  logEl.innerHTML = `
    <div class="dbg-head">
      <b>event log</b> · ${telemetry.log.length} events · ${telemetry.duration.toFixed(1)}s
      <button type="button" data-copy>copy JSON</button>
    </div>
    <div class="dbg-scroll"><table>${rows}</table></div>`;
  document.body.appendChild(logEl);
  logEl.querySelector('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(telemetry.log, null, 1)); } catch { /* ignore */ }
  });
}

export function hideEventLog() {
  if (logEl) { logEl.remove(); logEl = null; }
}
