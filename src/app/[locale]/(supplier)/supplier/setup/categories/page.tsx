import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import {
  SupplierCategoriesForm,
  type CategoryOption,
} from "@/components/supplier/supplier-categories-form";
import { SupplierSetupShell } from "@/components/supplier/supplier-setup-shell";
import { getCategoryTree } from "@/lib/api/catalogue-server";

/** Supplier setup stage 5 — the categories the supplier covers (business-flows §3.3, api.md §2.9). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.supplierSetup.categories" });
  return { title: t("title") };
}

/**
 * The offered taxonomy is the real public category tree — the backend validates
 * every slug against exactly this catalogue, so the picker and the authority are
 * the same data. Only top-level categories are offered: the supplier's coverage
 * at registration is root-level, and a nested path is a product classification,
 * not a business identity.
 *
 * A failed catalogue read degrades to an empty offer rather than replacing the
 * whole step with an error page: the supplier's own covered slugs still render
 * (the form is handed them by its own read), so the step stays usable and
 * nothing the supplier already covers becomes invisible.
 */
async function offeredCategories(): Promise<CategoryOption[]> {
  try {
    const tree = await getCategoryTree();
    return tree.filter((node) => node.isRoot).map((node) => ({ slug: node.slug, name: node.name }));
  } catch (error) {
    console.error(
      "[supplier-setup] category tree read failed; offering only already-covered categories:",
      error,
    );
    return [];
  }
}

export default async function SupplierSetupCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.supplierSetup.categories");
  const categories = await offeredCategories();

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="mt-2 type-body text-ink-muted">{t("description")}</p>
        </header>
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierSetup}><SupplierSetupShell current="categories" />
        <SupplierCategoriesForm categories={categories} /></PermissionGate>
      </div>
    </div>
  );
}
