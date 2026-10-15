"use client";

/*
 * Supplier setup stage 5 — the categories the supplier covers (business-flows
 * §3.3, api.md §2.9). The catalogue taxonomy is the authority on which slugs
 * exist; this form is handed the offered set by its page (a Server Component
 * reading the public category tree) and only ever sends slugs from it.
 *
 * Unlike the other steps this one is a set of *idempotent* single-row writes
 * (`POST` to add, `DELETE` to remove) rather than one replace, because the
 * backend's contract is add/remove — so the submit diffs the chosen set against
 * what was read and issues the minimum number of calls, sequentially. Re-adding
 * a category that is already covered is a no-op server-side, so a retry is safe.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { errorEnvelopeCode, resolveErrorCopy, supplierSelfApi } from "@/lib/api";
import { fieldErrorsToRecord } from "@/lib/validation/auth";
import { SupplierSetupMissing } from "./supplier-setup-missing";

export interface CategoryOption {
  slug: string;
  name: string;
}

export function SupplierCategoriesForm({ categories }: { categories: readonly CategoryOption[] }) {
  const t = useTranslations("auth.supplierSetup.categories");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [initial, setInitial] = useState<string[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const self = await supplierSelfApi.get();
        if (cancelled) return;
        const slugs = self.categories.map((category) => category.slug);
        setInitial(slugs);
        setCovered(slugs);
      } catch (error) {
        if (cancelled) return;
        if (errorEnvelopeCode(error) === "RESOURCE_NOT_FOUND") setMissing(true);
      } finally {
        if (!cancelled) setReadSettled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const locked = submitting || status === "loading" || (status === "signedIn" && !readSettled);

  // The offered taxonomy plus anything already covered that the tree no longer
  // lists: nothing the supplier is on record as covering may be hidden, and
  // nothing is removed silently.
  const options: CategoryOption[] = [
    ...categories,
    ...covered
      .filter((slug) => !categories.some((category) => category.slug === slug))
      .map((slug) => ({ slug, name: slug })),
  ];

  const toggle = (slug: string): void => {
    setCovered((previous) =>
      previous.includes(slug) ? previous.filter((candidate) => candidate !== slug) : [...previous, slug],
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);
    setFieldErrors({});

    setSubmitting(true);
    try {
      const token = await csrfToken();
      const additions = covered.filter((slug) => !initial.includes(slug));
      const removals = initial.filter((slug) => !covered.includes(slug));

      // Sequential, not parallel: the antiforgery token is refreshed by each
      // response, and a diff here is at most the size of the taxonomy.
      for (const slug of additions) await supplierSelfApi.addCategory(slug, token);
      for (const slug of removals) await supplierSelfApi.removeCategory(slug, token);

      router.push("/supplier");
    } catch (error) {
      if (errorEnvelopeCode(error) === "RESOURCE_NOT_FOUND") {
        setMissing(true);
        return;
      }
      setBanner(resolveErrorCopy(tErrors, error));
      if (error instanceof Error && "envelope" in error) {
        const envelope = (
          error as { envelope?: { fieldErrors?: Parameters<typeof fieldErrorsToRecord>[0] } }
        ).envelope;
        setFieldErrors(fieldErrorsToRecord(envelope?.fieldErrors, tValidation));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (missing) return <SupplierSetupMissing />;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={locked} className="space-y-6">
      {banner !== null && (
        <p role="alert" className="rounded-md border border-line bg-surface-panel p-3 type-body-sm text-ink">
          {banner}
        </p>
      )}

      <p className="type-body-sm text-ink-muted">{t("hint")}</p>

      {options.length === 0 ? (
        <p className="type-body-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <fieldset className="space-y-2" disabled={locked}>
          <legend className="type-label text-ink">{t("legend")}</legend>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {options.map((option) => (
              <li key={option.slug}>
                <label className="flex items-center gap-2 type-body-sm text-ink">
                  <input
                    type="checkbox"
                    name="categories"
                    value={option.slug}
                    checked={covered.includes(option.slug)}
                    onChange={() => toggle(option.slug)}
                    disabled={locked}
                  />
                  {option.name}
                </label>
              </li>
            ))}
          </ul>
          {fieldErrors.slug !== undefined && (
            <p role="alert" className="type-body-sm text-signal-critical">
              {fieldErrors.slug}
            </p>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("finish")}
        </Button>
      </div>
    </form>
  );
}
