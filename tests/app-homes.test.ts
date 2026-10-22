import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import AppPricing from "../components/apps/AppPricing";
import AppFounder from "../components/apps/AppFounder";
import { appWorlds } from "../components/apps/AppWorlds";
import AppStoreBadge from "../components/site/AppStoreBadge";
import { appHomes, APP_PAGES_PRERELEASE, publicAppHomes, showPrereleaseAppPages } from "../lib/app-homes";
import { appPrices, priceLine } from "../lib/app-prices";
import { shippedProducts } from "../lib/products";
import { dreamcatcherRelease } from "../lib/releases";
import sitemap from "../app/sitemap";

const root = path.resolve(import.meta.dirname, "..");
test("every rendered price and billing term comes from the single prices config", () => {
  for (const app of Object.values(appHomes)) {
    const html = renderToStaticMarkup(createElement(AppPricing, { slug: app.slug, free: app.free, prerelease: app.prerelease }));
    const $ = load(html);
    assert.match($.text(), /Free to download/);
    assert.deepEqual([...$.text().matchAll(/\$(\d+\.\d{2})/g)].map(match => match[1]), appPrices[app.slug].map(price => price.amount));
    $("dl > div").each((i, row) => {
      const price = appPrices[app.slug][i];
      assert.ok($(row).find("dt").text().startsWith(price.name));
      assert.equal($(row).find("dd span").text(), price.term);
    });
    const card = shippedProducts.find(product => product.href === `/${app.slug}`);
    if (card) assert.equal(card.appStore?.priceLine, priceLine(app.slug));
  }
});
test("no page or product copy contains the false no-purchases claim", () => {
  for (const dir of ["app", "components", "lib"]) {
    for (const file of fs.readdirSync(path.join(root, dir), { recursive: true }) as string[]) {
      if (/\.(tsx?|json)$/.test(file)) assert.doesNotMatch(fs.readFileSync(path.join(root, dir, file), "utf8"), /no purchases/i, `${dir}/${file}`);
    }
  }
});
test("coming-soon homes are public by Blake's decision, without App Store buttons", () => {
  assert.equal(APP_PAGES_PRERELEASE, true);
  assert.deepEqual(publicAppHomes().map(app => app.slug).sort(), ["dreamcatcher", "forget-about-it", "old-dog", "preaching-to-the-choir", "teachers-pet", "trendi", "way-in"]);
  assert.equal(appHomes["teachers-pet"].store, undefined, "Teacher's Pet must not link to the App Store before approval");
  assert.equal(appHomes["teachers-pet"].prerelease, true);
  assert.equal(appHomes["old-dog"].platforms, "Mac");
  assert.equal(appHomes["teachers-pet"].coming, "Coming to the Mac App Store");
});
test("Dreamcatcher's live page renders its real store button and free download pricing", () => {
  const app = appHomes.dreamcatcher;
  assert.equal(app.store, dreamcatcherRelease.url);
  assert.equal(app.prerelease, undefined);
  assert.equal(app.coming, undefined);
  const $ = load(renderToStaticMarkup(createElement(appWorlds.dreamcatcher)));
  assert.equal($("a[aria-label='Download Dreamcatcher on the App Store']").attr("href"), dreamcatcherRelease.url);
  assert.equal($(".app-home__free h3").text(), "Free to download");
  assert.doesNotMatch($.text(), /coming to|when released|pending review|pending App Review|planned pricing|not available to buy/i);
  assert.ok(sitemap().some(entry => entry.url.endsWith("/dreamcatcher")));
});
test("store badge accessible labels name each live app and the correct store", () => {
  for (const app of Object.values(appHomes).filter(app => app.store)) {
    const $ = load(renderToStaticMarkup(createElement(AppStoreBadge, { product: app.slug, url: app.store!, placement: "product_hero" })));
    const store = app.slug === "old-dog" ? "Mac App Store" : "App Store";
    assert.equal($("a").attr("aria-label"), `Download ${app.name} on the ${store}`);
    assert.equal($("a > span > span").text(), store);
  }
});
test("coming-soon price cards qualify free downloads with when released", () => {
  for (const app of Object.values(appHomes).filter(app => app.prerelease)) {
    const $ = load(renderToStaticMarkup(createElement(AppPricing, { slug: app.slug, free: app.free, prerelease: app.prerelease })));
    assert.equal($("h3").text(), "Free to download when released");
    assert.equal($("a[href*='apps.apple.com']").length, 0);
  }
});
test("app copy excludes the rejected claims and has distinct feature headings", () => {
  assert.doesNotMatch(JSON.stringify(appHomes), /Nothing is invented|Catch it\. Keep your words\./i);
  assert.equal(new Set(Object.values(appHomes).map(app => app.featureHeading)).size, 7);
  assert.match(appHomes["way-in"].free, /Full review, editing, and export of saved résumés require an eligible purchase\./);
});
test("founder notes are verbatim lines from Blake (inventory or chat) with a factual receipt", () => {
  const notes = {
    trendi: "Every product here started as something I needed the week I needed it.",
    "way-in": "Nothing here stayed an idea.",
    "forget-about-it": "The simulator votes. The device decides.",
    "old-dog": "Taste and judgment are the job.",
    "teachers-pet": "I built Teacher’s Pet because learning shouldn’t feel like figuring out what you’re supposed to learn next.", // Blake, chat, 2026-10-16
    dreamcatcher: "The fear of an ordinary life, and what I did about it.",
  };
  for (const app of Object.values(appHomes)) {
    const expected = notes[app.slug as keyof typeof notes];
    assert.equal(app.founderNote, expected);
    const $ = load(renderToStaticMarkup(createElement(AppFounder, { founderNote: app.founderNote })));
    assert.equal($(".app-home__founder-note").text(), expected || "");
    assert.equal($(".app-home__sign-off").text(), "Designed, built and shipped by Blake Taylor in Chicago.");
    assert.equal($("#founder-title").text(), expected ? "From Blake" : "The builder");
    assert.equal($("blockquote").length, 0);
  }
});
test("all seven homes have original assets and three to five sourced features", () => {
  for (const app of Object.values(appHomes)) {
    assert.ok(app.features.length >= 3 && app.features.length <= 5);
    assert.ok(fs.existsSync(path.join(root, `public/apps/${app.slug}/icon.png`)));
    app.screens.forEach((_, i) => assert.ok(fs.existsSync(path.join(root, `public/apps/${app.slug}/shot-${i + 1}.png`))));
    assert.ok(!app.screens.some(caption => /device frame/i.test(caption)));
  }
});
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test("app palettes meet WCAG AA for text, accents, and card copy", () => {
  for (const app of Object.values(appHomes)) {
    for (const [foreground, background] of [[app.colors.ink, app.colors.paper], [app.colors.muted, app.colors.paper], [app.colors.accent, app.colors.paper], [app.colors.ink, app.colors.surface], [app.colors.muted, app.colors.surface]]) {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${app.slug}: ${foreground} on ${background}`);
    }
  }
});

test("seven worlds render distinct compositions with the correct listing provenance", () => {
  const compositions = { trendi: ".greenroom-stage", "way-in": ".path-waypoints", "forget-about-it": ".diary-entry", "preaching-to-the-choir": ".choir-arc", "old-dog": ".reading-desk", "teachers-pet": ".school-stepper", dreamcatcher: ".dream-phase" };
  for (const app of Object.values(appHomes)) {
    const $ = load(renderToStaticMarkup(createElement(appWorlds[app.slug])));
    assert.ok($(compositions[app.slug]).length);
    assert.equal($("h1").length, 1);
    assert.equal($("#pricing").length, 1);
    assert.match($.text(), app.prerelease ? /From the submitted listing/ : /From the App Store listing/);
    assert.doesNotMatch($.text(), /A look inside\.|Made to be used\.|Start here\./);
    if (app.prerelease) {
      assert.equal($("a[href*='apps.apple.com']").length, 0);
      assert.equal($(".app-home__coming").prop("tagName"), "P");
    }
    $(".world-art img").each((_, el) => assert.equal($(el).attr("alt"), ""));
  }
});
test("rejected imagery and claims cannot reappear in world output", () => {
  const render = (slug: keyof typeof appWorlds) => load(renderToStaticMarkup(createElement(appWorlds[slug])));
  const old = render("old-dog");
  assert.doesNotMatch(old.html(), /iphone-shot|Business|Courses planned/);
  assert.ok(old("img[src*='shot-5-crop']").length);
  assert.equal(old(".catalog-cards article").length, 10);
  const dream = render("dreamcatcher");
  dream(".world-shot img").each((_, el) => assert.match(dream(el).attr("src")!, /shot-[123]-crop/));
  assert.equal(dream(".dream-hoop path").length, 8);
  assert.equal(dream(".dream-hoop polygon").length, 2);
  assert.equal(dream(".morning").length, 1);
  assert.doesNotMatch(dream.text(), /sleep quality|better sleep|dream meaning|No analytics|Face ID/);
  const school = render("teachers-pet");
  assert.doesNotMatch(school.text(), /1,273|318 units|52 courses|13 grade levels/);
  assert.ok(school("img[src*='shot-1-crop']").length);
  assert.ok(school("img[src*='shot-2-crop']").length);
  assert.match(school.text(), /one supervised check—not a mastery grade or proof of learning/);
  assert.doesNotMatch(render("trendi").text(), /Take Two|viral|auto-post/);
  assert.doesNotMatch(render("preaching-to-the-choir").text(), /unlock|premium|trial|nothing leaves the phone/i);
});
test("each subscription option carries renewal text and every original price remains exact", () => {
  for (const app of Object.values(appHomes)) {
    const $ = load(renderToStaticMarkup(createElement(AppPricing, { slug: app.slug, free: app.free, prerelease: app.prerelease })));
    $("dl > div").each((i, row) => {
      const term: string = appPrices[app.slug][i].term;
      assert.equal($(row).find(".renewal").length, ["monthly", "yearly", "first year"].includes(term) ? 1 : 0);
    });
    assert.match($.text(), /USA/);
  }
});
test("route-local fonts, shared shell, and motion constraints are explicit", () => {
  for (const app of Object.values(appHomes)) {
    const layout = fs.readFileSync(path.join(root, `app/${app.slug}/layout.tsx`), "utf8");
    assert.match(layout, /next\/font\/google/);
    assert.doesNotMatch(layout, /\bInter\b/);
    assert.equal((layout.match(/const (body|display) = /g) || []).length, 2);
  }
  const home = fs.readFileSync(path.join(root, "components/apps/AppHome.tsx"), "utf8");
  assert.doesNotMatch(home, /next\/font|Masthead|SiteFooter|Work With Us/);
  assert.match(home, /width=\{48\}/);
  assert.match(home, /prefetch=\{false\}/);
  const motion = fs.readFileSync(path.join(root, "components/apps/WorldBehavior.tsx"), "utf8");
  assert.doesNotMatch(motion, /requestAnimationFrame|setInterval/);
  assert.match(motion, /prefers-reduced-motion: no-preference/);
});

test("each app carries Blake's one-liner on its page, studio card and Also-from row", () => {
  const lines = {
    trendi: "Turn messy ideas into content worth posting.",
    "way-in": "Turn a messy career search into a clear way forward.",
    "forget-about-it": "Turn scattered memories into something you can actually find again.",
    "preaching-to-the-choir": "Turn scattered thoughts into a prayer you can return to.",
    "old-dog": "Turn \u201cI should learn that\u201d into actually knowing it.",
    "teachers-pet": "Turn messy learning into a clear path through school.",
    dreamcatcher: "Turn half-remembered dreams into words you can keep.",
  };
  for (const app of Object.values(appHomes)) assert.equal(app.tagline, lines[app.slug as keyof typeof lines]);
});
