import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ReferenceIcon } from "@/components/ui/reference-icon";
import type { ReferenceIconName } from "@/lib/reference-icons";
import { FOOTER_GROUPS, SOCIAL_LINKS } from "@/lib/navigation/navigation";

/**
 * Public-site footer — reference reconstruction (Phase 2 §4.4), matching the
 * original Stockpile.lk footer: a WHITE four-column grid (Contact Info /
 * Stockpile / Company / Support) with the social row and the copyright bar.
 *
 * Reference measurements (2026-10-14, 1440px):
 *   `.footer.content`  border-top 1px #e1e1e1, padding-top 50px, 492px tall
 *   column titles      `.h4`: 16px/500 #666666
 *   links              16px/400 #020202 — the theme hovers them to its signal
 *                      yellow, which on this white ground is ~1.1:1, so the
 *                      hover here is an underline instead (documented
 *                      deviation; the yellow hover is kept where it is legible,
 *                      e.g. department rows on a yellow ground)
 *   columns            33.33% / 25% / 16.67% / 25% → 4 / 3 / 2 / 3 of twelve
 *   socials            brand glyphs at 16px in the theme's own brand colours
 *
 * Contact column copy is the reference footer's own: owner line, trading
 * hours, the redacted phone label and info@stockpile.lk (mailto). The social
 * hrefs are read from the reference footer's markup (linkedin/facebook/
 * instagram/youtube — stockpile.lk handles).
 *
 * The bottom bar renders the reference copyright line with the live year and
 * the "subject to Terms Of Use" note pointing at the real /terms-of-use page.
 */

/** The reference's own brand colours for the footer social glyphs. */
const SOCIAL_GLYPHS: Record<string, { icon: ReferenceIconName; colour: string }> = {
  linkedin: { icon: "mbi-linkedin", colour: "#020202" },
  facebook: { icon: "mbi-facebook", colour: "#336699" },
  instagram: { icon: "mbi-instagram", colour: "#996633" },
  youtube: { icon: "mbi-youtube", colour: "#cc3333" },
};

/** Column widths as the reference proportions (4/3/2/3 of twelve). */
const GROUP_SPAN: Record<string, string> = {
  stockpileGroup: "md:col-span-3",
  companyGroup: "md:col-span-2",
  supportGroup: "md:col-span-3",
};

export async function SiteFooter() {
  const footer = await getTranslations("footer");
  const nav = await getTranslations("nav");

  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-auto border-t border-[#e1e1e1] bg-surface-page text-ink">
      <div className="shell-public pt-[50px] pb-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand + contact */}
          <div className="md:col-span-4">
            <Image
              src="/brand/stockpile-logo-ink.png"
              alt="Stockpile.lk"
              width={300}
              height={73}
              className="h-8 w-auto"
            />
            <p className="mt-5 max-w-sm text-base text-ink-muted">{footer("tagline")}</p>

            <ul className="mt-6 space-y-2 font-body text-base text-ink">
              <li>{footer("ownerLine")}</li>
              <li>{footer("hours")}</li>
              <li>
                <a
                  href={`mailto:${footer("email")}`}
                  className="transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {footer("email")}
                </a>
              </li>
            </ul>

            <ul className="mt-6 flex items-center gap-3" aria-label={footer("contactGroup")}>
              {SOCIAL_LINKS.map((social) => {
                const glyph = SOCIAL_GLYPHS[social.labelKey];
                if (!glyph) return null;
                return (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={footer(social.labelKey)}
                      className="inline-flex transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      style={{ color: glyph.colour }}
                    >
                      <ReferenceIcon name={glyph.icon} className="size-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Link groups — Stockpile / Company / Support (supportGroup is in
              FOOTER_GROUPS too; nothing is duplicated here). */}
          {FOOTER_GROUPS.map((group) => (
            <nav
              key={group.titleKey}
              aria-label={footer(group.titleKey)}
              className={GROUP_SPAN[group.titleKey] ?? "md:col-span-3"}
            >
              <h2 className="text-base font-medium text-[#666666]">{footer(group.titleKey)}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    {link.href.endsWith(".xml") ? (
                      /* The sitemap is the reference's own `.xml` path, served
                         by a route handler outside the locale tree — a
                         locale-aware Link would ask next-intl for
                         `/si/sitemap/sitemap.xml`, which does not exist. */
                      <a
                        href={link.href}
                        className="font-body text-base text-ink transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {nav(link.labelKey)}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="font-body text-base text-ink transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {nav(link.labelKey)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink">{footer("copyright", { year })}</p>
          <p className="text-sm text-ink">
            <Link
              href="/terms-of-use"
              className="text-ink transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {footer("termsNote")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
