"use client";

/*
 * Lazy mount points for the masthead/dock islands (design-system §11 —
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
import { ReferenceIcon } from "@/components/ui/reference-icon";

function CommandSearchFallback() {
  const tNav = useTranslations("nav");
  return (
    <button
      type="button"
      aria-label={tNav("searchSubmit")}
      className="inline-flex h-[42px] w-full items-center gap-2 rounded-l-[3px] border border-line bg-surface-panel px-[15px] text-ink-muted transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <ReferenceIcon name="mbi-magnifier" className="size-4" />
      <span className="hidden truncate text-base xl:inline">{tNav("searchPlaceholder")}</span>
      <span className="ml-auto hidden items-center self-stretch rounded-r-[3px] border-y border-ink bg-brand-primary px-[15px] font-body text-base font-medium text-ink-on-signal xl:inline-flex">
        {tNav("searchSubmit")}
      </span>
    </button>
  );
}

function DepartmentMenuFallback() {
  const tNav = useTranslations("nav");
  return (
    <button
      type="button"
      className="department-block inline-flex h-[50px] w-full items-center justify-center bg-transparent px-0 font-body text-base font-medium text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus md:justify-start"
    >
      <span>{tNav("shopByDepartment")}</span>
    </button>
  );
}

function MobileMenuFallback() {
  const tA11y = useTranslations("a11y");
  return (
    <button
      type="button"
      aria-label={tA11y("openMenu")}
      className="inline-flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <ReferenceIcon name="mbi-menu" className="size-5" />
    </button>
  );
}

function MobileDockFallback() {
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const items = [
    { label: tNav("menu"), icon: "mbi-menu" },
    { label: tNav("searchSubmit"), icon: "mbi-magnifier" },
    { label: tNav("home"), icon: "mbi-home3" },
    { label: tNav("myOrder"), icon: "mbi-bag2" },
    { label: tNav("me"), icon: "mbi-user" },
  ] as const;
  return (
    <nav
      aria-label={tA11y("mainNavigation")}
      className="fixed inset-x-0 bottom-0 z-sticky flex border-t border-line bg-surface-panel pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((item) => (
        <span key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 font-body text-[11px] font-medium text-ink-muted">
          <ReferenceIcon name={item.icon} className="size-5" />
          <span>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}

export const LazyCommandSearch = dynamic(
  () => import("./command-search").then((module) => module.CommandSearch),
  { ssr: false, loading: CommandSearchFallback },
);

export const LazyDepartmentMenu = dynamic(
  () => import("./department-menu").then((module) => module.DepartmentMenu),
  { ssr: false, loading: DepartmentMenuFallback },
);

export const LazyMobileMenu = dynamic(
  () => import("./mobile-menu").then((module) => module.MobileMenu),
  { ssr: false, loading: MobileMenuFallback },
);

export const LazyMobileDock = dynamic(
  () => import("./mobile-dock").then((module) => module.MobileDock),
  { ssr: false, loading: MobileDockFallback },
);