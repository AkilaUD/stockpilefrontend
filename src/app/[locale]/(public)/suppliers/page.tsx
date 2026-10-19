import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSupplierDirectory } from "@/lib/api/catalogue-server";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { CatalogueSearchForm } from "@/components/catalogue/catalogue-search-form";
import { SupplierDirectoryCard } from "@/components/catalogue/supplier-directory-card";
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
    <CatalogueShell
      title={t("title")}
      lede={t("lede")}
      aside={
        <>
          <p className="type-body-sm text-ink-muted" aria-live="polite">
            {t("count", { count: data.totalItems })}
          </p>
          <CatalogueSearchForm
            action={getPathname({ href: "/suppliers", locale })}
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            submitLabel={t("searchSubmit")}
          />
        </>
      }
    >
      {data.items.length === 0 ? (
        <EmptyState title={t("noMatchesTitle")} description={t("noMatchesBody")} headingLevel="h2" />
      ) : (
        <Reveal>
          <ul className="catalogue-grid gap-3 md:gap-4">
            {data.items.map((supplier) => (
              <SupplierDirectoryCard
                key={supplier.publicId}
                supplier={supplier}
                verifiedLabel={t("verified")}
                unverifiedLabel={t("unverified")}
                productsLabel={t("products", { count: supplier.productCount ?? 0 })}
              />
            ))}
          </ul>
        </Reveal>
      )}
    </CatalogueShell>
  );
}
