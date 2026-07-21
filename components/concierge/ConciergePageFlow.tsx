"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import ConciergeFlow from "@/components/concierge/ConciergeFlow";

const StudioFrontOffice = dynamic(() => import("@/components/front-office/StudioFrontOffice"), {
  loading: () => <div className="koi-companion-panel__loading" role="status">Opening the front office…</div>,
});

/**
 * The /concierge page surface.
 *
 * The usability audit's headline finding: every prominent "help me" CTA on
 * the site pointed here — and this page led with the seven-step form while
 * the better conversational flow hid behind the koi. Flipping the hierarchy
 * turns all of those existing buttons into front doors for the front office.
 *
 * The step-by-step concierge is one honest toggle away (and directly
 * linkable via ?mode=steps), because some visitors genuinely prefer fixed
 * questions — the audit's standard is the shortest path to a useful brief,
 * not fewer choices.
 */
export default function ConciergePageFlow({ entry, mode }: { entry: string; mode?: string }) {
  const [surface, setSurface] = useState<"front_office" | "steps">(mode === "steps" ? "steps" : "front_office");

  if (surface === "steps") {
    return (
      <div className="concierge-page-flow">
        <div className="concierge-page-flow__switch">
          <button
            type="button"
            className="concierge-link-button"
            onClick={() => {
              setSurface("front_office");
              trackStudioEvent("front_office_opened", { host: "studio", route: "/concierge", entry });
            }}
          >
            Prefer to say it in your own words? Use the conversational front office
          </button>
        </div>
        <ConciergeFlow entry={entry} />
      </div>
    );
  }

  return (
    <div className="concierge-page-flow">
      <StudioFrontOffice />
      <div className="concierge-page-flow__switch">
        <button
          type="button"
          className="concierge-link-button"
          onClick={() => {
            setSurface("steps");
            trackStudioEvent("concierge_standard_form_selected", { step_id: "front_office_page" });
          }}
        >
          Prefer fixed steps? Use the seven-question concierge
        </button>
      </div>
    </div>
  );
}
