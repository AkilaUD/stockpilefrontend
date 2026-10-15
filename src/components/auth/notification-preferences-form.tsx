"use client";

/*
 * Buyer wizard step 4b — per-channel notification preferences (business-flows
 * §2, api.md §2.2). Reads the stored channels on mount and PATCHes on submit;
 * completing this step finishes the wizard and lands the buyer in the workspace.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { authApi, resolveErrorCopy, type NotificationPreferencesDraft } from "@/lib/api";

type ChannelKey = "email" | "sms" | "whatsApp";

const CHANNELS: readonly { key: ChannelKey; labelKey: string }[] = [
  { key: "email", labelKey: "emailLabel" },
  { key: "sms", labelKey: "smsLabel" },
  { key: "whatsApp", labelKey: "whatsappLabel" },
];

export function NotificationPreferencesForm() {
  const t = useTranslations("auth.notificationPreferences");
  const tErrors = useTranslations("errors");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<NotificationPreferencesDraft>({
    email: true,
    sms: false,
    whatsApp: false,
  });
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const prefs = await authApi.getNotificationPreferences();
        if (cancelled) return;
        setValues({ email: prefs.email, sms: prefs.sms, whatsApp: prefs.whatsApp });
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
    setSubmitting(true);
    try {
      await authApi.updateNotificationPreferences(values, await csrfToken());
      router.push("/workspace");
    } catch (error) {
      setBanner(resolveErrorCopy(tErrors, error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate aria-busy={locked} onSubmit={onSubmit} className="flex flex-col gap-4">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <p className="type-body text-ink-muted">{t("description")}</p>

      <div className="flex flex-col gap-3">
        {CHANNELS.map(({ key, labelKey }) => (
          <div key={key} className="flex items-center gap-3 rounded-sm border border-line p-3">
            <input
              type="checkbox"
              id={`notify-${key}`}
              className="h-4 w-4"
              checked={values[key] ?? false}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setValues((previous) => ({ ...previous, [key]: event.target.checked }))
              }
              disabled={locked}
            />
            <label htmlFor={`notify-${key}`} className="type-body flex-1 cursor-pointer">
              {t(labelKey)}
            </label>
          </div>
        ))}
      </div>

      <p className="type-body-sm text-ink-muted">{t("whatsappNote")}</p>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={locked}>
          {submitting ? t("completing") : t("completeSetup")}
        </Button>
      </div>
    </form>
  );
}
