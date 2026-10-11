import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Buyer workspace home — implementation-plan 1.52, design-system §8.5.
 * Resolves to `/workspace` (see the group layout for why the group nests a
 * literal `workspace` segment).
 *
 * In Phase 1 the backend offers no workspace data surface yet (RFQs, projects
 * and saved items join in Phase 2), so the honest page is one empty state —
 * deliberately NOT a dashboard of invented KPIs (§8.5 "no 4-card KPI page",
 * rule X2). The container matters though: this is the protected route the
 * Phase-1 gate's "login → protected route" browser test lands on.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("title") };
}

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("title")}</h1>
      <EmptyState title={t("emptyTitle")} description={t("emptyBody")} headingLevel="h2" />
    </div>
  );
}