/**
 * Every synthesised audio cue must actually be played.
 *
 * `CombatAudio` builds its cues into a dictionary and plays them by name. A cue can
 * therefore be written, tuned, and committed without a single call site — which is
 * exactly what happened to `step`: footsteps existed as a buffer from the first commit
 * of the audio layer and were never once heard, in a game whose whole presentation
 * claim is that the body tells you what is happening.
 *
 * That is the same defect as the input buffer, the five dead settings and the four dead
 * tuning constants: a declaration that looks live, reads as finished, and never runs.
 * Fifth time. So it gets a test rather than more care.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const AUDIO = new URL(
  '../../apple/MartialGod/Audio/CombatAudio.swift', import.meta.url,
).pathname;

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

test('every built audio cue has a play site', () => {
  const src = strip(readFileSync(AUDIO, 'utf8'));

  const built = [...src.matchAll(/buffers\["(\w+)"\]\s*=/g)].map((m) => m[1]);
  assert.ok(built.length >= 8, `only ${built.length} cues found; the parse is wrong`);

  // A cue is played if its name appears anywhere other than its own declaration —
  // `play("thud")`, or inside a ternary like `play(head ? "crack" : "thud")`.
  const dead = built.filter((name) => {
    const uses = [...src.matchAll(new RegExp(`"${name}"`, 'g'))].length;
    return uses <= 1;
  });

  assert.deepEqual(dead, [],
    `these audio cues are built and never played: ${dead.join(', ')}.\n` +
    'A cue with no call site is a sound the game cannot make. Wire it or delete it.');
});

test('the events that carry the fight are all audible', () => {
  // Not every event needs a sound, but these carry the moments the design says the
  // player must perceive without a HUD: exhaustion, the Final Inch, and the end.
  const src = strip(readFileSync(AUDIO, 'utf8'));
  for (const event of ['hit', 'guarded', 'deflected', 'whiff', 'brokeStructure',
                       'gassed', 'inchOpen', 'terminal', 'over']) {
    assert.ok(new RegExp(`case \\.${event}\\b`).test(src),
      `CombatAudio does not respond to "${event}" — that moment is silent`);
  }
});

test('the Final Inch drops the audio to breath and room tone', () => {
  // COMBAT_SYSTEM.md §10 specifies this, and it is not decoration: the Inch asks the
  // game's only question, with no prompt and no menu. The mix has to get out of the
  // way and leave the two things that still mean something — someone breathing, and
  // the room they are standing in.
  const audio = readFileSync(AUDIO, 'utf8');
  const src = strip(audio);
  assert.ok(src.includes('func setInchOpen'), 'the audio layer cannot be told the Inch is open');
  assert.ok(/buffers\["room"\]/.test(src), 'there is no room tone to drop to');
  assert.ok(src.includes('func duck'), 'nothing ducks during the Inch');

  // Breath must NOT be ducked — it is what the duck exists to reveal.
  const breathBody = src.slice(src.indexOf('func breath'), src.indexOf('func breath') + 700);
  assert.ok(!/duck\(/.test(breathBody),
    'breath is being ducked along with everything else, which defeats the whole point');

  const session = readFileSync(
    new URL('../../apple/MartialGod/App/GameSession.swift', import.meta.url).pathname, 'utf8');
  assert.ok(strip(session).includes('audio.setInchOpen'),
    'the session never tells the audio layer the Inch is open');
  assert.ok(strip(session).includes('camera.setInchOpen'),
    'the session never tells the camera the Inch is open');
});

test('footsteps are driven by ground covered, not by a timer', () => {
  // The rhythm has to BE the movement: circling ticks along, a committed step-in lands
  // one heavy footfall, standing still is silent. A timer gives all three the same beat.
  const session = readFileSync(
    new URL('../../apple/MartialGod/App/GameSession.swift', import.meta.url).pathname, 'utf8');
  const src = strip(session);
  assert.ok(src.includes('audio.footstep'), 'nothing ever plays a footstep');
  assert.ok(src.includes('lastMove'), 'footsteps are not derived from distance travelled');
  assert.ok(/strideSince/.test(src), 'no per-fighter stride accumulator');
});
