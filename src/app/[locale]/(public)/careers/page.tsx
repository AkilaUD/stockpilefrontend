import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /careers — the reference's Careers page (reference reconstruction §4.4 /
 * PARITY.md gap C). Copy is the reference's own. Its "apply" link points at the
 * reference's own careers board (odoo.stockpile.lk/jobs), which is a real,
 * external destination — the reference has no vacancies list on site.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.careers" });
  return { title: t("title"), description: t("lede") };
}

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.careers" });
  const link = t.raw("link") as { label: string; href: string };
  const paragraphs = t("body")
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="measure-editorial space-y-4">
        <p className="font-display text-xl font-extrabold tracking-tight text-ink">{t("lede")}</p>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="type-body leading-relaxed text-ink-muted">
            {paragraph}
          </p>
        ))}
        <p>
          <a
            href={link.href}
            rel="noreferrer"
            className="font-medium text-ink-accent underline decoration-from-font underline-offset-2 transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {link.label}
          </a>
        </p>
        <p className="type-body leading-relaxed text-ink-muted">{t("outro")}</p>
      </div>
    </InfoPage>
  );
}
