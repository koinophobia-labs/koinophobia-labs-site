/** Display only: translate the recorded finding without changing proof or measurements. */
export interface DisplayFinding {
  check?: string;
  name?: string;
  key?: string;
  measurement?: string;
  detail?: string;
  label?: string;
}
export const TECHNICAL_WORDS = /\b(?:LCP|ms|Chromium|Core Web Vitals|lab)\b/i;
export function slowSeconds(f: DisplayFinding): number | null {
  if ((f.check ?? f.name) !== "Slow page") return null;
  const match = (f.measurement ?? f.detail ?? "").match(/median LCP (\d+(?:\.\d+)?) ms\b/i);
  return match && Number(match[1]) > 0 ? Math.round(Number(match[1]) / 1000) : null;
}
export function plainFinding(f: DisplayFinding): string {
  const text = f.measurement ?? f.detail ?? "";
  const check = f.check ?? f.name;
  switch (check) {
    case "Slow page": {
      const seconds = slowSeconds(f);
      if (seconds !== null) return `Your site's main content takes about ${seconds} seconds to appear (Google calls under 2.5 seconds good). People on phones may leave while they wait.`;
      const load = text.match(/median load (\d+(?:\.\d+)?) ms\b/i);
      if (load && Number(load[1]) > 0) return `Your page takes about ${Math.round(Number(load[1]) / 1000)} seconds to finish loading. People on phones may leave while they wait.`;
      break;
    }
    case "Dead contact / booking / order link":
      return f.label?.trim() && !TECHNICAL_WORDS.test(f.label)
        ? `Your '${f.label.trim()}' button goes to a page that doesn't work.`
        : "A link on your site goes to a page that doesn't work.";
    case "Closed Google Form": return "Your form is no longer accepting responses.";
    case "HTTPS failure":
      if (f.key === "mixed-content" || /blocked mixed HTTP content/.test(text)) return "Your browser blocks some images because they use an unprotected connection.";
      if (f.key === "https-refused" || /refused connections on HTTPS/.test(text)) return "Your site opens without a secure connection, but its secure address doesn't work.";
      return "Browsers show a security warning when opening your site.";
    case "Expiring certificate": {
      const date = text.match(/\b(\d{4}-\d{2}-\d{2})(?:T[\d:.]+Z)?\b/)?.[1];
      if (date && !Number.isNaN(Date.parse(date))) return `Your site's security certificate expires on ${date}; if it is not renewed, browsers will warn visitors away after that date.`;
      break;
    }
    case "Mobile layout":
      if (f.key === "overlapping-targets" || /tap targets overlap/.test(text)) return "On a phone, some buttons overlap, making them hard to tap.";
      if (f.key === "tiny-primary-text" || /paragraph renders at/.test(text)) return "On a phone, some of your main text is very small and hard to read.";
      if (f.key === "zoomed-out" || /scaled to/.test(text)) return "On a phone, your page is shrunk down to fit, making it harder to read.";
      if (f.key === "horizontal-overflow" || /content extends .* beyond the viewport/.test(text)) return "On a phone, your page is wider than the screen, so people have to scroll sideways.";
      break;
    case "Mobile contact route": return "On a phone, there's no visible call, contact or booking option until you scroll down.";
    case "Unfinished content": return /coming soon|under construction/i.test(text)
      ? "Your main page says your site is coming soon or under construction."
      : "Your page still shows unfinished template text.";
    case "Wrong key link": return "A social media link on your site goes back to your homepage instead of your profile.";
    case "Broken image": return "An image on your page doesn't load.";
    case "Booking widget failure": return "The booking tool on your page shows an error instead of loading.";
    case "Insecure form": return "Your form is set to send information through an unprotected connection. We haven't submitted it to check what happens.";
    case "Lighthouse mobile performance": return "Your page scored poorly in a phone speed check.";
  }
  // Preserve honest existing copy. Technical-only unknowns remain available in details.
  return text && !TECHNICAL_WORDS.test(text) ? text : "This website issue needs a closer look. Open Technical details for the recorded result.";
}
export function sayFinding(f: DisplayFinding): string {
  const seconds = slowSeconds(f);
  return seconds === null ? plainFinding(f)
    : `It's loading slowly — about ${seconds} seconds for the main content to appear. People on their phone may not wait that long.`;
}
/** Old public pages store the measurement. Only recognize signatures produced by our checker. */
export function storedProblemFinding(measurement: string): DisplayFinding {
  const signatures: [RegExp, string][] = [
    [/currently served TLS certificate expires on/, "Expiring certificate"],
    [/certificate-verified TLS handshake failed|refused connections on HTTPS|blocked mixed HTTP content/, "HTTPS failure"],
    [/Three fresh Chromium loads: median LCP/i, "Slow page"],
    [/published action (?:URL|page)/i, "Dead contact / booking / order link"],
    [/Google Forms states that this form/i, "Closed Google Form"],
    [/At 390 px,|At 390 px the rendered layout/, "Mobile layout"],
    [/initial screen has no visible contact or booking control/, "Mobile contact route"],
    [/visible image failed to load/, "Broken image"],
    [/visible booking widget shows an explicit load error/, "Booking widget failure"],
    [/visible form declares a POST action over plain HTTP/, "Insecure form"],
    [/link points to this website's homepage instead of the social profile/, "Wrong key link"],
    [/primary page heading says|unfinished template phrase/, "Unfinished content"],
  ];
  return { measurement, check: signatures.find(([pattern]) => pattern.test(measurement))?.[1] };
}
