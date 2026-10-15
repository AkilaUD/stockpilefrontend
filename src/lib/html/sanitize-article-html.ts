/**
 * sanitizeArticleHtml — the allow-list check behind `SanitizedHtml`.
 *
 * security-test-matrix I8/X11 forbids `dangerouslySetInnerHTML` everywhere except
 * one audited renderer, and this is the check that makes that renderer safe. It
 * *verifies* rather than rewrites: the article bodies are our own migrated copy
 * (written only by `ContentSeeder` out of `tools/content-migrate/out/articles.json`),
 * so re-serialising them would only risk changing the reference's own markup.
 *
 * A body is rendered as markup only if:
 *
 *  1. every `<…>` token is exactly one allow-listed tag with no attributes —
 *     `<p>`, `</h2>`, `<br/>`. Measured across the whole dataset (2026-10-14):
 *     div 1952, span 1168, strong 648, li 430, p 234, h3 206, h2 144, ul 112,
 *     td 46, tr 18, table 6, tbody 6, h1 2, em 2, sup 2 — and **zero**
 *     attribute-bearing tags anywhere;
 *  2. no `<` survives outside those tokens. That is the whole proof: an HTML
 *     parser only starts a tag at a `<`, so if every `<` belongs to a token we
 *     vetted, the browser cannot see anything else. It is also why a stray `<`
 *     fails closed — a token pattern cannot even see a `<` with no `>` after it.
 *
 * Anything else — a comment, a `<script>`, an attribute, a stray `<` — fails the
 * whole body closed: it is escaped and rendered as literal text. A body that
 * cannot be vouched for shows its markup; it never becomes markup. Text between
 * tokens is passed through untouched, so entities (`&nbsp;` and `&amp;` are the
 * only two the dataset contains) keep decoding exactly as the reference's page does.
 *
 * `tests/e2e/sanitized-html.spec.ts` is the selftest: it feeds this classifier
 * hostile input (script, event handler, comment, attribute, stray `<`) as well as
 * the exact shapes the migrated dataset contains, and it checks a live article to
 * prove the pass-through path is what the surface actually renders.
 */

/**
 * The editorial-body tags: the dataset's own set plus the rest of each family it
 * touches (the remaining heading levels, the other list/emphasis/table tags, and
 * `hr`). Anchors are deliberately *not* here — the migration unwraps them to text
 * because their hrefs point at the reference site, so a body that still carried
 * one would fail closed, which is the signal that the builder needs to unwrap it.
 * Images are absent for the same reason: no image is ingested (RECONSTRUCTION-NOTES.md).
 */
const ALLOWED_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "sup",
  "sub",
  "blockquote",
  "br",
  "hr",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "div",
  "span",
]);

/** One token as the tokenizer sees it: a `<` up to the next `>` (or the string's end). */
const TOKEN_PATTERN = /<[^>]*>/g;

/** A vetted token: allow-listed tag name, optional `/`, and no attribute text. */
const TAG_PATTERN = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)\s*\/?>$/;

/** True when the body is safe to render as markup — see the module comment. */
export function isArticleMarkupSafe(html: string): boolean {
  for (const token of html.match(TOKEN_PATTERN) ?? []) {
    const tag = TAG_PATTERN.exec(token);
    if (!tag || !ALLOWED_TAGS.has(tag[2].toLowerCase())) return false;
  }

  return !html.replace(TOKEN_PATTERN, "").includes("<");
}

/** The body as markup when it passes the check, as literal text when it does not. */
export function sanitizeArticleHtml(html: string): string {
  return isArticleMarkupSafe(html) ? html : escapeArticleText(html);
}

/** The fail-closed rendering: every character that could start markup is neutralised. */
export function escapeArticleText(html: string): string {
  return html.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
