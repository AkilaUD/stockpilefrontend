export interface ComparisonRow {
  supplier: string;
  unitPrice: string;
  leadTime: string;
  total: string;
  /** When true, row is the lowest total (visual peak emphasis). */
  lowest?: boolean;
}

export interface HomeComparisonPeakProps {
  stamp: string;
  title: string;
  note: string;
  item: string;
  supplierHeader: string;
  unitPriceHeader: string;
  leadTimeHeader: string;
  totalHeader: string;
  rows: ComparisonRow[];
}

/**
 * Labelled EXAMPLE quote comparison — the scroll peak visual.
 * Rows stagger via GSAP on `[data-compare-row]` when the workflow pin fires.
 */
export function HomeComparisonPeak({
  stamp,
  title,
  note,
  item,
  supplierHeader,
  unitPriceHeader,
  leadTimeHeader,
  totalHeader,
  rows,
}: HomeComparisonPeakProps) {
  return (
    <div
      className="rounded-lg border border-line bg-surface-panel p-5 shadow-elev-sm"
      data-comparison-peak
    >
      <p className="type-label text-ink-muted">{stamp}</p>
      <h3 className="type-title-md mt-2 text-ink">{title}</h3>
      <p className="type-body-sm mt-1 text-ink-muted">{note}</p>
      <p className="type-body-sm mt-4 font-semibold text-ink">{item}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-80 border-t border-line text-left">
          <thead>
            <tr className="type-label text-ink-muted">
              <th className="py-2 pr-2 font-semibold">{supplierHeader}</th>
              <th className="py-2 pr-2 font-semibold">{unitPriceHeader}</th>
              <th className="py-2 pr-2 font-semibold">{leadTimeHeader}</th>
              <th className="py-2 text-right font-semibold">{totalHeader}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.supplier}
                data-compare-row
                data-lowest={row.lowest ? "true" : undefined}
                className={
                  row.lowest
                    ? "type-data border-t border-line bg-brand-primary/15 text-ink"
                    : "type-data border-t border-line text-ink"
                }
              >
                <td className="py-2.5 pr-2 font-semibold">{row.supplier}</td>
                <td className="py-2.5 pr-2 tabular">{row.unitPrice}</td>
                <td className="py-2.5 pr-2">{row.leadTime}</td>
                <td className="py-2.5 text-right tabular font-semibold">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
