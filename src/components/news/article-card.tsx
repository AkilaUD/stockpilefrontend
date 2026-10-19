import { Link } from "@/i18n/navigation";
import { ArticleBody } from "@/components/news/article-body";
import { formatPublishedDate } from "@/lib/date";
import type { ArticleSummary } from "@/lib/api/content";

/*
 * One news list entry — reference `.post-item` with optional ingested hero
 * (ContentSeeder → MediaAsset). No hotlink / placeholder when heroImageUrl is null.
 */
interface ArticleCardProps {
  article: ArticleSummary;
  locale: string;
  readMoreLabel: string;
}

export function ArticleCard({ article, locale, readMoreLabel }: ArticleCardProps) {
  const published = formatPublishedDate(article.publishedAt, locale);
  const bucket = article.categories[0];
  const href = `/news/post/${encodeURIComponent(article.slug)}`;
  const hero = article.heroImageUrl;

  return (
    <article className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      {hero && (
        <Link href={href} className="mb-4 block overflow-hidden bg-surface-recessed" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite */}
          <img
            src={hero}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full object-cover"
          />
        </Link>
      )}

      {bucket && (
        <Link
          href={`/news/category/${encodeURIComponent(bucket.slug)}`}
          className="type-label font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {bucket.name}
        </Link>
      )}

      <h2 className="mt-2 max-w-3xl font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
        <Link
          href={href}
          className="transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {article.title}
        </Link>
      </h2>

      {published && <p className="type-body-sm mt-2 text-ink-muted">{published}</p>}

      <ArticleBody html={article.body} className="mt-4" />

      <p className="mt-4">
        <Link
          href={href}
          className="type-body-sm font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {readMoreLabel}
        </Link>
      </p>
    </article>
  );
}
