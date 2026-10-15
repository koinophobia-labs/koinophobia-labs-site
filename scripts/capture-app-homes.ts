import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { appHomes } from "../lib/app-homes";
import { appPrices } from "../lib/app-prices";
async function main() {
const base = process.env.QA_BASE ?? "http://localhost:3128";
const output = process.env.QA_OUT ?? "Evidence/WO-0127/final";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    for (const app of Object.values(appHomes)) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(`${base}/${app.slug}`, { waitUntil: "networkidle", timeout: 60000 });
      assert.equal(response?.status(), 200, app.slug);
      await page.evaluate(() => document.fonts.ready);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('href'), '#app-main', 'skip link is first focusable element');
      await page.keyboard.press('Enter');
      assert.ok(await page.locator('#app-main').evaluate(el => el.getBoundingClientRect().top <= 1), 'skip link reaches main');
      const gallery = page.locator('.app-home__gallery');
      // Exercise every scroll position and decode each real image before capturing.
      for (const figure of await gallery.locator('figure').all()) {
        await figure.scrollIntoViewIfNeeded();
        await figure.locator('img').evaluate(async (image: HTMLImageElement) => { await image.decode(); });
      }
      await gallery.evaluate(el => { el.scrollLeft = 0; });
      await page.evaluate(() => window.scrollTo(0, 0));
      const facts = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        headingFont: getComputedStyle(document.querySelector('h1')!).fontFamily,
        imageSources: Array.from(document.querySelectorAll('.app-home__gallery img')).map(image => (image as HTMLImageElement).currentSrc),
        prices: Array.from(document.querySelectorAll('[data-price]')).map(el => el.textContent),
        body: document.body.innerText,
        introColor: getComputedStyle(document.querySelector('.app-home__intro')!).color,
        galleryScrollable: document.querySelector('.app-home__gallery')!.scrollWidth > document.querySelector('.app-home__gallery')!.clientWidth,
      }));
      assert.ok(facts.overflow <= 1, `${app.slug} @${width}: ${facts.overflow}px overflow`);
      assert.match(facts.headingFont, /Gelasio|Newsreader|Source Serif/);
      assert.deepEqual(facts.prices, appPrices[app.slug].map(price => `$${price.amount}`));
      assert.deepEqual([...facts.body.matchAll(/\$(\d+\.\d{2})/g)].map(match => match[1]), appPrices[app.slug].map(price => price.amount));
      assert.doesNotMatch(facts.body, /no purchases|Nothing is invented|Catch it\. Keep your words\.|IPhone/);
      assert.equal(await page.locator('.app-home__founder-note, .app-home__founder blockquote').count(), 0);
      assert.equal(await page.locator('.app-home__sign-off').innerText(), 'Designed, built and shipped by Blake Taylor in Chicago.');
      assert.equal(await page.locator('.app-home__sign-off').evaluate(el => getComputedStyle(el).color), facts.introColor, 'factual sign-off uses readable app ink');
      assert.equal(await page.locator('#features-title').innerText(), app.featureHeading);
      if (app.platforms.includes('iPhone')) assert.match(await page.locator('.app-home__identity small').innerText(), /iPhone/);
      if (app.slug === 'trendi') assert.match(await page.locator('.app-home__hero .app-home__eyebrow').innerText(), /iPhone/);
      assert.ok(facts.imageSources.every(src => src.includes('/_next/image?')), 'optimized screenshots');
      assert.equal(errors.length, 0, errors.join('\n'));
      if (app.prerelease) {
        assert.equal(await page.locator('.app-home__coming').innerText(), app.coming);
        assert.equal(await page.locator('main a[href*="apps.apple.com"]').count(), 0);
        assert.match(await page.locator('.app-home__text-link').innerText(), /Free to download when released/);
        assert.equal(await page.locator('.app-home__free h3').innerText(), 'Free to download when released');
        assert.equal(await page.locator('.app-home__coming').evaluate(el => el.matches('a, button, [tabindex], [role="button"]')), false);
      } else {
        assert.equal(await page.locator('main a[href*="apps.apple.com"]').count(), 1);
        assert.equal(await page.locator('.store__badge').getAttribute('aria-label'), `Download ${app.name} on the ${app.slug === 'old-dog' ? 'Mac App Store' : 'App Store'}`);
      }
      if (app.slug === 'old-dog') {
        for (const target of await page.locator('main a').all()) {
          const box = await target.boundingBox();
          assert.ok(box && box.height >= 24 && box.width >= 24, `Old Dog link target: ${await target.innerText()}`);
        }
        for (const label of await page.locator('main .app-home__eyebrow, .app-home__scroll-hint, .app-home__number, figcaption').all()) {
          assert.ok(await label.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 13));
        }
        if (width === 390) {
          assert.equal(await gallery.locator('img').first().evaluate(el => el.getBoundingClientRect().width), width);
          assert.ok(facts.galleryScrollable);
          assert.equal(await gallery.evaluate(el => getComputedStyle(el).scrollSnapType), 'x mandatory');
        }
      }
      if (app.slug === 'dreamcatcher' && width === 1440) {
        assert.equal(await page.locator('.app-home__feature-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(track => parseFloat(track) > 0).length), 3);
      }
      if (width === 390) {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
      }
      const screenshot = `${output}/${app.slug}-${width === 390 ? 'phone' : 'desktop'}.png`;
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.screenshot({ path: screenshot, fullPage: true });
      const record = { ...facts, body: undefined };
      report.push({ slug: app.slug, width, screenshot, ...record, errors });
      console.log(`${app.slug} @${width}: PASS`);
      await page.close();
    }
  }
  await fs.writeFile(`${output}/browser-qa.json`, JSON.stringify({ base, at: new Date().toISOString(), report }, null, 2));
} finally { await browser.close(); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
