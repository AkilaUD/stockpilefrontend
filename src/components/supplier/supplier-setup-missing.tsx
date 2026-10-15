"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";

/**
 * The honest answer when a signed-in caller has no supplier row: every
 * `/suppliers/me` read answers one 404 `RESOURCE_NOT_FOUND` (api.md §2.9), and
 * the setup surface says so plainly instead of rendering three empty forms that
 * would each fail the same way. The account that holds a supplier role always
 * has a supplier (registration creates both in one transaction), so this is a
 * defensive state, not a routine one.
 */
export function SupplierSetupMissing() {
  const t = useTranslations("auth.supplierSetup.noSupplier");

  return (
    <div className="rounded-md border border-line bg-surface-panel p-5">
      <h2 className="type-title-md text-ink">{t("title")}</h2>
      <p className="mt-2 type-body text-ink-muted">{t("body")}</p>
      <div className="mt-4">
        <ButtonLink href="/supplier-register">{t("cta")}</ButtonLink>
      </div>
    </div>
  );
}
