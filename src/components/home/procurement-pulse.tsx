/*
 * ProcurementPulse — live marketplace metrics (§6.1 motif, §8.3 item 3).
 *
 * DYNAMIC VALUES ONLY: every figure arrives as a prop from the page's
 * server-side reads — the supplier total here must reconcile with the
 * directory total because it is the same read (§8.3). Hard-coded marketing
 * numbers are forbidden (§1). Big mono numerals, label beneath; colour never
 * carries meaning (§10). Server Component.
 */

interface PulseMetric {
  label: string;
  value: string;
}

export function ProcurementPulse({ metrics, note }: { metrics: PulseMetric[]; note: string }) {
  return (
    <section aria-label={note} className="bg-surface-dark">
      <div className="shell-public py-12 md:py-16">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="border-l-2 border-brand-primary pl-4">
              <dd className="type-display-md font-mono tabular text-white">{metric.value}</dd>
              <dt className="type-meta mt-1 font-mono uppercase tracking-wide text-white/70">{metric.label}</dt>
            </div>
          ))}
        </dl>
        <p className="type-meta mt-8 font-mono text-white/50">{note}</p>
      </div>
    </section>
  );
}
