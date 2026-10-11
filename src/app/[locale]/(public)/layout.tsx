import { setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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
      <SiteFooter />
    </>
  );
}
