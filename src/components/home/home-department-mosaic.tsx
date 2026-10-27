import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { categoryHref, DEPARTMENT_ICONS } from "@/lib/navigation/navigation";
import { SectionHeader } from "@/components/ui/page-header";

/**
 * Department mosaic of live root departments. Tiles use real category names
 * and subcategory counts from the API tree.
 *
 * DEPARTMENT_ICONS are 20×20 nav glyphs — never stretch them as cover photos.
 * When real department photography exists, prefer a separate DEPARTMENT_PHOTOS
 * map (≥800px) as full-bleed covers and keep DEPARTMENT_ICONS for the menu only.
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
        {departments.map((dept) => {
          const icon = DEPARTMENT_ICONS[dept.slug];
          return (
            <li key={dept.slug}>
              <Link
                href={categoryHref(dept.slug)}
                className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {icon ? (
                  <Image
                    src={icon}
                    alt=""
                    width={40}
                    height={40}
                    className="pointer-events-none absolute right-3 top-3 size-8 opacity-40 brightness-0 invert transition-transform duration-base ease-standard group-hover:scale-110 sm:right-4 sm:top-4 sm:size-10"
                    aria-hidden
                  />
                ) : null}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-[rgb(20_20_20/0.55)] via-transparent to-transparent"
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
