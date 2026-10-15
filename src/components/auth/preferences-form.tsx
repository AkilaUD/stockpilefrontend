"use client";

/*
 * Buyer wizard step 4a — UI/locale preferences (business-flows §2, api.md §2.2).
 * Reads the stored preferences on mount and PATCHes on submit (resumable). The
 * locale passes through to `User.PreferredLocale`; the quote-notification flag
 * defaults to on until the buyer opts out.
 */

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { authApi, resolveErrorCopy, type PreferencesDraft } from "@/lib/api";
import { fieldErrorsToRecord } from "@/lib/validation/auth";

export function PreferencesForm() {
  const t = useTranslations("auth.preferences");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<PreferencesDraft>({ locale: "en", quoteNotificationPrefs: true });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);

  const localeId = useId();

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const prefs = await authApi.getPreferences();
        if (cancelled) return;
        setValues({ locale: prefs.locale, quoteNotificationPrefs: prefs.quoteNotificationPrefs });
      } catch {
        /* Leave the defaults; the server stays the authority. */
      } finally {
        if (!cancelled) setReadSettled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  /** Inert until this step's own read settles — see profile-form for why. */
  const locked = submitting || status === "loading" || (status === "signedIn" && !readSettled);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await authApi.updatePreferences(values, await csrfToken());
      router.push("/wizard/notification-preferences");
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

  return (
    <form noValidate aria-busy={locked} onSubmit={onSubmit} className="flex flex-col gap-6">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <FormField id={localeId} label={t("localeLabel")} error={fieldErrors.locale}>
        {(control) => (
          <select
            {...control}
            className={fieldControlClassName}
            value={values.locale}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setValues((previous) => ({ ...previous, locale: event.target.value }))
            }
            disabled={locked}
          >
            <option value="en">{t("locale.en")}</option>
            <option value="si">{t("locale.si")}</option>
          </select>
        )}
      </FormField>

      <div className="flex items-center gap-3 rounded-sm border border-line p-3">
        <input
          type="checkbox"
          id="quoteNotifications"
          className="h-4 w-4"
          checked={values.quoteNotificationPrefs ?? true}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setValues((previous) => ({ ...previous, quoteNotificationPrefs: event.target.checked }))
          }
          disabled={locked}
        />
        <label htmlFor="quoteNotifications" className="type-body cursor-pointer">
          {t("quoteNotificationsLabel")}
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("continue")}
        </Button>
      </div>
    </form>
  );
}
