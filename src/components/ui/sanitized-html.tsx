import { sanitizeArticleHtml } from "@/lib/html/sanitize-article-html";

/**
 * SanitizedHtml — the one place in this application where stored HTML becomes
 * markup (security-test-matrix I8/X11).
 *
 * The eslint rule that forbids `dangerouslySetInnerHTML` is scoped off for this
 * file alone (`eslint.config.mjs`), which is what that rule's own comment asked
 * for: "the sanctioned path replaces this rule's scope when the sanitized
 * renderer arrives".
 *
 * It is safe because `sanitizeArticleHtml` lets a body through to markup only
 * when every tag is allow-listed, none carries an attribute, and no `<` survives
 * outside those tags; otherwise the whole body is escaped to text. That
 * classifier is proven by its own selftest, `tests/e2e/sanitized-html.spec.ts`,
 * which drives it with hostile input and with the shapes the migrated dataset
 * actually contains. Nothing else in the app may inject HTML.
 */
export function SanitizedHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(html) }} />;
}
