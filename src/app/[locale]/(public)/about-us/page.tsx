import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /about-us — reference reconstruction §4.4; copy faithful to the original
 * page: hero line (subtitle/tagline), four body paragraphs, closing callout.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function AboutUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.about" });
  const body = t.raw("body") as string[];

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <header className="max-w-3xl">
        <p className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {t("subtitle")}
        </p>
        <p className="mt-2 font-display text-base font-semibold text-ink-accent">
          {t("tagline")}
        </p>
      </header>

      <div className="mt-8 max-w-3xl space-y-5">
        {body.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="font-body leading-relaxed text-ink-muted">
            {paragraph}
          </p>
        ))}
      </div>

      <aside className="mt-10 max-w-3xl rounded-md border-l-4 border-brand-primary bg-surface-panel p-6">
        <p className="font-display text-lg font-semibold leading-relaxed text-ink">
          {t("closing")}
        </p>
      </aside>
    </InfoPage>
  );
}