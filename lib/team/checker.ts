import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
import type { Finding } from "./types";
import { Fault } from "./domain";
export function publicAddress(address: string) {
  try {
    const ip = ipaddr.process(address);
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}
export async function validateTarget(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Fault("Enter a full http:// or https:// URL.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  )
    throw new Fault("Use a public HTTP or HTTPS website on a standard port.");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((x) => !publicAddress(x.address)))
    throw new Fault(
      "Private, loopback and reserved network addresses cannot be checked.",
    );
  return { url, address: addresses[0] };
}
export interface PageResponse {
  url: string;
  status: number;
  html: string;
  duration: number;
  contentType: string;
}
export async function fetchPage(
  raw: string,
  redirects = 0,
): Promise<PageResponse> {
  if (redirects > 4) throw new Fault("Too many redirects.");
  const { url, address } = await validateTarget(raw);
  const start = performance.now();
  const response = await new Promise<{
    status: number;
    html: string;
    location?: string;
    contentType: string;
  }>((resolve, reject) => {
    const request = (url.protocol === "https:" ? https : http).get(
      url,
      {
        headers: {
          "User-Agent": "KoinophobiaTeamSiteCheck/1.0",
          Accept: "text/html",
          "Accept-Encoding": "identity",
        },
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000)
            request.destroy(
              new Error("Response exceeded the 2 MB check limit."),
            );
          else chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            html: Buffer.concat(chunks).toString("utf8"),
            location: res.headers.location,
            contentType: res.headers["content-type"] ?? "",
          }),
        );
      },
    );
    const timer = setTimeout(
      () => request.destroy(new Error("Request timed out after 8 seconds.")),
      8000,
    );
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
  });
  if (response.status >= 300 && response.status < 400 && response.location) {
    const next = await fetchPage(
      new URL(response.location, url).href,
      redirects + 1,
    );
    return { ...next, duration: Math.round(performance.now() - start) };
  }
  return {
    ...response,
    url: url.href,
    duration: Math.round(performance.now() - start),
  };
}
export function inspectHtml(page: PageResponse): {
  findings: Finding[];
  links: string[];
} {
  const $ = load(page.html);
  const findings: Finding[] = [];
  const add = (name: string, ok: boolean, yes: string, no: string) =>
    findings.push({
      name,
      status: ok ? "pass" : "review",
      detail: ok ? yes : no,
    });
  add(
    "HTTPS",
    page.url.startsWith("https:"),
    "Final page was retrieved over HTTPS with certificate verification.",
    "Final page was retrieved over HTTP, without transport encryption.",
  );
  add(
    "Page response",
    page.status >= 200 && page.status < 300,
    `HTTP ${page.status} returned.`,
    `HTTP ${page.status} returned; page content may be an error document.`,
  );
  if (
    page.status < 200 ||
    page.status >= 300 ||
    !page.contentType.toLowerCase().includes("text/html")
  ) {
    [
      "Mobile viewport",
      "Page title",
      "Meta description",
      "Tappable phone",
      "Contact / booking links",
    ].forEach((name) =>
      findings.push({
        name,
        status: "unknown",
        detail:
          "Not assessed: the server did not return a successful HTML page.",
      }),
    );
    return { findings, links: [] };
  }
  const viewport =
    $("meta")
      .filter(
        (_, el) => ($(el).attr("name") ?? "").toLowerCase() === "viewport",
      )
      .attr("content") ?? "";
  add(
    "Mobile viewport",
    /width\s*=\s*device-width/i.test(viewport),
    "A device-width viewport meta tag was found.",
    "No device-width viewport meta tag was found in the returned HTML.",
  );
  add(
    "Page title",
    !!$("title").text().trim(),
    "A non-empty page title was found.",
    "No non-empty page title was found in the returned HTML.",
  );
  add(
    "Meta description",
    !!$("meta")
      .filter(
        (_, el) => ($(el).attr("name") ?? "").toLowerCase() === "description",
      )
      .attr("content")
      ?.trim(),
    "A non-empty meta description was found.",
    "No non-empty meta description was found in the returned HTML.",
  );
  $("script,style,noscript,template").remove();
  const phones = (
    $("body")
      .text()
      .match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g) ?? []
  ).map((x) => x.replace(/\D/g, "").slice(-10));
  const tappable = $('a[href^="tel:"]')
    .toArray()
    .map((el) => ($(el).attr("href") ?? "").replace(/\D/g, "").slice(-10));
  findings.push({
    name: "Tappable phone",
    status: phones.length
      ? phones.every((x) => tappable.includes(x))
        ? "pass"
        : "review"
      : "unknown",
    detail: phones.length
      ? phones.every((x) => tappable.includes(x))
        ? "Detected US-format phone numbers have matching tel: links."
        : "At least one detected US-format phone number has no matching tel: link."
      : "No US-format phone number detected. Other formats and rendered content were not assessed.",
  });
  const links: string[] = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const label = $(el).text();
    if (!/contact|book|appointment|schedule/i.test(`${href} ${label}`)) return;
    if (!href || href === "#") {
      findings.push({
        name: "Contact / booking link",
        status: "review",
        detail: `A contact or booking link has ${href ? "only a # target" : "no href"}. JavaScript behavior was not tested.`,
      });
      return;
    }
    if (/^(tel:|mailto:|javascript:|#)/i.test(href)) return;
    try {
      const target = new URL(href, page.url);
      if (["https:", "http:"].includes(target.protocol))
        links.push(target.href);
    } catch {
      findings.push({
        name: "Contact / booking link",
        status: "review",
        detail: "A contact or booking link has an invalid URL.",
      });
    }
  });
  return { findings, links: [...new Set(links)] };
}
export async function checkSite(raw: string, fetcher = fetchPage) {
  const page = await fetcher(raw);
  const { findings, links } = inspectHtml(page);
  findings.push({
    name: "HTML response time",
    status: "pass",
    detail: `${page.duration} ms to fetch the HTML response from this server, including redirects. This is not browser load time or Core Web Vitals.`,
  });
  for (const link of links.slice(0, 5)) {
    try {
      const result = await fetcher(link);
      findings.push({
        name: "Contact / booking link",
        status:
          result.status >= 200 && result.status < 400
            ? "pass"
            : result.status === 404 || result.status === 410
              ? "review"
              : "unknown",
        detail: `${link} → HTTP ${result.status}. Forms and booking completion were not tested.`,
      });
    } catch (error) {
      findings.push({
        name: "Contact / booking link",
        status: "unknown",
        detail: `${link} → could not verify (${error instanceof Error ? error.message : "request failed"}).`,
      });
    }
  }
  if (
    !links.length &&
    !findings.some((x) => x.name.includes("Contact / booking"))
  )
    findings.push({
      name: "Contact / booking links",
      status: "unknown",
      detail:
        "No HTTP contact or booking links detected in the returned HTML. JavaScript-only links were not tested.",
    });
  if (links.length > 5)
    findings.push({
      name: "Check limit",
      status: "unknown",
      detail: `Checked 5 of ${links.length} detected contact / booking links.`,
    });
  return {
    url: raw,
    final_url: page.url,
    measured_at: new Date().toISOString(),
    duration_ms: page.duration,
    findings,
  };
}
