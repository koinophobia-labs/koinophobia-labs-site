#!/usr/bin/env node
// Turn an approved Higgsfield render into the koi world's asset convention:
//   public/koi/<id>-1280.mp4, public/koi/<id>-854.mp4, public/koi/poster-<name>.webp
// H.264 only, on purpose: VP9/AV1 re-encodes measured the same size or larger
// on near-black footage. Loop clips get their first frame appended as the
// poster-hero timestamp source. Updates public/brand/koi-scroll-assets.sha256.
//
// Usage: node scripts/ingest-koi-clip.mjs <input.mp4> <clip-id> [--poster-at 3.2] [--vertical]
//   clip-id is the basename used in lib/koi/journey.ts, e.g. koi-lead.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [input, id, ...rest] = process.argv.slice(2);
if (!input || !id) {
  console.error("usage: ingest-koi-clip.mjs <input.mp4> <clip-id> [--poster-at seconds] [--vertical]");
  process.exit(1);
}
const posterAt = Number(rest[rest.indexOf("--poster-at") + 1] || 0) || 0;
const vertical = rest.includes("--vertical");
const outDir = path.resolve("public/koi");
fs.mkdirSync(outDir, { recursive: true });

const run = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const scale = (w) => (vertical ? `scale=-2:${w}` : `scale=${w}:-2`);

for (const [w, crf] of [
  [1280, 22],
  [854, 24],
]) {
  const out = path.join(outDir, `${id}-${w}.mp4`);
  run(["-i", input, "-an", "-vf", scale(w), "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  console.log("wrote", path.relative(process.cwd(), out), fs.statSync(out).size, "bytes");
}
const posterName = id.replace(/^koi-/, "");
const poster = path.join(outDir, `poster-${posterName}.webp`);
// This ffmpeg has no libwebp; write a PNG frame and let Pillow encode it.
const posterPng = poster.replace(/\.webp$/, ".png");
run(["-ss", String(posterAt), "-i", input, "-frames:v", "1", "-vf", scale(1280), posterPng]);
execFileSync("python3", ["-c", "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'WEBP', quality=82, method=6)", posterPng, poster], { stdio: "inherit" });
fs.unlinkSync(posterPng);
console.log("wrote", path.relative(process.cwd(), poster));

const manifest = path.resolve("public/brand/koi-scroll-assets.sha256");
const lines = fs.existsSync(manifest) ? fs.readFileSync(manifest, "utf8").split("\n").filter(Boolean) : [];
const entries = new Map(lines.map((line) => [line.split(/\s+/)[1], line]));
for (const file of [`${id}-1280.mp4`, `${id}-854.mp4`, `poster-${posterName}.webp`]) {
  const full = path.join(outDir, file);
  const hash = createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  entries.set(`public/koi/${file}`, `${hash}  public/koi/${file}`);
}
fs.writeFileSync(manifest, `${[...entries.values()].join("\n")}\n`);
console.log("manifest updated");
