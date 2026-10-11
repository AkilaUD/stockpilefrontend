import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getSupplierDirectory } from "@/lib/api/catalogue-server";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue.supplier" });
  return { title: t("title"), description: t("lede") };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SuppliersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const t = await getTranslations({ locale, namespace: "catalogue.supplier" });

  const q = firstParam(sp.q)?.trim() || undefined;
  const data = await getSupplierDirectory(q);

  return (
    <div className="shell-public py-8 md:py-12">
      <header className="max-w-2xl">
        <h1 className="type-display-md text-ink">{t("title")}</h1>
        <p className="mt-3 type-body text-ink-muted">{t("lede")}</p>
        <p className="mt-2 type-body-sm text-ink-muted" aria-live="polite">
          {t("count", { count: data.totalItems })}
        </p>

        <form action={getPathname({ href: "/suppliers", locale })} method="get" role="search" className="mt-6 flex max-w-md items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-11 w-full rounded-md border border-line bg-surface-panel px-3 font-body text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-md bg-brand-primary px-4 font-body text-sm font-semibold text-ink-on-signal transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("searchSubmit")}
          </button>
        </form>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title={t("noMatchesTitle")} description={t("noMatchesBody")} headingLevel="h2" />
      ) : (
        <Reveal className="mt-10">
        <ul className="divide-y divide-line border-y border-line">
          {data.items.map((supplier) => (
            <li key={supplier.publicId}>
              <Link
                href={`/suppliers/${supplier.slug}`}
                className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span>
                  <span className="block type-title-sm text-ink transition-colors duration-instant ease-standard group-hover:text-ink-accent">
                    {supplier.name}
                  </span>
                  <span className="mt-1 block type-body-sm text-ink-muted">
                    {[supplier.district, supplier.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="type-body-sm text-ink-muted">
                    {supplier.productCount != null ? t("products", { count: supplier.productCount }) : ""}
                  </span>
                  <StatusPill tone={supplier.verified ? "success" : "neutral"}>
                    {supplier.verified ? t("verified") : t("unverified")}
                  </StatusPill>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        </Reveal>
      )}
    </div>
  );
}