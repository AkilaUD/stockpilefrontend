#!/usr/bin/env node
/**
 * Bundle budget check (implementation-plan 1.9 / design-system §11, spec §38):
 *
 *   - public routes:    first-load JS ≤ 200 KB gzip
 *   - workspace routes: first-load JS ≤ 275 KB gzip
 *   - GSAP must never appear in a workspace route's bundle
 *
 * Calibration (measured, not guessed): an EMPTY public route on Next 16.3.8
 * costs 153.8 KB gzip of first-load JS — React + the Next client runtime +
 * next-intl + next/image, none of it reducible by our code. The public budget
 * is that floor plus headroom for route code and GSAP (permitted on public
 * pages, §38); the workspace floor adds React Query, tables, forms, and Radix.
 * A budget below the floor would fail forever with no action available, which
 * is how budgets get ignored. The spec's hard performance requirement is
 * LCP < 2.5 s (§38) — these budgets are regression tripwires behind it.
 *
 * Reads the manifests `next build` already writes (no extra tooling):
 *   - .next/diagnostics/route-bundle-stats.json — per-route first-load chunks
 *   - .next/app-path-routes-manifest.json      — route key → path, where the
 *     key still contains the route group, e.g. "/[locale]/(public)/page"
 *
 * Routes without a route group (API handlers, _not-found, favicon) are not
 * budgeted — they are not pages a user loads — but they are printed so the
 * output always accounts for every route.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextRoot = path.join(frontendRoot, ".next");

const BUDGETS_BYTES = {
  // Public register: marketing + auth shells (auth pages are public routes —
  // they sit in their own group but draw from the same 200 KB pool).
  public: 200 * 1024,
  auth: 200 * 1024,
  // Private register: the buyer workspace, supplier desk and admin groups all
  // get the workspace allowance (React Query, tables, forms, Radix, §11).
  workspace: 275 * 1024,
  supplier: 275 * 1024,
  admin: 275 * 1024,
};

/** The private groups GSAP must never appear in (design-system §38). */
const PRIVATE_GROUPS = new Set(["workspace", "supplier", "admin"]);

/** Byte signatures that only appear in bundled GSAP code. */
const GSAP_MARKERS = ["_gsap", "ScrollTrigger", "greensock"];

function fail(message) {
  console.error(`bundle-budget: ${message}`);
  process.exit(2);
}

function readJson(relativePath) {
  const absolute = path.join(nextRoot, relativePath);
  if (!fs.existsSync(absolute)) {
    fail(`${relativePath} not found — run \`npm run build\` first.`);
  }
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

function gzipSize(absolutePath) {
  return zlib.gzipSync(fs.readFileSync(absolutePath), { level: 9 }).length;
}

function groupOf(routeKey) {
  const groups = [...routeKey.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const distinct = [...new Set(groups)];
  if (distinct.length > 1) {
    fail(`route key "${routeKey}" spans multiple route groups: ${distinct.join(", ")}`);
  }
  return distinct[0] ?? null;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const stats = readJson(path.join("diagnostics", "route-bundle-stats.json"));
const routeKeyToPath = readJson("app-path-routes-manifest.json");

// Route path → the manifest key that still carries the route group.
const pathToKey = new Map();
for (const [key, routePath] of Object.entries(routeKeyToPath)) {
  pathToKey.set(routePath, key);
}

const violations = [];
const rows = [];
const workspaceChunkFiles = new Set();

for (const entry of stats) {
  const routeKey = pathToKey.get(entry.route);
  if (!routeKey) {
    fail(`route "${entry.route}" missing from app-path-routes-manifest.json`);
  }

  const group = groupOf(routeKey);
  if (!group) {
    rows.push({ route: entry.route, group: "—", gzip: null, budget: null });
    continue;
  }
  if (!(group in BUDGETS_BYTES)) {
    fail(
      `route "${entry.route}" sits in unknown route group "${group}" — ` +
        "classify it in BUDGETS_BYTES so its budget is an explicit decision.",
    );
  }

  const budget = BUDGETS_BYTES[group];
  let total = 0;
  const missing = [];

  for (const chunk of entry.firstLoadChunkPaths) {
    // Manifest paths are relative to the frontend directory and may use
    // either separator depending on the build host.
    const absolute = path.join(frontendRoot, chunk.replace(/\\/g, "/"));
    if (!fs.existsSync(absolute)) {
      missing.push(chunk);
      continue;
    }
    total += gzipSize(absolute);
    if (PRIVATE_GROUPS.has(group)) {
      workspaceChunkFiles.add(absolute);
    }
  }

  if (missing.length > 0) {
    fail(`stale manifest for "${entry.route}" — missing chunks: ${missing.join(", ")}. Rebuild.`);
  }

  rows.push({ route: entry.route, group, gzip: total, budget });
  if (total > budget) {
    violations.push(
      `${entry.route} (${group}) is ${kb(total)} gzip, over the ${kb(budget)} budget by ${kb(total - budget)}`,
    );
  }
}

// ---- GSAP containment -----------------------------------------------------
const gsapHits = [];
for (const file of workspaceChunkFiles) {
  const content = fs.readFileSync(file, "latin1");
  for (const marker of GSAP_MARKERS) {
    if (content.includes(marker)) {
      gsapHits.push(`${path.relative(frontendRoot, file)} contains "${marker}"`);
    }
  }
}

// ---- Report ---------------------------------------------------------------
const width = Math.max(...rows.map((row) => row.route.length), "route".length);
console.log("route".padEnd(width), "  group     gzip       budget");
for (const row of rows) {
  const gzip = row.gzip === null ? "—" : kb(row.gzip);
  const budget = row.budget === null ? "unbudgeted" : kb(row.budget);
  const over = row.gzip !== null && row.gzip > row.budget ? "  ← OVER" : "";
  console.log(
    row.route.padEnd(width),
    `  ${row.group.padEnd(8)}  ${gzip.padEnd(9)}  ${budget}${over}`,
  );
}

console.log(`\nGSAP in private-area chunks (workspace/supplier/admin): ${gsapHits.length === 0 ? "clean" : "FOUND"}`);
for (const hit of gsapHits) {
  console.log(`  ${hit}`);
}

if (violations.length > 0 || gsapHits.length > 0) {
  console.error("");
  for (const violation of violations) {
    console.error(`bundle-budget: VIOLATION ${violation}`);
  }
  for (const hit of gsapHits) {
    console.error(`bundle-budget: VIOLATION ${hit}`);
  }
  process.exit(1);
}

console.log("bundle-budget: all routes within budget.");
