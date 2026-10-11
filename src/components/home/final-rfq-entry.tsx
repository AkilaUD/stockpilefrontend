import { ButtonLink } from "@/components/ui/button";

/*
 * FinalRfqEntry — the strong closing entry (§8.3 item 11, §6.1 motif).
 *
 * Signal-yellow ground, ink text, hard edges: the action colour does the
 * shouting exactly once, at the end. Two honest destinations — create the
 * account, or keep browsing suppliers. Server Component.
 */

interface FinalRfqEntryProps {
  title: string;
  lede: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export function FinalRfqEntry({
  title,
  lede,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: FinalRfqEntryProps) {
  return (
    <section className="shell-public py-12 md:py-16">
      <div className="rounded-none bg-brand-primary px-6 py-12 md:px-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 className="type-display-md text-ink-on-signal">{title}</h2>
            <p className="type-body mt-3 max-w-xl text-ink-on-signal/80">{lede}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <ButtonLink href={primaryHref} variant="secondary" size="lg">
              {primaryLabel}
            </ButtonLink>
            <ButtonLink href={secondaryHref} variant="ghost" size="lg" className="text-ink-on-signal hover:bg-ink-on-signal/10">
              {secondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
