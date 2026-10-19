import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

/*
 * /supplier-login — the supplier-framed sign-in (business-flows §3.1). One
 * identity system signs every account in (api.md §2.1 POST /auth/login), so
 * this page reuses the same LoginForm against the same endpoint; only the frame
 * copy differs. It exists so the reference header's "Supplier Login" link lands
 * on a supplier-shaped screen rather than a generic one.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("supplierLoginTitle") };
}

export default async function SupplierLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("supplierLoginTitle")} subtitle={t("supplierLoginSubtitle")} audience="supplier">
      <LoginForm registerHref="/supplier-register" />
    </AuthShell>
  );
}
