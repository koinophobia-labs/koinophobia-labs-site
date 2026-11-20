"use client";
import { ConnectPanel } from "./ConnectPanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  ScanLine,
  FileText,
  Layers3,
  Wallet,
  MessageSquare,
  Settings2,
  LogOut,
  Search,
  Check,
  Copy,
  Plus,
  Upload,
  ShieldCheck,
} from "lucide-react";
import type { TeamSnapshot } from "@/lib/team/store";
import { SERVICES, money, servicePrice } from "@/lib/team/config";
import { STAGES, type Deal } from "@/lib/team/types";
import { commission } from "@/lib/team/domain";
import { quotePaymentLink } from "@/lib/team/payment-links";
import { quoteMessage } from "@/lib/team/quotes";
import { SCRIPTS } from "@/lib/team/scripts";
const navigation = [
  ["leads", "Leads", Users],
  ["check", "Site check", ScanLine],
  ["quote", "Quote builder", FileText],
  ["pipeline", "Pipeline", Layers3],
  ["commissions", "Commissions", Wallet],
  ["scripts", "Scripts", MessageSquare],
  ["admin", "Team admin", Settings2],
] as const;
const headings: Record<string, [string, string]> = {
  leads: [
    "Your next good conversation.",
    "A real problem is the beginning of useful work.",
  ],
  check: [
    "Show them what you found.",
    "A clear, measured finding. A practical next step.",
  ],
  quote: [
    "Make the next step clear.",
    "Build the scope. Get approval. Share the payment link.",
  ],
  pipeline: [
    "Keep the work moving.",
    "From first conversation to a fix that makes a difference.",
  ],
  commissions: [
    "Your work. Your share.",
    "40% of client payments received, including Care Plan renewals. Paid out per deal once the client's payment clears.",
  ],
  scripts: [
    "Sound like yourself.",
    "Start with their specific problem. Keep it human.",
  ],
  admin: [
    "Build a good team.",
    "Invite partners, assign leads, and keep the details in order.",
  ],
};
export function Portal({
  screen,
  initial: data,
}: {
  screen: string;
  initial: TeamSnapshot;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(""),
    [services, setServices] = useState<string[]>(["fix"]),
    [script, setScript] = useState("Call"),
    [inviteCode, setInviteCode] = useState("");
  const owner = data.me.role === "owner";
  const totals = data.connect
    ? data.connect.payments.reduce(
        (a, p) => ({
          received: a.received + p.amount - p.loss,
          earned: a.earned + p.earned,
          paid: a.paid + p.paid,
          owed: a.owed + p.owed,
        }),
        { received: 0, earned: 0, paid: 0, owed: 0 },
      )
    : data.deals.reduce(
        (a, d) => {
          const c = commission(data, d);
          return {
            received: a.received + c.received,
            earned: a.earned + c.earned,
            paid: a.paid + c.paid,
            owed: a.owed + c.owed,
          };
        },
        { received: 0, earned: 0, paid: 0, owed: 0 },
      );
  const owedBack =
    data.connect?.payments.reduce((sum, p) => sum + p.owed_back, 0) || 0;
  const name = (d: Deal) =>
    data.leads.find((l) => l.id === d.lead_id)?.business || "Lead";
  async function act(action: string, body: object) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/team/api/" + action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      if (action === "invite") setInviteCode(v.code);
      if (v.url && ["connect-onboard", "connect-dashboard"].includes(action)) {
        window.location.assign(v.url);
        return v;
      }
      setMessage(
        action === "import"
          ? `${v.imported} imported · ${v.duplicates} duplicates · ${v.suppressed} opted out`
          : action === "invite"
            ? "Invitation created. Share the code privately."
            : "Saved.",
      );
      if (action === "logout") window.location.assign("/team");
      else router.refresh();
      return v;
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied. Nothing was sent.");
    } catch {
      setMessage("Clipboard unavailable. Select and copy the text.");
    }
  }
  const submit =
    (action: string, transform?: (f: FormData) => object) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      void act(action, transform ? transform(f) : Object.fromEntries(f));
    };
  const selectedLead =
    data.leads.find((l) => l.id === selected) || data.leads[0];
  const activeScript = SCRIPTS.find((s) => s.id === script) || SCRIPTS[0];
  const scriptBody = activeScript.body.replace(
    "[MAILING ADDRESS — Blake fills in]",
    data.mailingAddress || "[MAILING ADDRESS — Blake fills in]",
  );
  const disabled = busy || data.readonly;
  return (
    <div className="team-workspace">
      <aside className="team-sidebar">
        <Link href="/team/leads" className="team-wordmark">
          KOI<span>PARTNER DESK</span>
        </Link>
        <p className="team-eyebrow">WORKSPACE</p>
        <nav aria-label="Team workspace">
          {navigation
            .filter(([id]) => id !== "admin" || owner)
            .map(([id, label, Icon]) => (
              <Link
                key={id}
                href={"/team/" + id}
                className={screen === id ? "active" : ""}
                aria-current={screen === id ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
                {screen === id && <span className="nav-dot" />}
              </Link>
            ))}
        </nav>
        <div className="team-sidebar-bottom">
          <div className="team-avatar">{data.me.name.slice(0, 1)}</div>
          <div>
            <strong>{data.me.name}</strong>
            <small>{owner ? "Owner" : "Sales partner · 40% share"}</small>
          </div>
          <button
            aria-label="Sign out"
            className="icon-button"
            onClick={() => act("logout", {})}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="team-main">
        <header className="team-topbar">
          <span>
            KOINOPHOBIA LABS <span className="team-slash">/</span> TEAM
          </span>
          <span className="team-status">
            <i />
            {data.fake ? "FAKE DATA PREVIEW" : "PRIVATE WORKSPACE"}
          </span>
        </header>
        <main className="team-content">
          <div className="team-page-heading">
            <div>
              <p className="team-eyebrow">
                {String(
                  navigation.findIndex((x) => x[0] === screen) + 1,
                ).padStart(2, "0")}{" "}
                / {navigation.find((x) => x[0] === screen)?.[1].toUpperCase()}
              </p>
              <h1>{headings[screen][0]}</h1>
              <p>{headings[screen][1]}</p>
            </div>
            <span className="team-outline-label">
              {owner ? "OWNER VIEW" : "PARTNER VIEW"}
            </span>
          </div>
          {data.fake && (
            <div className="team-preview-note">
              Fictional demonstration records only. Hosted preview is read-only;
              no real contacts or payments.
            </div>
          )}
          {message && (
            <div role="status" className="team-notice">
              {message}
            </div>
          )}
          {screen === "leads" && (
            <>
              <div className="team-stats">
                <Stat
                  title="Assigned leads"
                  value={String(data.leads.length)}
                  note="A place to start"
                />
                <Stat
                  title="Open conversations"
                  value={String(
                    data.deals.filter(
                      (d) => !["Lead", "Lost", "Delivered"].includes(d.stage),
                    ).length,
                  )}
                  note="Keep the next step clear"
                />
                <Stat
                  title="Ready to help"
                  value={String(
                    data.deals.filter((d) => d.stage === "Won").length,
                  )}
                  note="Awaiting client payment"
                />
              </div>
              <div className="team-section-title">
                <h2>
                  Lead desk <span>{data.leads.length}</span>
                </h2>
                <div className="team-search">
                  <Search size={16} />
                  <input
                    aria-label="Search leads"
                    placeholder="Search your leads"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="team-lead-grid">
                <div className="team-lead-list">
                  {data.leads
                    .filter((l) =>
                      (l.business + " " + l.email)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((l) => (
                      <button
                        className={
                          "team-lead-row " +
                          (selectedLead?.id === l.id ? "selected" : "")
                        }
                        key={l.id}
                        onClick={() => setSelected(l.id)}
                      >
                        <span className="team-lead-avatar">
                          {l.business.slice(0, 1)}
                        </span>
                        <span>
                          <strong>{l.business}</strong>
                          <small>
                            {l.city ? [l.city, l.state].join(", ") : l.channel}{" "}
                            · {l.opted_out ? "Do not contact" : "Assigned lead"}
                          </small>
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                  {!data.leads.length && (
                    <Empty text="Your next leads will appear here when Blake assigns them." />
                  )}
                </div>
                {selectedLead && (
                  <section className="team-card team-lead-detail">
                    <div className="team-card-kicker">
                      LEAD BRIEF{" "}
                      <span className="team-tag">
                        {selectedLead.opted_out
                          ? "OPTED OUT"
                          : "READY TO REVIEW"}
                      </span>
                    </div>
                    <h2>{selectedLead.business}</h2>
                    <p>{selectedLead.website}</p>
                    <dl>
                      <dt>Contact</dt>
                      <dd>{selectedLead.contact || "Business team"}</dd>
                      <dt>Email</dt>
                      <dd>{selectedLead.email || "Not listed"}</dd>
                      <dt>Phone</dt>
                      <dd>{selectedLead.phone || "Not listed"}</dd>
                      <dt>Time zone</dt>
                      <dd>
                        {selectedLead.time_zone || "Confirm before calling"}
                      </dd>
                    </dl>
                    <div className="team-inset">
                      <p className="team-eyebrow">THE REASON TO REACH OUT</p>
                      <p>{selectedLead.opener || selectedLead.notes}</p>
                      {selectedLead.evidence?.map((e, i) => (
                        <p key={i}>
                          <strong>{e.check}:</strong> {e.measurement}
                        </p>
                      ))}
                    </div>
                    <div className="team-actions">
                      <Link
                        href="/team/check"
                        className="team-button secondary"
                      >
                        Run site check <ArrowUpRight size={15} />
                      </Link>
                      <button
                        className="text-button"
                        disabled={disabled || selectedLead.opted_out}
                        onClick={() => act("optout", { id: selectedLead.id })}
                      >
                        Record opt-out
                      </button>
                    </div>
                    <small>
                      Opt-outs apply to every partner, across matching email,
                      phone and website.
                    </small>
                  </section>
                )}
              </div>
            </>
          )}
          {screen === "check" && (
            <>
              <section className="team-card team-check-intro">
                <div>
                  <p className="team-eyebrow">FREE SITE CHECK</p>
                  <h2>Start with the evidence.</h2>
                  <p>
                    Check HTTPS, mobile viewport, metadata, phone links and
                    contact or booking links. Forms and browser performance
                    still need a human check.
                  </p>
                </div>
                <ScanLine size={58} strokeWidth={1} />
              </section>
              <form
                className="team-card team-inline-form"
                onSubmit={submit("check")}
              >
                <label>
                  Website URL
                  <input
                    name="url"
                    type="url"
                    required
                    placeholder="https://business.com"
                  />
                </label>
                <button disabled={disabled}>
                  {busy ? "Checking…" : "Run site check"}{" "}
                  <ArrowRight size={16} />
                </button>
              </form>
              {data.site_checks.length ? (
                data.site_checks.map((check) => (
                  <section className="team-card" key={check.id}>
                    <div className="team-section-title">
                      <div>
                        <p className="team-eyebrow">CHECK RESULTS</p>
                        <h2>{check.url}</h2>
                      </div>
                      <span className="team-tag">
                        {new Date(check.measured_at).toLocaleDateString(
                          "en-US",
                          { timeZone: "UTC" },
                        )}
                      </span>
                    </div>
                    {check.findings.map((finding, i) => (
                      <div className="team-finding" key={i}>
                        <span
                          className={"team-finding-symbol " + finding.status}
                        >
                          {finding.status === "pass" ? (
                            <Check size={15} />
                          ) : finding.status === "review" ? (
                            "!"
                          ) : (
                            "?"
                          )}
                        </span>
                        <div>
                          <strong>{finding.name}</strong>
                          <p>{finding.detail}</p>
                        </div>
                        <span className="team-fine">{finding.status}</span>
                      </div>
                    ))}
                    <button
                      className="secondary"
                      onClick={() =>
                        copy(
                          check.findings
                            .map((f) => `${f.name}: ${f.detail}`)
                            .join("\n"),
                        )
                      }
                    >
                      <Copy size={15} /> Copy findings
                    </button>
                  </section>
                ))
              ) : (
                <Empty text="Run a check to create your first measured brief." />
              )}
            </>
          )}
          {screen === "quote" && (
            <>
              <div className="team-two-columns">
                <section className="team-card">
                  <p className="team-eyebrow">01 / BUILD THE SCOPE</p>
                  <h2>A useful offer, clearly priced.</h2>
                  <form
                    onSubmit={submit("quote", (f) => ({
                      lead_id: f.get("lead_id"),
                      services: f.getAll("services"),
                    }))}
                  >
                    <label>
                      Business
                      <select name="lead_id" required>
                        <option value="">Choose a lead</option>
                        {data.leads
                          .filter((l) => !l.opted_out)
                          .map((l) => (
                            <option value={l.id} key={l.id}>
                              {l.business}
                            </option>
                          ))}
                      </select>
                    </label>
                    <fieldset className="team-service-options">
                      <legend>Choose services</legend>
                      {SERVICES.map((s) => (
                        <label key={s.id}>
                          <input
                            type="checkbox"
                            name="services"
                            value={s.id}
                            checked={services.includes(s.id)}
                            onChange={(e) =>
                              setServices(
                                e.target.checked
                                  ? [...services, s.id]
                                  : services.filter((id) => id !== s.id),
                              )
                            }
                          />
                          <span>
                            {s.name}
                            <small>{servicePrice(s)}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <div className="team-inset">
                      <p className="team-eyebrow">INCLUDED IN THE SCOPE</p>
                      <p>
                        {SERVICES.filter((s) => services.includes(s.id))
                          .map((s) => s.scope)
                          .join("\n\n")}
                      </p>
                    </div>
                    <button
                      disabled={
                        disabled || !data.leads.length || !services.length
                      }
                    >
                      <Plus size={16} /> Create quote for approval
                    </button>
                  </form>
                </section>
                <section className="team-card team-accent-card">
                  <p className="team-eyebrow">THE PARTNER PROMISE</p>
                  <h2>
                    Clear scope.
                    <br />
                    No surprises.
                  </h2>
                  <p>
                    Blake approves every quote. Fixed-price offers use the
                    site’s secure Checkout. Custom work gets a written scope and
                    milestone pricing.
                  </p>
                  <div className="team-rule" />
                  <p>
                    <strong>40% of what the client pays.</strong>
                    <br />
                    Commission is owed when a verified payment lands.
                  </p>
                  <small>
                    Nothing is sent from this desk. Copy the approved message
                    and share it yourself.
                  </small>
                </section>
              </div>
              <div className="team-section-title">
                <h2>Your quotes</h2>
                <span className="team-fine">OWNER APPROVAL REQUIRED</span>
              </div>
              <div className="team-quote-grid">
                {data.deals.map((d) => {
                  const link = data.readonly ? null : quotePaymentLink(d);
                  const lead = data.leads.find((l) => l.id === d.lead_id);
                  return (
                    <section className="team-card" key={d.id}>
                      <div className="team-card-kicker">
                        {d.services
                          .map((id) => SERVICES.find((s) => s.id === id)?.name)
                          .join(" + ")}
                        <span
                          className={"team-tag " + (d.approved ? "green" : "")}
                        >
                          {d.approved ? "APPROVED" : "IN REVIEW"}
                        </span>
                      </div>
                      <h2>{name(d)}</h2>
                      <div className="team-quote-price">
                        {d.price === null ? "Custom quote" : money(d.price)}
                        {d.monthly > 0 && <small> / month</small>}
                      </div>
                      <p>{d.scope}</p>
                      <div className="team-actions">
                        {owner && !d.approved && (
                          <form
                            onSubmit={submit("deal", (f) => ({
                              id: d.id,
                              action: "approve",
                              price: f.get("price")
                                ? Math.round(Number(f.get("price")) * 100)
                                : undefined,
                            }))}
                          >
                            {d.price === null && (
                              <label>
                                Approved price (USD)
                                <input
                                  name="price"
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  required
                                />
                              </label>
                            )}
                            <button disabled={disabled}>Approve quote</button>
                          </form>
                        )}
                        <button
                          className="secondary"
                          disabled={!link || lead?.opted_out}
                          onClick={() => link && copy(link)}
                        >
                          <Copy size={15} /> Copy payment link
                        </button>
                        <button
                          className="text-button"
                          disabled={
                            !d.approved || lead?.opted_out || data.readonly
                          }
                          onClick={() =>
                            copy(
                              quoteMessage(
                                d,
                                name(d),
                                data.me.name,
                                "Text",
                                link || "Reply to confirm the written scope",
                              ),
                            )
                          }
                        >
                          Copy quote text
                        </button>
                      </div>
                      {data.readonly && (
                        <small>
                          Payment links are disabled for fictional preview
                          deals.
                        </small>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}
          {screen === "pipeline" && (
            <>
              <div className="team-stats">
                <Stat
                  title="Active deals"
                  value={String(
                    data.deals.filter(
                      (d) => !["Lost", "Delivered"].includes(d.stage),
                    ).length,
                  )}
                  note="From conversation to delivery"
                />
                <Stat
                  title="Collected"
                  value={money(totals.received)}
                  note="Verified client payments"
                />
                <Stat
                  title="Commission owed"
                  value={money(totals.owed)}
                  note="40% less recorded payouts"
                />
              </div>
              <div className="team-pipeline">
                {STAGES.map((stage) => (
                  <section className="team-stage" key={stage}>
                    <div className="team-stage-title">
                      <span
                        className={
                          "stage-dot " +
                          (stage === "Client paid" ? "green" : "")
                        }
                      />
                      <h2>{stage}</h2>
                      <span>
                        {data.deals.filter((d) => d.stage === stage).length}
                      </span>
                    </div>
                    {data.deals
                      .filter((d) => d.stage === stage)
                      .map((d) => (
                        <div className="team-deal-card" key={d.id}>
                          <p className="team-eyebrow">
                            {d.services.join(" + ")}
                          </p>
                          <h3>{name(d)}</h3>
                          <strong>
                            {d.price === null ? "Custom" : money(d.price)}
                          </strong>
                          <p className="team-fine">
                            {d.approved ? "Quote approved" : "Approval needed"}
                          </p>
                          {!["Delivered", "Lost"].includes(stage) && (
                            <form
                              onSubmit={submit("deal", (f) => ({
                                id: d.id,
                                stage: f.get("stage"),
                                reason: f.get("reason"),
                              }))}
                            >
                              <label className="team-fine">
                                Next stage
                                <select
                                  aria-label={"Next stage for " + name(d)}
                                  name="stage"
                                >
                                  <option value="">Choose…</option>
                                  {STAGES.filter(
                                    (s) =>
                                      s !== "Client paid" &&
                                      (s !== "Delivered" || owner) &&
                                      s !== stage,
                                  ).map((s) => (
                                    <option key={s}>{s}</option>
                                  ))}
                                </select>
                              </label>
                              <input
                                name="reason"
                                placeholder="Reason if lost"
                                aria-label="Lost reason"
                              />
                              <button
                                className="secondary small"
                                disabled={disabled}
                              >
                                Update <ArrowRight size={13} />
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                    {!data.deals.some((d) => d.stage === stage) && (
                      <p className="team-stage-empty">No deals here yet</p>
                    )}
                  </section>
                ))}
              </div>
              <p className="team-fine">
                Client paid updates automatically from Stripe. Only the owner
                marks work delivered.
              </p>
            </>
          )}
          {screen === "commissions" && (
            <>
              <div className="team-earnings-hero">
                <div>
                  <p className="team-eyebrow">COMMISSION OWED</p>
                  <div className="team-big-money">{money(totals.owed)}</div>
                  {owedBack > 0 && (
                    <p>
                      <strong>Owed back: {money(owedBack)}</strong> · deducted
                      from that partner’s future transfers.
                    </p>
                  )}
                  <p>
                    Your share of client payments, after refunds and balance
                    adjustments.
                  </p>
                </div>
                <div className="team-share">
                  <strong>
                    40<span>%</span>
                  </strong>
                  <small>OF CLIENT PAYMENTS</small>
                </div>
              </div>
              <div className="team-stats">
                <Stat
                  title="Client payments"
                  value={money(totals.received)}
                  note="Collected through Stripe"
                />
                <Stat
                  title="Commission earned"
                  value={money(totals.earned)}
                  note="Renewals count, too"
                />
                <Stat
                  title="Already paid out"
                  value={money(totals.paid)}
                  note={
                    data.connect
                      ? "Transfers and balance adjustments"
                      : "Recorded by the owner"
                  }
                />
              </div>
              <ConnectPanel data={data} busy={busy} act={act} />
              {!data.connect && (
                <>
                  <div className="team-section-title">
                    <h2>Commission ledger</h2>
                    <span className="team-tag">OVERRIDES OFF</span>
                  </div>
                  <div className="team-ledger">
                    {data.deals.map((d) => {
                      const c = commission(data, d);
                      return (
                        <section className="team-ledger-row" key={d.id}>
                          <div>
                            <h3>{name(d)}</h3>
                            <small>{d.stage}</small>
                          </div>
                          <div>
                            <small>Received</small>
                            <strong>{money(c.received)}</strong>
                          </div>
                          <div>
                            <small>Earned</small>
                            <strong>{money(c.earned)}</strong>
                          </div>
                          <div>
                            <small>Paid out</small>
                            <strong>{money(c.paid)}</strong>
                          </div>
                          <div>
                            <small>Owed</small>
                            <strong className="team-green">
                              {money(c.owed)}
                            </strong>
                          </div>
                          {owner && c.owed > 0 && (
                            <form
                              onSubmit={submit("payout", (f) => ({
                                id: d.id,
                                amount: Math.round(
                                  Number(f.get("amount")) * 100,
                                ),
                              }))}
                            >
                              <label>
                                Payout amount (USD)
                                <input
                                  name="amount"
                                  type="number"
                                  min="0.01"
                                  max={c.owed / 100}
                                  step="0.01"
                                  required
                                />
                              </label>
                              <button
                                disabled={disabled}
                                className="secondary small"
                              >
                                Record payout
                              </button>
                            </form>
                          )}
                        </section>
                      );
                    })}
                  </div>
                  <p className="team-fine">
                    Recording a payout does not move money. Refunded payments no
                    longer count toward earned commission; a negative balance
                    remains visible for reconciliation.
                  </p>
                </>
              )}
            </>
          )}
          {screen === "scripts" && (
            <>
              <div
                className="team-script-tabs"
                role="group"
                aria-label="Script channel"
              >
                {SCRIPTS.map((s) => (
                  <button
                    className={script === s.id ? "selected" : "secondary"}
                    key={s.id}
                    onClick={() => setScript(s.id)}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
              <div className="team-two-columns">
                <section className="team-card">
                  <div className="team-card-kicker">
                    {activeScript.id.toUpperCase()} SCRIPT{" "}
                    <MessageSquare size={17} />
                  </div>
                  <h2>{activeScript.title}</h2>
                  <p>{activeScript.note}</p>
                  {activeScript.body.includes("[MAILING ADDRESS") &&
                    !data.mailingAddress && (
                      <div className="team-notice">
                        Email is on hold. Blake must set the studio mailing
                        address before this template can be copied for use.
                      </div>
                    )}
                  <pre className="team-script-body">{scriptBody}</pre>
                  <button
                    disabled={
                      activeScript.body.includes("[MAILING ADDRESS") &&
                      !data.mailingAddress
                    }
                    onClick={() => copy(scriptBody)}
                  >
                    <Copy size={15} /> Copy {script.toLowerCase()} script
                  </button>
                </section>
                <section className="team-card team-script-guide">
                  <p className="team-eyebrow">THE PLAYBOOK</p>
                  <h2>Be useful first.</h2>
                  <ol>
                    <li>
                      <strong>One specific problem.</strong>
                      <p>
                        Use their measured finding. Never invent lost revenue or
                        results.
                      </p>
                    </li>
                    <li>
                      <strong>Show, then offer.</strong>
                      <p>
                        A two-minute recording makes the issue clear before they
                        buy.
                      </p>
                    </li>
                    <li>
                      <strong>Respect the answer.</strong>
                      <p>
                        Log “no thanks” as an opt-out immediately. It applies to
                        every partner.
                      </p>
                    </li>
                  </ol>
                  <div className="team-inset">
                    <strong>Follow-up rhythm</strong>
                    <p>
                      Day 3: a useful reminder.
                      <br />
                      Day 7: one last note.
                      <br />
                      Day 14: stop; mark Lost, “no reply”.
                    </p>
                  </div>
                  <small>
                    Work remotely with businesses across the US. Call business
                    numbers during their local business hours.
                  </small>
                </section>
              </div>
            </>
          )}
          {screen === "admin" && owner && (
            <>
              <div className="team-stats">
                <Stat
                  title="Team members"
                  value={String(data.partners.length)}
                  note="Invited access only"
                />
                <Stat
                  title="Assigned leads"
                  value={String(data.leads.length)}
                  note="Scoped to each partner"
                />
                <Stat
                  title="Payouts owed"
                  value={money(totals.owed)}
                  note="Owner records every payout"
                />
              </div>
              <div className="team-two-columns">
                <section className="team-card">
                  <div className="team-card-kicker">
                    INVITE A PARTNER <Plus size={18} />
                  </div>
                  <h2>Bring someone in.</h2>
                  <form onSubmit={submit("invite")}>
                    <label>
                      Name
                      <input
                        name="name"
                        required
                        maxLength={120}
                        placeholder="Partner’s full name"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="partner@company.com"
                      />
                    </label>
                    <label>
                      Parent partner (optional)
                      <select name="parent_partner_id">
                        <option value="">None</option>
                        {data.partners
                          .filter((p) => p.role === "partner" && p.active)
                          .map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <p className="team-fine">
                      Sub-reps are modelled. Override commissions remain off.
                    </p>
                    <button disabled={disabled}>
                      Create invitation <ArrowRight size={16} />
                    </button>
                  </form>
                  {inviteCode && (
                    <div className="team-notice">
                      Share privately; expires in 7 days.{" "}
                      <code>{inviteCode}</code>
                      <button
                        className="secondary"
                        onClick={() => copy(inviteCode)}
                      >
                        Copy invite code
                      </button>
                    </div>
                  )}
                </section>
                <section className="team-card">
                  <div className="team-card-kicker">
                    LEAD IMPORT <Upload size={18} />
                  </div>
                  <h2>Give them a good start.</h2>
                  <p>
                    Upload the lead generator’s leads.json. Evidence and contact
                    details stay attached. Duplicates and global opt-outs are
                    skipped.
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget),
                        file = f.get("file") as File;
                      try {
                        if (file.size > 2_000_000)
                          throw Error("Upload must be under 2 MB.");
                        await act("import", {
                          partner_id: f.get("partner_id"),
                          leads: JSON.parse(await file.text()),
                        });
                      } catch {
                        setMessage("Choose a valid leads.json under 2 MB.");
                      }
                    }}
                  >
                    <label>
                      Assign to
                      <select name="partner_id" required>
                        <option value="">Choose a partner</option>
                        {data.partners
                          .filter((p) => p.role === "partner" && p.active)
                          .map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      leads.json
                      <input
                        type="file"
                        name="file"
                        accept=".json,application/json"
                        required
                      />
                    </label>
                    <button disabled={disabled}>
                      <Upload size={16} /> Import & assign
                    </button>
                  </form>
                </section>
              </div>
              <section className="team-card">
                <div className="team-card-kicker">
                  STUDIO SETTINGS <ShieldCheck size={18} />
                </div>
                <h2>Mailing address</h2>
                <p>
                  The address appears in email outreach templates. Email copy
                  remains on hold until this is filled in.
                </p>
                <form
                  className="team-inline-form"
                  onSubmit={submit("settings")}
                >
                  <label>
                    Studio mailing address
                    <input
                      name="address"
                      defaultValue={data.mailingAddress}
                      maxLength={500}
                      placeholder="Street / suite, city, state, ZIP"
                    />
                  </label>
                  <button disabled={disabled}>Save address</button>
                </form>
              </section>
              <section className="team-card">
                <h2>Team access</h2>
                {data.partners.map((p) => (
                  <div className="team-member" key={p.id}>
                    <span className="team-lead-avatar">
                      {p.name.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.role} · {p.active ? "Active" : "Inactive"}
                      </small>
                    </div>
                    {p.role === "partner" && p.active && (
                      <button
                        disabled={disabled}
                        className="text-button"
                        onClick={() => act("deactivate", { id: p.id })}
                      >
                        Deactivate access
                      </button>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
          <footer className="team-footer">
            <span>KOINOPHOBIA LABS</span>
            <span>Useful work. Honest records.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <section className="team-stat">
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="team-empty">
      <Layers3 size={25} />
      <p>{text}</p>
    </div>
  );
}
