import { Link } from "@/i18n/navigation";
import { ArticleBody } from "@/components/news/article-body";
import { formatPublishedDate } from "@/lib/date";
import type { ArticleSummary } from "@/lib/api/content";

/*
 * One news list entry.
 *
 * Follows the reference's own list item (probed 2026-10-14 on /en/news:
 * `.post-item` = artwork, the bucket as a badge over it, then the title link,
 * the date, the post's full text and a "Read more" link) minus the artwork: the
 * reference's media is not ingested yet, and a hotlinked or placeholder image
 * would be worse than none (api.md §3.5 truthful rendering).
 *
 * The list renders the article text in full because the reference does — it is
 * not a teaser list — which is also why the list contract carries the body.
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

  return (
    <article className="border-t border-line pt-8 first:border-t-0 first:pt-0">
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
