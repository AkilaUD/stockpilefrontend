"use client";

import { useTranslations } from "next-intl";
import { Building2, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";

export type AuthAudience = "buyer" | "supplier";

const CARD =
  "flex flex-1 flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function AuthAudienceRail({ active }: { active: AuthAudience }) {
  const t = useTranslations("auth");

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-3" role="group" aria-label={t("audienceLegend")}>
      <Link
        href="/login"
        className={cx(
          CARD,
          active === "buyer"
            ? "border-ink bg-surface-panel shadow-elev-sm"
            : "border-line bg-surface-recessed/50 text-ink-muted hover:border-line-strong hover:text-ink",
        )}
        aria-current={active === "buyer" ? "page" : undefined}
      >
        <span className="flex items-center gap-2 type-label text-ink">
          <Building2 className="size-4 shrink-0" aria-hidden />
          {t("audienceBuyer")}
        </span>
        <span className="type-meta text-ink-muted">{t("audienceBuyerHint")}</span>
      </Link>
      <Link
        href="/supplier-login"
        className={cx(
          CARD,
          active === "supplier"
            ? "border-ink bg-surface-panel shadow-elev-sm"
            : "border-line bg-surface-recessed/50 text-ink-muted hover:border-line-strong hover:text-ink",
        )}
        aria-current={active === "supplier" ? "page" : undefined}
      >
        <span className="flex items-center gap-2 type-label text-ink">
          <Truck className="size-4 shrink-0" aria-hidden />
          {t("audienceSupplier")}
        </span>
        <span className="type-meta text-ink-muted">{t("audienceSupplierHint")}</span>
      </Link>
    </div>
  );
}
