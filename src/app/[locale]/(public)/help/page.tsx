import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /help — "User Guide & Help" (reference reconstruction §4.4). The reference
 * help is a FAQ accordion; ours groups honest, actionable answers derived
 * only from features and endpoints that exist in this build. Accordion via
 * native <details>/<summary> (no state, full keyboard support).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.help" });
  return { title: t("title"), description: t("lede") };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.help" });
  const groups = t.raw("groups") as Array<{ title: string; items: string[] }>;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <div className="measure-editorial space-y-3">
        {groups.map((group) => (
          <details key={group.title} className="group rounded-md border border-line bg-surface-panel">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md px-5 py-4 transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <span className="font-display text-base font-bold text-ink">{group.title}</span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-ink-muted transition-transform duration-instant ease-standard group-open:rotate-180"
                strokeWidth={1.5}
              />
            </summary>
            <ul className="space-y-2 px-5 pb-5">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2 type-body-sm text-ink-muted">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-brand-secondary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
