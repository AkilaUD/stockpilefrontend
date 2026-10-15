import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "./locale-toggle";
import { AccountStatus } from "./account-status";
import { LazyDepartmentMenu, LazyMobileMenu, LazyCommandSearch } from "./nav/lazy-nav";
import { getCategoryTree } from "@/lib/api/catalogue-server";
import { HUB_LINKS, SUPPLIER_LINKS, UTILITY_LINKS } from "@/lib/navigation/navigation";

/**
 * Public-site masthead — reference reconstruction (Phase 2 §4.4), matching
 * the original Stockpile.lk (Magento/MageBig "Martfury layout05") three-row
 * header:
 *
 *   1. Utility bar  — signal yellow (#f6e71d): tagline, Get Quotes ·
 *                      Pricing · Supplier List, language toggle.
 *   2. Masthead     — dark command area (#020202, `data-surface="dark"`):
 *                      wordmark (yellow on this ground), catalogue command
 *                      search, the reference's "header links" (Supplier Login ·
 *                      Supplier Registration · Request For Quote — Log In and
 *                      Register are the account-status island's), and account
 *                      status. `data-surface="dark"` re-roles
 *                      the semantic tokens for this subtree only — the logo
 *                      and links sit on the §14 ground they need.
 *   3. Menu row     — the dark "Shop By Department" block at the left with
 *                      the signal-yellow horizontal bar (Get Quotes / How It
 *                      Works / About Us / Help) filling the rest of the row.
 *
 * The category tree is fetched here, on the server, and passed down as
 * serializable props — the client islands (DepartmentMenu, MobileMenu) own no
 * data, and the browser never fetches the catalogue tree. The islands mount
 * through ./nav/lazy-nav (client): their Radix bodies are runtime chunks, so
 * no route's first-load script graph carries them (§11 / AccountMenu
 * precedent), while the SSR fallbacks keep the header fully rendered.
 */
export async function SiteHeader() {
  const nav = await getTranslations("nav");
  const a11y = await getTranslations("a11y");
  // The catalogue tree is live data, but a failed read here must not take the
  // masthead — and with it the entire shell — down to an error page. On
  // failure the header renders without department/menu data (empty tree).
  let tree: Awaited<ReturnType<typeof getCategoryTree>> = [];
  try {
    tree = await getCategoryTree();
  } catch (error) {
    console.error("[site-header] category tree read failed; rendering header without departments:", error);
  }

  return (
    <header className="sticky top-0 z-header">
      {/* Utility bar — signal yellow. Reference `.header-top-inner` (measured
          2026-10-14): 37.875px tall, rows padding 10px 0, 13px/17.875 text. */}
      <div className="bg-brand-primary text-ink-on-signal">
        <div className="shell-public flex h-[38px] items-center justify-between gap-4">
          <p className="hidden items-center text-[13px] leading-[17.875px] md:flex">
            {nav("utilityTagline")}
          </p>
          <div className="flex items-center gap-x-5 md:ml-auto">
            {UTILITY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] leading-[17.875px] text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {nav(link.labelKey)}
              </Link>
            ))}
            <div className="max-md:hidden">
              <LocaleToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Masthead — dark command area. Reference `.header-main-content`: 92px
          (the masthead row), wordmark 200×48.66. */}
      <div data-surface="dark" className="bg-surface-page text-ink">
        <div className="shell-public flex h-16 items-center gap-2 md:h-[92px] md:gap-6">
          <div className="lg:hidden">
            <LazyMobileMenu tree={tree} />
          </div>
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/brand/stockpile-logo-yellow.png"
              alt="Stockpile.lk"
              width={300}
              height={73}
              priority
              className="h-6 w-auto md:h-[49px]"
            />
          </Link>
          <div className="hidden flex-1 lg:block" role="search">
            <LazyCommandSearch />
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* Reference `ul.header.links` (verified 2026-10-13). Log In/Register
                are AccountStatus's job; these three need the browse width only
                (`xl`) — below that the drawer carries them — so the search and
                account controls keep their room. */}
            <nav
              aria-label={a11y("mainNavigation")}
              className="hidden items-center gap-x-4 xl:flex"
            >
              {SUPPLIER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {nav(link.labelKey)}
                </Link>
              ))}
            </nav>
            <AccountStatus />
          </div>
        </div>
      </div>

      {/* Menu row — Shop By Department + signal-yellow hub bar. The row's
          content is centred in the public container so the department block
          sits at the container's own left edge — the reference's `col-lg-3`
          column (measured x=135 at a 1440px viewport, i.e. the 1200px
          container plus its 15px padding), not the viewport edge.

          Reference `.header-menu-content` (measured 2026-10-14): 50px tall,
          signal-yellow, 1px `rgba(204,204,204,0.5)` rules top and bottom, and
          16px/500 black links 20px apart. */}
      <div className="border-y border-[rgba(204,204,204,0.5)] bg-brand-primary">
        <div className="shell-public flex items-stretch">
          <LazyDepartmentMenu tree={tree} />
          <nav
            aria-label={a11y("mainNavigation")}
            className="hidden flex-1 items-stretch gap-5 md:flex"
          >
            {HUB_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center text-base font-medium text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus"
              >
                {nav(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}