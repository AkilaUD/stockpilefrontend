import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import { HeroSearch } from "./hero-search";

export interface HeroStats {
  products: number;
  suppliers: number;
  departments: number;
  categories: number;
}

/**
 * Full-bleed cinematic hero — photography first, minimal copy, live stats.
 * Newest products live in their own section below (not duplicated here).
 * `data-surface="dark"` re-roles ink tokens; use text-ink / text-ink-muted.
 */
export async function HomeHero({
  locale,
  stats,
}: {
  locale: string;
  stats: HeroStats | null;
}) {
  const t = await getTranslations({ locale, namespace: "home" });

  const statCells = stats
    ? [
        { label: t("stats.products"), value: stats.products },
        { label: t("stats.suppliers"), value: stats.suppliers },
        { label: t("stats.departments"), value: stats.departments },
        { label: t("stats.categories"), value: stats.categories },
      ]
    : [];

  return (
    <section
      className="relative isolate min-h-[70vh] lg:min-h-[85vh]"
      data-surface="dark"
      data-hero
    >
      <div className="absolute inset-0 overflow-hidden" data-hero-bg aria-hidden>
        <Image
          src="/home/home-hero-materials.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Localized scrim — left/bottom only so photography stays visible */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[rgb(20_20_20/0.88)] via-[rgb(20_20_20/0.45)] to-[rgb(20_20_20/0.15)] max-md:from-[rgb(20_20_20/0.82)] max-md:via-[rgb(20_20_20/0.55)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(20_20_20/0.75)] to-transparent"
          aria-hidden
        />
      </div>

      <div className="shell-public relative flex min-h-[70vh] flex-col justify-center py-12 sm:py-16 lg:min-h-[85vh] lg:py-20">
        <div className="max-w-2xl">
          <p data-hero-reveal className="type-label flex items-center gap-2 text-ink-accent">
            <span aria-hidden className="inline-block size-2.5 bg-brand-primary" />
            {t("hero.flowLabel")}
          </p>
          <h1 data-hero-reveal className="type-display-lg mt-4 text-balance text-ink">
            {t("hero.headline")}
          </h1>
          <p data-hero-reveal className="type-body mt-4 max-w-[42ch] text-ink-muted">
            {t("hero.lede")}
          </p>

          <div data-hero-reveal className="mt-8 max-w-xl">
            <HeroSearch />
          </div>

          <div data-hero-reveal className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#materials-list" className={buttonClassName({ variant: "primary", size: "lg" })}>
              {t("ledger.startList")}
              <ArrowDown className="size-4" aria-hidden />
            </a>
            <Link href="/products" className={buttonClassName({ variant: "secondary", size: "lg" })}>
              {t("hero.browseCta")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {statCells.length > 0 ? (
            <dl
              data-hero-reveal
              className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4"
            >
              {statCells.map((stat) => (
                <div key={stat.label} className="bg-surface-elevated px-4 py-3">
                  <dd className="type-title-lg text-ink" data-count-up={stat.value}>
                    {stat.value.toLocaleString(locale)}
                  </dd>
                  <dt className="type-meta mt-0.5 text-ink-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
