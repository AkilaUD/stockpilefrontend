import { useTranslations } from "next-intl";

/*
 * PasswordStrength — a truthful meter, not a copy of the messages files'
 * earlier composition rule. Threat-model §4 is explicit that the enforced
 * policy is length-only ("≥ 10 chars, no composition theatre"), so the meter
 * grades LENGTH and nothing else:
 *
 *   < 10  Weak    — below the enforced minimum (the rule the form rejects)
 *   10–11 Fair    — meets the minimum, shorter end
 *   12–15 Good    — comfortably past the minimum
 *   ≥ 16  Strong  — generous headroom
 *
 * The label is announced via role="meter" (colour is never the only signal,
 * §10); the bar is decorative. This file is rendered only from inside client
 * forms, so no `"use client"` directive is needed — it inherits the client
 * tree — and it holds no state.
 */

export function passwordStrengthLevel(password: string): 0 | 1 | 2 | 3 | 4 {
  const length = password.length;
  if (length === 0) return 0;
  if (length < 10) return 1;
  if (length < 12) return 2;
  if (length < 16) return 3;
  return 4;
}

const LEVEL_LABEL_KEYS = ["weak", "fair", "good", "strong"] as const;

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations("auth.strength");
  const level = passwordStrengthLevel(password);
  if (level === 0) return null;

  const labelKey = LEVEL_LABEL_KEYS[level - 1];

  return (
    <div className="flex items-center gap-3">
      <div
        role="meter"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={level}
        aria-label={`${t("label")}: ${t(labelKey)}`}
        className="flex h-1.5 flex-1 gap-1"
      >
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={
              step <= level ? "bg-brand-primary flex-1 rounded-full" : "bg-line flex-1 rounded-full"
            }
          />
        ))}
      </div>
      <span className="type-meta w-16 shrink-0 text-ink-muted">{t(labelKey)}</span>
    </div>
  );
}