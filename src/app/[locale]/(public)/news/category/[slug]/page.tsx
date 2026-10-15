import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleCard } from "@/components/news/article-card";
import { NewsShell } from "@/components/news/news-shell";
import { Pagination } from "@/components/catalogue/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { getArticles, getContentCategories } from "@/lib/api/content-server";

/*
 * /news/category/{slug} — one editorial bucket, e.g. the reference's
 * "Completed Jobs" (api.md §2.12 `?category=`).
 *
 * A slug that is not one of the buckets 404s rather than rendering an empty
 * page: the bucket list is the authority for which category pages exist, and
 * a page that cannot exist is not a page. A bucket that exists but holds no
 * published posts still renders, with the empty state.
 */

/** A repeated query parameter arrives as an array; take the first value. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const categories = await getContentCategories();
  const bucket = categories.find((category) => category.slug === slug);
  if (bucket) return { title: bucket.name };

  const t = await getTranslations({ locale, namespace: "content" });
  return { title: t("news") };
}

export default async function NewsCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "content" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const categories = await getContentCategories();
  const bucket = categories.find((category) => category.slug === slug);
  if (!bucket) notFound();

  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const data = await getArticles({ category: bucket.slug, locale, page });

  return (
    <NewsShell
      crumbs={[{ label: t("news"), href: "/news" }, { label: bucket.name }]}
      title={bucket.name}
    >
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
          basePath={`/news/category/${bucket.slug}`}
          labels={{
            previous: tPager("previous"),
            next: tPager("next"),
            pageAria: (p) => tPager("pageAria", { page: p }),
          }}
        />
      </div>
    </NewsShell>
  );
}
