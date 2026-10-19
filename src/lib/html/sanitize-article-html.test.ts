import { describe, expect, it } from "vitest";
import { escapeArticleText, isArticleMarkupSafe, sanitizeArticleHtml } from "./sanitize-article-html";

describe("isArticleMarkupSafe", () => {
  it("accepts allow-listed tags without attributes", () => {
    expect(isArticleMarkupSafe("<p>Hello <strong>world</strong></p>")).toBe(true);
    expect(isArticleMarkupSafe("<h2>Title</h2><ul><li>One</li></ul>")).toBe(true);
  });

  it("rejects script, attributes, comments, and stray angle brackets", () => {
    expect(isArticleMarkupSafe('<p onclick="alert(1)">x</p>')).toBe(false);
    expect(isArticleMarkupSafe("<script>alert(1)</script>")).toBe(false);
    expect(isArticleMarkupSafe("<!-- comment --><p>x</p>")).toBe(false);
    expect(isArticleMarkupSafe("a < b")).toBe(false);
  });
});

describe("sanitizeArticleHtml", () => {
  it("passes safe markup through and escapes unsafe bodies", () => {
    const safe = "<p>Ready-mix <em>concrete</em></p>";
    expect(sanitizeArticleHtml(safe)).toBe(safe);
    expect(sanitizeArticleHtml('<img src=x onerror=alert(1)>')).toBe(
      escapeArticleText('<img src=x onerror=alert(1)>'),
    );
  });
});
