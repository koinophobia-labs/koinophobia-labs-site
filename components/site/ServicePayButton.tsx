"use client";
import { useState } from "react";

export default function ServicePayButton({ source, path, label }: { source: string; path: string; label: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function checkout() {
    setBusy(true); setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: source }) });
      const result = await response.json();
      if (!response.ok || !result.url) throw Error(result.message || "Checkout is unavailable. Please try again.");
      window.location.assign(result.url);
    } catch (error) { setError(error instanceof Error ? error.message : "Checkout is unavailable. Please try again."); setBusy(false); }
  }
  return <div><button className="btn btn--primary" onClick={checkout} disabled={busy}>{busy ? "Opening checkout…" : label}</button>{error ? <p role="alert">{error}</p> : null}</div>;
}
