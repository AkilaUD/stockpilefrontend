"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { useMotionPreference } from "@/lib/motion/use-motion-preference";
import type { ProductListItem } from "@/lib/api/catalogue";

/*
 * MaterialStrip — the horizontal featured-materials strip (§6.1 motif,
 * §7.1: GSAP owns "horizontal material strips" and "home scroll
 * choreography").
 *
 * Budget isolation (§7.1, §11): this file imports `gsap` + `ScrollTrigger`,
 * so it MUST only ever load through `next/dynamic` with `ssr: false` from a
 * public route. The bundle-budget gate fails the build if GSAP appears in any
 * workspace/supplier/admin chunk — a static import anywhere shared would do
 * exactly that. The loading fallback is the same static snap row, so SSR and
 * no-JS readers get identical content with zero layout shift.
 *
 * Motion contract (§7.2): the scrub timeline is created only when the OS
 * does not ask for reduced motion (the one hook). Reduced-motion readers get
 * the native horizontal snap row — full content, no scripted movement.
 * `scrub` is honest here: the strip genuinely maps vertical scroll progress
 * to horizontal travel; nothing is pinned, nothing hijacks (§52). Timelines
 * and triggers are killed on unmount and never persist across routes.
 */

gsap.registerPlugin(ScrollTrigger);

interface MaterialStripProps {
  items: ProductListItem[];
  locale: string;
  priceOnRequest: ReactNode;
}

function imageUrl(srcset: string | null | undefined): string | null {
  if (!srcset || srcset.trim() === "") return null;
  return srcset.trim().split(/\s+/)[0] ?? null;
}

export function MaterialStrip({ items, locale, priceOnRequest }: MaterialStripProps) {
  const reduce = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track || reduce) return;

      const overflow = track.scrollWidth - track.clientWidth;
      if (overflow <= 0) return;

      // Native snap row becomes the scrubbed track: no competing scroll.
      track.classList.remove("overflow-x-auto");
      track.classList.add("overflow-visible");

      const tween = gsap.fromTo(
        track,
        { x: 0 },
        {
          x: -overflow,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        track.classList.add("overflow-x-auto");
        track.classList.remove("overflow-visible");
      };
    },
    { scope: sectionRef, dependencies: [reduce, items.length] },
  );

  return (
    <section ref={sectionRef} aria-label="Featured materials" className="overflow-hidden py-12 md:py-16">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(var(--layout-gutter),calc((100vw-80rem)/2+var(--layout-gutter)))] pb-2"
      >
        {items.map((item) => {
          const src = imageUrl(item.image?.srcset);
          const price = item.price;
          const public_ = price?.state === "Public" && price.amount != null;
          return (
            <article
              key={item.publicId}
              className="w-64 shrink-0 snap-start overflow-hidden rounded-md border-2 border-ink bg-surface-panel"
            >
              {src && (
                <Link href={`/products/${item.slug}`} aria-label={item.name} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-recessed">
                    {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: same-origin catalogue media, no optimizer re-fetch. */}
                    <img
                      src={src}
                      alt={item.image?.alt ?? item.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </Link>
              )}
              <div className="border-t-2 border-brand-primary p-4">
                <p className="type-meta font-mono text-ink-muted">{item.sku}</p>
                <h3 className="type-title-sm mt-1 text-ink">
                  <Link
                    href={`/products/${item.slug}`}
                    className="transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {item.name}
                  </Link>
                </h3>
                <p className="type-body mt-1 text-ink-muted">{item.supplier.name}</p>
                {item.attributes?.slice(0, 2).map((attr) => (
                  <p key={attr.code} className="type-meta mt-1 font-mono text-ink-muted">
                    {attr.label}: {attr.value}
                    {attr.unit ? ` ${attr.unit}` : ""}
                  </p>
                ))}
                <p className="type-title-sm mt-2 tabular text-ink">
                  {public_ ? (
                    formatMoney({ amount: price.amount as number, currency: price.currency, locale })
                  ) : (
                    <span className="type-body text-ink-muted">{priceOnRequest}</span>
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
