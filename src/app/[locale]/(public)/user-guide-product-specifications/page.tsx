import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";
import specData from "@/lib/content/product-specifications.json";

/**
 * /user-guide-product-specifications — the reference's Product Specifications
 * reference (reference reconstruction §4.4 / PARITY.md gap C).
 *
 * This is the one editorial route whose body is tabular: the reference lists,
 * per product category, the attributes a supplier must put in a listing, plus
 * the input type and examples. Re-typing ~370 cells by hand would invite
 * transcription drift, so the tables are captured verbatim from the reference
 * and stored as data in `src/lib/content/product-specifications.json` (the
 * capture script and the raw measurement live in tests/, and the file records
 * its own source URL and capture date). The page is the renderer; the message
 * file carries only its title, lede and column heads.
 *
 * The reference's category headings are stored in its own "Table of Content"
 * order, which is the order the tables appear in — the heading markup on the
 * reference is incomplete for its first few tables (see tests/ref-content/
 * spec-page.html), so the contents list is what pairs heading to table.
 */
const CURRENT = "/user-guide-product-specifications";
const NAMESPACE = "pages.guideProductSpecifications";

interface SpecSection {
  category: string;
  rows: string[][];
}

const spec = specData as { sections: SpecSection[] };

/** Stable in-page anchor for a category heading. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function ProductSpecificationsGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  const tGuide = await getTranslations({ locale, namespace: "pages.userGuide" });

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
      <nav aria-label={t("tocTitle")} className="measure-editorial">
        <h2 className="block-title normal-case">{t("tocTitle")}</h2>
        <ul className="mt-3 grid list-disc gap-1 pl-5 sm:grid-cols-2">
          {spec.sections.map((section) => (
            <li key={section.category} className="type-body-sm text-ink-muted">
              <a
                href={`#${slug(section.category)}`}
                className="transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {section.category}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-10">
        {spec.sections.map((section) => {
          const [head, ...body] = section.rows;
          return (
            <section key={section.category} id={slug(section.category)} className="scroll-mt-24">
              <h2 className="block-title normal-case">{section.category}</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      {head.map((cell, cellIndex) => (
                        <th
                          key={cell || cellIndex}
                          scope="col"
                          className="py-2 pr-4 type-label text-ink"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={row[0] || rowIndex} className="border-b border-line/60 align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-2 pr-4 type-body-sm text-ink-muted">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </UserGuideShell>
  );
}
