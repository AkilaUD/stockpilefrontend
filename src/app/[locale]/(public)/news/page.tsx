import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleCard } from "@/components/news/article-card";
import { Pagination } from "@/components/catalogue/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoPage } from "@/components/pages/info-page";
import { getArticles } from "@/lib/api/content-server";

/*
 * /news — the reference's editorial index (api.md §2.12).
 *
 * Every kind appears here, not just NewsArticle: the reference's first page is
 * entirely completed-project write-ups and its own bucket badge on each card is
 * what tells them apart, so no kind filter is sent — the endpoint's default
 * (all kinds, newest first) is this page.
 *
 * The list renders each post in full under its heading the way the reference's
 * list item does, and pages six at a time, which is the reference's page size.
 */

/** A repeated query parameter arrives as an array; take the first value. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "content" });
  return { title: t("news") };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "content" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const data = await getArticles({ locale, page });

  return (
    <InfoPage breadcrumb={t("news")} title={t("news")}>
      {data.items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} headingLevel="h2" />
      ) : (
        <div className="space-y-10">
          {data.items.map((article) => (
            <ArticleCard
              key={article.publicId}
              article={article}
              locale={locale}
              readMoreLabel={t("readMore")}
            />
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.totalItems}
          basePath="/news"
          labels={{
            previous: tPager("previous"),
            next: tPager("next"),
            pageAria: (p) => tPager("pageAria", { page: p }),
          }}
        />
      </div>
    </InfoPage>
  );
}
