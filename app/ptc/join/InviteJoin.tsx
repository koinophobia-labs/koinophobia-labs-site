"use client";

import { useSyncExternalStore } from "react";
import { inviteAppLinks, inviteSecretFromHash, PTC_APP_STORE_URL, PTC_PLAY_STORE_URL } from "@/lib/ptc-invite";

// The invite secret is the URL fragment. It is read here, in the browser, and
// only ever placed into links that open the app. It is never sent to the
// server, logged, stored, or passed to analytics.
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const readSecret = () => inviteSecretFromHash(window.location.hash);
const noSecretOnServer = () => "";

export default function InviteJoin() {
  const secret = useSyncExternalStore(subscribe, readSecret, noSecretOnServer);
  const links = secret ? inviteAppLinks(secret) : null;

  function openApp(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!links) return;
    event.preventDefault();
    // Try the custom scheme; if the page is still showing shortly after,
    // fall back to the universal link (which opens the app when the OS
    // honours it, or simply stays on this page).
    const fallback = window.setTimeout(() => {
      if (document.visibilityState === "visible") window.location.assign(links.universal);
    }, 1200);
    document.addEventListener("visibilitychange", () => window.clearTimeout(fallback), { once: true });
    window.location.href = links.scheme;
  }

  return <>
    <h1 className="ptc-join__title">You&rsquo;re invited to a prayer group</h1>
    <p className="ptc-join__lede">Prayer groups are private and encrypted, just for the people praying together.</p>
    {links
      ? <a className="ptc-join__button ptc-join__button--primary" href={links.universal} onClick={openApp} rel="noreferrer">Open in Preaching to the Choir</a>
      : <p className="ptc-join__note" role="status">This invite link looks incomplete. Ask the person who sent it for a fresh link.</p>}
    <p className="ptc-join__hint">Don&rsquo;t have the app yet? Install it, then tap your invite link again.</p>
    <div className="ptc-join__stores">
      <a className="ptc-join__button" href={PTC_APP_STORE_URL} rel="noreferrer">Get it on the App Store</a>
      <a className="ptc-join__button" href={PTC_PLAY_STORE_URL} rel="noreferrer">Get it on Google Play</a>
    </div>
  </>;
}
