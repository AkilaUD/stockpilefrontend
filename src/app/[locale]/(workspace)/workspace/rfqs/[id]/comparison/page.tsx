import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/workspace/role-gate";
import { RfqComparisonView } from "@/components/workspace/rfq-comparison";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace.quotes" });
  return { title: t("comparisonTitle") };
}

export default async function WorkspaceRfqComparisonPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-8">
      <RoleGate allowedRoles={["buyer", "buyerAdmin"]}>
        <RfqComparisonView rfqId={id} />
      </RoleGate>
    </div>
  );
}
