import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryDetail, getCategoryTree } from "@/lib/api/catalogue-server";
import type { CategoryDetailResponse, CategoryNode } from "@/lib/api/catalogue";
import { ApiClientError } from "@/lib/api/envelope";
import { categoryHref } from "@/lib/navigation/navigation";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getCategoryDetail(slug);
    return { title: detail.category.name };
  } catch {
    return { title: "Category" };
  }
}

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const pageValue = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number.parseInt(pageValue ?? "1", 10) || 1);

  let detail: CategoryDetailResponse;
  try {
    detail = await getCategoryDetail(slug, page);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const t = await getTranslations({ locale, namespace: "catalogue.category" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const tListing = await getTranslations({ locale, namespace: "catalogue.listing" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const category = detail.category;
  const childCount = category.children.length;
  const totalPages = Math.max(1, Math.ceil(detail.totalProducts / 24));

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const tree = await getCategoryTree();
  const nodeBySlug = new Map<string, CategoryNode>();
  const collect = (nodes: CategoryNode[]): void => {
    for (const node of nodes) {
      nodeBySlug.set(node.slug, node);
      collect(node.children);
    }
  };
  collect(tree);
  const ancestors: Array<{ slug: string; name: string }> = [];
  let cursor: string | null | undefined = category.parentSlug;
  while (cursor) {
    const node = nodeBySlug.get(cursor);
    if (!node) break;
    ancestors.unshift({ slug: node.slug, name: node.name });
    cursor = node.parentSlug;
  }

  const crumbs = [
    { label: tListing("title"), href: "/products" },
    ...ancestors.map((ancestor) => ({ label: ancestor.name, href: categoryHref(ancestor.slug) })),
    { label: category.name },
  ];

  return (
    <CatalogueShell
      crumbs={crumbs}
      title={category.name}
      lede={t("products", { count: detail.totalProducts })}
      aside={
        <ButtonLink href={`/products?category=${encodeURIComponent(slug)}`} variant="secondary" size="sm">
          {tProduct("viewAllInCategory", { category: category.name })}
        </ButtonLink>
      }
    >
      {childCount > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">{t("subcategories")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={categoryHref(child.slug)}
                  className="type-meta inline-block rounded-full border border-line px-3 py-1.5 text-ink-muted transition-colors duration-instant ease-standard hover:border-line-strong hover:text-ink"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.products.length > 0 ? (
        <Reveal className="catalogue-grid gap-3 md:gap-4">
          {detail.products.map((item) => (
            <ProductCard
              key={item.publicId}
              item={item}
              locale={locale}
              priceOnRequest={tProduct("priceOnRequest")}
              minOrderLabel={
                item.minOrderQuantity != null ? tProduct("minOrder", { quantity: item.minOrderQuantity }) : undefined
              }
              stockLabel={stockLabel}
            />
          ))}
        </Reveal>
      ) : (
        <p className="type-body text-ink-muted">{t("products", { count: 0 })}</p>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            page={page}
            pageSize={24}
            total={detail.totalProducts}
            basePath={categoryHref(slug)}
            labels={{
              previous: tPager("previous"),
              next: tPager("next"),
              pageAria: (p) => tPager("pageAria", { page: p }),
            }}
          />
        </div>
      )}
    </CatalogueShell>
  );
}
