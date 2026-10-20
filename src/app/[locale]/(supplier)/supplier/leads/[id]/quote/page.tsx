import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { SupplierQuoteForm } from "@/components/supplier/supplier-quote-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supplier.quotes" });
  return { title: t("title") };
}

export default async function SupplierLeadQuotePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-10">
      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierLeadQuote}>
        <SupplierQuoteForm leadId={id} />
      </PermissionGate>
    </div>
  );
}
