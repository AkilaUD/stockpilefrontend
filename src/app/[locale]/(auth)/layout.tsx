import { setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Authentication shell — the `/(auth)` tree (implementation-plan 1.52, spec
 * §54 route groups).
 *
 * The five auth routes (login, register, forgot/reset password, verify email)
 * are a route group of their own so they own a distinct `<main
 * id="main-content">` and can diverge from the editorial register without
 * touching it. Today that shell is the same public chrome (`SiteHeader` /
 * `SiteFooter` components — shared as components, never as one layout file,
 * design-system §13 F12); the wire flows of task 1.51 are unchanged by the
 * move — the URLs stay `/login`, `/register`, … because route groups do not
 * appear in URLs.
 *
 * Contract with the root layout: the skip link targets `#main-content`, so
 * every route-group layout must render exactly one `<main id="main-content">`.
 * Exactly one group is mounted per request, so the id stays unique.
 */
export default async function AuthLayout({
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