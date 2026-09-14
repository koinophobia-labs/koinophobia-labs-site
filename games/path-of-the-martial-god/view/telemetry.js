/**
 * Playtest instrumentation.
 *
 * READ-ONLY. It observes the event stream and the fight state and never writes to
 * either, so it cannot alter combat behaviour. Nothing it records is displayed as a
 * gameplay meter — the whole point of the milestone is that the fight is legible
 * without one. The numbers exist for the post-fight review and the debug overlay.
 */
import { bandFor } from '../sim/constants.js';
import { distance } from '../sim/fighter.js';
import { technique } from '../sim/techniques.js';

const SIDES = ['player', 'opponent'];
const other = (id) => (id === 'player' ? 'opponent' : 'player');

function perSide(make) {
  return { player: make(), opponent: make() };
}

export function makeTelemetry() {
  return {
    ticks: 0,
    duration: 0,
    winner: null,
    reason: null,
    terminal: null,
    terminalClean: null,
    bands: { contact: 0, mid: 0, long: 0, outside: 0 },
    staggeredTicks: perSide(() => 0),
    downTicks: perSide(() => 0),
    guardTicks: perSide(() => 0),
    attempted: perSide(() => 0),           // offensive techniques begun
    attemptedByName: perSide(() => ({})),
    landed: perSide(() => 0),              // clean hits landed BY this side
    guardedAgainst: perSide(() => 0),      // this side's attacks that met a guard
    whiffs: perSide(() => 0),
    feints: perSide(() => 0),
    deflects: perSide(() => 0),            // successful deflects BY this side
    deflectFails: perSide(() => 0),
    slipsAttempted: perSide(() => 0),
    slipsWorked: perSide(() => 0),
    breaksCaused: perSide(() => 0),
    inchOpenings: perSide(() => 0),        // inches where this side was the actor
    guardBypassByAngle: perSide(() => 0),  // caused BY this side, via position
    guardBypassByLeg: perSide(() => 0),    // caused BY this side, via a leg strike
    lateGuards: perSide(() => 0),
    breathOuts: perSide(() => 0),
    actionsWhileSpent: perSide(() => 0),   // techniques begun on an empty tank
    interrupts: perSide(() => 0),
    /** @type {any[]} the complete event log, surfaced through debug after the fight */
    log: [],
  };
}

/** Call once per simulation tick, after step(). */
export function sample(t, fight) {
  t.ticks++;
  t.duration = t.ticks / 60;
  t.bands[bandFor(distance(fight.a, fight.b))]++;
  for (const f of [fight.a, fight.b]) {
    if (f.state === 'staggered') t.staggeredTicks[f.id]++;
    else if (f.state === 'down') t.downTicks[f.id]++;
    else if (f.state === 'guard') t.guardTicks[f.id]++;
  }
}

/** Call once per tick with that tick's events. */
export function consume(t, events, fight) {
  for (const e of events) t.log.push(e);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    switch (e.type) {
      case 'begin': {
        const tech = technique(e.technique);
        t.attemptedByName[e.who][tech.name] = (t.attemptedByName[e.who][tech.name] ?? 0) + 1;
        if (['Strike', 'Drive', 'Check', 'Displace'].includes(tech.kind)) t.attempted[e.who]++;
        if (tech.kind === 'Evade') t.slipsAttempted[e.who]++;
        const f = e.who === 'player' ? fight.a : fight.b;
        if (f.breath <= 0.5) t.actionsWhileSpent[e.who]++;
        break;
      }
      case 'hit': t.landed[e.by]++; break;
      case 'guarded': t.guardedAgainst[e.by]++; break;
      case 'whiff': t.whiffs[e.who]++; break;
      case 'feint': t.feints[e.who]++; break;
      case 'deflected': t.deflects[e.who]++; break;
      case 'deflect_failed': t.deflectFails[e.who]++; break;
      case 'evaded': t.slipsWorked[e.who]++; break;
      case 'break': t.breaksCaused[e.by]++; break;
      case 'late_guard': t.lateGuards[e.who]++; break;
      case 'gassed': t.breathOuts[e.who]++; break;
      case 'interrupted': t.interrupts[e.by]++; break;
      case 'inch_open': t.inchOpenings[e.actor]++; break;
      case 'terminal':
        t.terminal = e.executed;
        t.terminalClean = e.clean;
        break;
      case 'over':
        t.winner = e.winnerId;
        t.reason = e.reason;
        break;
      case 'guard_bypassed': {
        // The event names the defender; with two fighters the attacker is the other.
        // Whether the bypass was earned by POSITION or simply by a leg strike (which
        // attacks the base that leg carries wherever you stand) matters a great deal
        // to the design claim, so the two are counted separately. The technique is
        // read from the landing event that follows it in the same tick.
        const causedBy = other(e.who);
        let region = null;
        for (let j = i + 1; j < events.length; j++) {
          const n = events[j];
          if ((n.type === 'hit' || n.type === 'guarded') && n.who === e.who) { region = n.region; break; }
        }
        if (region === 'leadLeg' || region === 'rearLeg') t.guardBypassByLeg[causedBy]++;
        else t.guardBypassByAngle[causedBy]++;
        break;
      }
      default: break;
    }
  }
}

/** A compact, copyable summary. Never rendered as a meter. */
export function summarise(t) {
  const s = (k) => ({ you: t[k].player, him: t[k].opponent });
  return {
    duration_s: Number(t.duration.toFixed(1)),
    winner: t.winner,
    reason: t.reason,
    terminal: t.terminal,
    terminal_clean: t.terminalClean,
    distance_band_seconds: Object.fromEntries(
      Object.entries(t.bands).map(([k, v]) => [k, Number((v / 60).toFixed(1))]),
    ),
    techniques_attempted: s('attempted'),
    techniques_landed: s('landed'),
    attacks_guarded: s('guardedAgainst'),
    whiffs: s('whiffs'),
    feints: s('feints'),
    deflects: s('deflects'),
    deflects_failed: s('deflectFails'),
    slips_attempted: s('slipsAttempted'),
    slips_that_worked: s('slipsWorked'),
    structure_breaks_caused: s('breaksCaused'),
    final_inch_openings: s('inchOpenings'),
    guard_bypassed_by_angle: s('guardBypassByAngle'),
    guard_bypassed_by_leg_strike: s('guardBypassByLeg'),
    late_guards: s('lateGuards'),
    breath_outs: s('breathOuts'),
    actions_on_an_empty_tank: s('actionsWhileSpent'),
    seconds_staggered: {
      you: Number((t.staggeredTicks.player / 60).toFixed(1)),
      him: Number((t.staggeredTicks.opponent / 60).toFixed(1)),
    },
    seconds_down: {
      you: Number((t.downTicks.player / 60).toFixed(1)),
      him: Number((t.downTicks.opponent / 60).toFixed(1)),
    },
    seconds_guarding: {
      you: Number((t.guardTicks.player / 60).toFixed(1)),
      him: Number((t.guardTicks.opponent / 60).toFixed(1)),
    },
    player_technique_mix: t.attemptedByName.player,
    opponent_technique_mix: t.attemptedByName.opponent,
  };
}

const STORE_KEY = 'pomg.m1.playtest';

/** Persist locally. No network, no backend; the results stay on this machine. */
export function persist(t, survey) {
  try {
    const all = load();
    all.push({ at: new Date().toISOString(), metrics: summarise(t), survey: survey ?? null });
    localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(-60)));
    return all.length;
  } catch { return 0; }
}

export function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'); } catch { return []; }
}

export { SIDES };
