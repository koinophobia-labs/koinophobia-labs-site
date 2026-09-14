/**
 * The control card names the gestures and explains nothing else.
 *
 * The milestone's exit condition is that a stranger can READ THE FIGHT. Every system
 * named on the way in is one the fight no longer has to communicate, and the
 * measurement is spoiled the moment the game starts describing itself. The web
 * prototype showed eight control names and nothing more, on purpose; the native card
 * has to hold the same line, and it is the kind of line that erodes one helpful
 * sentence at a time.
 *
 * Naming the vocabulary is not explaining the game. The eight verbs were always meant
 * to be public — what they MEAN in a given moment is the thing the player works out.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CARD = new URL(
  '../../apple/MartialGod/App/ControlsOverlay.swift', import.meta.url).pathname;

/// Only the text the player actually reads.
///
/// Comments are stripped FIRST. The doc comment above the overlay quotes a gesture
/// name, and leaving it in threw the quote-pairing out by one for the whole rest of
/// the file — every string after it came back as the punctuation between two others.
function displayedText(src) {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  return [...code.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join(' | ').toLowerCase();
}

test('the card names every verb the player has', () => {
  const shown = displayedText(readFileSync(CARD, 'utf8'));
  for (const verb of ['pressure', 'angle', 'strike', 'commit', 'feint',
                      'guard', 'deflect', 'slip', 'breathe']) {
    assert.ok(shown.includes(verb), `the control card never mentions "${verb}"`);
  }
});

test('the card explains none of the systems', () => {
  const shown = displayedText(readFileSync(CARD, 'utf8'));
  const forbidden = [
    'quadrant', 'structure', 'collapse', 'balance',
    'frame', 'startup', 'recovery', 'window', 'tick',
    'final inch', 'terminal', 'mastery',
    'breath meter', 'stamina', 'health', 'damage',
    'opponent ai', 'difficulty', 'best', 'should', 'try to', 'tip',
  ];
  const leaked = forbidden.filter((t) => shown.includes(t));
  assert.deepEqual(leaked, [],
    `the control card leaks the systems it is supposed to let the player discover: ` +
    `${leaked.join(', ')}. Anything explained here is something the fight no longer ` +
    'has to communicate, and the readability measurement is spoiled.');
});

test('the card is shown once, not every launch', () => {
  const vc = readFileSync(
    new URL('../../apple/MartialGod/App/GameViewController.swift', import.meta.url).pathname,
    'utf8');
  assert.ok(/hasSeenControls/.test(vc), 'nothing records that the card has been shown');
  assert.ok(/guard\s+!SettingsStore\.shared\.settings\.hasSeenControls/.test(vc),
    'the card is not gated on having been seen — a game that explains itself every ' +
    'launch is conceding that it is not legible');
});
