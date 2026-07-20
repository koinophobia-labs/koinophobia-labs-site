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
const DH_INK = "#05060A";
const DH_PANEL = "#0A0B12";
const DH_PANEL2 = "#0D0E17";

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

  // ---- koinophobia.dev dark personal palette (.devhome home + .connectcard) ----
  // Surfaces: ink #05060A (page), panel #0A0B12, panel-2 #0D0E17.
  // Status-chip text sits on the violet-soft fill blended over panel: ~#201538.
  ["#E8E6F0", DH_INK, "normal", "dark: primary text on ink"],
  ["#E8E6F0", DH_PANEL, "normal", "dark: primary text on panel (cards/actions)"],
  ["#A7A3B8", DH_INK, "normal", "dark: body on ink"],
  ["#A7A3B8", DH_PANEL, "normal", "dark: body on panel (work-note/sub)"],
  ["#807C94", DH_INK, "normal", "dark: muted (caption/footer/label) on ink"],
  ["#807C94", DH_PANEL, "normal", "dark: muted on panel"],
  ["#807C94", DH_PANEL2, "normal", "dark: muted on panel-2 (hover)"],
  ["#B15CFF", DH_INK, "normal", "dark: violet-hot kicker/role on ink"],
  ["#B15CFF", DH_PANEL, "normal", "dark: violet-hot icon on panel"],
  ["#B15CFF", DH_PANEL2, "normal", "dark: violet-hot arrow/icon on panel-2 (hover)"],
  ["#B15CFF", "#201538", "normal", "dark: violet-hot status-chip text on violet-soft fill"],
  ["#FFFFFF", "#9447FF", "normal", "dark: white button label on violet"],
  // ---- koinophobia.dev product worlds (app/dev-system.css [data-world]) ----
  // Each product accent must clear AA on all three dark surfaces, and ink text
  // must clear AA on the accent (used for .devpage__btn labels).
  ["#FF9D3D", DH_INK, "normal", "forge: Career Forge accent on ink"],
  ["#FF9D3D", DH_PANEL, "normal", "forge: accent on panel"],
  ["#FF9D3D", DH_PANEL2, "normal", "forge: accent on panel-2"],
  ["#FFB867", DH_INK, "normal", "forge: accent-hot on ink"],
  ["#FFB867", DH_PANEL, "normal", "forge: accent-hot on panel"],
  ["#05060A", "#FF9D3D", "normal", "forge: ink button label on accent"],
  ["#3DDCC2", DH_INK, "normal", "signal: Trendi accent on ink"],
  ["#3DDCC2", DH_PANEL, "normal", "signal: accent on panel"],
  ["#3DDCC2", DH_PANEL2, "normal", "signal: accent on panel-2"],
  ["#78ECD8", DH_INK, "normal", "signal: accent-hot on ink"],
  ["#78ECD8", DH_PANEL, "normal", "signal: accent-hot on panel"],
  ["#05060A", "#3DDCC2", "normal", "signal: ink button label on accent"],
  ["#FF7A4D", DH_INK, "normal", "arena: You Know Ball accent on ink"],
  ["#FF7A4D", DH_PANEL, "normal", "arena: accent on panel"],
  ["#FF7A4D", DH_PANEL2, "normal", "arena: accent on panel-2"],
  ["#FF9D79", DH_INK, "normal", "arena: accent-hot on ink"],
  ["#FF9D79", DH_PANEL, "normal", "arena: accent-hot on panel"],
  ["#05060A", "#FF7A4D", "normal", "arena: ink button label on accent"],
  ["#6FA8CF", DH_INK, "normal", "cave: Koi Cave accent on ink"],
  ["#6FA8CF", DH_PANEL, "normal", "cave: accent on panel"],
  ["#6FA8CF", DH_PANEL2, "normal", "cave: accent on panel-2"],
  ["#98C4E2", DH_INK, "normal", "cave: accent-hot on ink"],
  ["#98C4E2", DH_PANEL, "normal", "cave: accent-hot on panel"],
  ["#05060A", "#6FA8CF", "normal", "cave: ink button label on accent"],
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
