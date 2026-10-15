import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

/*
 * Next 16 renamed `middleware.ts` → `proxy.ts` and the exported `middleware`
 * function → `proxy`. The runtime is Node.js and cannot be changed
 * (next/dist/docs/03-file-conventions/proxy.md).
 *
 * Three responsibilities, deliberately kept in this order:
 *   1. Route class (below) — decide whether this path is a page at all.
 *   2. Route-group guard (implementation-plan 1.52, §54/§67) — the private
 *      groups `/(workspace)`, `/(supplier)`, `/(admin)` need a session cookie
 *      present before a page render is even produced (missing → 307 to the
 *      localized `/login`), and their responses unconditionally carry
 *      `X-Robots-Tag: noindex, nofollow` (security-test-matrix Z1,
 *      design-system §13.15 "robots.txt disallows /workspace/** … ").
 *   3. Locale resolution (next-intl) — decides / vs /si/* and redirects a
 *      stray /en/* back to the unprefixed canonical URL.
 *   4. CSP (implementation-plan 1.22, threat-model §9/§13.15) — a fresh nonce
 *      per response, `Report-Only` until the rollout proves it clean.
 *
 * The guard is a PRESENCE check only. The cookie is HttpOnly and encrypted
 * (.NET Identity ticket, architecture §8.1) — a Node proxy cannot decrypt it,
 * so it can answer "is a session cookie there?" and nothing more. Every real
 * permission decision is made server-side by the .NET authorization pipeline
 * (spec §0.9 — no frontend-only permission checks); roles are not decidable
 * at the edge and are enforced by the API, not here.
 */
const handleI18nRouting = createMiddleware(routing);

/**
 * Where browsers post violations. Kept with the policy rather than in
 * next.config because `report-to` is a CSP directive and is meaningless
 * without this header.
 */
const REPORTING_ENDPOINTS = 'csp-endpoint="/api/csp-report"';

/**
 * threat-model §9, directive for directive.
 *
 * `Report-Only` is the whole point of task 1.22: §13.15 requires the header
 * set to be *exercised* against real flows before it is enforced, and a CSP
 * that blocks on its first deployment is a CSP that gets reverted.
 *
 * Deliberately absent, both for reasons the spec is explicit about:
 *   - `upgrade-insecure-requests` — not in §9's list, and it would rewrite
 *     http://localhost subresources to https while verifying locally.
 *   - `strict-dynamic` — not in §9's list either. `'self'` already covers
 *     Next's own chunks; revisit only if a report shows a legitimate script
 *     being blocked, and then with the spec amended alongside it.
 *
 * Production only, like HSTS (threat-model §19 accepts local development
 * running without nonce strictness).
 */
const cspEnabled = process.env.NODE_ENV === "production";

function buildPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
}

/**
 * Mint a nonce and attach the policy to the *request*.
 *
 * That request copy is the load-bearing half: `app-render` reads the request's
 * `content-security-policy` **or** `content-security-policy-report-only`, pulls
 * the nonce out with `getScriptNonceFromHeader`, and stamps it on the inline
 * scripts it emits (flight payload included). Without it, the first thing the
 * policy blocks is Next's own hydration.
 *
 * next-intl builds the headers it forwards as `new Headers(request.headers)`,
 * so mutating before calling it is enough — there is no need to rebuild its
 * response. `x-nonce` is set as well for anything in app code that has to
 * pass the nonce to a third-party tag (guides/content-security-policy).
 *
 * Returns the policy, or `null` when CSP is not being applied.
 */
function applyPolicyToRequest(request: NextRequest): string | null {
  if (!cspEnabled) return null;
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const policy = buildPolicy(nonce);
  request.headers.set("content-security-policy-report-only", policy);
  request.headers.set("x-nonce", nonce);
  return policy;
}

/**
 * Prefixes answered by something other than a page: the framework, or the
 * .NET origin behind the `rewrites()` in next.config.ts.
 *
 * The matcher excludes these as an optimization; this guard is what makes it
 * *correct*. Next invokes the proxy for `_next/data` even when a matcher
 * excludes it (proxy.md, "Negative matching"), and a locale rewrite of an
 * asset or an API path fails in a way no build-time regex can catch.
 *
 * The trailing slash is load-bearing. `/apifoo`, `/_nextfoo` and bare `/api`
 * are not framework paths: letting them through keeps them on the localized
 * 404 instead of Next's `lang=""` default one (WCAG 3.1.1).
 */
const NON_PAGE_PREFIXES = ["/api/", "/_next/", "/_vercel/"];

/**
 * Extensioned URLs answered by the App Router rather than by a file in
 * `public/`. Today: the metadata file convention (`src/app/favicon.ico` →
 * /favicon.ico) and the reference's own sitemap path
 * (`src/app/sitemap/sitemap.xml/route.ts`, a route handler whose folder name
 * matches its URL). Phase 7's `robots.ts` → /robots.txt belongs here too,
 * because its filename does not match its URL.
 *
 * A missing entry does not crash anything — it produces a 404, and the wrong
 * one: locale-routed, and (until it resolves) missing from the page.
 */
const APP_ROUTED_URLS = new Set<string>(["/favicon.ico", "/sitemap/sitemap.xml"]);

const PUBLIC_DIR = join(process.cwd(), "public");

