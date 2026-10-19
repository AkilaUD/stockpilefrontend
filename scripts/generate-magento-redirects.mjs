/*
 * Build Magento .html → canonical path map from the catalogue seed pack.
 * Output: src/lib/seo/magento-html-redirects.json
 *   { "bathrooms/accessories.html": "/categories/bathrooms%2Faccessories",
 *     "some-product.html": "/products/some-product" }
 *
 * Consumed by src/proxy.ts for permanent (308) redirects.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..", "..");
const cataloguePath = path.join(root, "tools", "catalogue-migrate", "out", "catalogue.json");
const outDir = path.join(import.meta.dirname, "..", "src", "lib", "seo");
const outPath = path.join(outDir, "magento-html-redirects.json");

const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
/** @type {Record<string, string>} */
const map = {};

for (const category of catalogue.categories ?? []) {
  if (!category.path) continue;
  const key = `${category.path}.html`;
  map[key] = `/categories/${encodeURIComponent(category.path)}`;
}

for (const product of catalogue.products ?? []) {
  if (!product.slug) continue;
  const key = `${product.slug}.html`;
  // Categories win on collision (root dept pages vs product slug clash).
  if (map[key]) continue;
  map[key] = `/products/${encodeURIComponent(product.slug)}`;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(map) + "\n");
console.log(
  JSON.stringify(
    {
      entries: Object.keys(map).length,
      categories: (catalogue.categories ?? []).length,
      products: (catalogue.products ?? []).length,
      out: outPath,
    },
    null,
    2,
  ),
);
