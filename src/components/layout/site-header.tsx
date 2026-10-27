import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "./locale-toggle";
import { AccountStatus } from "./account-status";
import { LazyDepartmentMenu, LazyMobileMenu, LazyCommandSearch } from "./nav/lazy-nav";
import { getCategoryTree } from "@/lib/api/catalogue-server";
import { HUB_LINKS, SUPPLIER_LINKS, UTILITY_LINKS } from "@/lib/navigation/navigation";

/**
 * Public masthead — Modern Construction Procurement (DESIGN.md).
 * Three rows: compact utility · dark command masthead · department + hub bar.
 * Category tree is server-fetched; client islands own no data.
 */
export async function SiteHeader() {
  const nav = await getTranslations("nav");
  const a11y = await getTranslations("a11y");
  let tree: Awaited<ReturnType<typeof getCategoryTree>> = [];
  try {
    tree = await getCategoryTree();
  } catch (error) {
    console.error("[site-header] category tree read failed; rendering header without departments:", error);
  }

  return (
    <header className="sticky top-0 z-header border-b border-line bg-surface-page shadow-elev-sm">
      {/* Utility — graphite strip, signal accents via links */}
      <div data-surface="dark" className="bg-surface-inverse text-ink">
        <div className="shell-public flex h-9 items-center justify-between gap-4">
          <p className="hidden type-meta tracking-wide text-ink-muted md:block">
            {nav("utilityTagline")}
          </p>
          <div className="flex items-center gap-x-4 md:ml-auto">
            {UTILITY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="type-meta font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

      {/* Masthead */}
      <div data-surface="dark" className="bg-surface-inverse-raised text-ink">
        <div className="shell-public flex h-16 items-center gap-3 md:h-20 md:gap-6">
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
              className="h-7 w-auto md:h-10"
            />
          </Link>
          <div className="hidden flex-1 lg:block" role="search">
            <LazyCommandSearch />
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <nav aria-label={a11y("mainNavigation")} className="hidden items-center gap-x-4 xl:flex">
              {SUPPLIER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="type-body-sm text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {nav(link.labelKey)}
                </Link>
              ))}
            </nav>
            <AccountStatus />
          </div>
        </div>
      </div>

      {/* Hub + departments — shared 50px row so SBD + RFQ ends match hub links */}
      <div className="border-t border-line bg-surface-page">
        <div className="shell-public flex min-h-[50px] items-stretch">
          <LazyDepartmentMenu tree={tree} />
          <nav
            aria-label={a11y("mainNavigation")}
            className="hidden flex-1 items-stretch gap-1 md:flex"
          >
            {HUB_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center px-3 type-body-sm font-semibold text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
              >
                {nav(link.labelKey)}
              </Link>
            ))}
          </nav>
          <Link
            href="/rfq"
            className="hidden h-[50px] items-center bg-brand-primary px-4 type-body-sm font-semibold text-ink-on-signal transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus sm:flex"
          >
            {nav("requestForQuote")}
          </Link>
        </div>
      </div>
    </header>
  );
}
