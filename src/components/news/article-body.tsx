import { SanitizedHtml } from "@/components/ui/sanitized-html";
import { cx } from "@/lib/cx";

/**
 * ArticleBody — renders the transcribed reference HTML of an article.
 *
 * The body is the reference's own markup with the theme's furniture removed at
 * migration time (see tests/content-dataset.mjs), so every tag in it is content:
 * headings, paragraphs, lists, emphasis, tables. It is rendered through
 * `SanitizedHtml` — the application's single audited HTML renderer, which
 * verifies the markup against an allow-list of attribute-free tags before it
 * becomes markup and escapes it to text otherwise (I8/X11; see that component
 * and `src/lib/html/sanitize-article-html.ts`).
 *
 * The typography is declared here rather than inline at each call site, because
 * the news list renders the same markup under each card as the article page does.
 *
 * The h2 voice follows the reference's own content heading, measured on the
 * product template (.tab-content h2: 24px / 500 — tests/audit/template.json);
 * anything the reference leaves at theme defaults uses this design system's
 * body copy instead.
 */
const BODY_CLASS = cx(
  "max-w-3xl font-body text-base leading-relaxed text-ink",
  "[&>*+*]:mt-4",
  "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight",
  "[&_strong]:font-semibold",
  "[&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:list-decimal [&_ol]:pl-6",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-muted",
  "[&_table]:w-full [&_table]:text-left",
  "[&_th]:py-1 [&_th]:pr-4 [&_th]:align-top [&_th]:font-semibold",
  "[&_td]:py-1 [&_td]:pr-4 [&_td]:align-top",
  "[&_a]:underline",
);

export function ArticleBody({ html, className }: { html: string; className?: string }) {
  return (
    <SanitizedHtml
      html={html}
      className={className ? `${BODY_CLASS} ${className}` : BODY_CLASS}
    />
  );
}
