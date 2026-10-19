import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";

/*
 * Material Atlas hero — brand-first, search-forward procurement opening.
 * Real CTAs only; imagery is the existing how-it-works asset (no invented photos).
 */

interface HeroBannerProps {
  headline: string;
  lede: string;
  alt: string;
  cta: string;
  rfqCta: string;
  supplierCta: string;
  searchSlot?: React.ReactNode;
}

export function HeroBanner({
  headline,
  lede,
  alt,
  cta,
  rfqCta,
  supplierCta,
  searchSlot,
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface-inverse text-ink" data-surface="dark">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <Image
          src="/original/hero-how-it-works.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-inverse via-surface-inverse/90 to-surface-inverse/40" />
      </div>

      <div className="shell-public relative grid gap-10 py-14 md:grid-cols-12 md:items-end md:py-20 lg:py-24">
        <div className="md:col-span-7 lg:col-span-6">
          <p className="type-label font-semibold tracking-[0.14em] text-ink-accent">Stockpile</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-tight text-ink-strong md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl type-body text-ink-muted md:text-lg">{lede}</p>

          {searchSlot && <div className="mt-8 max-w-xl">{searchSlot}</div>}

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/rfq" size="lg">
              {rfqCta}
            </ButtonLink>
            <ButtonLink href="/supplier-register" variant="secondary" size="lg" className="border-ink-muted! bg-transparent! text-ink! hover:bg-surface-elevated!">
              {supplierCta}
            </ButtonLink>
            <Link
              href="/how-it-works"
              className="inline-flex items-center type-body-sm font-medium text-ink-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {cta}
            </Link>
          </div>
        </div>

        <div className="relative hidden md:col-span-5 md:block lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden border border-line/30 bg-surface-elevated">
            <Image
              src="/original/hero-how-it-works.jpg"
              alt={alt}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
