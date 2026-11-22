"use client";
import { useRef, useState } from 'react';

// No mount requests, polling, celebration layer, or automatic retry.
export function AffiliateControls({ connection, readonly }: {
  connection: 'none' | 'incomplete' | 'ready'; readonly: boolean;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(action: 'connect-onboard' | 'connect-dashboard') {
    if (pending.current || readonly) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/team/api/' + action, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to open Stripe. Try again later.');
      const destination = new URL(result.url);
      if (destination.protocol !== 'https:' || !['connect.stripe.com', 'dashboard.stripe.com'].includes(destination.hostname))
        throw Error('Stripe returned an unexpected address. Contact Blake.');
      window.location.assign(destination.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open Stripe. Try again later.');
    } finally { pending.current = false; setBusy(false); }
  }
  return <div>
    <button disabled={busy || readonly} onClick={() => act(connection === 'ready' ? 'connect-dashboard' : 'connect-onboard')}>
      {busy ? 'Opening Stripe…' : connection === 'ready' ? 'Open Stripe Express' : 'Connect Stripe to get paid'}
    </button>
    {error && <p className="team-notice" role="alert">{error}</p>}
  </div>;
}

export function AffiliateCopy({ app, url }: { app: string; url: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage('Copied'); }
    catch { setMessage('Select and copy the link below.'); }
  }
  return <div className="affiliate-link-controls">
    <button className="secondary" onClick={copy} aria-label={`Copy ${app} redemption link`}>Copy link</button>
    <span role="status">{message}</span>
    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
  </div>;
}

export function AffiliateLogout() {
  const pending = useRef(false);
  const [error, setError] = useState('');
  async function logout() {
    if (pending.current) return;
    pending.current = true;
    try {
      const r = await fetch('/team/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!r.ok) throw Error();
      window.location.assign('/team');
    } catch { setError('Unable to sign out. Try again.'); }
    finally { pending.current = false; }
  }
  return <div><button className="secondary" onClick={logout}>Sign out</button>{error && <p role="alert">{error}</p>}</div>;
}
