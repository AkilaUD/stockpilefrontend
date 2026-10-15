import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";

/**
 * /user-guide-supplier-quotation — the reference's "Supplier - Quoting for an
 * RFQ" guide (reference reconstruction §4.4 / PARITY.md gap C).
 *
 * The reference page is a video and a bullet list of what it covers. This build
 * has no video asset for it, so the page renders the transcript the reference
 * publishes alongside the video (its own wording) and nothing invented.
 */
const CURRENT = "/user-guide-supplier-quotation";
const NAMESPACE = "pages.guideSupplierQuotation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function SupplierQuotationGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  const tGuide = await getTranslations({ locale, namespace: "pages.userGuide" });
  const bullets = t.raw("bullets") as string[];

  return (
    <UserGuideShell
      title={t("title")}
      lede={t("lede")}
      nav={tGuide.raw("nav") as GuideNavEntry[]}
      navLabel={tGuide("navLabel")}
      current={CURRENT}
      prevLabel={tGuide("prevTopic")}
      nextLabel={tGuide("nextTopic")}
      topicNavLabel={tGuide("topicNavLabel")}
    >
      <ul className="measure-editorial list-disc space-y-2 pl-5">
        {bullets.map((bullet) => (
          <li key={bullet} className="type-body leading-relaxed text-ink-muted">
            {bullet}
          </li>
        ))}
      </ul>
    </UserGuideShell>
  );
}
