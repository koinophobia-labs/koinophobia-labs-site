/** Runs only in the page. Measurements concern rendered elements, never HTML strings. */
export function snapshotLeverage() {
    const all = [...document.querySelectorAll('*')];
    const visible = (e) => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && r.width > 2 && r.height > 2 && s.display !== 'none' && !e.closest('[hidden],[aria-hidden="true"],[inert]');
    };
    const inView = (e) => { const r = e.getBoundingClientRect(); return visible(e) && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; };
    const reachable = (e) => {
        if (!visible(e))
            return false;
        const r = e.getBoundingClientRect(), left = Math.max(0, r.left), right = Math.min(innerWidth, r.right), top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
        if (right - left < 3 || bottom - top < 3)
            return false;
        const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
        return !!hit && e.contains(hit);
    };
    const intersects = (e) => { const r = e.getBoundingClientRect(); return visible(e) && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
    const name = (e) => (e.getAttribute('aria-label') ?? e.getAttribute('title') ?? e.textContent ?? '').trim().replace(/\s+/g, ' ');
    const signals = [];
    const add = (e, s) => { if (signals.length >= 12)
        return; const signal = { ...s, elementIndex: all.indexOf(e) }; signals.push(signal); return signal; };
    // Tutorial prose, quoted examples and editors are not unfinished business copy.
    const educational = /\b(?:tutorial|documentation|placeholder text|what is lorem ipsum|lorem ipsum generator|sample text generator)\b/i.test(document.title + ' ' + document.querySelector('h1')?.textContent);
    if (!educational)
        for (const e of document.querySelectorAll('h1,h2,h3,p,li,td,figcaption,div,span')) {
            if (!visible(e) || e.closest('pre,code,blockquote,textarea,[contenteditable="true"],footer') || e.matches('div,span') && e.children.length > 0)
                continue;
            const t = e.innerText?.trim().replace(/\s+/g, ' ') ?? '';
            if (t.length < 5 || t.length > 1800)
                continue;
            const token = /\blorem ipsum(?: dolor)?\b|^sample text[.!]?$|^your business name(?: here)?[.!]?$|click here to add your own text and edit me|click edit button to change this text/i.exec(t)?.[0];
            const coming = e.matches('h1') && /^(?:website |site |we are )?(?:coming soon|under construction)[.!]?$/i.test(t);
            if (token || coming)
                add(e, { check: 'Unfinished content', key: `placeholder-${(token ?? 'coming-soon').toLowerCase().replace(/\W+/g, '-')}`, measurement: coming ? 'The primary page heading says the site is coming soon or under construction.' : `Visible page content contains the unfinished template phrase “${token}”.`, impact: coming ? 'Visitors reach an unfinished primary page rather than the business information or service.' : 'Visitors see template copy where finished business information should be.', verify_url: location.href });
        }
    const controls = [...document.querySelectorAll('a[href],button,input[type="submit"],[role="button"]')].filter(visible);
    for (const e of document.querySelectorAll('a[href]')) {
        if (!visible(e) || e.hasAttribute('onclick') || e.getAttribute('role') === 'button' || e.hasAttribute('data-toggle'))
            continue;
        const label = name(e), raw = e.getAttribute('href') ?? '';
        // A social-labelled anchor to this site's root is demonstrably the wrong destination.
        // Hash/JS anchors and booking launchers abstain; they may open a working widget.
        if (!/^(?:follow (?:us )?on )?(?:our )?(instagram|facebook|tiktok|youtube|linkedin)(?: page)?$/i.test(label) || /^(#|javascript:)/i.test(raw))
            continue;
        try {
            const u = new URL(raw, location.href);
            if (u.origin === location.origin && u.pathname === '/' && !u.search && !u.hash)
                add(e, { check: 'Wrong key link', key: `social-home-${label.toLowerCase().replace(/\W+/g, '-')}`, measurement: `The visible ${label} link points to this website's homepage instead of the social profile.`, impact: 'Visitors using the social link return to the business homepage instead of reaching the labelled profile.', verify_url: location.href });
        }
        catch { /* Unparseable does not establish a failed action. */ }
    }
    for (const e of document.images) {
        const r = e.getBoundingClientRect();
        if (visible(e) && e.complete && e.naturalWidth === 0 && r.width >= 48 && r.height >= 48 && e.currentSrc)
            add(e, { check: 'Broken image', key: `image-${e.currentSrc}`, asset: e.currentSrc, measurement: 'A visible image failed to load; the browser received HTTP 404 or 410 for its asset.', impact: 'Visitors see a missing image in the rendered page.', verify_url: location.href });
    }
    for (const form of document.forms) {
        if (!visible(form) || !form.querySelector('input:not([type="hidden"]),textarea,select') || form.hasAttribute('onsubmit'))
            continue;
        const submit = form.querySelector('button[type="submit"],button:not([type]),input[type="submit"]');
        if (!submit || !visible(submit) || submit.hasAttribute('onclick') || submit.hasAttribute('formaction'))
            continue;
        try {
            const action = new URL(form.getAttribute('action') || location.href, location.href);
            if (action.protocol === 'http:' && (form.getAttribute('method') ?? 'get').toLowerCase() === 'post')
                add(form, { check: 'Insecure form', key: `http-form-${action.origin}${action.pathname}`, measurement: 'The visible form declares a POST action over plain HTTP. It was not submitted; JavaScript interception was not tested.', impact: 'The declared form destination would transmit entered information without HTTPS if the browser follows the native action.', verify_url: location.href });
        }
        catch { /* Invalid action remains unverified. */ }
    }
    const primary = /\b(?:book|appointment|schedule|reserve|reservation|order|contact|call|quote|message|inquiry|enquiry|get in touch)\b/i;
    if (innerWidth === 390) {
        const contact = controls.filter(e => primary.test(name(e)) || /^(?:tel:|mailto:)/i.test(e.getAttribute('href') ?? ''));
        const menu = controls.some(e => reachable(e) && (/\b(?:menu|navigation)\b/i.test(name(e)) || e.getAttribute('aria-haspopup') === 'true' || e.hasAttribute('aria-expanded')));
        // Only make the narrow above-the-fold claim when a real contact route exists
        // farther down. A menu, cookie wall, or otherwise occluded page abstains.
        const overlay = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],[id*="cookie-banner"],[class*="cookie-banner"],[id*="consent-banner"]')].some(intersects);
        // Plain visible contact details also give visitors a way to reach the business.
        // Embedded or unlabeled form interfaces cannot be ruled out passively.
        const contactText = all.some(e => e.children.length === 0 && reachable(e) && /(?:\+?\d[\d\s().-]{7,}\d|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i.test(e.innerText ?? ''));
        const embedded = [...document.querySelectorAll('iframe,form')].some(intersects);
        // Any reachable control could expose a contact path that passive inspection
        // cannot understand (including icon-only menus). Qualify only total absence.
        const anyControl = controls.some(reachable);
        if (contact.length && !anyControl && !menu && !overlay && !contactText && !embedded) {
            const body = document.body;
            const contactSignal = add(body, { check: 'Mobile contact route', key: 'contact-below-fold', measurement: 'At 390 × 844, the initial screen has no visible contact or booking control; a contact route is present farther down the page.', impact: 'A phone visitor must scroll before finding the contact or booking route.', verify_url: location.href });
            if (contactSignal)
                contactSignal.elementIndex = undefined;
        }
        for (const e of controls) {
            if (!inView(e) || !primary.test(name(e)))
                continue;
            const r = e.getBoundingClientRect();
            if (r.width >= 24 && r.height >= 24)
                continue;
            // A small target with ample spacing is not a WCAG target-size failure.
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const crowded = controls.some(other => {
                if (other === e || e.contains(other) || other.contains(e) || !inView(other))
                    return false;
                const o = other.getBoundingClientRect();
                const dx = Math.max(o.left - cx, 0, cx - o.right), dy = Math.max(o.top - cy, 0, cy - o.bottom);
                return Math.hypot(dx, dy) < 12;
            });
            if (crowded)
                add(e, { check: 'Mobile layout', key: 'small-crowded-primary', measurement: `At 390 px, a primary action is ${Math.round(r.width)} × ${Math.round(r.height)} CSS px and has another target within its 24 px spacing area.`, impact: 'The small, crowded action is difficult to tap without selecting a neighbouring control.', verify_url: location.href });
        }
        for (const e of document.querySelectorAll('main p,main li,[role="main"] p')) {
            if (!inView(e) || name(e).length < 80 || e.closest('footer,small'))
                continue;
            const size = parseFloat(getComputedStyle(e).fontSize) * (visualViewport?.scale ?? 1);
            if ([...e.querySelectorAll('*')].some(child => visible(child) && parseFloat(getComputedStyle(child).fontSize) * (visualViewport?.scale ?? 1) >= 10))
                continue;
            if (size < 10)
                add(e, { check: 'Mobile layout', key: 'tiny-primary-text', measurement: `At 390 px, a visible main-content paragraph renders at ${size.toFixed(1)} px after viewport scaling.`, impact: 'Main business information is rendered at a very small size on the tested phone viewport.', verify_url: location.href });
        }
    }
    return signals;
}
