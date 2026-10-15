import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /data-deletion-instructions — the reference's Data Deletion Instructions
 * (reference reconstruction §4.4 / PARITY.md gap C). The reference page is a
 * single sentence naming a support address; this renders that sentence (the
 * reference's own wording) with the address as a real mailto: link.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.dataDeletion" });
  return { title: t("title"), description: t("body") };
}

export default async function DataDeletionInstructionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.dataDeletion" });

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="measure-editorial">
        <p className="type-body leading-relaxed text-ink-muted">
          {t("body")} —{" "}
          <a
            href="mailto:support@stockpile.lk"
            className="font-medium text-ink-accent underline decoration-from-font underline-offset-2 transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            support@stockpile.lk
          </a>
        </p>
      </div>
    </InfoPage>
  );
}
