"use client";
import { useState } from "react";
import {
  platforms,
  inviteSteps,
  platformHelp,
  type Platform,
} from "@/lib/team/jobs-domain";
export function Onboarding({
  code,
  needsSite,
}: {
  code: string;
  needsSite: boolean;
}) {
  const [platform, setPlatform] = useState<Platform>("Unknown"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const r = await fetch(`/start/${code}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const b = await r.json();
          if (!r.ok) throw Error(b.error);
          setSaved(true);
          setMessage("Received. Blake will confirm access and start the work.");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {needsSite && (
        <>
          <label>
            Business name
            <input name="business" maxLength={200} required />
          </label>
          <label>
            Website address
            <input
              name="website"
              type="url"
              placeholder="https://"
              maxLength={2000}
              required
            />
          </label>
        </>
      )}
      <label>
        Website platform
        <select
          name="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
        >
          {platforms.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Best contact name
        <input name="contact" maxLength={100} autoComplete="name" required />
      </label>
      <label>
        Best contact email
        <input
          name="contact_email"
          type="email"
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label>
        Cell for a call or text
        <input name="cell" type="tel" maxLength={30} autoComplete="tel" />
        <small>
          Blake or your partner may contact you from their own phone. No
          automated texts.
        </small>
      </label>
      <section className="job-instructions">
        <h2>Invite us to your site</h2>
        <p>
          Send the invitation to <strong>blake@koinophobialabs.com</strong>.
        </p>
        <ol>
          {inviteSteps[platform].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {platformHelp[platform] && (
          <p>
            <a href={platformHelp[platform]} target="_blank" rel="noreferrer">
              Official {platform} instructions ↗
            </a>
          </p>
        )}
        <p>
          <strong>Never send passwords.</strong> Keep your login private. After
          the work, you can remove contributor access.
        </p>
      </section>
      <label>
        Access status
        <select name="access">
          <option>Need help</option>
          <option>Invite sent</option>
        </select>
      </label>
      <button className="team-btn" disabled={busy || saved}>
        {busy ? "Saving…" : saved ? "Saved" : "Save next steps"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
