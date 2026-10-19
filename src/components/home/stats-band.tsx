/*
 * Honest catalogue pulse — products · suppliers · categories from API summary.
 */

interface Stat {
  label: string;
  value: string;
}

export function StatsBand({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;

  return (
    <section className="border-b border-line bg-surface-page" data-home-reveal>
      <div className="shell-public grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-page px-5 py-8 md:py-10">
            <p className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 type-meta font-medium tracking-wide text-ink-muted uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
