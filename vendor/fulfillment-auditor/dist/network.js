import { lookup } from 'node:dns/promises';
import { createServer, get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import { connect as netConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { createRequire } from 'node:module';
import ipaddr from 'ipaddr.js';
export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
export const publicAddress = (s) => { try {
    return ipaddr.process(s).range() === 'unicast';
}
catch {
    return false;
} };
export function safeUrl(raw) {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || (u.port && !['80', '443'].includes(u.port)))
        throw Error('unsafe_target');
    if (/\/(?:login|signin|sign-in|logout|signout|admin|checkout|cart|submit|formResponse)(?:\/|$)/i.test(u.pathname) || /(?:action|do)=(?:delete|send|submit|logout|unsubscribe)/i.test(u.search))
        throw Error('action_url');
    u.hash = '';
    return u;
}
export async function resolvePublic(host) {
    const rows = await lookup(host.replace(/^\[|\]$/g, ''), { all: true });
    if (!rows.length || rows.some(x => !publicAddress(x.address)))
        throw Error('non_public_address');
    return rows[0];
}
// Every TCP connection, including redirects/subresources, is pinned after DNS
// validation. Browser-side URL checks alone are not DNS-rebinding protection.
export async function proxy() {
    const errors = new Map();
    const sockets = new Set();
    const server = createServer(async (req, res) => {
        try {
            if (req.method !== 'GET')
                throw Error('method_blocked');
            const u = safeUrl(req.url ?? '');
            if (u.protocol !== 'http:')
                throw Error('protocol');
            const ip = await resolvePublic(u.hostname);
            const upstream = httpGet(u, { headers: { ...req.headers, host: u.host }, lookup: (_h, o, cb) => o.all ? cb(null, [ip]) : cb(null, ip.address, ip.family) }, r => { res.writeHead(r.statusCode ?? 502, r.headers); r.pipe(res); });
            upstream.setTimeout(20_000, () => upstream.destroy());
            upstream.on('error', () => { res.writeHead(502, { 'X-Koi-Proxy-Error': '1' }); res.end(); });
        }
        catch {
            res.writeHead(403);
            res.end();
        }
    });
    server.on('connect', async (req, client, head) => {
        try {
            const u = new URL('https://' + req.url);
            if (u.port && u.port !== '443')
                throw Error('port');
            const ip = await resolvePublic(u.hostname);
            const upstream = netConnect({ host: ip.address, port: 443, family: ip.family });
            sockets.add(upstream);
            upstream.setTimeout(30_000, () => upstream.destroy());
            upstream.once('connect', () => { client.write('HTTP/1.1 200 Connection Established\r\n\r\n'); if (head.length)
                upstream.write(head); client.pipe(upstream); upstream.pipe(client); });
            upstream.on('error', () => client.destroy());
            upstream.on('close', () => sockets.delete(upstream));
            client.on('error', () => upstream.destroy());
            client.on('close', () => upstream.destroy());
        }
        catch (e) {
            if (e.code === 'ENOTFOUND')
                errors.set((req.url ?? '').split(':')[0], 'dns');
            client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
        }
    });
    server.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)); s.on('error', () => { }); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string')
        throw Error('proxy_failed');
    return { url: `http://127.0.0.1:${address.port}`, errors, close: async () => { for (const s of sockets)
            s.destroy(); await new Promise(r => server.close(() => r())); } };
}
export async function tlsCheck(raw) {
    const u = safeUrl(raw);
    const ip = await resolvePublic(u.hostname);
    return new Promise(resolve => {
        const socket = tlsConnect({ host: ip.address, port: 443, servername: u.hostname, rejectUnauthorized: true }, () => { socket.end(); resolve(null); });
        socket.setTimeout(12_000, () => { socket.destroy(); resolve('timeout'); });
        socket.on('error', (e) => resolve(e.code ?? 'tls_unknown'));
    });
}
export const CERT_ERRORS = new Set(['CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'ERR_TLS_CERT_ALTNAME_INVALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_REVOKED']);
export async function certificateExpiry(raw) {
    const u = safeUrl(raw);
    if (u.protocol !== 'https:')
        return null;
    const ip = await resolvePublic(u.hostname);
    return new Promise(resolve => {
        const socket = tlsConnect({ host: ip.address, port: 443, servername: u.hostname, rejectUnauthorized: true }, () => {
            const cert = socket.getPeerCertificate();
            socket.end();
            const expires = Date.parse(cert.valid_to);
            resolve(Number.isFinite(expires) && cert.fingerprint256 ? { expires_at: new Date(expires).toISOString(), fingerprint: cert.fingerprint256 } : null);
        });
        socket.setTimeout(10_000, () => { socket.destroy(); resolve(null); });
        socket.on('error', () => resolve(null));
    });
}
export async function pinnedGet(raw, redirects = 0) {
    if (redirects > 4)
        throw Error('redirect_limit');
    const u = safeUrl(raw);
    const ip = await resolvePublic(u.hostname);
    const r = await new Promise((resolve, reject) => {
        const req = (u.protocol === 'https:' ? httpsGet : httpGet)(u, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'identity' }, lookup: (_h, o, cb) => o.all ? cb(null, [ip]) : cb(null, ip.address, ip.family) }, res => {
            const chunks = [];
            let size = 0;
            res.on('data', (b) => { size += b.length; if (size > 512_000)
                req.destroy(Error('robots_too_large'));
            else
                chunks.push(b); });
            res.on('error', reject);
            res.on('end', () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString(), location: res.headers.location }));
        });
        req.setTimeout(12_000, () => req.destroy(Error('robots_timeout')));
        req.on('error', reject);
    });
    if (r.status >= 300 && r.status < 400 && r.location)
        return pinnedGet(new URL(r.location, u).href, redirects + 1);
    return r;
}
const robotsParser = createRequire(import.meta.url)('robots-parser');
export function robotsPolicy() {
    const cache = new Map();
    const last = new Map();
    return async (raw) => {
        const u = safeUrl(raw);
        let rules = cache.get(u.origin);
        if (!rules) {
            rules = pinnedGet(u.origin + '/robots.txt').then(r => {
                if (![200, 404, 410].includes(r.status) || r.status === 200 && /<(?:html|body)/i.test(r.text))
                    throw Error('robots_unavailable');
                return robotsParser(u.origin + '/robots.txt', r.status === 200 ? r.text : '');
            });
            cache.set(u.origin, rules);
        }
        const r = await rules;
        if (r.isAllowed(u.href, 'KoinophobiaLeadgen') === false)
            throw Error('robots_disallowed');
        const delay = Math.max(1200, (r.getCrawlDelay('KoinophobiaLeadgen') ?? 0) * 1000);
        if (delay > 30_000)
            throw Error('crawl_delay_budget');
        await new Promise(r => setTimeout(r, Math.max(0, (last.get(u.origin) ?? 0) + delay - Date.now())));
        last.set(u.origin, Date.now());
    };
}
