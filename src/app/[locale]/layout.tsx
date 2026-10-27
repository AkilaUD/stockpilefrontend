import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Inter, Noto_Sans_Sinhala } from "next/font/google";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { MotionProvider } from "@/components/providers/motion-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import "../globals.css";

/*
 * Modern Construction Procurement type system (frontend/DESIGN.md):
 *   Archivo — industrial grotesque display / headings
 *   Inter — UI / body
 *   Noto Sans Sinhala — /si glyph coverage in the body stack
 *
 * next/font self-hosts under /_next/static/media (CSP font-src 'self').
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Tabular mono for SKUs, references, quantities and prices only (DESIGN.md). */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * This layout is the root layout: every route in the app sits under
 * `[locale]`, so it owns `<html>`. That is what lets `lang` reflect the
 * active locale instead of being hard-coded — a Sinhala page served as
 * `lang="en"` would fail WCAG 3.1.1.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * There are exactly two locales, and this layout enumerates both above.
 *
 * Without this, a URL whose first segment is neither locale *and* contains a
 * dot — `/missing.png`, `/report.pdf`, a crawler probing `/manifest.json` —
 * is skipped by the proxy matcher (see src/proxy.ts, which must not rewrite
 * real files), reaches the router as `locale="missing.png"`, misses the
 * prerender manifest for a route Next built as static, and is then forced
 * through a dynamic render on a static route. Next 16 rejects that outright:
 *
 *   Error: Page changed from static to dynamic at runtime /foo.bar,
 *          reason: headers        -> HTTP 500
 *
 * A 500 for a missing file is wrong on both counts: the correct answer is 404,
 * and a 500 on every asset probe is noise in logs and in any uptime monitor.
 * `dynamicParams = false` makes Next answer 404 from the prerender manifest
 * without rendering anything, so no dynamic API is touched.
 *
 * Routes that must still accept unlisted params opt back in themselves —
 * `(public)/[...slug]/page.tsx` sets `dynamicParams = true`, because "any slug
 * we did not pre-render" is exactly what a catch-all is for.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return {
    title: {
      default: "Stockpile.lk — Construction material procurement",
      template: "%s · Stockpile.lk",
    },
    description: t("tagline"),
    applicationName: "Stockpile.lk",
    /*
     * Launch switch (task 7E): set ALLOW_SEARCH_INDEXING=true on the production
     * host when public catalogue content is ready. Private routes still get
     * X-Robots-Tag via src/proxy.ts regardless of this metadata flag.
     */
    robots: process.env.ALLOW_SEARCH_INDEXING === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0d60a",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  /*
   * Prerendering stops here, deliberately.
   *
   * src/proxy.ts mints a fresh CSP nonce for every response and Next stamps
   * it onto this document's inline scripts while rendering — it reads the
   * nonce back out of the request's CSP header (app-render.js,
   * `parseRequestHeaders`). That handshake cannot happen for a page served
   * straight from the build: there is no request, so the prerendered HTML
   * ships `<script>` tags with no nonce (measured: 0 of 13 on `/`).
   *
   * In Report-Only that is merely a violation report per view. Under
   * enforcement (threat-model §9) it is hydration blocked on every static
   * route — so the document must be produced per response. `connection()` is
   * Next 16's replacement for `export const dynamic = 'force-dynamic'`, and
   * living at the layout level it covers every current and future route in
   * this tree: a page added later that never reads a request-time API would
   * otherwise quietly prerender itself back into that hole.
   */
  await connection();

  // A hand-edited URL such as /fr/... must 404 rather than render English
  // under a false language code.
  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "a11y" });

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${inter.variable} ${notoSinhala.variable} ${plexMono.variable}`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> post-render, which otherwise tripped the
          React hydration-mismatch guard on every load. */}
      <body
        className="min-h-dvh flex flex-col bg-surface-page text-ink antialiased"
        suppressHydrationWarning
      >
        {/*
          First focusable element in the document. Keyboard users must be able
          to reach main content without tabbing through the entire header —
          docs/design-system.md §10 (WCAG 2.4.1 Bypass Blocks).
        */}
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <MotionProvider>
          <SessionProvider>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </SessionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
