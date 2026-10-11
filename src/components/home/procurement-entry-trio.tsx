import { Link } from "@/i18n/navigation";

/*
 * ProcurementEntryTrio — the secondary entry trio (§8.2, §6.1 motif).
 *
 * Three DELIBERATELY UNEQUAL navigation choices (spans 5/4/3), hard edges
 * (`rounded-none`). These read as navigation, not feature cards: step number
 * + plain title + one line of body + text link — no icon-above-heading, no
 * identical boxes, no pill CTA (§8.2). Server Component.
 */

interface TrioEntry {
  step: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}

export function ProcurementEntryTrio({ entries }: { entries: [TrioEntry, TrioEntry, TrioEntry] }) {
  const spans = ["lg:col-span-5", "lg:col-span-4", "lg:col-span-3"];
  return (
    <nav aria-label="Ways to start" className="grid gap-4 lg:grid-cols-12">
      {entries.map((entry, index) => (
        <Link
          key={entry.href}
          href={entry.href}
          className={`group flex flex-col gap-2 rounded-none border border-line bg-surface-panel p-6 transition-colors duration-instant ease-standard hover:border-ink-strong hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${spans[index] ?? ""}`}
        >
          <span className="type-meta font-mono text-ink-muted">{entry.step}</span>
          <span className="type-title-lg text-ink group-hover:text-ink-accent">{entry.title}</span>
          <span className="type-body text-ink-muted">{entry.body}</span>
          <span className="type-body mt-auto pt-3 font-medium text-ink-accent">{entry.linkLabel} →</span>
        </Link>
      ))}
    </nav>
  );
}
