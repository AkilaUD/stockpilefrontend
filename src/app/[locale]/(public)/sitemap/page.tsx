import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /sitemap — reference reconstruction §4.4. Every public route that exists in
 * this build, grouped Main / Shop / Company / Support like the reference.
 * All destinations are real routes; nothing invented (News and the vendor
 * onboarding flows are absent, as documented elsewhere).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.sitemap" });
  return { title: t("title"), description: t("lede") };
}

export default async function SitemapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.sitemap" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const tQuotes = await getTranslations({ locale, namespace: "pages.quotations" });
  const tHow = await getTranslations({ locale, namespace: "pages.howItWorks" });
  const tSupp = await getTranslations({ locale, namespace: "pages.supplierBenefits" });
  const tAbout = await getTranslations({ locale, namespace: "pages.about" });
  const tContact = await getTranslations({ locale, namespace: "pages.contact" });
  const tTerms = await getTranslations({ locale, namespace: "pages.terms" });
  const tHelp = await getTranslations({ locale, namespace: "pages.help" });
  const tPricing = await getTranslations({ locale, namespace: "pages.pricing" });
  const tSelf = await getTranslations({ locale, namespace: "pages.sitemap" });
  const tGuide = await getTranslations({ locale, namespace: "pages.userGuide" });
  const tBuyers = await getTranslations({ locale, namespace: "pages.howItWorksForBuyers" });
  const tNewest = await getTranslations({ locale, namespace: "pages.newestProducts" });
  const tCareers = await getTranslations({ locale, namespace: "pages.careers" });
  const tReturn = await getTranslations({ locale, namespace: "pages.returnPolicy" });
  const tPrivacy = await getTranslations({ locale, namespace: "pages.privacyPolicy" });
  const tDeletion = await getTranslations({ locale, namespace: "pages.dataDeletion" });
  const tConversion = await getTranslations({ locale, namespace: "pages.conversionTables" });
  const tRegistration = await getTranslations({
    locale,
    namespace: "pages.guideSupplierRegistration",
  });
  const tCreation = await getTranslations({ locale, namespace: "pages.guideProductCreation" });
  const tSpecs = await getTranslations({ locale, namespace: "pages.guideProductSpecifications" });
  const tQuoting = await getTranslations({ locale, namespace: "pages.guideSupplierQuotation" });
  const tRfqs = await getTranslations({ locale, namespace: "pages.guideCustomerCreatingRfqs" });
  const tViewing = await getTranslations({
    locale,
    namespace: "pages.guideCustomerViewingQuotations",
  });
  const tGlossary = await getTranslations({ locale, namespace: "pages.guideGlossary" });

  const groups: Array<{ title: string; links: { label: string; href: string }[] }> = [
    {
      title: t("mainTitle"),
      links: [
        { label: nav("home"), href: "/" },
        { label: nav("products"), href: "/products" },
        { label: nav("suppliers"), href: "/suppliers" },
        { label: nav("searchSubmit"), href: "/search" },
        { label: tQuotes("title"), href: "/quotations-and-estimations" },
      ],
    },
    {
      title: t("shopTitle"),
      links: [
        { label: tQuotes("title"), href: "/quotations-and-estimations" },
        { label: tHow("title"), href: "/how-it-works" },
        { label: nav("shopByDepartment"), href: "/products" },
        { label: tNewest("title"), href: "/newest-products" },
        { label: tPricing("title"), href: "/pricing" },
      ],
    },
    {
      title: t("companyTitle"),
      links: [
        { label: tAbout("title"), href: "/about-us" },
        { label: tContact("title"), href: "/contact" },
        { label: tCareers("title"), href: "/careers" },
        { label: tTerms("title"), href: "/terms-of-use" },
        { label: tPrivacy("title"), href: "/privacy-policy-cookie-restriction-mode" },
        { label: tReturn("title"), href: "/return-policy" },
        { label: tDeletion("title"), href: "/data-deletion-instructions" },
      ],
    },
    {
      title: t("supportTitle"),
      links: [
        { label: tBuyers("eyebrow"), href: "/how-it-works-for-buyers" },
        { label: tSupp("title"), href: "/how-it-works-for-suppliers" },
        { label: tHelp("title"), href: "/help" },
        { label: tGuide("title"), href: "/user-guide" },
        { label: tRegistration("title"), href: "/user-guide-supplier-registration" },
        { label: tCreation("title"), href: "/user-guide-product-creation" },
        { label: tSpecs("title"), href: "/user-guide-product-specifications" },
        { label: tQuoting("title"), href: "/user-guide-supplier-quotation" },
        { label: tRfqs("title"), href: "/user-guide-customer-creating-rfqs" },
        { label: tViewing("title"), href: "/user-guide-customer-viewing-quotations" },
        { label: tConversion("title"), href: "/conversion-tables" },
        { label: tGlossary("title"), href: "/user-guide-glossary" },
        { label: tSelf("title"), href: "/sitemap" },
      ],
    },
  ];

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <div className="grid gap-8 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="block-title">{group.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-ink-muted transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </InfoPage>
  );
}