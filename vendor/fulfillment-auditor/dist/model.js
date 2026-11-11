import { createHash } from 'node:crypto';
export const VERSION = '2.1.4-fulfillment.1';
export const LINK_DELAY_MS = 600_000;
export const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export function blocked(p) {
    return [401, 403, 407, 429].includes(p.status) || /just a moment|access denied|attention required|security verification|verify (?:you are|you're) human|checking your browser|captcha|cloudflare (?:ray|security)|enable javascript and cookies to continue|sorry, you have been blocked/i.test(`${p.title}\n${p.heading}\n${p.text.slice(0, 1600)}`);
}
export function linkProblem(p) {
    if (blocked(p) || p.incomplete)
        return null;
    if (p.error === 'dns')
        return { check: 'Dead contact / booking / order link', key: 'dns', measurement: 'The published action URL failed DNS resolution.' };
    if (p.error)
        return null;
    if (([404, 410].includes(p.status) || p.status >= 500 && p.status <= 599) && p.text.trim().length > 300 && !/\b(?:404|410|50[0-9]|page not found|page (?:does not|doesn't) exist|internal server error|service unavailable|bad gateway|gateway timeout)\b/i.test(`${p.title} ${p.heading} ${p.text.slice(0, 200)}`))
        return null;
    if ([404, 410].includes(p.status) || p.status >= 500 && p.status <= 599)
        return { check: 'Dead contact / booking / order link', key: `http-${p.status}`, measurement: `The published action URL returned HTTP ${p.status} in Chromium using GET.` };
    let u;
    try {
        u = new URL(p.url);
    }
    catch {
        return null;
    }
    if (u.hostname === 'docs.google.com' && u.pathname.startsWith('/forms/') && /\b(?:this form|the form|form .{0,120}) (?:is )?no longer accepting responses\b/i.test(p.text))
        return { check: 'Closed Google Form', key: 'google-closed', measurement: 'Google Forms states that this form is no longer accepting responses.' };
    // Only a dominant rendered error heading/title, not incidental body copy or scripts.
    const explicit = /^(?:(?:error|oops|sorry)[\s:!—-]*)?(?:(?:404|410)[\s:!—-]*)?(?:page (?:not found|does not exist|doesn't exist)|this page (?:could not be found|does not exist|doesn't exist)|we (?:couldn't|could not|cannot) find (?:this|that|the) page|the page (?:you requested|you're looking for) (?:could not be found|does not exist))[.!\s]*$/i;
    if (p.status === 200 && (explicit.test(p.heading.trim()) || explicit.test(p.title.trim())) && p.text.length < 3000)
        return { check: 'Dead contact / booking / order link', key: 'soft-404', measurement: 'The rendered action page shows a dominant page-not-found message despite HTTP 200.' };
    return null;
}
export function layoutProblems(p) {
    if (p.error || p.incomplete || blocked(p) || p.status < 200 || p.status >= 300)
        return [];
    const result = [];
    if (p.overflow > 24)
        result.push({ key: 'horizontal-overflow', measurement: `At 390 px, visible page content extends ${Math.round(p.overflow)} px beyond the viewport (document width ${p.width} px).` });
    if (p.text.trim().length >= 80 && !/width\s*=\s*device-width/i.test(p.viewportMeta) && p.width > 600 && p.scale < 0.8)
        result.push({ key: 'zoomed-out', measurement: `At 390 px the rendered layout is ${p.width} px wide and scaled to ${p.scale.toFixed(2)}; the viewport declaration is missing or unsuitable.` });
    if (p.overlaps > 0)
        result.push({ key: 'overlapping-targets', measurement: `At 390 px, ${p.overlaps} pairs of independent, visible tap targets overlap and obscure each other's clickable area.` });
    return result;
}
export function slowProblem(samples) {
    if (samples.length !== 3 || samples.some(p => p.error || p.incomplete || blocked(p) || p.status !== 200 || p.load === null))
        return null;
    const load = median(samples.map(p => p.load));
    const lcp = samples.every(p => p.lcp !== null) ? median(samples.map(p => p.lcp)) : null;
    if ((lcp !== null && lcp > 4000) || load > 8000)
        return { key: lcp !== null && lcp > 4000 ? 'lcp' : 'load', measurement: `Three fresh Chromium loads: median LCP ${lcp === null ? 'unavailable' : `${Math.round(lcp)} ms`}; median load ${Math.round(load)} ms. Thresholds: LCP >4000 ms or load >8000 ms. Lab measurements, not field Core Web Vitals.` };
    return null;
}
export function confirm(current, previous = []) {
    return current.map(o => {
        const link = o.check === 'Dead contact / booking / order link' || o.check === 'Closed Google Form' || o.check === 'Wrong key link';
        const second = previous.find(p => p.run_id !== o.run_id && p.check === o.check && p.key === o.key && p.url === o.url && validProof(p.proof) && validProof(o.proof) && Date.parse(o.measured_at) - Date.parse(p.measured_at) >= (link ? LINK_DELAY_MS : 0) && Date.parse(o.measured_at) - Date.parse(p.measured_at) < 7 * 86400_000);
        return { ...o, confidence: second ? 'confirmed' : "couldn't verify", observations: second ? [second, o] : [o], ...(!second ? { reason: link ? 'Needs matching browser proof at least ten minutes apart.' : 'Needs a second matching browser observation and saved proof.' } : {}) };
    });
}
export function validProof(p) {
    if (!p || !/^data:image\/jpeg;base64,/.test(p.image ?? '') || p.image.length > 600_000 || !Number.isFinite(Date.parse(p.captured_at)))
        return false;
    return createHash('sha256').update(Buffer.from(p.image.split(',')[1], 'base64')).digest('hex') === p.sha256;
}
export function isConfirmed(f) {
    if (f.confidence !== 'confirmed' || !validProof(f.proof) || !Array.isArray(f.observations) || f.observations.length !== 2)
        return false;
    const [a, b] = f.observations;
    return (!f.check || f.check === b.check) && (!f.key || f.key === b.key) && (!f.url || f.url === b.url) && confirm([b], [a])[0].confidence === 'confirmed' && f.proof?.sha256 === b.proof?.sha256;
}
// A ranking of observed friction, visibility, verifiability and likely scope;
// it is not a revenue forecast or a promise that every repair costs $299.
export function leverageScore(f) {
    const weight = {
        'Dead contact / booking / order link': 96, 'Closed Google Form': 95, 'Booking widget failure': 94,
        'Insecure form': 91, 'HTTPS failure': 90, 'Wrong key link': 86, 'Unfinished content': 84,
        'Broken image': 78, 'Mobile layout': 76, 'Expiring certificate': 74,
        'Mobile contact route': 66, 'Lighthouse mobile performance': 64, 'Slow page': 58,
    };
    return Math.min(100, (weight[f.check] ?? 0) + (f.verify_url ? 4 : 0));
}
export function rankFindings(findings) {
    return [...findings].sort((a, b) => leverageScore(b) - leverageScore(a) || a.check.localeCompare(b.check) || a.key.localeCompare(b.key));
}
export function impactLine(f) {
    if (f.impact)
        return f.impact;
    if (/Dead|Closed/.test(f.check))
        return 'Visitors following this published contact, booking or order route cannot reach the intended page.';
    if (f.check === 'HTTPS failure')
        return 'Visitors cannot establish a trusted connection, or visible content is blocked by insecure transport.';
    if (f.check === 'Mobile layout')
        return 'At the tested phone width, visible content or controls are difficult to reach or read.';
    if (f.check === 'Slow page')
        return 'Visitors wait for the page to become visible in repeated mobile lab loads; actual customer impact was not measured.';
    return 'The visible problem reproduced in two separate browser observations.';
}
export function verifyLink(f) {
    const candidate = f.verify_url ?? (f.check === 'Slow page' || f.check === 'Lighthouse mobile performance' ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(f.url)}&form_factor=mobile` : f.url);
    try {
        const u = new URL(candidate);
        return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '';
    }
    catch {
        return '';
    }
}
