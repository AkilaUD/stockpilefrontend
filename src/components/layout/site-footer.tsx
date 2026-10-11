import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

/**
 * Public-site footer — design-system.md §6.1 / §8.3 step 12.
 *
 * `data-surface="dark"` re-roles the semantic tokens for this subtree only
 * (tokens.css), which is what lets every class below stay token-named: there
 * is no `text-white` anywhere, and `bg-surface-page` resolves to #202020 here
 * without being #202020 anywhere else. It also gives the yellow mark its
 * correct ground — §14 only permits `stockpile-logo-yellow.png` on dark, and
 * the brief allocates #202020 to the footer (§1.1).
 *
 * The utility groups are intentionally short in Phase 1. About, Contact,
 * Terms, Privacy and Help centre are content pages that arrive with Phase 7;
 * listing them now would mean five dead links.
 */
export async function SiteFooter() {
  const footer = await getTranslations("footer");
  const actions = await getTranslations("common.actions");
  const nav = await getTranslations("nav");

  const groups = [
    {
      label: footer("accountGroup"),
      links: [
        { label: actions("signIn"), href: "/login" },
        { label: actions("register"), href: "/register" },
      ],
    },
    {
      label: footer("siteGroup"),
      links: [{ label: nav("home"), href: "/" }],
    },
  ];

  return (
    <footer className="mt-auto border-t border-line bg-surface-page text-ink">
      <div className="shell-public pt-12 pb-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <Image
              src="/brand/stockpile-logo-yellow.png"
              alt="Stockpile.lk"
              width={300}
              height={73}
              className="h-8 w-auto"
            />
            <p className="type-body-sm mt-5 max-w-sm text-ink-muted">{footer("tagline")}</p>
          </div>

          {groups.map((group) => (
            <nav key={group.label} aria-label={group.label} className="md:col-span-3">
              <h2 className="type-label">{group.label}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Real content, so it owes the reader ≥4.5:1 (docs/design-system.md
            §10) — `text-ink-faint` here measured only 3.4:1 on the dark
            ground. `--ink-faint` is decorative-tier by design and stays out of
            copy. */}
        <p className="type-micro border-line text-ink-muted mt-10 border-t pt-6">
          © {new Date().getUTCFullYear()} Stockpile.lk. {footer("rights")}
        </p>
      </div>
    </footer>
  );
}
