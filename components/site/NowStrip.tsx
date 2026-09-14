import Link from "next/link";
import { logEntries } from "@/lib/dev/log";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${d}`;
}

/** The last three log entries, generated at build. No hand-maintained "now". */
export const nowEntries = [...logEntries]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3);

export default function NowStrip() {
  return (
    <div className="now" aria-label="Now, from the build log">
      <p className="k">
        <b>Now</b> · from the build log
      </p>
      {nowEntries.map((entry) => (
        <Link key={entry.slug} href={`/log#${entry.slug}`} data-analytics="log_entry_view" data-analytics-label={entry.slug}>
          <time dateTime={entry.date}>{shortDate(entry.date)}</time>
          <span>{entry.title}</span>
        </Link>
      ))}
    </div>
  );
}
