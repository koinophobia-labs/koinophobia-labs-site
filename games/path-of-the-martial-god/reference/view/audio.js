/**
 * Audio — AUDIO_DIRECTION.md.
 *
 * §2: "Breathing is the main HUD." With no stamina bar on screen, breath is the
 * interface. §1: hit sounds are low, short and bodily — no whooshes on ordinary
 * motion, no layered cinematic stacks, no sparks. §3: master-tier fighters are
 * QUIET; less cloth, less foot noise, shorter breath.
 *
 * Everything here is synthesised. No assets.
 */
import { MAX } from '../sim/constants.js';

export function makeAudio() {
  let ctx = null, master = null, enabled = false;
  const breathState = new Map();

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }

  function noise(dur) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function env(node, gain, attack, decay) {
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    node.connect(g); g.connect(master);
    return g;
  }

  /** A body sound: low, short, with cloth. Never a whoosh. */
  function thud(freq, gain, decay, q = 1) {
    if (!enabled || !ensure()) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + decay);
    env(o, gain, 0.002, decay);
    o.start(); o.stop(ctx.currentTime + decay + 0.02);

    const n = noise(decay * 0.7);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900 * q; f.Q.value = 0.8;
    n.connect(f);
    env(f, gain * 0.5, 0.001, decay * 0.7);
    n.start();
  }

  return {
    get enabled() { return enabled; },
    enable() { enabled = true; ensure(); if (ctx?.state === 'suspended') ctx.resume(); },
    disable() { enabled = false; },
    toggle() { if (enabled) this.disable(); else this.enable(); return enabled; },

    /** Impact, by what actually happened. A blocked blow is audibly NOT a hit. */
    impact(kind, force, region) {
      if (!enabled || !ensure()) return;
      const f = Math.min(1, force / 40);
      if (kind === 'guarded') {
        // forearms: a flat slap of meat on meat, so the player hears defence working
        const n = noise(0.09);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.2;
        n.connect(bp); env(bp, 0.22 + f * 0.15, 0.001, 0.08); n.start();
      } else if (kind === 'deflected') {
        const n = noise(0.13);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 2.4;
        n.connect(bp); env(bp, 0.16, 0.004, 0.12); n.start();
      } else if (region === 'head') {
        thud(150, 0.34 + f * 0.2, 0.09, 2.2);   // sharper, with bone in it
      } else {
        thud(88, 0.30 + f * 0.26, 0.16, 1);     // dull, low, cloth-compressed
      }
    },

    /** Not an impact at all: the sound of someone's feet losing the floor. */
    structureBreak() {
      if (!enabled || !ensure()) return;
      const n = noise(0.42);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 700;
      n.connect(f); env(f, 0.30, 0.01, 0.40); n.start();
      thud(62, 0.26, 0.30);
    },

    scuff(intensity = 1) {
      if (!enabled || !ensure()) return;
      const n = noise(0.07);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 1800;
      n.connect(f); env(f, 0.05 * intensity, 0.002, 0.06); n.start();
    },

    whiff() {
      if (!enabled || !ensure()) return;
      // Only committed attacks displace enough air to be heard, and only slightly.
      const n = noise(0.12);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.7;
      n.connect(f); env(f, 0.05, 0.02, 0.10); n.start();
    },

    /**
     * The breathing loop — the most important system in this file.
     * Rate and volume both track Breath; a master is quieter than a novice at the
     * same effort, so the player hears competence as well as exhaustion.
     */
    breath(fighter, now) {
      if (!enabled || !ensure()) return;
      const st = breathState.get(fighter.id) ?? { next: 0 };
      breathState.set(fighter.id, st);
      if (now < st.next) return;

      const frac = fighter.breath / MAX.breath;
      const period = 0.22 + frac * 0.95;                 // gassed = fast
      const gain = (0.055 + (1 - frac) * 0.16) * (1 - fighter.mastery * 0.30);
      st.next = now + period;

      const n = noise(0.20 + (1 - frac) * 0.16);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 480 + (1 - frac) * 340;        // opens up as it gets ragged
      f.Q.value = 0.55;
      n.connect(f);
      env(f, gain, 0.05, 0.18 + (1 - frac) * 0.20);
      n.start();
    },
  };
}
