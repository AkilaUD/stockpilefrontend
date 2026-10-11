"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

/*
 * The one client component in the header, and only because preserving the
 * current path across a locale change needs `usePathname`.
 *
 * It is a *navigation*, not an in-place swap: `Link` takes the target locale
 * explicitly, so the request goes through the server and both `lang` and the
 * message bundle change together. Re-rendering client-side with new strings
 * would leave `<html lang>` stale and fail WCAG 3.1.1.
 *
 * Only the locale the visitor would switch *to* is interactive. The current
 * locale is rendered as text rather than a link to itself — a link whose
 * destination is the page you are on is noise for a screen-reader user.
 */
export function LocaleToggle() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const target = routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  const shortLabel = (value: string) => (value === "en" ? t("localeEnShort") : t("localeSiShort"));
  const actionLabel = (value: string) =>
    value === "en" ? t("switchToEnglish") : t("switchToSinhala");

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex items-center rounded-md border border-line-strong p-0.5"
    >
      <span
        aria-current="true"
        className="rounded-sm bg-surface-recessed px-2 py-1 font-body text-xs font-semibold text-ink"
      >
        {shortLabel(locale)}
      </span>
      <Link
        href={pathname}
        locale={target}
        aria-label={actionLabel(target)}
        className="rounded-sm px-2 py-1 font-body text-xs font-medium text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink"
      >
        {shortLabel(target)}
      </Link>
    </div>
  );
}
