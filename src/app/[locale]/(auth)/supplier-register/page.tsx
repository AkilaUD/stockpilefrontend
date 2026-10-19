import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { SupplierRegisterForm, type DepartmentOption } from "@/components/auth/supplier-register-form";
import { getCategoryTree } from "@/lib/api/catalogue-server";
import { sortDepartments } from "@/lib/navigation/navigation";

/*
 * /supplier-register — supplier self-registration (business-flows §3.3). The
 * department choices are read on the server from the live catalogue tree and
 * handed to the client form as plain props; a failed read degrades to an empty
 * list rather than taking the page down (the same containment the masthead
 * applies — B14), and the server is the authority on which slugs exist anyway.
 *
 * The page lives in the (auth) group so it shares the public chrome; its path
 * deliberately does NOT sit under the guarded `/supplier` prefix (proxy.ts).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("supplierRegisterTitle") };
}

export default async function SupplierRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  let departments: DepartmentOption[] = [];
  try {
    const tree = await getCategoryTree();
    departments = sortDepartments(tree).map((node) => ({
      slug: node.slug,
      name: locale === "si" && node.nameSi ? node.nameSi : node.name,
    }));
  } catch (error) {
    console.error("[supplier-register] category tree read failed; rendering without departments:", error);
  }

  return (
    <AuthShell
      title={t("supplierRegisterTitle")}
      subtitle={t("supplierRegisterSubtitle")}
      audience="supplier"
    >
      <SupplierRegisterForm departments={departments} />
    </AuthShell>
  );
}
