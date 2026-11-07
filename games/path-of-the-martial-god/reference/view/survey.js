/**
 * Post-fight questionnaire.
 *
 * Appears only after a fight ends. It asks what the milestone cannot answer
 * automatically: whether a person understood and participated in the fight without
 * meters. It deliberately does not name the quadrant model, structure, frame data,
 * the Final Inch, or any strategy — those are the things the prototype is supposed
 * to communicate through play, and naming them here would destroy the measurement.
 */
import { persist, summarise, load } from './telemetry.js';

const CHOICE = [
  { id: 'control', q: 'Who felt in control during most of the fight?',
    a: ['Me', 'The opponent', 'Neither', 'It kept shifting'] },
  { id: 'danger', q: 'Could you tell when you were in danger before getting hit?',
    a: ['Usually', 'Sometimes', 'Rarely', 'Never'] },
  { id: 'vulnerable', q: 'Could you tell when the opponent was vulnerable?',
    a: ['Usually', 'Sometimes', 'Rarely', 'Never'] },
  { id: 'lateral', q: 'Did moving left/right seem meaningfully different from moving forward/back?',
    a: ['Clearly different', 'Somewhat', 'Not really', 'No idea'] },
  { id: 'guard', q: 'Did guarding feel like protection or invulnerability?',
    a: ['Protection', 'Invulnerability', 'Neither — it felt useless', 'Unsure'] },
  { id: 'tired', q: 'Could you tell when either fighter was tired?',
    a: ['Both of us', 'Only myself', 'Only him', 'Neither'] },
  { id: 'base', q: 'Could you tell when a fighter had lost their footing or balance?',
    a: ['Clearly', 'Sometimes', 'No'] },
  { id: 'ending', q: 'When the fight ended, did you understand why it had reached that point?',
    a: ['Yes', 'Partly', 'No'] },
];

const TEXT = [
  { id: 'confusing', q: 'Which controls or outcomes confused you?', ph: 'Anything that did not do what you expected…' },
  { id: 'lesson', q: 'Without being told the system, what do you think the game wanted you to learn?', ph: '' },
];

const STRATEGY = {
  id: 'strategy',
  q: 'What strategy did you naturally start trying?',
  ph: 'Whatever you found yourself doing, even if it did not work…',
};

export function makeSurvey(root, telemetry, onDone) {
  let el = null;

  /** Remove the panel without side effects. Safe to call from anywhere. */
  function close() {
    if (el) { el.remove(); el = null; }
  }

  /**
   * Close because the player finished with it, and hand control back.
   * Kept separate from close(): the caller's onDone restarts the fight, and a
   * restart also closes the survey — routing both through one function recurses.
   */
  function finish() {
    close();
    onDone?.();
  }

  function show() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'survey';
    el.innerHTML = `
      <form class="survey-card" autocomplete="off">
        <p class="survey-eyebrow">After the fight</p>
        <h2>What did that feel like?</h2>
        <p class="survey-lede">No wrong answers. Confusion is the most useful thing you can report.</p>

        <div class="q strategy">
          <label for="q-strategy">${STRATEGY.q}</label>
          <textarea id="q-strategy" name="strategy" rows="2" placeholder="${STRATEGY.ph}"></textarea>
        </div>

        ${CHOICE.map((c) => `
          <fieldset class="q">
            <legend>${c.q}</legend>
            <div class="opts">
              ${c.a.map((a, i) => `
                <label class="opt">
                  <input type="radio" name="${c.id}" value="${a}" id="${c.id}-${i}">
                  <span>${a}</span>
                </label>`).join('')}
            </div>
          </fieldset>`).join('')}

        ${TEXT.map((tq) => `
          <div class="q">
            <label for="q-${tq.id}">${tq.q}</label>
            <textarea id="q-${tq.id}" name="${tq.id}" rows="2" placeholder="${tq.ph}"></textarea>
          </div>`).join('')}

        <div class="survey-actions">
          <button type="submit" class="go">Save and fight again</button>
          <button type="button" class="ghost" data-skip>Skip</button>
          <button type="button" class="ghost" data-copy>Copy all results</button>
        </div>
        <p class="survey-note" data-note></p>
      </form>`;
    root.appendChild(el);

    const form = el.querySelector('form');
    const note = el.querySelector('[data-note]');

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const n = persist(telemetry, data);
      note.textContent = `Saved locally. ${n} fight${n === 1 ? '' : 's'} recorded on this device.`;
      setTimeout(finish, 450);
    });

    el.querySelector('[data-skip]').addEventListener('click', () => {
      persist(telemetry, null);
      finish();
    });

    el.querySelector('[data-copy]').addEventListener('click', async () => {
      const payload = JSON.stringify({ thisFight: summarise(telemetry), allFights: load() }, null, 2);
      try {
        await navigator.clipboard.writeText(payload);
        note.textContent = 'Copied to clipboard.';
      } catch {
        // Clipboard can be blocked; fall back to something selectable.
        const ta = document.createElement('textarea');
        ta.className = 'dump';
        ta.value = payload;
        ta.readOnly = true;
        form.appendChild(ta);
        ta.focus(); ta.select();
        note.textContent = 'Clipboard blocked — select the text below and copy it.';
      }
    });

    el.querySelector('#q-strategy')?.focus();
  }

  return { show, close, get open() { return !!el; } };
}
