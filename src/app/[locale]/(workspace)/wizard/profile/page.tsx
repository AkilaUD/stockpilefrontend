import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WizardShell } from "@/components/auth/wizard-shell";
import { ProfileForm } from "@/components/auth/profile-form";

/** Buyer wizard step 2 — the professional profile (business-flows §2, api.md §2.2). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.wizard.profile" });
  return { title: t("title") };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.wizard.profile");

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="type-body text-ink-muted mt-2">{t("description")}</p>
        </header>
        <WizardShell current="profile" />
        <ProfileForm />
      </div>
    </div>
  );
}
