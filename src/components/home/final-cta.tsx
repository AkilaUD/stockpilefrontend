import { ButtonLink } from "@/components/ui/button";

interface FinalCtaProps {
  title: string;
  lede: string;
  rfqCta: string;
  browseCta: string;
}

export function FinalCta({ title, lede, rfqCta, browseCta }: FinalCtaProps) {
  return (
    <section className="bg-surface-inverse py-14 text-ink md:py-20" data-surface="dark" data-home-reveal>
      <div className="shell-public grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-strong md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl type-body text-ink-muted">{lede}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
          <ButtonLink href="/rfq" size="lg">
            {rfqCta}
          </ButtonLink>
          <ButtonLink
            href="/products"
            variant="secondary"
            size="lg"
            className="border-ink-muted! bg-transparent! text-ink! hover:bg-surface-elevated!"
          >
            {browseCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
