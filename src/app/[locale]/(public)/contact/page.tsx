import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /contact — reference reconstruction §4.4; informational contact page with
 * the original's block headings (questions / quotations / call / HQ / work
 * with us) plus a "Get In Touch" strip. Actions are the real ones we have:
 * mailto for info@ and rfq@, tel: for 0114-222-555. There is no contact-form
 * or intents endpoint in this build, so no form is rendered (documented
 * dependency).
 *
 * "Stockpile Careers" now points at our own `/careers` page (gap C), which is
 * the reference's route; before that page existed this link went off-site to
 * the company LinkedIn profile.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return { title: t("title"), description: t("getInTouchTitle") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.contact" });

  const blocks: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: t("questionsTitle"),
      body: (
        <a
          href={`mailto:${t("questionsEmail")}`}
          className="font-body text-base font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("questionsEmail")}
        </a>
      ),
    },
    {
      title: t("quotesTitle"),
      body: (
        <a
          href={`mailto:${t("quotesEmail")}?subject=RFQ%20Request`}
          className="font-body text-base font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("quotesEmail")}
        </a>
      ),
    },
    {
      title: t("callTitle"),
      body: (
        <p className="font-body text-sm leading-relaxed text-ink-muted">
          {t("callBody")}
        </p>
      ),
    },
    {
      title: t("hqTitle"),
      body: <p className="font-body text-base font-medium text-ink">{t("hqAddress")}</p>,
    },
    {
      title: t("workTitle"),
      body: (
        <p className="font-body text-sm leading-relaxed text-ink-muted">
          {t("workBody")}{" "}
          <Link
            href="/careers"
            className="font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("workLink")}
          </Link>
        </p>
      ),
    },
  ];

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((block) => (
          <div key={block.title} className="rounded-md border border-line bg-surface-panel p-6">
            <h2 className="font-display text-lg font-bold text-ink">{block.title}</h2>
            <div className="mt-2">{block.body}</div>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-md bg-brand-primary p-6 text-ink md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("getInTouchTitle")}
        </h2>
        <ul className="mt-4 space-y-3 font-body font-semibold">
          <li className="flex flex-wrap items-center gap-2">
            <span className="text-ink/70">{t("emailUs")}</span>
            <a
              href={`mailto:${t("questionsEmail")}`}
              className="underline decoration-ink/50 underline-offset-2 transition-colors duration-instant ease-standard hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {t("questionsEmail")}
            </a>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <span className="text-ink/70">{t("callUs")}</span>
            <a
              href="tel:+94114222555"
              className="underline decoration-ink/50 underline-offset-2 transition-colors duration-instant ease-standard hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              0114-222-555
            </a>
          </li>
        </ul>
      </section>
    </InfoPage>
  );
}