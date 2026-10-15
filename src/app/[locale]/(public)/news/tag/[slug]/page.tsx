import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleCard } from "@/components/news/article-card";
import { NewsShell } from "@/components/news/news-shell";
import { Pagination } from "@/components/catalogue/pagination";
import { getArticles } from "@/lib/api/content-server";

/*
 * /news/tag/{slug} — the destination of the tag chips the reference prints on
 * each article (api.md §2.12 `?tag=`).
 *
 * The platform has no tag list endpoint, so the page's own first result is what
 * names it: a tag exists only by being attached to a published post, and a slug
 * with no posts is therefore not a tag page at all (404), matching the
 * reference, whose tag URLs likewise only exist for tags in use.
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
  const data = await getArticles({ tag: slug, locale, page: 1 });
  const tag = data.items[0]?.tags.find((entry) => entry.slug === slug);
  if (!tag) notFound();

  return { title: tag.name };
}

export default async function NewsTagPage({
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

  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const data = await getArticles({ tag: slug, locale, page });

  const tag = data.items[0]?.tags.find((entry) => entry.slug === slug);
  if (!tag) notFound();

  return (
    <NewsShell crumbs={[{ label: t("news"), href: "/news" }, { label: tag.name }]} title={tag.name}>
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

      <div className="mt-10">
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.totalItems}
          basePath={`/news/tag/${tag.slug}`}
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
