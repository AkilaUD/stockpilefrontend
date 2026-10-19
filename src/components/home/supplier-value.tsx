import Image from "next/image";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/*
 * Supplier acquisition band — sells leads, not listings.
 * No guaranteed-volume claims; pricing copy stays manual/invoice.
 */

interface SupplierValueProps {
  title: string;
  lede: string;
  items: string[];
  imageAlt: string;
  cta: string;
  pricingCta: string;
}

export function SupplierValue({ title, lede, items, imageAlt, cta, pricingCta }: SupplierValueProps) {
  return (
    <section className="border-b border-line bg-surface-recessed py-14 md:py-20" data-home-reveal>
      <div className="shell-public grid items-center gap-10 lg:grid-cols-12">
        <div className="relative aspect-[4/3] overflow-hidden lg:col-span-5">
          <Image
            src="/home/home-supplier-yard.jpg"
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="lg:col-span-7">
          <p className="type-label font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Stockpile for Suppliers
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl type-body text-ink-muted">{lede}</p>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex gap-3 type-body text-ink">
                <Check className="mt-1 size-4 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/supplier-register" size="lg">
              {cta}
            </ButtonLink>
            <ButtonLink href="/pricing" variant="secondary" size="lg">
              {pricingCta}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
