import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

/*
 * Buyer benefits + an illustrative comparison table.
 * The table is an EXAMPLE only (labelled as such) — no real supplier
 * names, prices, or savings claims.
 */

interface BenefitItem {
  title: string;
  body: string;
}

interface BuyerBenefitsProps {
  title: string;
  lede: string;
  items: BenefitItem[];
  imageAlt: string;
  ctaLabel: string;
  example: {
    title: string;
    note: string;
    item: string;
    supplierHeader: string;
    unitPriceHeader: string;
    leadTimeHeader: string;
    totalHeader: string;
    rows: { supplier: string; unitPrice: string; leadTime: string; total: string }[];
  };
}

export function BuyerBenefits({ title, lede, items, imageAlt, ctaLabel, example }: BuyerBenefitsProps) {
  return (
    <section className="border-b border-line bg-surface-page py-14 md:py-20" data-home-reveal>
      <div className="shell-public grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h2>
          <p className="mt-3 type-body text-ink-muted">{lede}</p>
          <ul className="mt-8 space-y-6">
            {items.map((item, index) => (
              <li key={item.title} className="border-l-2 border-brand-primary pl-4">
                <h3 className="type-title-sm font-semibold text-ink">
                  <span className="mr-2 text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
                  {item.title}
                </h3>
                <p className="mt-1 type-body-sm text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <ButtonLink href="/rfq" size="lg" className="mt-8">
            {ctaLabel}
          </ButtonLink>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-recessed">
            <Image
              src="/home/home-buyer-desk.jpg"
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="mt-6 border border-line bg-surface-elevated">
            <div className="border-b border-line px-5 py-4">
              <h3 className="type-title-sm font-semibold text-ink">{example.title}</h3>
              <p className="mt-1 type-meta text-ink-muted">
                {example.item} · {example.note}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-line type-meta tracking-wide text-ink-muted uppercase">
                    <th scope="col" className="px-5 py-3 font-medium">{example.supplierHeader}</th>
                    <th scope="col" className="px-5 py-3 font-medium">{example.unitPriceHeader}</th>
                    <th scope="col" className="px-5 py-3 font-medium">{example.leadTimeHeader}</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">{example.totalHeader}</th>
                  </tr>
                </thead>
                <tbody>
                  {example.rows.map((row) => (
                    <tr key={row.supplier} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 type-body-sm font-medium text-ink">{row.supplier}</td>
                      <td className="px-5 py-3 type-body-sm text-ink">{row.unitPrice}</td>
                      <td className="px-5 py-3 type-body-sm text-ink">{row.leadTime}</td>
                      <td className="px-5 py-3 text-right type-body-sm font-semibold text-ink">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
