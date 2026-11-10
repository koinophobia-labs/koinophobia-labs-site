"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ArrowRight, ShieldCheck } from "lucide-react";
export function Login({
  preview,
  magic,
  token,
}: {
  preview: boolean;
  magic: boolean;
  token?: string;
}) {
  const [invite, setInvite] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(action: string, body: object) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/team/api/" + action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (action === "magic") setMessage(d.message);
      else window.location.assign("/team/leads");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="team-login">
      <div className="team-login-story">
        <Link className="team-brand" href="/">
          KOI<span> / </span>KOINOPHOBIA LABS <ArrowUpRight size={15} />
        </Link>
        <div>
          <p className="team-eyebrow">THE PARTNER DESK</p>
          <h1>
            Good work.
            <br />
            <em>Built together.</em>
          </h1>
          <p>
            Find the problem. Show the fix.
            <br />
            Help a business take its next step.
          </p>
        </div>
        <div className="team-login-foot">
          <span>01 / FIND</span>
          <span>02 / FIX</span>
          <span>03 / GROW</span>
        </div>
      </div>
      <section className="team-login-panel">
        <div className="team-lock">
          <ShieldCheck size={24} />
        </div>
        <p className="team-eyebrow">INVITE-ONLY WORKSPACE</p>
        <h2>Welcome to the team.</h2>
        <p>
          Your leads, your pipeline, your share.
          <br />
          One place to move the work forward.
        </p>
        {preview ? (
          <>
            <div className="team-notice">
              FAKE DATA · REVIEW PREVIEW
              <br />
              Explore the owner or partner view. Changes and payments are
              disabled.
            </div>
            <button
              disabled={busy}
              onClick={() => submit("demo", { role: "partner" })}
            >
              Explore partner view <ArrowRight size={17} />
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => submit("demo", { role: "owner" })}
            >
              Explore owner view <ArrowRight size={17} />
            </button>
          </>
        ) : token ? (
          <button disabled={busy} onClick={() => submit("consume", { token })}>
            Confirm sign in <ArrowRight size={17} />
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void submit(magic ? "magic" : "login", Object.fromEntries(f));
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
              />
            </label>
            {!magic && (
              <>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    autoComplete={invite ? "new-password" : "current-password"}
                    required
                    minLength={invite ? 12 : 1}
                  />
                </label>
                {invite && (
                  <label>
                    Invite code
                    <input name="code" autoComplete="off" required />
                  </label>
                )}
              </>
            )}
            <button disabled={busy}>
              {busy
                ? "Signing in…"
                : magic
                  ? "Email me a login link"
                  : invite
                    ? "Accept invite & sign in"
                    : "Sign in"}{" "}
              <ArrowRight size={17} />
            </button>
            {!magic && (
              <button
                type="button"
                className="text-button"
                onClick={() => setInvite(!invite)}
              >
                {invite
                  ? "I already have an account"
                  : "First time? Accept your invitation"}
              </button>
            )}
          </form>
        )}
        {message && (
          <p role="status" className="team-notice">
            {message}
          </p>
        )}
        <p className="team-fine">
          Access is created by Blake. Need an invitation?
          <br />
          Ask your team owner directly.
        </p>
      </section>
    </main>
  );
}