/**
 * Route-group guard data (implementation-plan 1.52).
 *
 * The session cookie is `HttpOnly` + encrypted (architecture §8.1) — this
 * Node proxy can only check that it exists, which is exactly the job: the
 * private surfaces must not so much as render a page shell for a visitor with
 * no session. Roles are not decidable here and remain the API's job (spec §0.9).
 */
const AUTH_SESSION_COOKIE = ".Stockpile.Auth";

/**
 * Private URL prefixes. Three are route groups (`(workspace)`, `(supplier)`,
 * `(admin)`); `/wizard` is the buyer setup wizard, which renders the guarded
 * `(workspace)` shell but resolves to a top-level URL. The API authorizes
 * every request regardless — this is the shell-level floor, not the gate.
 */
const PRIVATE_PREFIXES = ["/workspace", "/supplier", "/admin", "/wizard"];

/**
 * Split a pathname into its locale and the locale-stripped remainder, the
 * same shape next-intl's `as-needed` prefix produces: `en` is the unprefixed
 * default, `si` is `/si/*`.
 */
function localePathname(
  pathname: string,
): { locale: string; rest: string } {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return { locale, rest: "/" };
    if (pathname.startsWith(`${prefix}/`)) {
      return { locale, rest: pathname.slice(prefix.length) };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

/** The private group a locale-stripped path belongs to, if any. */
function privateGroupOf(rest: string): string | undefined {
  return PRIVATE_PREFIXES.find(
    (prefix) => rest === prefix || rest.startsWith(`${prefix}/`),
  );
}

/**
 * Does this pathname resolve to a file that really exists in `public/`?
 * `resolve()` collapses `..`, so a traversal lands outside the prefix test
 * below and is refused rather than allowed to bypass.
 */
function isPublicFile(pathname: string): boolean {
  const candidate = resolve(PUBLIC_DIR, pathname.replace(/^\/+/, ""));
  if (!candidate.startsWith(PUBLIC_DIR + sep)) return false;
  return existsSync(candidate);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (pathname.includes(".")) {
    /*
     * The live reason for this branch: proxy runs *before* the filesystem
     * step (proxy.md, "Execution order"), so locale-routing a real file
     * rewrites it out from under the handler that was about to serve it.
     *
     * The original reason is now history, and worth keeping as such: before
     * this split, every extensioned path was excluded from the matcher and
     * `/manifest.json` landed on the locale route as
     * `locale="manifest.json"` — a parameter build had only ever generated
     * for `en` and `si` — which returned HTTP 500 ("Page changed from static
     * to dynamic at runtime"). That specific failure can no longer occur now
     * that the locale tree renders per response (threat-model §9.1), but
     * hiding a real file still can. Hence the check stays.
     */
    if (APP_ROUTED_URLS.has(pathname)) return NextResponse.next();

    // If `public/` is missing we cannot prove the file *doesn't* exist, so
    // err towards not hiding it: that is the pre-existing behaviour, and it
    // degrades to a missed rewrite rather than a broken image.
    if (!existsSync(PUBLIC_DIR)) return NextResponse.next();
    if (isPublicFile(pathname)) return NextResponse.next();

    // Not a file — fall through to locale routing, which rewrites it under
    // the resolved locale and lets `(public)/[...slug]` render the localized
    // 404: right status, right `lang`, the same page as any other miss.
  }

  // ---- Route-group guard (implementation-plan 1.52) ----------------------
  const { locale, rest } = localePathname(pathname);
  const privateArea = privateGroupOf(rest);

  // Signed-out visitors to a private group never get a page render at all —
  // 307 to the localized login, before any locale work. The cookie check is
  // deliberately presence-only (see AUTH_SESSION_COOKIE above).
  if (privateArea && !request.cookies.has(AUTH_SESSION_COOKIE)) {
    const login = locale === routing.defaultLocale ? "/login" : `/${locale}/login`;
    return NextResponse.redirect(new URL(login, request.url), 307);
  }

  const policy = applyPolicyToRequest(request);
  const response = handleI18nRouting(request);

  // Z1 — private routes never ask to be crawled, authenticated or not. Set
  // on the page response; a next-intl redirect out of here points at a public
  // page and does not need it.
  if (privateArea) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (policy) {
    response.headers.set("content-security-policy-report-only", policy);
    response.headers.set("reporting-endpoints", REPORTING_ENDPOINTS);
  }

  return response;
}

export const config = {
  /*
   * Skipped:
   *   /api/...     — proxied to the .NET origin by next.config rewrites; the
   *                  backend authorizes those itself
   *   /_next/...   — framework assets (_next/static, _next/image, _next/data)
   *   /_vercel/... — platform assets
   *
   * Each is a prefix *with a slash*, not a bare word, so `/apifoo`,
   * `/_nextfoo` and bare `/api` still reach locale routing and get the
   * localized 404 rather than Next's `lang=""` default.
   *
   * Deliberately NOT excluded: `*.*`. Excluding every extensioned path is
   * what stranded `/manifest.json` on the prerenderer. A matcher is a
   * constant regex and cannot ask the filesystem, so the file/page split for
   * everything with a dot is made in `proxy()` above, where it can.
   */
  matcher: ["/((?!api/|_next/|_vercel/).*)"],
};
