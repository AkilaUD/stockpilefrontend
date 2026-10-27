import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { categoryHref, DEPARTMENT_ICONS } from "@/lib/navigation/navigation";
import { SectionHeader } from "@/components/ui/page-header";

/**
 * Photo mosaic of live root departments. Tiles use real category names and
 * the existing department art map — no invented imagery or counts beyond
 * subcategory length from the API tree.
 */
export async function HomeDepartmentMosaic({
  locale,
  departments,
}: {
  locale: string;
  departments: CategoryNode[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div data-home-reveal>
      <SectionHeader eyebrow={t("index.title")} title={t("departments.title")} lede={t("departments.lede")} />
      <ul className="mt-7 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {departments.map((dept, index) => {
          const src = DEPARTMENT_ICONS[dept.slug];
          const tall = index === 0 || index === 5;
          return (
            <li key={dept.slug} className={tall ? "row-span-1 sm:row-span-1" : undefined}>
              <Link
                href={categoryHref(dept.slug)}
                className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-base ease-standard group-hover:scale-[1.05]"
                  />
                ) : (
                  <span className="absolute inset-0 bg-surface-inverse" aria-hidden />
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-[rgb(20_20_20/0.88)] via-[rgb(20_20_20/0.25)] to-transparent"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <span className="type-title-sm block text-ink-inverse">{dept.name}</span>
                  <span className="type-meta mt-0.5 block text-ink-inverse/75">
                    {t("departments.subcategories", { count: dept.children.length })}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
