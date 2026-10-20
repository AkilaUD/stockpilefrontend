import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeskPageHeader } from "@/components/ui/desk-register";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { SupplierOrdersList } from "@/components/supplier/supplier-orders-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supplier.orders" });
  return { title: t("title") };
}

export default async function SupplierOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supplier.orders");

  return (
    <div className="shell-workspace py-8">
      <DeskPageHeader title={t("title")} lede={t("lede")} />
      <div>
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierOrders}>
          <SupplierOrdersList />
        </PermissionGate>
      </div>
    </div>
  );
}
