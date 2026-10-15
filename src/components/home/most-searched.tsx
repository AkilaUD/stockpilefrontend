import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MOST_SEARCHED } from "@/lib/navigation/navigation";

/*
 * MostSearched — the "Most Searched Products" tile grid (reference
 * reconstruction Phase 2 §4.4). Six original tiles (graphic + label), each
 * mapping to a REAL backend category route via navigation.ts's MOST_SEARCHED
 * config — every tile was verified to resolve to a live category page.
 * The labels are the original's; the original asset PNGs are served from
 * public/original/most-searched/ (provenance: README.md there).
 */
export async function MostSearched() {
  const t = await getTranslations("home.mostSearched");
  const tA11y = await getTranslations("a11y");

  return (
    <section className="shell-public pb-[30px]">
      {/* Reference `.top-title` rhythm: heading block `padding:5px 20px`,
          24px/500 heading, sections 30px apart. This heading is NOT a link in
          the reference (only Newest Suppliers / Newest Products / News are). */}
      <div className="px-5 py-[5px]">
        <h2 className="font-body text-2xl leading-8 font-medium text-ink">{t("title")}</h2>
      </div>
      <ul className="mt-[5px] grid grid-cols-2 gap-4 px-5 sm:grid-cols-3 lg:grid-cols-6">
        {MOST_SEARCHED.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="relative block aspect-square overflow-hidden bg-surface-recessed">
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 12vw, (min-width: 640px) 25vw, 45vw"
                  className="h-full w-full object-contain transition-transform duration-200 ease-standard group-hover:scale-105"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-3 block text-center font-body text-sm font-normal text-ink transition-colors duration-instant ease-standard group-hover:text-ink-accent">
                {t(tile.labelKey)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="sr-only">{tA11y("mostSearchedDescription")}</p>
    </section>
  );
}