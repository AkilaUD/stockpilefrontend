import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "./locale-toggle";
import { AccountStatus } from "./account-status";
import { LazyMegaMenu, LazyMobileMenu, LazyCommandSearch } from "./nav/lazy-nav";
import { getCategoryTree } from "@/lib/api/catalogue-server";

/**
 * Public-site masthead — design-system.md §6.1 `SiteHeader`, §14 logo rules.
 *
 * Dark command area: the master brief allocates #202020 to primary
 * navigation (§1.1), so `data-surface="dark"` re-roles the semantic tokens
 * for this subtree — `bg-surface-page` resolves to #202020 here and nowhere
 * else, nav links get their muted→bright hover for free, and the yellow
 * wordmark (`stockpile-logo-yellow.png`) lands on the §14 ground it needs.
 * The layout itself (shell, hairline, h-16/h-20 rhythm) is ours — only the
 * colour assignment moved, and it moved because the brief mandates it.
 *
 * Phase 2 navigation: Home / Products / Categories (mega-menu) / Suppliers,
 * plus the command-search overlay (lg+) and the mobile drawer (<lg, which
 * owns the 768–1023 band where the full masthead row cannot fit — §16). The
 * category tree is fetched here, on the server, and passed down as
 * serializable props — the client islands (MegaMenu, MobileMenu) own no data,
 * and the browser never fetches the catalogue tree. The three islands mount
 * through ./nav/lazy-nav (client): their Radix bodies are runtime chunks, so
 * no route's first-load script graph carries them (§11 / AccountMenu
 * precedent), while the SSR fallbacks keep the header fully rendered.
 */
export async function SiteHeader() {
  const nav = await getTranslations("nav");
  const a11y = await getTranslations("a11y");
  const tree = await getCategoryTree();

  const items = [
    { label: nav("home"), href: "/" },
    { label: nav("products"), href: "/products" },
    { label: nav("suppliers"), href: "/suppliers" },
  ];

  return (
    <header className="sticky top-0 z-header border-b border-line bg-surface-page text-ink">
      <div className="shell-public flex h-16 items-center gap-2 md:h-20 md:gap-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/stockpile-logo-ink.png"
            alt="Stockpile.lk"
            width={300}
            height={73}
            priority
            className="h-6 w-auto md:h-9"
          />
        </Link>

        <nav aria-label={a11y("mainNavigation")} className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <LazyMegaMenu tree={tree} />
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden lg:block">
            <LazyCommandSearch />
          </div>
          <LocaleToggle />
          <AccountStatus />
          <div className="lg:hidden">
            <LazyMobileMenu tree={tree} />
          </div>
        </div>
      </div>
    </header>
  );
}
