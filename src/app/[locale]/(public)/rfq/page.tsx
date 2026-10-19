import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";
import { RfqForm, type DepartmentOption, type UnitOption } from "@/components/procurement/rfq-form";
import { getCategoryTree, getUnits } from "@/lib/api/catalogue-server";
import { sortDepartments } from "@/lib/navigation/navigation";

/*
 * /rfq — the real Request For Quote submission surface (business-flows §3.8,
 * api.md §2.6). The reference site's quotations page pointed at an email
 * address because no RFQ endpoint existed; it does now, so this page is the
 * destination its CTA always wanted.
 *
 * The department and unit choices are read on the server from the live
 * catalogue and handed to the client form as plain props; a failed read
 * degrades to an empty list rather than taking the page down (the same
 * containment the masthead applies — B14), and the API is the authority on
 * which slugs and codes exist anyway.
 *
 * Sign-in is not enforced here (the group guard is a cookie-presence check in
 * proxy.ts and this route is public): the form itself decides between the
 * sign-in prompt and the RFQ fields, and the API is the real gate — every
 * submit carries the session cookie and is authorized server-side (§0.9).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq" });
  return { title: t("title"), description: t("lede") };
}

export default async function RfqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq");

  let departments: DepartmentOption[] = [];
  try {
    const tree = await getCategoryTree();
    departments = sortDepartments(tree).map((node) => ({
      slug: node.slug,
      name: locale === "si" && node.nameSi ? node.nameSi : node.name,
    }));
  } catch (error) {
    console.error("[rfq] category tree read failed; rendering without departments:", error);
  }

  let units: UnitOption[] = [];
  try {
    units = (await getUnits()).map((unit) => ({ code: unit.code, name: unit.name }));
  } catch (error) {
    console.error("[rfq] unit read failed; rendering without units:", error);
  }

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="measure-editorial">
        <p className="type-body text-ink-muted">{t("lede")}</p>
      </div>
      <div className="measure-editorial mt-8">
        <RfqForm departments={departments} units={units} />
      </div>
    </InfoPage>
  );
}
