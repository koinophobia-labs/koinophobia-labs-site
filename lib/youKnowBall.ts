export type DebatePrompt = {
  id: string;
  sport: "NBA" | "NFL" | "MLB";
  question: string;
  sides: [string, string];
  counters: [string, string];
};

export const debatePrompts: DebatePrompt[] = [
  {
    id: "peak-or-longevity",
    sport: "NBA",
    question: "What matters more in an all-time player debate: peak or longevity?",
    sides: ["Peak wins", "Longevity wins"],
    counters: [
      "Peak is the loudest part of a résumé, not the whole résumé. If greatness only counts at its absolute ceiling, availability, adaptation, and sustained dominance disappear from the argument. Your move: how long must a peak last before it outweighs years of elite play?",
      "Longevity can become a reward for simply staying in the conversation. The best player at their apex changes schemes, matchups, and championship paths in a way a longer but lower ceiling may never touch. Your move: when does sustained excellence beat a clearly higher peak?",
    ],
  },
  {
    id: "rings-or-context",
    sport: "NBA",
    question: "Are rings a fair shortcut for comparing all-time players?",
    sides: ["Rings matter most", "Context matters more"],
    counters: [
      "Rings prove a team finished the job; they do not isolate one player's value. Roster fit, health, coaching, and opponent quality all shape the result. Your move: what did the player control beyond being on the winning side?",
      "Context can explain everything until it explains away winning. The best players are judged by how often their impact survives the hardest rounds and forces opponents to adjust. Your move: what result would make you stop adding caveats?",
    ],
  },
  {
    id: "qb-wins",
    sport: "NFL",
    question: "Should quarterback wins carry major weight in individual rankings?",
    sides: ["Yes — winning is the job", "No — wins are a team stat"],
    counters: [
      "Winning is the job, but a quarterback does not block, cover, or call every defensive adjustment. Using wins as the main proof can hide whether the quarterback created the margin or merely protected it. Your move: which part of winning belongs to the quarterback alone?",
      "Calling wins a team stat can undersell the one position that controls the ball, protection calls, and late-game decisions most often. Your move: if wins barely count, how do you measure command when the game tightens?",
    ],
  },
  {
    id: "baseball-peak",
    sport: "MLB",
    question: "Would you take five dominant seasons over twelve very good ones?",
    sides: ["Give me dominance", "Give me the full career"],
    counters: [
      "Five dominant seasons can define an era, but a short window leaves less proof against decline, adjustment, and changing competition. Your move: how much career value are you willing to trade for the higher ceiling?",
      "A full career builds value, but volume can blur the difference between being consistently good and genuinely game-changing. Your move: where is the season that made opponents redesign their plan?",
    ],
  },
];

// Ported from public/you-know-ball-scoring.js in the authoritative private app.
const bettingPattern = /\b(bet|bett|wager|parlay|spread|moneyline|prop|odds|sportsbook|unit|lock|tail|fade|cover|over\/under|pick|cash|free money|risk[- ]?free|chase|win my money back)\b|[+-]\d+/i;
const reasonPattern = /\b(because|cuz|cause|since|due to|the reason|why|if|when|unless|but|however|counter|proof|evidence|context|resume|peak|longevity|defense|offense|coaching|health|roster|playoff|finals|rings|scheme|spacing|usage|role)\b/i;
const heatPattern = /\b(goat|overrated|trash|washed|all-time|rings|no debate|winning it all|title|mvp|hall|dynasty|choke|fraud|clears)\b/i;
const contextPattern = /\b(lebron|jordan|mahomes|bonds|cowboys|hornets|lamelo|wemby|bears|knicks|lakers|nba|nfl|mlb|football|basketball|baseball|playoffs|finals|mvp|qb)\b/i;

export type RoundScore = {
  points: number;
  takeStrength: number;
  clarity: number;
  heat: number;
  verdict: string;
  paused: boolean;
};

export function scoreTake(take: string, prompt: DebatePrompt): RoundScore {
  const clean = take.trim();
  if (bettingPattern.test(clean)) {
    return { points: 0, takeStrength: 0, clarity: 0, heat: 0, verdict: "Score paused · sports debate only", paused: true };
  }
  const words = clean.split(/\s+/).filter(Boolean);
  const fullTake = `${prompt.question} ${clean}`;
  const clear = words.length >= 3;
  const context = contextPattern.test(fullTake);
  const reason = reasonPattern.test(clean) || words.length >= 8;
  const evidence = reason && (words.length >= 10 || /\b(peak|resume|health|roster|scheme|playoff|defense|offense|coaching|era|rings|longevity)\b/i.test(clean));
  const vague = words.length < 4;
  let base = (clear ? 3 : 0) + (context ? 2 : 0) + (reason ? 2 : 0) + (evidence ? 2 : 0);
  if (vague) base = Math.max(0, base - 1);
  const points = Math.min(24, Math.max(0, Math.round(base * 1.2)));
  const clarity = clamp((clear ? 45 : 20) + (context ? 25 : 0) + (reason ? 20 : 0) - (vague ? 25 : 0));
  const heat = clamp((heatPattern.test(clean) ? 58 : 32) + (context ? 12 : 0) + (reason ? 10 : 0));
  const takeStrength = clamp(Math.round(clarity * 0.38 + heat * 0.2 + 30 * 0.22 + (evidence ? 20 : reason ? 10 : 0)));
  const verdict = takeStrength >= 62 ? "Certified take" : takeStrength >= 42 ? "Solid case" : "Warm-up round";
  return { points, takeStrength, clarity, heat, verdict, paused: false };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value || 0));
}

export function trackYkb(event: "play_module_viewed" | "first_possession_started" | "take_submitted" | "possession_completed" | "continued_to_full_game" | "replay_selected") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ykb:analytics", { detail: { event } }));
  const analyticsWindow = window as typeof window & { dataLayer?: Array<Record<string, string>> };
  analyticsWindow.dataLayer?.push({ event: `ykb_${event}` });
}
