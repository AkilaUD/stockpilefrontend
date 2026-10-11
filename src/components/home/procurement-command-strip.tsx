import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";
import { HeroSearch } from "./hero-search";

/*
 * ProcurementCommandStrip — the home hero composition (§8.1, §6.1 motif).
 *
 * Three-zone asymmetric grid, left → right: narrative (span 5) / action
 * (span 4) / material (span 3). The headline is display-xl LEFT-aligned
 * (§52 forbids the huge-centred-headline + three-cards template); the search
 * field is the visual centre of gravity — it is the product, not decoration.
 *
 * Everything dynamic is live: the material panel shows a real catalogue
 * product's media with its SKU and category, and the staged RFQ signal reads
 * the same summary the ProcurementPulse renders (one source, reconciled).
 * No RFQ/quote figures exist on any public endpoint, so the signal stages
 * what the catalogue actually is — products → suppliers → departments —
 * rather than inventing pipeline numbers (§0.6 backend-authoritative).
 *
 * Motion: CSS-only `.hero-enter` stagger + one-shot `.signal-node` stages
 * (globals.css) — first-paint, no JavaScript, collapsed under
 * prefers-reduced-motion. Server Component.
 */

interface SignalReadout {
  label: string;
  value: string;
}

interface ProcurementCommandStripProps {
  eyebrow: string;
  headline: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
  searchLabel: string;
  searchSubmit: string;
  searchExamples: string[];
  intentLabel: string;
  intents: Array<{ label: string; href: string }>;
  material: {
    src: string | null;
    alt: string;
    sku: string;
    category: string;
    href: string;
    figureLabel: string;
  };
  signal: [SignalReadout, SignalReadout, SignalReadout];
}

export function ProcurementCommandStrip({
  eyebrow,
  headline,
  lede,
  ctaLabel,
  ctaHref,
  searchLabel,
  searchSubmit,
  searchExamples,
  intentLabel,
  intents,
  material,
  signal,
}: ProcurementCommandStripProps) {
  return (
    <section aria-label={eyebrow} className="bg-surface-page">
      <div className="shell-public grid grid-cols-[minmax(0,1fr)] gap-10 py-14 md:py-20 lg:grid-cols-12 lg:gap-8">
        {/* Narrative — span 5 */}
        <div className="lg:col-span-5">
          <p className="hero-enter type-label font-mono text-ink-accent">{eyebrow}</p>
          <h1 className="hero-enter hero-enter-1 type-display-xl mt-4 text-ink">{headline}</h1>
          <p className="hero-enter hero-enter-2 type-body mt-5 max-w-xl text-ink-muted">{lede}</p>
          <div className="hero-enter hero-enter-3 mt-8">
            <ButtonLink href={ctaHref} variant="primary" size="lg">
              {ctaLabel}
            </ButtonLink>
          </div>
        </div>

        {/* Action — span 4 */}
        <div className="hero-enter hero-enter-2 lg:col-span-4">
          <div className="rounded-md border border-line bg-surface-elevated p-5">
            <HeroSearch label={searchLabel} submitLabel={searchSubmit} examples={searchExamples} />
            <p className="type-meta mt-4 text-ink-muted">{intentLabel}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {intents.map((intent) => (
                <li key={intent.href}>
                  <Link
                    href={intent.href}
                    className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-sm text-ink transition-colors duration-instant ease-standard hover:border-ink-strong hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {intent.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Material — span 3 */}
        <div className="hero-enter hero-enter-3 lg:col-span-3">
          <figure className="overflow-hidden rounded-md border border-line bg-surface-elevated">
            {material.src && (
              <Link href={material.href} aria-label={material.alt} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-recessed">
                  {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: same-origin catalogue media, no optimizer re-fetch. */}
                  <img
                    src={material.src}
                    alt={material.alt}
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </Link>
            )}
            <figcaption className="border-t-2 border-brand-primary p-4">
              <p className="type-meta font-mono text-ink-muted">{material.figureLabel}</p>
              <p className="type-meta mt-1 font-mono text-ink">
                {material.sku} · {material.category}
              </p>
            </figcaption>
          </figure>

          {/* Live catalogue signal — one-shot staged nodes, then rest. */}
          <ol className="mt-4 space-y-2" aria-label={signal.map((s) => `${s.label} ${s.value}`).join(", ")}>
            {signal.map((node, index) => (
              <li
                key={node.label}
                className={`signal-node signal-node-${index + 1} flex items-baseline justify-between gap-3 rounded-sm border border-line bg-surface-panel px-3 py-2`}
              >
                <span className="type-meta font-mono text-ink-muted">{node.label}</span>
                <span className="type-meta font-mono font-semibold text-ink">{node.value}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
