import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
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
      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.workspaceComparison}>
        <RfqComparisonView rfqId={id} />
      </PermissionGate>
    </div>
  );
}
