import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArticleBody } from "@/components/news/article-body";
import { NewsShell } from "@/components/news/news-shell";
import { ApiClientError } from "@/lib/api/envelope";
import { getArticle } from "@/lib/api/content-server";
import { formatPublishedDate } from "@/lib/date";
import type { ArticleDetail } from "@/lib/api/content";

/*
 * /news/post/{slug} — one article (api.md §2.12 `GET /content/articles/{slug}`).
 *
 * The reference's post page carries, besides the body: the bucket link, the
 * date, a view counter, a Tags block, previous/next links and a comment
 * section. Only the bucket, the date, the tags and the body hold data in this
 * platform — there is no view counter, no post ordering endpoint and no
 * comments — so the rest is omitted rather than fabricated. Probed
 * 2026-10-14: the trail is Home / News / <bucket> / <title>, and each tag links
 * to /news/tag/{slug}.
 */

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const article = await getArticle(slug, locale);
    return {
      title: article.metaTitle ?? article.title,
      description: article.metaDescription ?? article.excerpt ?? undefined,
    };
  } catch {
    return {};
  }
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "content" });

  let article: ArticleDetail;
  try {
    article = await getArticle(slug, locale);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const published = formatPublishedDate(article.publishedAt, locale);
  const bucket = article.categories[0];

  const crumbs = [{ label: t("news"), href: "/news" }];
  if (bucket) {
    crumbs.push({ label: bucket.name, href: `/news/category/${bucket.slug}` });
  }

  return (
    <NewsShell crumbs={[...crumbs, { label: article.title }]} title={article.title}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {bucket && (
          <Link
            href={`/news/category/${encodeURIComponent(bucket.slug)}`}
            className="type-label font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {bucket.name}
          </Link>
        )}
        {published && <span className="type-body-sm text-ink-muted">{published}</span>}
      </div>

      {article.heroImageUrl && (
        <div className="mt-6 overflow-hidden bg-surface-recessed">
          {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite */}
          <img
            src={article.heroImageUrl}
            alt=""
            loading="eager"
            decoding="async"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      <ArticleBody html={article.body} className="mt-6" />

      {article.tags.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="type-label font-semibold text-ink-muted">{t("tags")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/news/tag/${encodeURIComponent(tag.slug)}`}
                  className="type-body-sm inline-block rounded-full border border-line px-3 py-1 text-ink transition-colors duration-instant ease-standard hover:border-ink-accent hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </NewsShell>
  );
}
