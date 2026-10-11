import { getRequestConfig } from "next-intl/server";
import { isAppLocale, routing } from "./routing";

/**
 * Resolves the active locale for a request.
 *
 * `requestLocale` carries whatever the URL proposed; anything unrecognised
 * (missing segment, unsupported value in a link, hand-edited URL) falls back to
 * the default rather than throwing, so a bad locale can never take the site
 * down.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
