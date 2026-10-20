import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { OrderDetailView } from "@/components/workspace/order-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supplier.orders" });
  return { title: t("detailTitle") };
}

export default async function SupplierOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-10">
      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierOrders}>
        <OrderDetailView orderId={id} backHref="/supplier/orders" canAcknowledge />
      </PermissionGate>
    </div>
  );
}
