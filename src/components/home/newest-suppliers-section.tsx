import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SupplierStoryStrip } from "./supplier-story-strip";
import type { SupplierDirectoryItem } from "@/lib/api/catalogue";

interface NewestSuppliersProps {
  suppliers: SupplierDirectoryItem[];
  limit: number;
}

export async function NewestSuppliers({ suppliers, limit }: NewestSuppliersProps) {
  const t = await getTranslations("home.newestSuppliers");

  if (suppliers.length === 0) return null;

  return (
    <section className="shell-public border-b border-line py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          <Link
            href="/suppliers"
            className="transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("title")}
          </Link>
        </h2>
        <Link
          href="/suppliers"
          className="type-body-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("viewAll")}
        </Link>
      </div>
      <div className="mt-8">
        <SupplierStoryStrip
          suppliers={suppliers.slice(0, limit).map((s) => ({
            slug: s.slug,
            name: s.name,
            district: s.district,
            productCount: s.productCount,
            verified: s.verified,
            verifiedLabel: t("verified"),
            unverifiedLabel: t("unverified"),
            productsLabel: t("products"),
            logoSrcset: s.logo?.srcset,
            logoAlt: s.logo?.alt ?? s.name,
          }))}
        />
      </div>
    </section>
  );
}
