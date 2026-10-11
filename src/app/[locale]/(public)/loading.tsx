import { getTranslations } from "next-intl/server";

/*
 * Instant loading state for public routes (Next 16 loading.tsx: no props, and
 * it wraps page.js while the segment layouts have already resolved the
 * locale, so the request-scoped translator is safe to call).
 *
 * A skeleton of the most common catalogue layout (title + product grid) keeps
 * layout shift to the minimum; everything is decorative (`aria-hidden`) with
 * a single `role="status"` line for assistive tech.
 */
export default async function PublicLoading() {
  const t = await getTranslations("a11y");

  return (
    <div className="shell-public py-8 md:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        {t("loading")}
      </p>
      <div className="h-8 w-56 rounded bg-surface-recessed" aria-hidden="true" />
      <div className="mt-4 h-4 w-full max-w-md rounded bg-surface-recessed" aria-hidden="true" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2" aria-hidden="true">
            <div className="aspect-[4/3] rounded-md bg-surface-recessed" />
            <div className="h-4 w-3/4 rounded bg-surface-recessed" />
            <div className="h-4 w-1/2 rounded bg-surface-recessed" />
          </div>
        ))}
      </div>
    </div>
  );
}