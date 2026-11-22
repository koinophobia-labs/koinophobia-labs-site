"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AccountPassword({ state, readonly, home = "/team/leads" }: {
  home?: string;
  state: { hasPassword: boolean; canReset: boolean; prompt: boolean };
  readonly: boolean;
}) {
  const router = useRouter();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(action: string, body: object, form?: HTMLFormElement) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/team/api/" + action, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      form?.reset();
      if (action === "password-prompt-dismiss") router.push(home);
      else setMessage("Password saved. Your other sessions have been signed out.");
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
      router.refresh();
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return <section className="team-card team-account-card">
    <h2>{state.prompt ? "Set a password for next time" : state.hasPassword ? "Change your password" : "Set a password"}</h2>
    <p>Use 12–256 characters. Saving signs out your other sessions.</p>
    {state.hasPassword && state.canReset && <p>Your email link verified you. You can reset your password here for 15 minutes without the current password.</p>}
    <form onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      if (values.get("password") !== values.get("confirmPassword")) {
        setMessage("Passwords do not match.");
        return;
      }
      void save("password", { password: values.get("password"), currentPassword: values.get("currentPassword") }, form);
    }}>
      {state.hasPassword && !state.canReset && <label>Current password
        <input name="currentPassword" type="password" autoComplete="current-password" maxLength={256} required disabled={busy || readonly} />
      </label>}
      <label>New password
        <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy || readonly} />
      </label>
      <label>Confirm new password
        <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy || readonly} />
      </label>
      <button disabled={busy || readonly}>{busy ? "Saving…" : "Save password"}</button>
      {state.prompt && <button type="button" className="text-button" disabled={busy || readonly} onClick={() => save("password-prompt-dismiss", {})}>Skip for now</button>}
    </form>
    {message && <p role="status" className="team-notice">{message}</p>}
  </section>;
}
