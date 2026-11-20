import test from "node:test";
import assert from "node:assert/strict";
import {
  publicAddress,
  inspectHtml,
  checkSite,
  validateTarget,
} from "../lib/team/checker";
const page = (html: string) => ({
  html,
  status: 200,
  url: "https://example.test",
  contentType: "text/html",
  duration: 123,
});
test("checker detects missing metadata and untappable visible number", () => {
  const result = inspectHtml(
    page('<html><body>312-555-0100<a href="/book">Book</a></body></html>'),
  );
  assert.equal(
    result.findings.find((x) => x.name === "Mobile viewport")?.status,
    "review",
  );
  assert.equal(
    result.findings.find((x) => x.name === "Tappable phone")?.status,
    "review",
  );
  assert.deepEqual(result.links, ["https://example.test/book"]);
});
test("checker recognizes valid metadata and matching phone link", () => {
  const result = inspectHtml(
    page(
      '<title>Test</title><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Hello"><body><a href="tel:+13125550100">312-555-0100</a></body>',
    ),
  );
  assert.ok(result.findings.every((x) => x.status === "pass"));
});
test("error page is not misreported as missing client site metadata", () => {
  const result = inspectHtml({ ...page("Forbidden"), status: 403 });
  assert.equal(
    result.findings.find((x) => x.name === "Mobile viewport")?.status,
    "unknown",
  );
});
test("no detected phone is unknown, not a defect", () => {
  assert.equal(
    inspectHtml(page("<body>Hello</body>")).findings.find(
      (x) => x.name === "Tappable phone",
    )?.status,
    "unknown",
  );
});
test("all private, loopback, metadata and mapped IPs rejected", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "192.168.0.1",
    "172.16.0.1",
    "::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "0.0.0.0",
    "100.64.0.1",
  ])
    assert.equal(publicAddress(ip), false, ip);
  assert.equal(publicAddress("1.1.1.1"), true);
});
test("URL validation rejects non-http, credentials, nonstandard ports and localhost", async () => {
  for (const url of [
    "file:///etc/passwd",
    "https://user:pass@example.com",
    "https://example.com:3000",
    "http://127.0.0.1",
    "http://[::1]",
  ])
    await assert.rejects(validateTarget(url));
});
test("contact link 404 measured; 403 is unverified; no fabricated load metric", async () => {
  const result = await checkSite("https://example.test", async (url) =>
    url.endsWith("/book")
      ? { ...page(""), url, status: 404 }
      : url.endsWith("/contact")
        ? { ...page(""), url, status: 403 }
        : page('<a href="/book">Book</a><a href="/contact">Contact</a>'),
  );
  assert.ok(
    result.findings.some(
      (x) => x.status === "review" && x.detail.includes("404"),
    ),
  );
  assert.ok(
    result.findings.some(
      (x) => x.status === "unknown" && x.detail.includes("403"),
    ),
  );
  assert.ok(
    result.findings.some((x) => x.detail.includes("not browser load time")),
  );
});
test("link checks bounded to five and surplus disclosed", async () => {
  let calls = 0;
  const result = await checkSite("https://example.test", async (url) => {
    calls++;
    return page(
      url === "https://example.test"
        ? Array.from(
            { length: 7 },
            (_, i) => `<a href="/book/${i}">Book</a>`,
          ).join("")
        : "",
    );
  });
  assert.equal(calls, 6);
  assert.ok(result.findings.some((x) => x.name === "Check limit"));
});
