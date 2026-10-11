import { defineRouting } from "next-intl/routing";

/**
 * Locale routing — docs/design-system.md §35 / implementation-plan 1.50.
 *
 * English is the working language of B2B procurement in Sri Lanka and stays at
 * the unprefixed root so public catalogue URLs remain canonical. Sinhala is
 * available under `/si/*`.
 */
export const routing = defineRouting({
  locales: ["en", "si"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}
