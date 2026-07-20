import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  MAX_STATUS_AGE_DAYS,
  getProduct,
  products,
  reachLabel,
  stageLabel,
  stageRank,
  statusOwner,
  universeLastUpdated,
} from "../lib/dev/universe";
import { experiments, getNote, notes, publishedNotes } from "../lib/dev/lab";
import { nowActiveWork, nowLastUpdated } from "../lib/now";

// The koinophobia.dev product universe exists because the site had drifted into
// describing the same product three different ways on three different pages.
//
// The 2026-07-20 reconciliation then found something worse: the "honest"
// correction was ALSO wrong. The site claimed no You Know Ball build had ever
// been uploaded, while Apple's own delivery logs named two it had accepted.
// Overcorrection is harder to catch than overclaiming, because nobody
// fact-checks the sentence that makes you look bad.
//
// So these tests guard evidence, not tone.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

/* ---------- verification metadata ---------- */

test("every product carries verification metadata", () => {
  assert.ok(products.length >= 4);
  for (const product of products) {
    assert.match(
      product.verifiedAt,
      /^\d{4}-\d{2}-\d{2}$/,
      `${product.name} needs an ISO verifiedAt date`,
    );
    assert.ok(
      product.evidence.length > 0,
      `${product.name} publishes a status with no evidence behind it`,
    );
    for (const item of product.evidence) {
      assert.ok(item.claim.trim().length > 0, `${product.name}: evidence entry with no claim`);
      assert.ok(
        item.source.trim().length > 12,
        `${product.name}: evidence "${item.claim}" needs a checkable source, not a gesture`,
      );
    }
  }
});

test("no product status has gone stale", () => {
  // Status decay is the actual failure mode. Make it break the build.
  const now = Date.now();
  for (const product of products) {
    const ageDays = (now - Date.parse(product.verifiedAt)) / 86_400_000;
    assert.ok(
      ageDays <= MAX_STATUS_AGE_DAYS,
      `${product.name} was last verified ${Math.round(ageDays)} days ago (limit ${MAX_STATUS_AGE_DAYS}). Re-check it against artifacts, then bump verifiedAt.`,
    );
  }
});

test("a status owner is recorded", () => {
  assert.ok(statusOwner.length > 0);
});

test("date stamps are literal strings, never runtime dates", () => {
  for (const source of [read("lib/dev/universe.ts"), read("lib/dev/lab.ts")]) {
    assert.doesNotMatch(
      source,
      /new Date\(\)|Date\.now\(\)/,
      "a status date that moves on its own is not evidence of anything",
    );
  }
  assert.ok(universeLastUpdated.length > 0);
  assert.ok(nowLastUpdated.length > 0);
});

/* ---------- the status ladder ---------- */

test("stage and reach never contradict each other", () => {
  for (const product of products) {
    assert.ok(stageLabel[product.stage], `${product.name} has an unknown stage`);
    assert.ok(reachLabel[product.reach], `${product.name} has an unknown reach`);
    assert.ok(product.status.length > 10, `${product.name} needs a specific status`);

    if (product.reach === "internal") {
      assert.ok(
        stageRank[product.stage] < stageRank["external-testers"],
        `${product.name} runs for Blake only but claims stage "${product.stage}"`,
      );
    }

    // A product can be publicly reachable through a different surface than the
    // stage describes (You Know Ball's web demo vs its iOS build). If so, the
    // status string has to say which surface, or the two facts read as one.
    if (product.reach === "public" && product.stage !== "public") {
      assert.match(
        product.status,
        /web demo/i,
        `${product.name} claims public reach at stage "${product.stage}" without naming the public surface`,
      );
    }
  }
});

test("the stage ladder never collapses distinct release states", () => {
  // "Release-ready", "uploaded" and "in a tester's hands" must stay separate.
  assert.ok(stageRank["release-candidate"] < stageRank.uploaded);
  assert.ok(stageRank.uploaded < stageRank["internal-testers"]);
  assert.ok(stageRank["internal-testers"] < stageRank["external-testers"]);
  assert.ok(stageRank["external-testers"] < stageRank.public);
});

test("TestFlight claims require TestFlight evidence", () => {
  for (const product of products) {
    if (/testflight/i.test(product.status)) {
      assert.ok(
        product.evidence.some((e) => /testflight|screenshot|installed/i.test(e.source)),
        `${product.name} mentions TestFlight in its status with no TestFlight evidence`,
      );
    }
  }
});

/* ---------- the specific corrections from 2026-07-20 ---------- */

