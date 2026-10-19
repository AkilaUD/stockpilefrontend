import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/workspace/role-gate";
import { SupplierLeadDetailView } from "@/components/supplier/supplier-lead-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supplier.leads" });
  return { title: t("detailTitle") };
}

export default async function SupplierLeadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-10">
      <RoleGate allowedRoles={["supplierOwner", "supplierUser"]}>
        <SupplierLeadDetailView leadId={id} />
      </RoleGate>
    </div>
  );
}
