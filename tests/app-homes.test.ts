import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import AppPricing from "../components/apps/AppPricing";
import { appHomes, APP_PAGES_PRERELEASE, publicAppHomes, showPrereleaseAppPages } from "../lib/app-homes";
import { appPrices, priceLine } from "../lib/app-prices";
import { shippedProducts } from "../lib/products";
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
  for (const slug of ["teachers-pet", "dreamcatcher"]) assert.equal(appHomes[slug].store, undefined, `${slug} must not link to the App Store before approval`);
  assert.equal(appHomes["old-dog"].platforms, "Mac");
  assert.equal(appHomes["teachers-pet"].coming, "Coming to the Mac App Store");
  assert.equal(appHomes.dreamcatcher.coming, "Coming to the App Store");
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
