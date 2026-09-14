import { Fragment } from "react";
import type { Evidence } from "@/lib/dev/universe";

/** Only explicit public URLs become links; private artifact paths stay text. */
export function EvidenceSource({ source }: { source: string }) {
  return source.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return <Fragment key={index}>{part}</Fragment>;
    const url = part.replace(/[.,;:)]+$/, "");
    return <Fragment key={index}><a href={url} target="_blank" rel="noreferrer">{url}</a>{part.slice(url.length)}</Fragment>;
  });
}

export default function EvidenceDetails({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return null;
  return (
    <details className="evidence-details">
      <summary>Sources and verification details</summary>
      <ul className="evidence" aria-label="Evidence">
        {evidence.map((item) => <li key={item.claim}><b>{item.claim}</b><EvidenceSource source={item.source} /></li>)}
      </ul>
    </details>
  );
}
