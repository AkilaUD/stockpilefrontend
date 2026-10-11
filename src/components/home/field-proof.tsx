/*
 * FieldProof — where the catalogue actually reaches (§8.3 item 8, honest).
 *
 * There is no projects/case-studies endpoint, so this section refuses to
 * invent completed jobs: it renders what the directory really says — every
 * district suppliers list, the verified share, the department count. A mono
 * register, TradeCredentials-adjacent. All values arrive as props from live
 * server reads. Server Component.
 */

interface FieldProofProps {
  title: string;
  districtsLabel: string;
  districts: string[];
  verifiedLabel: string;
  verifiedValue: string;
  departmentsLabel: string;
  departmentsValue: string;
}

export function FieldProof({
  title,
  districtsLabel,
  districts,
  verifiedLabel,
  verifiedValue,
  departmentsLabel,
  departmentsValue,
}: FieldProofProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h3 className="type-title-lg text-ink">{title}</h3>
        <dl className="mt-6 space-y-4">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="type-body text-ink-muted">{verifiedLabel}</dt>
            <dd className="type-title-sm font-mono tabular text-ink">{verifiedValue}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="type-body text-ink-muted">{departmentsLabel}</dt>
            <dd className="type-title-sm font-mono tabular text-ink">{departmentsValue}</dd>
          </div>
        </dl>
      </div>
      <div className="lg:col-span-8">
        <p className="type-label text-ink-muted">{districtsLabel}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {districts.map((district) => (
            <li
              key={district}
              className="type-meta rounded-full border border-line bg-surface-panel px-3 py-1.5 font-mono text-ink"
            >
              {district}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
