import { ClipboardList, Send, ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";

const ICONS = [ClipboardList, Send, ShoppingCart] as const;

/**
 * Visual RFQ → quotes → order rail (server). Entrance owned by home-motion
 * via data-home-reveal.
 */
export async function HomeProcurementRibbon({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.ribbon" });

  return (
    <section
      className="border-b border-line bg-surface-panel"
      aria-labelledby="procurement-ribbon-title"
      data-home-reveal
    >
      <div className="shell-public py-8 sm:py-10">
        <p id="procurement-ribbon-title" className="type-label text-ink-muted">
          {t("title")}
        </p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {ICONS.map((Icon, index) => (
            <li key={index} data-ribbon-step className="flex items-start gap-3 sm:flex-col sm:items-start">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-ink-on-signal shadow-elev-sm">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="type-label text-ink-muted">{t(`steps.${index}.label`)}</span>
                <span className="type-title-sm mt-1 block text-ink">{t(`steps.${index}.title`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
