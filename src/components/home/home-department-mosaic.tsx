import Image from "next/image";
import {
  BrickWall,
  Cable,
  DoorOpen,
  Droplets,
  GraduationCap,
  Hammer,
  HardHat,
  Layers,
  ShowerHead,
  Trees,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { categoryHref, DEPARTMENT_PHOTOS } from "@/lib/navigation/navigation";
import { SectionHeader } from "@/components/ui/page-header";

/** Lucide fallback when a department has no mosaic photo yet. */
const DEPARTMENT_LUCIDE: Record<string, LucideIcon> = {
  "building-materials": BrickWall,
  bathrooms: ShowerHead,
  "door-windows": DoorOpen,
  electrical: Cable,
  flooring: Layers,
  hardware: Wrench,
  plumbing: Droplets,
  "roofing-ceiling": HardHat,
  "tools-equipment": Hammer,
  "landscape-external-works": Trees,
  services: HardHat,
  training: GraduationCap,
};

/**
 * Photo mosaic of live root departments. Prefers DEPARTMENT_PHOTOS; otherwise
 * a graphite tile with a large Lucide glyph and signal accent. Nav row icons
 * (DEPARTMENT_ICONS) stay 20×20 and are never stretched as covers.
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
          const photo = DEPARTMENT_PHOTOS[dept.slug];
          const Icon = DEPARTMENT_LUCIDE[dept.slug];
          return (
            <li key={dept.slug}>
              <Link
                href={categoryHref(dept.slug)}
                className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-base ease-standard group-hover:scale-[1.04]"
                  />
                ) : (
                  <>
                    <span
                      className="absolute inset-0 bg-gradient-to-br from-surface-inverse-raised via-surface-inverse to-[rgb(20_20_20)]"
                      aria-hidden
                    />
                    {Icon ? (
                      <Icon
                        className="pointer-events-none absolute right-3 top-3 size-10 text-brand-primary opacity-90 transition-transform duration-base ease-standard group-hover:scale-110 sm:right-4 sm:top-4 sm:size-12"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    ) : null}
                  </>
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-[rgb(20_20_20/0.88)] via-[rgb(20_20_20/0.35)] to-transparent"
                  aria-hidden
                />
                <span
                  className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-brand-primary transition-transform duration-base ease-standard group-hover:scale-x-100"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <span className="type-title-sm block text-ink-inverse">{dept.name}</span>
                  <span className="type-meta mt-0.5 block text-ink-inverse/80">
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