test("You Know Ball does not claim it was never uploaded", () => {
  // Apple's 409 responses name previousBundleVersion 26 (Jul 16) and 27 (Jul 19).
  const ykb = getProduct("you-know-ball");
  assert.ok(ykb);
  const prose = [ykb!.status, ...ykb!.state, ...ykb!.notYet].join(" ");
  assert.doesNotMatch(
    prose,
    /never been on testflight|never reached testflight|has never been uploaded/i,
    "Apple's delivery logs contradict this claim",
  );
  assert.match(prose, /accepted by/i, "the accepted-by-Apple fact must stay stated");
  // And it must still say what did NOT happen after acceptance.
  assert.ok(
    ykb!.notYet.some((line) => /tester|processing|installed/i.test(line)),
    "YKB must say plainly that acceptance never became distribution",
  );
});

test("Trendi reflects build 118, not a superseded blocker", () => {
  const trendi = getProduct("trendi");
  assert.ok(trendi);
  const prose = [trendi!.status, ...trendi!.state].join(" ");
  assert.match(prose, /118/, "build 118 is the uploaded build");
  assert.doesNotMatch(
    trendi!.status,
    /blocked on builds? 11[56]|stuck behind an apple account/i,
    "builds 115/116 are superseded by 118",
  );
  // The isolation gate is genuinely open; the page must not imply otherwise.
  assert.ok(
    [...trendi!.state, ...trendi!.notYet].some((line) => /isolation/i.test(line)),
    "the incomplete data-isolation gate must be disclosed",
  );
});

test("Career Forge does not claim checkout is closed, or that anyone bought", () => {
  const cf = getProduct("career-forge");
  assert.ok(cf);
  assert.doesNotMatch(
    [cf!.status, ...cf!.state, ...cf!.notYet].join(" "),
    /fail-clos|payments are not configured/i,
    "production renders live-commerce copy and a working $49 link",
  );

  // Adoption language is banned in the ASSERTION fields only. `notYet` is the
  // denial list — "nobody has told me this got them hired" is the honest
  // sentence, and a checker that can't tell a claim from its negation would
  // push the copy toward saying nothing at all.
  assert.doesNotMatch(
    [cf!.status, ...cf!.state].join(" "),
    /\b(paying customers|active users|got hired|landed a job|customers trust)\b/i,
    "adoption language needs evidence that does not exist",
  );
  assert.ok(
    cf!.notYet.some((line) => /paid|stripe|reconcil/i.test(line)),
    "the payment question must be stated as unresolved, not omitted",
  );
});

test("unsourceable statistics stay out of published copy", () => {
  // Published once, then untraceable to any artifact during the audit.
  const banned = [/2\.36%/, /4,500 simulated/, /460 topics/, /16[–-]27%/];
  const surfaces = ["lib/dev/universe.ts", "app/dev/products/[slug]/page.tsx", "app/home/page.tsx"];
  for (const pattern of banned) {
    for (const file of surfaces) {
      assert.doesNotMatch(read(file), pattern, `${file} re-published an unsourced statistic`);
    }
    for (const note of publishedNotes) {
      assert.doesNotMatch(note.body.join(" "), pattern, `${note.slug} cites an unsourced statistic`);
    }
  }
});

/* ---------- honesty invariants ---------- */

test("every product states what is not true yet", () => {
  for (const product of products) {
    assert.ok(
      product.notYet.length >= 2,
      `${product.name} lists fewer than two unproven claims — verify that's real`,
    );
  }
});

test("internal-only products offer nothing to click", () => {
  for (const product of products.filter((p) => p.reach === "internal")) {
    assert.equal(
      product.actions.length,
      0,
      `${product.name} is internal but offers ${product.actions.length} action(s)`,
    );
  }
});

test("no product uses launch language it cannot back", () => {
  const banned = [/\blaunched\b/i, /\bavailable now\b/i, /\bgenerally available\b/i];
  for (const product of products) {
    for (const pattern of banned) {
      assert.doesNotMatch(product.status, pattern, `${product.name}: ${product.status}`);
    }
  }
});

test("no product invents users, revenue, or testimonials", () => {
  const source = read("lib/dev/universe.ts");
  for (const pattern of [
    /\d+\s*(paying|happy)\s+(customers|users|clients)/i,
    /\btestimonial/i,
    /\$\d+[\d,]*\s*(in\s+)?(revenue|MRR|ARR)/i,
  ]) {
    assert.doesNotMatch(source, pattern, `universe.ts appears to claim ${pattern}`);
  }
});

/* ---------- cross-surface agreement ---------- */

test("/now and the product universe agree about TestFlight", () => {
  const byName = new Map(products.map((p) => [p.name, p]));
  for (const entry of nowActiveWork) {
    const product = byName.get(entry.name);
    if (!product) continue; // the studio is not a product

    const nowClaims = /testflight/i.test(`${entry.stage} ${entry.snapshot} ${entry.doingNow}`);
    const universeClaims = /testflight|internal testers/i.test(
      `${stageLabel[product.stage]} ${product.status} ${product.state.join(" ")}`,
    );
    assert.equal(
      nowClaims,
      universeClaims,
      `/now and /products disagree about TestFlight for ${entry.name}`,
    );
  }
});

