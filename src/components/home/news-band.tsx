import { Link } from "@/i18n/navigation";
import { formatPublishedDate } from "@/lib/date";
import type { ArticleSummary } from "@/lib/api/content";

interface NewsBandProps {
  title: string;
  viewAllLabel: string;
  articles: ArticleSummary[];
  locale: string;
}

export function NewsBand({ title, viewAllLabel, articles, locale }: NewsBandProps) {
  if (articles.length === 0) return null;

  return (
    <section className="shell-public py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          <Link
            href="/news"
            className="transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {title}
          </Link>
        </h2>
        <Link
          href="/news"
          className="type-body-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {viewAllLabel}
        </Link>
      </div>

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          const href = `/news/post/${encodeURIComponent(article.slug)}`;
          const published = formatPublishedDate(article.publishedAt, locale);
          const bucket = article.categories[0];
          return (
            <li key={article.publicId}>
              <article className="flex h-full flex-col border-b border-line pb-6">
                {article.heroImageUrl && (
                  <Link href={href} className="mb-4 block overflow-hidden bg-surface-recessed" tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite */}
                    <img
                      src={article.heroImageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </Link>
                )}
                {bucket && (
                  <p className="type-label font-semibold tracking-wide text-ink-muted uppercase">{bucket.name}</p>
                )}
                <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
                  <Link
                    href={href}
                    className="transition-colors duration-instant ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {article.title}
                  </Link>
                </h3>
                {published && <p className="type-body-sm mt-2 text-ink-muted">{published}</p>}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
