import { Link } from "@/i18n/navigation";
import { BadgeCheck, MapPin, Package } from "lucide-react";
import type { SupplierDirectoryItem } from "@/lib/api/catalogue";
import { imageUrl } from "@/lib/media-url";
import { StatusPill } from "@/components/ui/status-pill";

interface SupplierDirectoryCardProps {
  supplier: SupplierDirectoryItem;
  verifiedLabel: string;
  unverifiedLabel: string;
  productsLabel: string;
}

export function SupplierDirectoryCard({
  supplier,
  verifiedLabel,
  unverifiedLabel,
  productsLabel,
}: SupplierDirectoryCardProps) {
  const logo = imageUrl(supplier.logo?.srcset);
  const locationLine = [supplier.district, supplier.location].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={`/suppliers/${supplier.slug}`}
        className="group flex h-full flex-col rounded-sm border border-line bg-surface-panel p-4 transition-colors duration-instant ease-standard hover:border-line-strong hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:p-5"
      >
        <div className="flex items-start gap-4">
          {logo ? (
            <span className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-line bg-surface-recessed">
              {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite */}
              <img
                src={logo}
                alt={supplier.logo?.alt ?? supplier.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-1.5"
              />
            </span>
          ) : (
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-sm border border-line bg-surface-recessed font-display text-lg font-bold text-ink-muted"
              aria-hidden
            >
              {supplier.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold tracking-tight text-ink transition-colors duration-instant ease-standard group-hover:text-ink-accent">
              {supplier.name}
            </p>
            {locationLine && (
              <p className="mt-1 flex items-center gap-1.5 type-meta text-ink-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {locationLine}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          {supplier.productCount != null && (
            <span className="flex items-center gap-1.5 type-meta text-ink-muted">
              <Package className="size-3.5 shrink-0" aria-hidden />
              {productsLabel}
            </span>
          )}
          <StatusPill tone={supplier.verified ? "success" : "neutral"}>
            {supplier.verified ? (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3.5" aria-hidden />
                {verifiedLabel}
              </span>
            ) : (
              unverifiedLabel
            )}
          </StatusPill>
        </div>
      </Link>
    </li>
  );
}
