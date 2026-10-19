import { ButtonLink } from "@/components/ui/button";

interface BecomeSupplierBandProps {
  title: string;
  lede: string;
  cta: string;
  pricingCta: string;
}

export function BecomeSupplierBand({ title, lede, cta, pricingCta }: BecomeSupplierBandProps) {
  return (
    <section className="border-y border-ink bg-brand-primary text-ink-on-signal" data-home-reveal>
      <div className="shell-public grid gap-8 py-14 md:grid-cols-12 md:items-end md:py-16">
        <div className="md:col-span-7">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 max-w-xl type-body text-ink-on-signal/80">{lede}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
          <ButtonLink href="/supplier-register" size="lg" className="border-ink! bg-ink! text-ink-inverse! hover:bg-ink-soft!">
            {cta}
          </ButtonLink>
          <ButtonLink href="/pricing" variant="secondary" size="lg" className="border-ink! bg-transparent!">
            {pricingCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
