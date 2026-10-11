"use client";

/*
 * Lazy mount points for the three masthead islands (design-system §11 —
 * public first-load stays ≤ 200 KB gzip).
 *
 * Why this file is a Client Component: next/dynamic with `ssr: false` is
 * only legal from a Client Component (Next 16 lazy-loading guide — a server
 * SiteHeader cannot call it), so the wrappers live here. Each island ships
 * as its own runtime chunk — fetched on this browser's mount, never part of
 * any route's first-load script graph (that is the AccountMenu precedent).
 * The `loading` fallbacks keep the server-rendered header whole: identical
 * controls, labels and order, so there is no layout shift and no assistive
 * gap on first paint; the real island then swaps in with matching markup.
 *
 * Keep the fallback class strings in sync with the trigger inside the
 * island they stand in for — a mismatch is a visible flash on hydration.
 */

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function CommandSearchFallback() {
  const t = useTranslations("catalogue.command");
  return (
    <button
      type="button"
      aria-label={t("trigger")}
      className="inline-flex h-11 items-center gap-2 rounded-sm bg-surface-elevated px-3 text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
        <circle cx="7" cy="7" r="4.25" />
        <path d="m10.5 10.5 2.75 2.75" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function MegaMenuFallback() {
  const tNav = useTranslations("nav");
  return (
    <button
      type="button"
      className="font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="inline-flex items-center gap-1">
        {tNav("categories")}
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3">
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

function MobileMenuFallback() {
  const t = useTranslations("catalogue.menu");
  return (
    <button
      type="button"
      aria-label={t("open")}
      className="inline-flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-instant ease-standard hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path d="M2 4.5h12M2 8h12M2 11.5h12" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export const LazyCommandSearch = dynamic(
  () => import("./command-search").then((module) => module.CommandSearch),
  { ssr: false, loading: CommandSearchFallback },
);

export const LazyMegaMenu = dynamic(
  () => import("./mega-menu").then((module) => module.MegaMenu),
  { ssr: false, loading: MegaMenuFallback },
);

export const LazyMobileMenu = dynamic(
  () => import("./mobile-menu").then((module) => module.MobileMenu),
  { ssr: false, loading: MobileMenuFallback },
);