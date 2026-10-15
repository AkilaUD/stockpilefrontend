import { Link } from "@/i18n/navigation";

/*
 * BecomeSupplierBand — the signal-yellow "Become a Supplier" band on the home
 * page (reference reconstruction Phase 2 §4.4). Solid #f6e71d ground, ink
 * type, and two real destinations only: Supplier Benefits
 * (/how-it-works-for-suppliers) and Pricing (/pricing). The reference CTA went
 * to a vendor-onboarding flow; this build has none, so the CTAs point at the
 * pages that exist (supplier onboarding is a documented dependency).
 */
interface BecomeSupplierBandProps {
  title: string;
  lede: string;
  cta: string;
  pricingCta: string;
}

export function BecomeSupplierBand({ title, lede, cta, pricingCta }: BecomeSupplierBandProps) {
  return (
    <section className="bg-brand-primary text-ink-on-signal">
      <div className="shell-public flex flex-col items-start gap-6 py-10 md:flex-row md:items-center md:justify-between md:py-12">
        <div className="max-w-2xl">
          <h2 className="font-body text-2xl leading-8 font-medium text-ink md:text-3xl">
            {title}
          </h2>
          <p className="mt-3 font-body text-base text-ink">{lede}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href="/how-it-works-for-suppliers"
            className="inline-flex h-[38px] items-center justify-center rounded-[3px] bg-ink px-[15px] font-body text-base font-medium text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {cta}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-[38px] items-center justify-center rounded-[3px] border border-ink px-[15px] font-body text-base font-medium text-ink transition-colors duration-instant ease-standard hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {pricingCta}
          </Link>
        </div>
      </div>
    </section>
  );
}