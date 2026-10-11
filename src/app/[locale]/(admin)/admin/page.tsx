import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Administration home — implementation-plan 1.52. Resolves to `/admin`.
 *
 * Phase 1 ships no administration surface; the page behind the `/(admin)`
 * guard is one honest empty state so the group is real, guarded and
 * navigable, with no invented tooling behind it (rule X2).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("adminTitle") };
}

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("adminTitle")}</h1>
      <EmptyState
        title={t("adminEmptyTitle")}
        description={t("adminEmptyBody")}
        headingLevel="h2"
      />
    </div>
  );
}