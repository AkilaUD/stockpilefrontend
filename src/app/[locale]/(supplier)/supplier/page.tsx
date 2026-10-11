import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Supplier-desk home — implementation-plan 1.52, design-system §8.6.
 * Resolves to `/supplier`.
 *
 * Phase 1 ships no supplier data surface (buying leads arrive in Phase 2), so
 * this is one honest empty state behind the same proxy guard as the buyer
 * workspace. Never a fake quota meter or a "welcome back" (§8.6).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("supplierTitle") };
}

export default async function SupplierDeskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("supplierTitle")}</h1>
      <EmptyState
        title={t("supplierEmptyTitle")}
        description={t("supplierEmptyBody")}
        headingLevel="h2"
      />
    </div>
  );
}