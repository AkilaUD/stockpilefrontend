import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categoryHref } from "@/lib/navigation/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";

/*
 * Department atlas — the real root departments from the live category tree,
 * in buyer language, straight under the hero.
 */

interface DepartmentAtlasProps {
  departments: CategoryNode[];
}

export async function DepartmentAtlas({ departments }: DepartmentAtlasProps) {
  const t = await getTranslations("home.departments");

  if (departments.length === 0) return null;

  return (
    <section className="shell-public border-b border-line py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-xl type-body text-ink-muted">{t("lede")}</p>
        </div>
        <div className="relative hidden aspect-[16/6] overflow-hidden md:col-span-5 md:block">
          <Image
            src="/home/home-material-atlas.jpg"
            alt={t("imageAlt")}
            fill
            sizes="40vw"
            className="object-cover"
          />
        </div>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {departments.map((department) => (
          <li key={department.slug} className="bg-surface-elevated">
            <Link
              href={categoryHref(department.slug)}
              className="group flex h-full flex-col px-5 py-5 transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
            >
              <span className="type-title-sm font-semibold text-ink">{department.name}</span>
              {department.children.length > 0 && (
                <span className="mt-1 type-meta text-ink-muted">
                  {t("subcategories", { count: department.children.length })}
                </span>
              )}
              <span className="mt-4 inline-flex items-center gap-1 type-meta font-semibold text-ink">
                {t("browse")}
                <ArrowRight
                  className="size-3.5 transition-transform duration-instant ease-standard group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
