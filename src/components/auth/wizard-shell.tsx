import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";

/**
 * The buyer registration wizard's step rail (business-flows §2). Every step is
 * an independent, resumable call against its own endpoint, so the rail is plain
 * navigation: a buyer can leave and re-enter any step, in any order, and each
 * form re-reads what the backend already holds. No client state, no progress
 * stored client-side — the pages themselves are the record.
 */

export type WizardStepKey = "profile" | "organization" | "preferences" | "notification-preferences";

const STEPS: readonly { key: WizardStepKey; href: string; labelKey: string }[] = [
  { key: "profile", href: "/wizard/profile", labelKey: "profile" },
  { key: "organization", href: "/wizard/organization", labelKey: "organization" },
  { key: "preferences", href: "/wizard/preferences", labelKey: "preferences" },
  { key: "notification-preferences", href: "/wizard/notification-preferences", labelKey: "notificationPreferences" },
];

export async function WizardShell({ current }: { current: WizardStepKey }) {
  const t = await getTranslations("auth.wizard");
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <nav aria-label={t("stepsLabel")} className="mb-8">
      <p className="type-meta text-ink-muted mb-3">
        {t("stepOf", { current: currentIndex + 1, total: STEPS.length })}
      </p>
      <ol className="flex flex-wrap gap-x-4 gap-y-2">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cx(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                  isCurrent && "border-brand-primary bg-brand-primary text-ink-on-signal",
                  isDone && "border-brand-primary text-brand-primary",
                  !isCurrent && !isDone && "border-line text-ink-muted",
                )}
              >
                {index + 1}
              </span>
              <Link
                href={step.href}
                aria-current={isCurrent ? "step" : undefined}
                className={cx(
                  "type-body-sm underline-offset-4 hover:underline",
                  isCurrent ? "font-semibold text-ink" : "text-ink-muted",
                )}
              >
                {t(`steps.${step.labelKey}`)}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
