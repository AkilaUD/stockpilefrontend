import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

/*
 * Breadcrumbs — the editorial info pages' trail (reference pages show
 * Home / <Page>). Server Component; a11y label from messages.
 *
 * Type follows the reference's own `.breadcrumbs` (measured 2026-10-14 on
 * /en/building-materials.html): 14px / 400, the current crumb in plain black.
 * The reference paints its crumb LINKS the theme's default blue (#0099cc) —
 * 2.9:1 on white, so ours keeps the design system's muted ink instead.
 */
interface Crumb {
  label: string;
  href?: string;
}

export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = await getTranslations("pages.common");
  const tA11y = await getTranslations("a11y");

  return (
    <nav aria-label={tA11y("breadcrumb")} className="text-sm leading-[19px] text-ink-muted">
      <ol className="flex flex-wrap items-center gap-x-2">
        <li>
          <Link
            href="/"
            className="transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("breadcrumbHome")}
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-x-2">
            <span aria-hidden="true" className="select-none">
              /
            </span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}