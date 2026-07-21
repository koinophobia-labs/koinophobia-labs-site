"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import FrontOfficeChat, { type FrontOfficeApi } from "@/components/front-office/FrontOfficeChat";
import KoiGlyph from "@/components/dev-koi/KoiGlyph";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import { personalOutcome, personalPolicy } from "@/lib/front-office/personal-policy";

/**
 * The personal koi's front-office panel — koinophobia.dev only.
 *
 * A compact surface anchored to the koi on desktop and a bottom sheet on
 * small screens; never a site-covering modal. Non-modal on purpose: the page
 * stays usable behind it, Escape closes, and the koi keeps focus custody
 * (PersonalKoi restores focus to the trigger on close).
 *
 * This host collects nothing. Every terminal card is a truthful pointer —
 * a product destination, the /now page, Blake's inbox, or the studio's own
 * intake. The only "submission" is the visitor deciding to follow a link.
 */

export default function PersonalKoiPanel({
  world,
  observationLine,
  onClose,
}: {
  world?: string;
  /** The koi's current page observation, shown as the grounded greeting. */
  observationLine?: string | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    trackStudioEvent("front_office_opened", {
      host: "personal",
      route: window.location.pathname,
    });
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="devkoi-panel__scrim" aria-hidden="true" onClick={onClose} />
      <aside
        ref={panelRef}
        className="devkoi-panel"
        role="dialog"
        aria-labelledby="devkoi-panel-title"
        data-world={world}
      >
        <header className="devkoi-panel__header">
          <span className="devkoi-panel__mark" aria-hidden="true"><KoiGlyph /></span>
          <div>
            <p className="devkoi-panel__kicker">The koi</p>
            <strong id="devkoi-panel-title">What are you here for?</strong>
            {observationLine ? <p className="devkoi-panel__observation">{observationLine}</p> : null}
          </div>
          <button ref={closeRef} type="button" className="devkoi-panel__close" onClick={onClose} aria-label="Close the koi panel">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="devkoi-panel__body">
          <FrontOfficeChat
            policy={personalPolicy}
            route={typeof window === "undefined" ? "" : window.location.pathname}
            lead="Say what you're working on — I'll point you at the closest build and tell you honestly what state it's in."
            privacyNote="This stays in your browser. Nothing here is saved, tracked to you, or sent anywhere."
            Outcome={PersonalOutcomeView}
          />
        </div>
      </aside>
    </>
  );
}

function PersonalOutcomeView({ api }: { api: FrontOfficeApi }) {
  const { session, restart, track } = api;
  const outcome = personalOutcome(session);
  const trackedRef = useRef(false);

  // This view only mounts at a terminal stage, so once-per-mount is the
  // correct cadence — and it runs in an effect because analytics is a side
  // effect, never render work.
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track("front_office_recommendation_shown", {
      recommendation: outcome.kind === "product" ? outcome.match.slug : outcome.kind,
    });
  }, [outcome, track]);

  const restartRow = (
    <div className="ffo__footer">
      <button type="button" className="ffo__restart" onClick={restart}>
        <RotateCcw size={13} aria-hidden="true" /> Ask about something else
      </button>
    </div>
  );

  if (outcome.kind === "product") {
    const match = outcome.match;
    return (
      <div className="ffo__outcome" data-product={match.slug}>
        <p className="ffo__eyebrow">Closest build</p>
        <h3>{match.name}</h3>
        <p className="ffo__who">{match.who}</p>
        <p className="ffo__addresses">{match.addresses}</p>
        <p className="ffo__availability">{match.availability}</p>
        {match.truthNote ? <p className="ffo__truth" role="status">{match.truthNote}</p> : null}
        <p className="ffo__limitation"><span>Not yet:</span> {match.limitation}</p>
        {match.destination ? (
          match.destination.external ? (
            <a className="ffo__primary" href={match.destination.href} target="_blank" rel="noopener noreferrer" onClick={() => track("front_office_destination_followed", { recommendation: match.slug })}>
              {match.destination.label} <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ) : (
            <Link className="ffo__primary" href={match.destination.href} onClick={() => track("front_office_destination_followed", { recommendation: match.slug })}>
              {match.destination.label} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )
        ) : null}
        <p className="ffo__whyfit">{match.whyFit}</p>
        <Link className="ffo__alt-link" href={`/products/${match.slug}`}>The full story, decisions, and honest state</Link>
        {restartRow}
      </div>
    );
  }

  if (outcome.kind === "handoff") {
    return (
      <div className="ffo__outcome">
        <p className="ffo__eyebrow">That&apos;s studio work</p>
        <h3>Two sites, one honest split.</h3>
        <p>{outcome.explanation}</p>
        <div className="ffo__carried">
          <p>What carries over:</p>
          <blockquote>{outcome.handoff.carried}</blockquote>
        </div>
        <a
          className="ffo__primary"
          href={outcome.handoff.href}
          onClick={() => track("front_office_handoff_selected", { recommendation: "studio_intake" })}
        >
          Continue at the studio intake <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <p className="ffo__consent">Nothing is sent by this handoff — the studio intake shows everything for review, and only submitting there shares it.</p>
        {restartRow}
      </div>
    );
  }

  if (outcome.kind === "collaborate") {
    return (
      <div className="ffo__outcome">
        <p className="ffo__eyebrow">Collaboration</p>
        <h3>Straight to Blake.</h3>
        <p>{outcome.note}</p>
        <a className="ffo__primary" href={outcome.href} onClick={() => track("front_office_handoff_selected", { recommendation: "email" })}>
          Email Blake <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        {restartRow}
      </div>
    );
  }

  if (outcome.kind === "now") {
    return (
      <div className="ffo__outcome">
        <p className="ffo__eyebrow">In motion · checked {outcome.updated}</p>
        <h3>What&apos;s actually moving</h3>
        <ul className="ffo__now-list">
          {outcome.items.map((item) => (
            <li key={item.name}><strong>{item.name}</strong><span>{item.stage}</span></li>
          ))}
        </ul>
        <Link className="ffo__primary" href={outcome.href}>
          Read the full update <ArrowRight size={15} aria-hidden="true" />
        </Link>
        {restartRow}
      </div>
    );
  }

  return (
    <div className="ffo__outcome">
      <p className="ffo__eyebrow">Good rooms to wander</p>
      <h3>Explore on your own.</h3>
      <ul className="ffo__explore">
        {outcome.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label} <ArrowRight size={13} aria-hidden="true" /></Link>
          </li>
        ))}
      </ul>
      {restartRow}
    </div>
  );
}