test("product links point at the personal universe, not studio chrome", () => {
  for (const entry of nowActiveWork) {
    if (entry.external) continue;
    assert.match(
      entry.href,
      /^\/products\/|^\/you-know-ball\/play$/,
      `${entry.name} links to ${entry.href}, which renders studio chrome on koinophobia.dev`,
    );
  }
});

test("product slugs are unique and every one resolves", () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate product slug");
  for (const slug of slugs) assert.ok(getProduct(slug), `${slug} does not resolve`);
  assert.equal(getProduct("does-not-exist"), undefined);
});

test("every product action link is usable by a stranger", () => {
  for (const product of products) {
    for (const action of product.actions) {
      if (action.external || action.href.startsWith("mailto:")) {
        assert.match(action.href, /^(https?:|mailto:)/, `${product.name}: ${action.href}`);
        continue;
      }
      const segments = action.href.replace(/^\//, "").split("/");
      const parent = segments.slice(0, -1).join("/");
      const candidates = [
        `app/${segments.join("/")}/page.tsx`,
        `app/dev/${segments.join("/")}/page.tsx`,
        ...(parent ? [`app/dev/${parent}/[slug]/page.tsx`] : []),
      ];
      assert.ok(
        candidates.some((file) => exists(file)),
        `${product.name}: ${action.href} resolves to nothing`,
      );
    }
  }
});

/* ---------- field notes ---------- */

test("held field notes stay in the repo but off the site", () => {
  const held = notes.filter((note) => !note.published);
  assert.ok(held.length > 0, "expected at least one note held for Blake's review");
  for (const note of held) {
    assert.ok(
      note.body.length > 0,
      `held note ${note.slug} was emptied — hold means unpublished, never deleted`,
    );
    assert.equal(getNote(note.slug), undefined, `held note ${note.slug} still resolves`);
  }
});

test("published field notes are specific, dated, and resolvable", () => {
  assert.ok(publishedNotes.length >= 3);
  for (const note of publishedNotes) {
    assert.ok(getNote(note.slug), `${note.slug} does not resolve`);
    assert.match(
      note.date,
      /^[A-Z][a-z]+ \d{1,2}, \d{4}(\s·\s.+)?$/,
      `${note.slug} has a malformed date`,
    );
    assert.ok(note.body.length >= 3, `${note.slug} is too thin to be a field note`);
    assert.match(
      note.body.join(" "),
      /\d/,
      `${note.slug} cites no specifics — it reads as an essay, not a note`,
    );
  }
  assert.equal(new Set(notes.map((n) => n.slug)).size, notes.length, "duplicate note slug");
});

test("a review file exists for the notes written in Blake's voice", () => {
  assert.ok(exists("docs/FIELD-NOTES-REVIEW.md"));
  const review = read("docs/FIELD-NOTES-REVIEW.md");
  for (const note of notes) {
    assert.ok(review.includes(note.slug), `${note.slug} is unreviewed`);
  }
});

test("the sitemap lists only published notes", () => {
  const sitemap = read("app/dev-sitemap.xml/route.ts");
  assert.match(sitemap, /publishedNotes/);
  assert.doesNotMatch(sitemap, /\bnotes\.map\b/);
});

/* ---------- design system ---------- */

test("each product has a distinct visual world", () => {
  const themes = products.map((p) => p.identity.theme);
  assert.equal(new Set(themes).size, themes.length, "two products share a theme");

  const css = read("app/dev-product.css");
  const system = read("app/dev-system.css");
  for (const theme of themes) {
    assert.ok(
      system.includes(`[data-world="${theme}"]`),
      `${theme} has no accent tokens in dev-system.css`,
    );
    assert.ok(
      css.includes(`[data-world="${theme}"]`),
      `${theme} has accent tokens but no rhythm overrides — that's a skin, not an identity`,
    );
  }
});

test("the design tokens are defined exactly once", () => {
  const files = [
    "app/dev-system.css",
    "app/dev-home.css",
    "app/now-dev.css",
    "app/connect-card.css",
    "app/resume-dev.css",
  ];
  const definitions = files.filter((file) => read(file).includes("--dh-ink:"));
  assert.deepEqual(definitions, ["app/dev-system.css"], "palette tokens are duplicated again");
});

test("every experiment reports what it showed", () => {
  for (const experiment of experiments) {
    assert.ok(experiment.finding.length > 30, `${experiment.name} has no finding`);
  }
});
