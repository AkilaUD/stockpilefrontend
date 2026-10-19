import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { FOOTER_GROUPS, SOCIAL_LINKS } from "@/lib/navigation/navigation";

/**
 * Public footer — Material Atlas editorial register.
 * Link groups stay driven by navigation.ts IA.
 * Social glyphs are local SVGs (Lucide no longer ships brand icons).
 */

type SocialName = (typeof SOCIAL_LINKS)[number]["labelKey"];

function SocialGlyph({ name }: { name: SocialName }) {
  const common = {
    className: "size-4",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };
  switch (name) {
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V23h-4v-6.6c0-1.57-.03-3.59-2.19-3.59-2.19 0-2.53 1.71-2.53 3.48V23h-4V8.5z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
        </svg>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

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
    <footer className="mt-auto border-t border-line bg-surface-elevated text-ink">
      <div className="shell-public pt-14 pb-10">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Image
              src="/brand/stockpile-logo-ink.png"
              alt="Stockpile.lk"
              width={300}
              height={73}
              className="h-8 w-auto"
            />
            <p className="mt-5 max-w-sm type-body text-ink-muted">{footer("tagline")}</p>

            <ul className="mt-6 space-y-2 type-body-sm text-ink">
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
              {SOCIAL_LINKS.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={footer(social.labelKey)}
                    className="inline-flex text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <SocialGlyph name={social.labelKey} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav
              key={group.titleKey}
              aria-label={footer(group.titleKey)}
              className={GROUP_SPAN[group.titleKey] ?? "md:col-span-3"}
            >
              <h2 className="type-label font-semibold tracking-[0.12em] text-ink-muted uppercase">
                {footer(group.titleKey)}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    {link.href.endsWith(".xml") ? (
                      <a
                        href={link.href}
                        className="type-body-sm text-ink transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {nav(link.labelKey)}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="type-body-sm text-ink transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="type-meta text-ink-muted">{footer("copyright", { year })}</p>
          <p className="type-meta text-ink-muted">
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
