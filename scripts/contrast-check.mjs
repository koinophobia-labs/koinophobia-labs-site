// WCAG contrast checker for the Blake, In Person homepage palette.
// Verifies every foreground/background pair actually used in the design.
function lum(hex) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const CREAM = "#F4F1EA";
const WHITE = "#FFFFFF";
const INK = "#141516";

// [fg, bg, sizeClass ('normal'|'large'|'nontext'), label]
const pairs = [
  ["#141516", CREAM, "normal", "ink text on cream"],
  ["#141516", WHITE, "normal", "ink text on white"],
  ["#55524C", CREAM, "normal", "charcoal secondary on cream"],
  ["#55524C", WHITE, "normal", "charcoal secondary on white"],
  ["#6B6257", CREAM, "normal", "muted meta on cream"],
  ["#6B6257", WHITE, "normal", "muted meta on white"],
  ["#096A82", CREAM, "normal", "cyan-text link on cream"],
  ["#096A82", WHITE, "normal", "cyan-text link on white"],
  ["#765A17", CREAM, "normal", "gold-text small on cream"],
  ["#765A17", WHITE, "normal", "gold-text small on white"],
  // product status labels (small mono text) sit on cream in the ecosystem section
  ["#B24016", CREAM, "normal", "YKB status text on cream"],
  ["#A03A2A", CREAM, "normal", "Trendi status text on cream"],
  ["#3F607F", CREAM, "normal", "Koi Cave status text on cream"],
  ["#765A17", CREAM, "normal", "OPEN (gold) status text on cream"],
  // dark cinematic audit section (ink bg)
  ["#F4F1EA", INK, "normal", "cream body on ink (audit/buttons)"],
  ["#B5B1A8", INK, "normal", "muted body on ink"],
  ["#C79A34", INK, "normal", "gold kicker on ink"],
  ["#8FD8E8", INK, "normal", "cyan link on ink"],
  ["#C79A34", INK, "normal", "gold-on-dark alt on ink"],
  // decorative / large (>=24px bold or >=18.66px) — 3:1 threshold
  ["#141516", CREAM, "large", "big Archivo headline on cream"],
  // purely decorative signature rule — always paired with a text label that
  // carries the meaning; WCAG 1.4.11 exempts decorative graphics. Reported
  // for transparency, not gated.
  ["#B08A2E", CREAM, "decorative", "gold signature rule on cream (decorative, exempt)"],
];

let fail = 0;
for (const [fg, bg, size, label] of pairs) {
  const r = ratio(fg, bg);
  if (size === "decorative") {
    console.log(`INFO  ${r.toFixed(2)}:1  (decorative, exempt)  ${fg} on ${bg}  — ${label}`);
    continue;
  }
  const need = size === "large" ? 3.0 : 4.5;
  const ok = r >= need;
  if (!ok) fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (need ${need})  ${fg} on ${bg}  — ${label}`
  );
}
console.log(fail === 0 ? "\nALL PAIRS PASS AA" : `\n${fail} PAIR(S) FAIL`);
process.exit(fail === 0 ? 0 : 1);
