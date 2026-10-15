import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SupplierStoryStrip } from "./supplier-story-strip";
import type { SupplierDirectoryItem } from "@/lib/api/catalogue";

/*
 * NewestSuppliers — the home supplier roster (reference reconstruction
 * Phase 2 §4.4; the original shows a logo carousel — this build has no
 * supplier logos to show, so the honest equivalent is the directory's own
 * order and labels via SupplierStoryStrip).
 *
 * The directory API returns suppliers in registration order (no join-date
 * field to sort by client-side), so "newest" is the API's list head —
 * documented dependency: supplier.logo surfacing would restore the reference
 * carousel look.
 */
interface NewestSuppliersProps {
  suppliers: SupplierDirectoryItem[];
  /** How many rows to render from the head of the list. */
  limit: number;
}

export async function NewestSuppliers({ suppliers, limit }: NewestSuppliersProps) {
  const t = await getTranslations("home.newestSuppliers");

  if (suppliers.length === 0) return null;

  return (
    <section className="shell-public pb-[30px]">
      <div className="px-5 py-[5px]">
        <h2 className="font-body text-2xl leading-8 font-medium text-ink">
          <Link
            href="/suppliers"
            className="transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("title")}
          </Link>
        </h2>
      </div>
      <div className="mt-[5px] px-5">
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
          }))}
        />
      </div>
    </section>
  );
}