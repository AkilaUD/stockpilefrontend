import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /terms-of-use — reference reconstruction §4.4. Body copy is the original
 * page's own text, condensed to its substantive paragraphs (§ headings, legal
 * boilerplate and structural markup dropped; every paragraph's wording kept).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  return { title: t("title"), description: t("title") };
}

export default async function TermsOfUsePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  const paragraphs = t.raw("body") as string[];

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <ol className="measure-editorial space-y-5">
        {paragraphs.map((paragraph, index) => (
          <li key={paragraph.slice(0, 32)} className="flex gap-4">
            <span
              aria-hidden="true"
              className="font-display text-base font-extrabold text-brand-secondary"
            >
              {index + 1}.
            </span>
            <p className="type-body text-ink-muted">{paragraph}</p>
          </li>
        ))}
      </ol>
    </InfoPage>
  );
}
