import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Catch-all for any path that resolves to a locale but to no route.
 *
 * Next only renders `not-found.tsx` when something *throws* `notFound()`.
 * An unmatched URL on its own falls through to the framework's built-in 404,
 * which is unstyled, English-only and carries `lang=""` — a WCAG 3.1.1
 * failure, since the page language is simply absent. Routing unmatched paths
 * into an explicit page is what makes the localized `./not-found.tsx`
 * reachable at all.
 *
 * Deliberately a catch-all rather than an enumerated list: route specificity
 * puts every concrete route (`/si/login`, `/si/products`, …) ahead of it, so
 * this file needs no edits as the site grows — it simply stops being reached.
 */
type Props = { params: Promise<{ locale: string; slug: string[] }> };

/**
 * Opt back in from `dynamicParams = false` on the locale layout above: an
 * un-rendered slug is the normal case here, not an error (see the comment on
 * that export). Without this the catch-all would 404 every path that was not
 * in a generateStaticParams list, which is none of them.
 */
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("title") };
}

export default async function UnknownPathPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
