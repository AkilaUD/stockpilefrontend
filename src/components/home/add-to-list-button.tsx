"use client";

import { useSyncExternalStore } from "react";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/lib/api/catalogue";
import { materialsListStore } from "@/lib/procurement/materials-list";
import { cx } from "@/lib/cx";

/**
 * The one action that turns a catalogue entry into a materials-list line.
 * Shared by the cover sheet and the current register so "add" means the same
 * thing everywhere on the page.
 */
export function AddToListButton({ product, compact = false }: { product: ProductListItem; compact?: boolean }) {
  const t = useTranslations("home.ledger");
  const lines = useSyncExternalStore(
    materialsListStore.subscribe,
    materialsListStore.getSnapshot,
    materialsListStore.getServerSnapshot,
  );
  const inList = Boolean(product.sku) && lines.some((line) => line.sku === product.sku);

  if (inList) {
    return (
      <Link
        href="#materials-list"
        className={cx(
          "type-stamp inline-flex items-center gap-1 border border-line-strong px-2 py-1 text-ink",
          "transition-colors hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <Check className="size-3.5" aria-hidden />
        {t("inList")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => materialsListStore.addProduct(product)}
      aria-label={t("addNamed", { name: product.name })}
      className={cx(
        "inline-flex items-center gap-1.5 border border-ink bg-surface-elevated px-2.5 py-1.5",
        "type-label text-ink transition-colors hover:bg-brand-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        compact && "px-2 py-1",
      )}
    >
      <Plus className="size-4" aria-hidden />
      {t("add")}
    </button>
  );
}
