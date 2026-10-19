import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MOST_SEARCHED } from "@/lib/navigation/navigation";

/*
 * Most searched tiles — real category routes from navigation.ts.
 */
export async function MostSearched() {
  const t = await getTranslations("home.mostSearched");
  const tA11y = await getTranslations("a11y");

  return (
    <section className="shell-public border-b border-line py-12 md:py-16">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{t("title")}</h2>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
        {MOST_SEARCHED.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="relative block aspect-square overflow-hidden border border-line bg-surface-elevated">
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 12vw, (min-width: 640px) 25vw, 45vw"
                  className="h-full w-full object-contain transition-transform duration-200 ease-standard group-hover:scale-105"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-3 block text-center type-body-sm font-medium text-ink transition-colors duration-instant ease-standard group-hover:underline">
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
