/**
 * Input — COMBAT_SYSTEM.md §3. Seven verbs, and a stick that supplies INTENT.
 *
 * The design is controller-first, so a gamepad is polled when present; the keyboard
 * map mirrors it exactly. Nothing here knows what a technique is: it emits the same
 * InputIntent the opponent's brain emits, and the grammar decides what it means.
 */
const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  leadSide: ['KeyA', 'ArrowLeft'],
  rearSide: ['KeyD', 'ArrowRight'],
  strike: ['KeyJ'],
  commit: ['KeyK'],
  deflect: ['KeyL'],
  evade: ['Space'],
  guard: ['ShiftLeft', 'ShiftRight'],
  focus: ['KeyF'],
};

const VERB_KEYS = ['strike', 'commit', 'deflect', 'evade', 'focus'];

export function makeInput(target = window) {
  const down = new Set();
  const pressed = new Set();   // edge this frame
  let padIndex = null;
  const prevPad = {};

  target.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (Object.values(KEYS).flat().includes(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
  });
  target.addEventListener('keyup', (e) => down.delete(e.code));
  target.addEventListener('blur', () => { down.clear(); pressed.clear(); });
  window.addEventListener('gamepadconnected', (e) => { padIndex = e.gamepad.index; });
  window.addEventListener('gamepaddisconnected', () => { padIndex = null; });

  const held = (name) => KEYS[name].some((k) => down.has(k));
  const edge = (name) => KEYS[name].some((k) => pressed.has(k));

  return {
    /**
     * @returns {import('../sim/formMachine.js').InputIntent}
     * `verb` is edge-triggered so holding a key does not machine-gun techniques;
     * `held` stays true while the key is down, which is what the Lie reads.
     */
    sample() {
      let forward = 0, lateral = 0;
      if (held('forward')) forward += 1;
      if (held('back')) forward -= 1;
      if (held('leadSide')) lateral += 1;
      if (held('rearSide')) lateral -= 1;
      let guard = held('guard');
      let verb = null;
      let anyHeld = false;

      for (const v of VERB_KEYS) {
        if (edge(v)) { verb = v; break; }
      }
      for (const v of VERB_KEYS) if (held(v)) anyHeld = true;

      // ---- gamepad overrides when one is actually being used -------------------
      const pad = padIndex != null ? navigator.getGamepads?.()[padIndex] : null;
      if (pad) {
        const ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
        if (Math.hypot(ax, ay) > 0.18) { forward = -ay; lateral = -ax; }
        const b = (i) => !!pad.buttons[i]?.pressed;
        const padEdge = (i, name) => { const now = b(i); const was = prevPad[name]; prevPad[name] = now; return now && !was; };
        if (b(4) || (pad.buttons[6]?.value ?? 0) > 0.4) guard = true;
        if (padEdge(2, 'strike')) verb = 'strike';        // X
        else if (padEdge(3, 'commit')) verb = 'commit';   // Y
        else if (padEdge(1, 'evade')) verb = 'evade';     // B
        else if (padEdge(5, 'deflect')) verb = 'deflect'; // RB
        else if (padEdge(0, 'focus')) verb = 'focus';     // A
        if (b(2) || b(3) || b(1) || b(5) || b(0)) anyHeld = true;
      }

      pressed.clear();
      return { forward, lateral, verb, held: anyHeld || verb != null, guard };
    },
    clear() { down.clear(); pressed.clear(); },
  };
}

export const CONTROLS = [
  ['W / S', 'pressure / retreat'],
  ['A / D', 'angle'],
  ['J', 'strike'],
  ['K', 'commit'],
  ['Shift', 'guard'],
  ['L', 'deflect'],
  ['Space', 'slip'],
  ['F', 'breathe'],
];
