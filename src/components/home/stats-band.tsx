/*
 * StatsBand — the dark count band under the hero (reference reconstruction
 * Phase 2 §4.4). The reference band shows Contractor RFQs · Call Inquiries ·
 * Products · Suppliers. RFQ and call counters have no live data source in
 * this build, so the band is HONEST: Products · Suppliers · Departments ·
 * Districts, all derived from the live catalogue API on the server.
 * (Dependency documented: reference-level RFQ/call counters when a public
 * aggregation endpoint exists.)
 */
interface Stat {
  value: string;
  label: string;
}

export function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-ink text-white">
      <div className="shell-public grid grid-cols-2 gap-x-4 gap-y-6 py-10 md:grid-cols-4 md:py-12">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-3xl font-extrabold tracking-tight tabular-nums md:text-4xl">
              {stat.value}
            </p>
            <p className="type-micro mt-1 font-medium text-ink-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}