"use client";

/*
 * Buyer wizard step 2 — professional profile (business-flows §2, api.md §2.2).
 * The caller is signed in (the wizard lives in the guarded (workspace) group).
 * The component reads the stored profile on mount and PATCHes on submit, so the
 * step is resumable: leaving and returning re-reads what the backend holds.
 *
 * Hand-rolled state, no react-hook-form: the forms are tiny and the workspace
 * budget is the small one (design-system §11). The server is the enforcement
 * boundary; `fieldErrorsToRecord` lands a 422 envelope's field errors back on
 * the inputs.
 */

import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { authApi, resolveErrorCopy, type ProfileDraft } from "@/lib/api";
import { fieldErrorsToRecord } from "@/lib/validation/auth";

/** The first field error whose key equals `exact` or starts with it (list entries arrive as `key[0]`). */
function fieldError(errors: Record<string, string>, exact: string): string | undefined {
  return errors[exact] ?? Object.entries(errors).find(([key]) => key.startsWith(exact))?.[1];
}

export function ProfileForm() {
  const t = useTranslations("auth.profile");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<ProfileDraft>({
    role: "",
    procurementLocations: [],
    projectInterests: [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);

  const roleId = useId();
  const locationsInputId = useId();
  const interestsInputId = useId();

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const profile = await authApi.getProfile();
        if (cancelled) return;
        setValues({
          role: profile.role ?? "",
          procurementLocations: profile.procurementLocations,
          projectInterests: profile.projectInterests,
        });
      } catch {
        /* A read failure just leaves the empty form — the server is still the authority. */
      } finally {
        if (!cancelled) setReadSettled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  /**
   * Inert until this step's own read settles. The read is a round trip and the
   * buyer does not wait for it: applying the stored profile to a form they have
   * already touched discards what they typed — silently, intermittently, and
   * worse the slower the network. The step's fields therefore stay disabled
   * (`aria-busy` on the form) until the answer is in hand.
   *
   * A signed-out caller is not held here: there is nothing to read, so the form
   * stays usable and the submit answers the ordinary 401.
   */
  const locked = submitting || status === "loading" || (status === "signedIn" && !readSettled);

  const addItem = (key: "procurementLocations" | "projectInterests", raw: string) => {
    const item = raw.trim();
    if (item.length === 0) return;
    setValues((previous) => {
      const list = previous[key] ?? [];
      if (list.includes(item)) return previous;
      return { ...previous, [key]: [...list, item] };
    });
  };

  const removeItem = (key: "procurementLocations" | "projectInterests", index: number) =>
    setValues((previous) => ({ ...previous, [key]: (previous[key] ?? []).filter((_, i) => i !== index) }));

  /** Enter commits the chip instead of submitting the whole form. */
  const chipKeyDown = (key: "procurementLocations" | "projectInterests") => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addItem(key, event.currentTarget.value);
    event.currentTarget.value = "";
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await authApi.updateProfile(values, await csrfToken());
      router.push("/wizard/organization");
    } catch (error) {
      setBanner(resolveErrorCopy(tErrors, error));
      if (error instanceof Error && "envelope" in error) {
        const envelope = (error as { envelope?: { fieldErrors?: Parameters<typeof fieldErrorsToRecord>[0] } }).envelope;
        setFieldErrors(fieldErrorsToRecord(envelope?.fieldErrors, tValidation));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const chips = (key: "procurementLocations" | "projectInterests") => (
    <ul className="flex flex-wrap gap-2">
      {(values[key] ?? []).map((item, index) => (
        <li
          key={`${key}-${index}`}
          className="inline-flex items-center gap-1 rounded-sm bg-surface-recessed px-2 py-1 type-body-sm text-ink"
        >
          {item}
          <button
            type="button"
            onClick={() => removeItem(key, index)}
            className="text-ink-muted hover:text-danger"
            aria-label={t("removeItem")}
            disabled={locked}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <form noValidate aria-busy={locked} onSubmit={onSubmit} className="flex flex-col gap-6">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <FormField id={roleId} label={t("roleLabel")} error={fieldError(fieldErrors, "role")}>
        {(control) => (
          <select
            {...control}
            className={fieldControlClassName}
            value={values.role}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setValues((previous) => ({ ...previous, role: event.target.value }))
            }
            disabled={locked}
          >
            <option value="">{t("rolePlaceholder")}</option>
            <option value="procurement-manager">{t("role.procurementManager")}</option>
            <option value="project-manager">{t("role.projectManager")}</option>
            <option value="owner-director">{t("role.ownerDirector")}</option>
            <option value="other">{t("role.other")}</option>
          </select>
        )}
      </FormField>

      <FormField
        id={locationsInputId}
        label={t("locationsLabel")}
        hint={t("locationsHint")}
        error={fieldError(fieldErrors, "procurementLocations")}
      >
        {(control) => (
          <div className="flex flex-col gap-2">
            {/* The control props carry `id`/`aria-describedby`/`aria-invalid`;
                without them the label's `htmlFor` points at nothing. */}
            <input
              {...control}
              type="text"
              className={fieldControlClassName}
              placeholder={t("locationsPlaceholder")}
              onKeyDown={chipKeyDown("procurementLocations")}
              disabled={locked}
            />
            {chips("procurementLocations")}
          </div>
        )}
      </FormField>

      <FormField
        id={interestsInputId}
        label={t("interestsLabel")}
        hint={t("interestsHint")}
        error={fieldError(fieldErrors, "projectInterests")}
      >
        {(control) => (
          <div className="flex flex-col gap-2">
            <input
              {...control}
              type="text"
              className={fieldControlClassName}
              placeholder={t("interestsPlaceholder")}
              onKeyDown={chipKeyDown("projectInterests")}
              disabled={locked}
            />
            {chips("projectInterests")}
          </div>
        )}
      </FormField>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("continue")}
        </Button>
      </div>
    </form>
  );
}
