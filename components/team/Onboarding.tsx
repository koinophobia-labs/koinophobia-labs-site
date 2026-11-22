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
  needsSite, initialPlatform, initialContact, initialEmail, initialCell, deadlineLabel, partnerFirstName,
}: {
  code: string;
  needsSite: boolean;
  initialPlatform: Platform;
  initialContact: string;
  initialEmail: string;
  initialCell: string;
  deadlineLabel: string | null;
  partnerFirstName: string;
}) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const access = submitter?.value === "Need help" ? "Need help" : "Invite sent";
        const data = { ...Object.fromEntries(new FormData(e.currentTarget)), access };
        try {
          const r = await fetch(`/start/${code}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const b = await r.json();
          if (!r.ok) throw Error(b.error);
          setSaved(true);
          setMessage(access === "Need help" ? "Received. We’ll help you arrange access. Keep your password private." : "Received. Blake will confirm access and start the work.");
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
        <input defaultValue={initialContact} name="contact" maxLength={100} autoComplete="name" required />
      </label>
      <label>
        Best contact email
        <input
          defaultValue={initialEmail}
          name="contact_email"
          type="email"
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label>
        Cell for a call or text
        <input defaultValue={initialCell} name="cell" type="tel" maxLength={30} autoComplete="tel" />
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
      <button className="team-btn job-invite-button" name="access" value="Invite sent" disabled={busy || saved}>
        {busy ? "Saving…" : saved ? "Received" : "I sent the invite"}
      </button>
      <button className="job-help-link" name="access" value="Need help" disabled={busy || saved}>I need help</button>
      <section aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">What happens next</h2>
        <p>We fix it {deadlineLabel ? `by ${deadlineLabel}` : "on the timeline in your agreed quote"}.</p>
        <p>You get a before/after recording of the fix.</p>
        <p>If it isn’t fixed, we keep working or refund.</p>
        <p>Questions? Text or call your rep, {partnerFirstName}.</p>
      </section>
      <p role="status">{message}</p>
    </form>
  );
}
