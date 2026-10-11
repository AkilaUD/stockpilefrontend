"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { ProductListItem } from "@/lib/api/catalogue";

/*
 * Lazy mount point for the GSAP MaterialStrip (design-system.md §7.1).
 *
 * `next/dynamic` with `ssr: false` is only legal from a Client Component,
 * so the boundary lives here — the same shape as `nav/lazy-nav.tsx`. The
 * `gsap` + `ScrollTrigger` runtime ships as its own chunk, fetched on this
 * browser's mount: never in any route's first-load script graph (§11 200 KB
 * cap), and never in a workspace/supplier/admin chunk (budget gate).
 *
 * The skeleton fallback keeps the section whole before hydration: same
 * track geometry, decorative pulse only, `aria-hidden` so assistive tech
 * meets the real strip on mount instead of a loading announcement.
 */

const Strip = dynamic(() => import("./material-strip").then((module) => module.MaterialStrip), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="flex gap-5 overflow-hidden px-[max(var(--layout-gutter),calc((100vw-80rem)/2+var(--layout-gutter)))] pb-2"
    >
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="w-64 shrink-0 overflow-hidden rounded-md border-2 border-ink">
          <div className="aspect-[4/3] bg-surface-recessed motion-safe:animate-pulse" />
          <div className="space-y-2 border-t-2 border-brand-primary p-4">
            <div className="h-3 w-1/3 bg-surface-recessed motion-safe:animate-pulse" />
            <div className="h-4 w-3/4 bg-surface-recessed motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  ),
});

interface MaterialStripLazyProps {
  items: ProductListItem[];
  locale: string;
  priceOnRequest: ReactNode;
}

export function MaterialStripLazy({ items, locale, priceOnRequest }: MaterialStripLazyProps) {
  return <Strip items={items} locale={locale} priceOnRequest={priceOnRequest} />;
}
