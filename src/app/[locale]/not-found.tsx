import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * Localized 404 — design-system.md §8.3 step 10, §10 (WCAG 3.1.1).
 *
 * This replaces Next's built-in 404, which ships with `lang=""` and an
 * English-only string. `lang=""` is a hard failure: a screen-reader user gets
 * no language announced for the page at all. Rendering here means the page is
 * inside `[locale]/layout.tsx`, so `<html lang>` is correct for `/si/*` and
 * the message bundle is the right one.
 *
 * It is self-contained rather than wrapped in the `(public)` shell: route-group
 * layouts only apply once a child route matches, and by definition none did.
 * The skip link in the root layout still resolves because this page owns the
 * `#main-content` target it points at.
 */
export default async function NotFound() {
  const notFound = await getTranslations("notFound");

  return (
    <main id="main-content" className="flex flex-1 items-center py-16">
      <div className="shell-public">
        <Image
          src="/brand/stockpile-logo-ink.png"
          alt="Stockpile.lk"
          width={300}
          height={73}
          className="h-9 w-auto"
        />

        <p className="type-label mt-12">{notFound("eyebrow")}</p>
        <h1 className="type-display-lg mt-4">{notFound("title")}</h1>
        <p className="type-body measure-editorial text-ink-muted mt-5">{notFound("body")}</p>

        <div className="mt-8">
          <ButtonLink href="/" size="lg">
            {notFound("backHome")}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
