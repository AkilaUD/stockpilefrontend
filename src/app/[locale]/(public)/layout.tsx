import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LazyMobileDock } from "@/components/layout/nav/lazy-nav";
import { getCategoryTree } from "@/lib/api/catalogue-server";

/**
 * Editorial shell — the `/(public)` tree (implementation-plan 1.47/1.52).
 *
 * design-system.md §13 F12 forbids sharing this layout component with
 * `/(workspace)`; the two registers must not converge on one chrome. What they
 * *do* share is the root layout above, which owns only `<html>`/`<body>`.
 *
 * Contract with the root layout: the skip link targets `#main-content`, so
 * every route-group layout must render exactly one `<main id="main-content">`.
 * Exactly one group is mounted per request, so the id stays unique.
 *
 * `flex-1` is what lets the footer sit at the bottom of a short page — the
 * root `<body>` is a `min-h-dvh flex flex-col` column (design-system §5.1).
 *
 * The mobile dock (reference mobile theme, < md) is mounted here, once, so it
 * does not re-mount per page. It needs the category tree for its Menu drawer,
 * which is fetched server-side like the header fetch (catalogue is live
 * platform state, so both reads are no-store by design).
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {/* Dock clearance on the footer (not just main) so copyright/links sit
          above the fixed mobile bar rather than under it. */}
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <SiteFooter />
      </div>
      {/* The dock's category tree is fetched inside the Suspense boundary so a
          slow/unavailable catalogue read never delays the page shell itself
          (the mobile menu is a client island and can wait for its own data). */}
      <Suspense fallback={null}>
        <MobileDockTree />
      </Suspense>
    </>
  );
}

/** Fetches the category tree for the mobile dock without gating the layout. */
async function MobileDockTree() {
  let tree: Awaited<ReturnType<typeof getCategoryTree>> | null;
  try {
    tree = await getCategoryTree();
  } catch (error) {
    // A failed dock read must not reach the layout's error boundary — the dock
    // is an enhancement; the shell (header/main/footer) renders without it.
    console.error("[public-layout] dock category read failed; omitting dock:", error);
    tree = null;
  }
  return tree ? <LazyMobileDock tree={tree} /> : null;
}