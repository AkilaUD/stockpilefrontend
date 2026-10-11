import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * Localized 404 — design-system.md §8.3 step 10, §48 (every empty/error state
 * offers the next action), §10 (WCAG 3.1.1).
 *
 * Reached from `./[...slug]/page.tsx`. Rendering inside `(public)/layout.tsx`
 * is what gives it the site header and footer — Next places the `not-found`
 * boundary at this segment, *below* the layout, so a visitor who mistypes a
 * URL still has navigation to recover with instead of a dead end.
 *
 * Because the layout already provides `<main id="main-content">`, this file
 * must not emit a second one: duplicate `id`s would break the skip link in the
 * root layout for assistive-technology users.
 *
 * No illustration (image-asset-plan: never an image just to fill space) and no
 * invented copy — the text is a message key, so `/si/*` gets Sinhala.
 */
export default async function NotFound() {
  const notFound = await getTranslations("notFound");

  return (
    <section className="shell-public py-16 md:py-24">
      <p className="type-label">{notFound("eyebrow")}</p>
      <h1 className="type-display-lg mt-4">{notFound("title")}</h1>
      <p className="type-body measure-editorial text-ink-muted mt-5">{notFound("body")}</p>

      <div className="mt-8">
        <ButtonLink href="/" size="lg">
          {notFound("backHome")}
        </ButtonLink>
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const notFound = await getTranslations("notFound");
  return { title: notFound("title") };
}
