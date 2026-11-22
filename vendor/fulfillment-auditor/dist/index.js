import { randomUUID, createHash } from 'node:crypto';
import { openBrowser } from './browser.js';
import { safeUrl, tlsCheck, certificateExpiry, CERT_ERRORS } from './network.js';
import { VERSION, LINK_DELAY_MS, isConfirmed, blocked, layoutProblems, linkProblem, slowProblem, confirm, rankFindings, impactLine, verifyLink, leverageScore } from './model.js';
export * from './model.js';
export { safeUrl, publicAddress, tlsCheck } from './network.js';
export { openBrowser } from './browser.js';
export async function auditSite(raw, options = {}) {
    const url = safeUrl(raw).href, run_id = randomUUID(), measured_at = new Date().toISOString();
    const result = { version: VERSION, run_id, url, final_url: url, measured_at, findings: [], notes: [], observations: [], samples: [] };
    let runner;
    try {
        runner = await openBrowser(options);
    }
    catch {
        result.notes.push({ name: "Couldn't verify", detail: 'Chromium was unavailable. No site defect was inferred.' });
        return result;
    }
    const observe = (p, check, key, measurement, id) => ({ run_id: id, check, key: key.length > 90 ? key.slice(0, 25) + '-' + createHash('sha256').update(key).digest('hex') : key, url: p.url, measured_at: p.proof?.captured_at ?? new Date().toISOString(), measurement, proof: p.proof });
    const render = async (target, mobile) => {
        try {
            return await runner.render(target, mobile);
        }
        catch {
            return { url: target, status: 0, title: '', heading: '', text: '', html: '', viewportMeta: '', width: 0, screen: 0, scale: 1, overflow: 0, overlaps: 0, lcp: null, load: null, links: [], notes: [], mixedBroken: 0, error: 'unavailable' };
        }
    };
    try {
        const samples = [];
        const layout = [];
        const transport = [];
        const leverage = [];
        for (let n = 0; n < 3; n++) {
            const p = await render(url, true);
            samples.push(p);
            const id = randomUUID();
            const batch = [];
            if (n < 2) {
                const signals = !p.error && !p.incomplete && !blocked(p) ? (p.signals ?? []).map(s => ({ ...observe({ ...p, proof: s.proof }, s.check, s.key, s.measurement, id), impact: s.impact, verify_url: s.verify_url })) : [];
                // Wrong links retain the ten-minute rule used for all action links.
                result.observations.push(...signals.filter(s => s.check === 'Wrong key link'));
                leverage.push(signals.filter(s => s.check !== 'Wrong key link'));
                if (n === 1)
                    result.findings.push(...confirm(signals.filter(s => s.check === 'Wrong key link'), options.previous ?? []));
                if (!p.error && !p.incomplete && !blocked(p) && p.status === 200) {
                    const cert = await certificateExpiry(p.url).catch(() => null);
                    if (n === 0 && cert)
                        result.certificate = cert;
                    if (cert && Date.parse(cert.expires_at) > Date.now() && Date.parse(cert.expires_at) - Date.now() <= 14 * 86400_000) {
                        leverage[n].push({ ...observe(p, 'Expiring certificate', `expires-${cert.expires_at}-${cert.fingerprint}`, `The currently served TLS certificate expires on ${cert.expires_at.slice(0, 10)} (within 14 days). Renewal was not predicted.`, id), impact: `If this certificate is not renewed or replaced before ${cert.expires_at.slice(0, 10)}, browsers will reject it as expired.`, verify_url: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(new URL(p.url).hostname)}` });
                    }
                }
            }
            if (n < 2) {
                for (const problem of layoutProblems(p))
                    batch.push(observe(p, 'Mobile layout', problem.key, problem.measurement, id));
                if (p.mixedBroken && !p.error && p.status === 200 && !p.incomplete && !blocked(p))
                    batch.push(observe(p, 'HTTPS failure', 'mixed-content', `${p.mixedBroken} visible images failed because Chromium blocked mixed HTTP content.`, id));
                layout.push(batch);
            }
            const tls = [];
            if (n < 2 && (p.error === 'certificate' || p.error === 'policy' || p.url.startsWith('http:'))) {
                const code = await tlsCheck(url).catch(() => 'unavailable');
                if (code && CERT_ERRORS.has(code) && p.error === 'certificate')
                    tls.push(observe(p, 'HTTPS failure', code, `A real certificate-verified TLS handshake failed (${code}); Chromium could not establish a trusted HTTPS connection.`, id));
                else if (code === 'ECONNREFUSED' && p.status === 200 && !p.error)
                    tls.push(observe(p, 'HTTPS failure', 'https-refused', 'HTTP rendered successfully, but the same host refused connections on HTTPS port 443.', id));
            }
            transport.push(tls);
            if (n === 0) {
                result.final_url = p.url;
                result.home = p;
                result.notes.push(...p.notes);
            }
            if (n === 0 && (p.error || blocked(p)) && p.error !== 'certificate')
                break;
        }
        if (layout.length > 1)
            result.findings.push(...confirm(layout[1], layout[0]));
        if (transport.length > 1)
            result.findings.push(...confirm(transport[1], transport[0]));
        if (leverage.length > 1)
            result.findings.push(...confirm(leverage[1], leverage[0]));
        let desktop;
        if (!samples[0].error && !blocked(samples[0])) {
            desktop = await render(url, false);
            const convert = (p) => p.error || p.incomplete || blocked(p) ? [] : (p.signals ?? []).map(s => ({ ...observe({ ...p, proof: s.proof }, s.check, s.key, s.measurement, randomUUID()), impact: s.impact, verify_url: s.verify_url }));
            const first = convert(desktop).filter(s => !result.findings.some(f => f.check === s.check && f.key === s.key && f.confidence === 'confirmed'));
            result.observations.push(...first.filter(s => s.check === 'Wrong key link'));
            result.findings.push(...confirm(first.filter(s => s.check === 'Wrong key link'), options.previous ?? []));
            if (first.some(s => s.check !== 'Wrong key link')) {
                const second = convert(await render(url, false));
                result.findings.push(...confirm(second.filter(s => first.some(f => f.key === s.key && f.check === s.check) && s.check !== 'Wrong key link'), first));
            }
        }
        result.samples = samples.map(({ lcp, load }) => ({ lcp, load }));
        const slow = slowProblem(samples);
        if (slow) {
            const repeat = [];
            for (let n = 0; n < 3; n++)
                repeat.push(await render(url, true));
            const second = slowProblem(repeat);
            const first = observe(samples[1], 'Slow page', slow.key, slow.measurement, randomUUID());
            if (second)
                result.findings.push(...confirm([observe(repeat[1], 'Slow page', second.key, second.measurement, randomUUID())], [first]));
            else
                result.findings.push(...confirm([first]));
            result.samples.push(...repeat.map(({ lcp, load }) => ({ lcp, load })));
        }
        const home = samples[0];
        if (home.error || blocked(home) || home.incomplete)
            result.notes.push({ name: "Couldn't verify", detail: 'The page was unavailable, challenged, or incomplete. Missing content and timings were not treated as defects.' });
        const actions = [...new Set([...(options.includeHomeAsAction ? [url] : []), ...(options.actionUrls ?? []), ...(!home.error && !blocked(home) ? home.links : []), ...(!desktop?.error && desktop && !blocked(desktop) ? desktop.links : [])])].slice(0, Math.min(3, options.maxLinks ?? 3));
        for (const target of actions) {
            let p;
            try {
                safeUrl(target);
                p = target === url ? home : await render(target, true);
            }
            catch {
                continue;
            }
            const problem = linkProblem(p);
            if (problem) {
                const observation = observe(p, problem.check, problem.key, problem.measurement, run_id);
                result.observations.push(observation);
                result.findings.push(...confirm([observation], options.previous ?? []));
            }
            else if (p.error || blocked(p) || p.incomplete)
                result.notes.push({ name: "Couldn't verify", detail: 'An action page could not be verified. No dead-link finding was created.' });
        }
        // Keep only the most recent result for each kind and URL.
        result.findings = result.findings.sort((a, b) => Number(isConfirmed(b)) - Number(isConfirmed(a))).filter((f, i, a) => a.findIndex(x => x.check === f.check && x.url === f.url && x.key === f.key) === i);
        result.findings = rankFindings(result.findings.map(f => ({ ...f, impact: impactLine(f), verify_url: verifyLink(f), leverage: leverageScore({ ...f, verify_url: verifyLink(f) }) })));
        if (result.findings.some(f => f.confidence !== 'confirmed' && /Dead|Closed|Wrong key/.test(f.check)))
            result.retry_after = new Date(Date.now() + LINK_DELAY_MS).toISOString();
        return result;
    }
    finally {
        await runner.close();
    }
}
export function confirmedFindings(result) { return rankFindings(result.findings.filter(isConfirmed)); }
