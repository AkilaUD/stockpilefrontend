import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";

/*
 * Material Atlas hero — explains the business in one screen:
 * mechanism headline (one RFQ → many quotes), search, one primary CTA,
 * one secondary CTA, and a process proof line. No invented numbers;
 * live counts live in the stats band directly below.
 */

interface HeroBannerProps {
  headline: string;
  lede: string;
  alt: string;
  cta: string;
  rfqCta: string;
  supplierCta: string;
  proofLine: string;
  flowLabel: string;
  searchSlot?: React.ReactNode;
}

export function HeroBanner({
  headline,
  lede,
  alt,
  cta,
  rfqCta,
  supplierCta,
  proofLine,
  flowLabel,
  searchSlot,
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface-inverse text-ink" data-surface="dark">
      <div className="shell-public relative grid gap-10 py-14 md:grid-cols-12 md:items-center md:py-20 lg:py-24">
        <div className="md:col-span-7 lg:col-span-6">
          <p className="type-label font-semibold tracking-[0.14em] text-brand-primary">
            Stockpile.lk — Sri Lanka
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-tight text-ink-strong md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl type-body text-ink-muted md:text-lg">{lede}</p>

          {searchSlot && <div className="mt-8 max-w-xl">{searchSlot}</div>}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/rfq" size="lg">
              {rfqCta}
            </ButtonLink>
            <ButtonLink
              href="/products"
              variant="secondary"
              size="lg"
              className="border-ink-muted! bg-transparent! text-ink! hover:bg-surface-elevated!"
            >
              {supplierCta}
            </ButtonLink>
            <Link
              href="/how-it-works"
              className="inline-flex items-center type-body-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {cta}
            </Link>
          </div>

          <p className="mt-8 border-t border-line/30 pt-4 type-meta tracking-wide text-ink-muted">
            {proofLine}
          </p>
        </div>

        <div className="relative md:col-span-5 lg:col-span-6">
          <div className="relative aspect-[16/10] overflow-hidden border border-line/30 bg-surface-elevated">
            <Image
              src="/home/home-hero-materials.jpg"
              alt={alt}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-3 inline-flex bg-brand-primary px-3 py-2 type-meta font-semibold tracking-wide text-ink-on-signal">
            {flowLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
