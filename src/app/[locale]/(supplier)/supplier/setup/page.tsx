import { redirect } from "@/i18n/navigation";

/**
 * `/supplier/setup` is a rail, not a page: it opens on its first step. The
 * redirect is locale-aware (the `(supplier)` group's pages are all reachable in
 * both locales), so a Sinhala visitor lands on `/si/supplier/setup/profile`.
 */
export default async function SupplierSetupIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/supplier/setup/profile", locale });
}
