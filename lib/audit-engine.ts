import dns from "node:dns/promises";
import net from "node:net";
import { load } from "cheerio";
import type { AuditFinding, AuditMetrics } from "@/lib/audits";
const MAX_HTML = 2_000_000,
  MAX_LINKS = 25,
  TIMEOUT = 10000;
const privateIp = (ip: string) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  } else
    return (
      ip === "::1" ||
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      ip.startsWith("fe80") ||
      ip === "::"
    );
};
export async function assertPublicUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    throw Error("Website URL is invalid");
  }
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
    throw Error("Only public HTTP(S) URLs are allowed");
  if (u.port && !["80", "443"].includes(u.port))
    throw Error("Non-standard ports are not allowed");
  const addresses = await dns.lookup(u.hostname, { all: true });
  if (!addresses.length || addresses.some((x) => privateIp(x.address)))
    throw Error("Private or local network targets are not allowed");
  u.hash = "";
  return u;
}
async function safeFetch(url: URL, method = "GET") {
  await assertPublicUrl(url.href);
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), TIMEOUT),
    start = Date.now();
  try {
    const r = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "KoinophobiaLabsAudit/1.0 (+https://koinophobialabs.com)",
      },
    });
    return { response: r, ms: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}
const finding = (
  category: AuditFinding["category"],
  severity: AuditFinding["severity"],
  title: string,
  evidence: string,
  recommendation: string,
  measured = true,
): AuditFinding => ({
  id: crypto.randomUUID(),
  category,
  severity,
  title,
  evidence,
  recommendation,
  measured,
  selectedForProposal: ["critical", "high"].includes(severity),
});
export async function runWebsiteAudit(raw: string) {
  const initial = await assertPublicUrl(raw),
    first = await safeFetch(initial);
  let response = first.response,
    final = initial,
    redirected = false;
  for (
    let i = 0;
    i < 4 && response.status >= 300 && response.status < 400;
    i++
  ) {
    const loc = response.headers.get("location");
    if (!loc) break;
    const next = new URL(loc, final);
    if (
      next.hostname !== initial.hostname &&
      next.hostname !== `www.${initial.hostname}` &&
      `www.${next.hostname}` !== initial.hostname
    )
      throw Error("Redirect left the target website");
    final = await assertPublicUrl(next.href);
    response = (await safeFetch(final)).response;
    redirected = true;
  }
  if (!response.ok) throw Error(`Target returned HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) throw Error("Target did not return HTML");
  const reader = response.body?.getReader();
  if (!reader) throw Error("No response body");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const read = await reader.read();
    if (read.done) break;
    if (read.value) {
      total += read.value.length;
      if (total > MAX_HTML) throw Error("HTML exceeded the 2 MB audit limit");
      chunks.push(read.value);
    }
  }
  const html = Buffer.concat(chunks),
    $ = load(html),
    findings: AuditFinding[] = [];
  const title = $("title").first().text().trim(),
    description = $("meta[name=description]").attr("content")?.trim() || "",
    h1 = $("h1").length,
    images = $("img").length,
    missingAlt = $("img").filter(
      (_, e) => !($(e).attr("alt") || "").trim(),
    ).length,
    forms = $("form").length,
    fields = $("input:not([type=hidden]),select,textarea").toArray(),
    unlabeled = fields.filter((e) => {
      const id = $(e).attr("id"),
        aria = $(e).attr("aria-label") || $(e).attr("aria-labelledby");
      return (
        !aria &&
        !(id && $(`label[for="${id.replaceAll('"', "")}" ]`).length) &&
        !$(e).closest("label").length
      );
    }).length,
    viewport = $("meta[name=viewport]").attr("content") || "",
    lang = $("html").attr("lang") || "";
  if (final.protocol !== "https:")
    findings.push(
      finding(
        "security",
        "critical",
        "Website is not using HTTPS",
        `Final audited URL used ${final.protocol}`,
        "Serve the entire site over HTTPS and redirect HTTP to HTTPS.",
      ),
    );
  else
    findings.push(
      finding(
        "security",
        "positive",
        "HTTPS is active",
        `Final audited URL: ${final.href}`,
        "Keep certificate renewal and HTTP-to-HTTPS redirects monitored.",
      ),
    );
  if (!title)
    findings.push(
      finding(
        "seo",
        "high",
        "Page title is missing",
        "No non-empty <title> was found on the audited page.",
        "Add a unique, descriptive title of roughly 30-60 characters.",
      ),
    );
  else if (title.length < 30 || title.length > 60)
    findings.push(
      finding(
        "seo",
        "medium",
        "Page title length is outside the usual search snippet range",
        `Measured title length: ${title.length} characters. Title: ${title}`,
        "Rewrite the title to clearly describe the page in roughly 30-60 characters.",
      ),
    );
  else
    findings.push(
      finding(
        "seo",
        "positive",
        "Page title is present",
        `Measured title length: ${title.length} characters.`,
        "Keep titles unique across pages.",
      ),
    );
  if (!description)
    findings.push(
      finding(
        "seo",
        "high",
        "Meta description is missing",
        "No meta[name=description] content was found.",
        "Add a specific summary that supports the search intent.",
      ),
    );
  else
    findings.push(
      finding(
        "seo",
        description.length < 70 || description.length > 170
          ? "medium"
          : "positive",
        "Meta description measured",
        `Measured description length: ${description.length} characters.`,
        description.length < 70 || description.length > 170
          ? "Refine it to a concise, specific summary around 70-170 characters."
          : "Keep descriptions specific and unique.",
      ),
    );
  if (h1 !== 1)
    findings.push(
      finding(
        "content",
        h1 === 0 ? "high" : "medium",
        "Heading hierarchy needs attention",
        `Measured ${h1} H1 elements on the audited page.`,
        "Use one clear primary heading that states the page purpose.",
      ),
    );
  else
    findings.push(
      finding(
        "content",
        "positive",
        "One primary heading is present",
        "Measured exactly one H1 element.",
        "Maintain a logical H2/H3 hierarchy below it.",
      ),
    );
  if (!viewport.toLowerCase().includes("width=device-width"))
    findings.push(
      finding(
        "mobile",
        "high",
        "Mobile viewport declaration is missing",
        `Viewport content measured as: ${viewport || "not present"}.`,
        "Add width=device-width and verify responsive layouts on real devices.",
      ),
    );
  else
    findings.push(
      finding(
        "mobile",
        "info",
        "Mobile viewport declaration is present",
        `Viewport content: ${viewport}.`,
        "This does not prove visual responsiveness; test representative device widths separately.",
      ),
    );
  if (missingAlt)
    findings.push(
      finding(
        "accessibility",
        missingAlt / images > 0.25 ? "high" : "medium",
        "Images are missing alternative text",
        `${missingAlt} of ${images} image elements had empty or missing alt text.`,
        "Add meaningful alt text to informative images and intentional empty alt text to decorative images.",
      ),
    );
  else
    findings.push(
      finding(
        "accessibility",
        "positive",
        "Image alt attributes are present",
        `${images} image elements checked; none had a missing or empty alt attribute.`,
        "Manually verify that the text alternatives are meaningful.",
      ),
    );
  if (unlabeled)
    findings.push(
      finding(
        "accessibility",
        "high",
        "Form controls lack detectable labels",
        `${unlabeled} of ${fields.length} visible form controls had no label, aria-label, or aria-labelledby.`,
        "Associate every control with a visible label or accessible name.",
      ),
    );
  if (!lang)
    findings.push(
      finding(
        "accessibility",
        "medium",
        "Document language is missing",
        "The html element had no lang attribute.",
        'Set the document language, such as lang="en".',
      ),
    );
  const links = [
      ...new Set(
        $("a[href]")
          .toArray()
          .flatMap((e) => {
            try {
              const u = new URL($(e).attr("href")!, final);
              return u.origin === final.origin &&
                ["http:", "https:"].includes(u.protocol)
                ? [u.href.split("#")[0]]
                : [];
            } catch {
              return [];
            }
          }),
      ),
    ].slice(0, MAX_LINKS),
    broken: string[] = [];
  for (const href of links) {
    try {
      let r = (await safeFetch(new URL(href), "HEAD")).response;
      if (r.status === 405)
        r = (await safeFetch(new URL(href), "GET")).response;
      if (r.status >= 400) broken.push(`${r.status} ${href}`);
    } catch {
      broken.push(`request failed ${href}`);
    }
  }
  if (broken.length)
    findings.push(
      finding(
        "links",
        "high",
        "Broken same-origin links detected",
        `${broken.length} of ${links.length} checked links failed: ${broken.slice(0, 5).join("; ")}`,
        "Repair or remove the failing internal links, then rerun the audit.",
      ),
    );
  else
    findings.push(
      finding(
        "links",
        "positive",
        "Checked internal links responded",
        `${links.length} unique same-origin links checked; none returned an error status.`,
        "This sample is capped at 25 links on the audited page.",
      ),
    );
  const metrics: AuditMetrics = {
    httpStatus: response.status,
    https: final.protocol === "https:",
    responseMs: first.ms,
    htmlBytes: html.length,
    title,
    descriptionLength: description.length,
    h1Count: h1,
    images,
    imagesMissingAlt: missingAlt,
    forms,
    unlabeledFields: unlabeled,
    brokenLinks: broken.length,
    redirected,
    measurementNote:
      "Server-side HTML and HTTP measurements only. Lighthouse, Core Web Vitals, JavaScript-rendered state, visual responsiveness, color contrast, and full WCAG conformance were not measured.",
  };
  findings.push(
    finding(
      "performance",
      "info",
      "Server response and HTML payload measured",
      `Initial response completed in ${first.ms} ms; HTML response body was ${html.length.toLocaleString()} bytes.`,
      "Use Lighthouse or field monitoring separately for rendering, interaction, and Core Web Vitals.",
    ),
  );
  return {
    finalUrl: final.href,
    summary: `Audited ${final.hostname} using direct HTTP and server-rendered HTML checks. ${findings.filter((f) => ["critical", "high"].includes(f.severity)).length} high-priority issues were measured.`,
    findings,
    metrics,
    pagesChecked: 1,
    linksChecked: links.length,
  };
}
