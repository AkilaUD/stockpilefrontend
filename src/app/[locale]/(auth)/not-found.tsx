import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * Localized 404 for the `/(auth)` tree (implementation-plan 1.52).
 *
 * Renders inside `(auth)/layout.tsx`, so it gets the site header and footer —
 * the visitor who mistypes a verification link or a reset URL keeps their
 * navigation instead of hitting the bare self-contained fallback.
 *
 * Because the layout already provides `<main id="main-content">`, this file
 * must not emit a second one: duplicate `id`s would break the skip link.
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