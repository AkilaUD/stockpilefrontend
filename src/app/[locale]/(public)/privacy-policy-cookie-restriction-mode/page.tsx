import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";
import {
  ProseSections,
  type ProseDefinition,
  type ProseSection,
} from "@/components/pages/prose-sections";

/**
 * /privacy-policy-cookie-restriction-mode — the reference's Privacy and Cookie
 * Policy (reference reconstruction §4.4 / PARITY.md gap C). The route slug is
 * the reference's own (it is what its footer and sitemap publish).
 *
 * Copy is the reference's own, transcribed verbatim into `pages.privacyPolicy` —
 * this is legal text, so nothing is paraphrased or machine-translated. The
 * closing "List of cookies we collect" section is a two-column table on the
 * reference, so it renders as one here from the same message data.
 */
const NAMESPACE = "pages.privacyPolicy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  const cookies = t.raw("cookies") as ProseDefinition[];

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <ProseSections sections={t.raw("sections") as ProseSection[]} />

      <section className="mt-10 measure-editorial">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-ink">
          {t("cookiesTitle")}
        </h2>
        <p className="mt-2 type-body leading-relaxed text-ink-muted">{t("cookiesLede")}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-4 type-label text-ink">
                  {t("cookieNameHeader")}
                </th>
                <th scope="col" className="py-2 pr-4 type-label text-ink">
                  {t("cookieDescriptionHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((cookie) => (
                <tr key={cookie.term} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-ink">{cookie.term}</td>
                  <td className="py-2 pr-4 type-body-sm text-ink-muted">{cookie.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </InfoPage>
  );
}
