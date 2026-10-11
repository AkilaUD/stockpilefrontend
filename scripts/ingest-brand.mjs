#!/usr/bin/env node
/**
 * Brand asset ingest — implementation-plan Phase 1, image-asset-plan §2/§3.
 *
 * Downloads the Stockpile.lk brand assets the design system needs (logo,
 * favicon), validates them, and writes:
 *
 *   .storage/originals/<aa>/<bb>/<sha256>.<ext>   content-addressed original
 *   .storage/provenance/<sha256>.json             audit sidecar (§32)
 *   frontend/public/…                             served first-party copy
 *   frontend/src/app/favicon.ico                  Next's icon entry point
 *
 * Recolouring the logo into the documented design-system §14 variants happens
 * here as well; see LOGO_DERIVATIVES for why the source art needs it.
 *
 * This is deliberately NOT a site mirror. It fetches only the assets listed in
 * BRAND_ASSETS below, which is the "scope rule" in image-asset-plan §2: no
 * bulk crawler, no recursion, no user-account media.
 *
 * Validation mirrors the real upload path (image-asset-plan §3.2) so there is
 * one set of rules rather than a trusted-internal one:
 *   protocol http/https · host allowlist · size cap · redirect cap
 *   · magic-byte sniff · extension/type agreement · SHA-256
 *
 * Usage:  node scripts/ingest-brand.mjs [--force]
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const STORAGE = path.join(REPO_ROOT, ".storage");
const PUBLIC_DIR = path.join(REPO_ROOT, "frontend", "public");

/** Hosts this tool is permitted to fetch from (image-asset-plan §3.2 SSRF guard). */
const ALLOWED_HOSTS = new Set(["stockpile.lk", "www.stockpile.lk"]);

const SIZE_CAP_BYTES = 25 * 1024 * 1024;
const REDIRECT_CAP = 3;
const TIMEOUT_MS = 30_000;

const USER_AGENT = "StockpileIngest/1.0 (+https://stockpile.lk; asset provenance capture)";

const PROVENANCE_AUTHORISATION =
  "Platform media library; supplier media reuse authorised by platform owner";
const PROVENANCE_LICENSE = "Proprietary — platform/supplier owned, not for redistribution";

/**
 * image-asset-plan §2. `out` is where the frontend needs a stable path.
 * Adding a row here is the only way this tool will ever fetch anything.
 */
const BRAND_ASSETS = [
  {
    key: "logo",
    url: "https://stockpile.lk/media/logo/default/Stockpile_Logo_DarkYellow.png",
    out: "brand/stockpile-logo-yellow.png",
  },
  {
    key: "favicon-png",
    url: "https://stockpile.lk/media/favicon/default/favicon6.png",
    out: "favicon.png",
  },
  {
    key: "favicon-ico",
    url: "https://stockpile.lk/favicon.ico",
    out: "brand/stockpile-favicon.ico",
    appFavicon: true,
  },
];

/**
 * The source logo is a single-hue (yellow, `#F4D20F`) wordmark on transparency
 * — verified against the live site, where it sits on an `rgb(2,2,2)` header.
 * It is therefore a dark-ground mark and is unusable on our light paper
 * surface without recolouring (contrast ≈1.45:1).
 *
 * These are the documented variants of design-system §14, produced losslessly
 * by keeping the original alpha channel and replacing only RGB — the artwork
 * is monochrome, so nothing but hue changes. Each derivative gets its own
 * provenance record with `derivedFrom` pointing at the source hash (§32).
 */
const LOGO_DERIVATIVES = [
  {
    key: "logo-ink",
    out: "brand/stockpile-logo-ink.png",
    rgb: [0x14, 0x16, 0x1a],
    note: "#14161a — light grounds; retained variant (design-system §14)",
  },
  {
    key: "logo-white",
    out: "brand/stockpile-logo-white.png",
    rgb: [0xff, 0xff, 0xff],
    note: "knockout white — saturated or photographic grounds where ink fails (§14)",
  },
];

// --- magic bytes ------------------------------------------------------------

const SIGNATURES = [
  { ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: "ico", bytes: [0x00, 0x00, 0x01, 0x00] },
  { ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

function sniff(buffer) {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => buffer[i] === b)) {
      if (sig.ext === "webp") {
        return buffer.subarray(8, 12).toString("ascii") === "WEBP" ? "webp" : null;
      }
      return sig.ext;
    }
  }
  return null;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

// --- fetch ------------------------------------------------------------------

async function fetchBuffer(urlString) {
  const url = new URL(urlString);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`refusing non-HTTP(S) protocol: ${url.protocol}`);
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`host not on allowlist: ${url.hostname}`);
  }

  let current = url;
  for (let hop = 0; hop <= REDIRECT_CAP; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": USER_AGENT, accept: "image/*,*/*;q=0.8" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`${current} redirected without location`);
      current = new URL(location, current);
      if (!ALLOWED_HOSTS.has(current.hostname)) {
        throw new Error(`redirect left allowlist: ${current.hostname}`);
      }
      continue;
    }

    if (!response.ok) {
      throw new Error(`${current} responded ${response.status}`);
    }

    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > SIZE_CAP_BYTES) {
      throw new Error(`content-length ${declared} exceeds cap`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > SIZE_CAP_BYTES) {
      throw new Error(`body ${bytes.length} exceeds cap`);
    }
    if (bytes.length === 0) {
      throw new Error("empty body");
    }
    return bytes;
  }

  throw new Error(`exceeded ${REDIRECT_CAP} redirects`);
}

// --- store ------------------------------------------------------------------

async function writeContentAddressed(buffer, ext) {
  const hash = sha256(buffer);
  const dir = path.join(STORAGE, "originals", hash.slice(0, 2), hash.slice(2, 4));
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${hash}.${ext}`);
  await writeFile(file, buffer);
  return { hash, file };
}

async function writeProvenance(record) {
  const dir = path.join(STORAGE, "provenance");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${record.sha256}.json`), `${JSON.stringify(record, null, 2)}\n`);
}

// --- derivatives ------------------------------------------------------------

async function loadPngBuffer(file) {
  return readFile(file);
}

async function recolour(file, [r, g, b]) {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(await loadPngBuffer(file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Replace RGB only. Alpha carries every antialiased edge, so the glyph shapes
  // are byte-for-byte the designer's — only the ink colour changes.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
}

async function deriveLogo(source) {
  const results = [];

  for (const variant of LOGO_DERIVATIVES) {
    const buffer = await recolour(source.file, variant.rgb);
    const hash = sha256(buffer);

    const dir = path.join(STORAGE, "originals", hash.slice(0, 2), hash.slice(2, 4));
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${hash}.png`);
    await writeFile(file, buffer);

    await writeProvenance({
      assetKey: variant.key,
      provenanceSourceUrl: source.url,
      provenanceRetrievedAt: new Date().toISOString(),
      provenanceAuthorisation: PROVENANCE_AUTHORISATION,
      provenanceLicense: PROVENANCE_LICENSE,
      sha256: hash,
      derivedFrom: source.hash,
      derivation: `RGB replaced with ${variant.note}; original alpha preserved`,
      contentType: "image/png",
      byteLength: buffer.length,
      detectedType: "png",
      storagePath: path.relative(REPO_ROOT, file).split(path.sep).join("/"),
    });

    const target = path.join(PUBLIC_DIR, variant.out);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);

    results.push({
      key: variant.key,
      sha256: hash,
      derivedFrom: source.hash,
      bytes: buffer.length,
      served: path.relative(REPO_ROOT, target).split(path.sep).join("/"),
    });

    process.stdout.write(`  ✓ ${variant.key}  ${variant.out}  sha256:${hash.slice(0, 12)}…\n`);
  }

  return results;
}

// --- main -------------------------------------------------------------------

async function main() {
  const force = process.argv.includes("--force");
  const results = [];

  for (const asset of BRAND_ASSETS) {
    process.stdout.write(`→ ${asset.key}  ${asset.url}\n`);

    const buffer = await fetchBuffer(asset.url);

    // Extension must agree with what the bytes actually are — a `.png` URL
    // serving HTML is the classic stored-XSS vector (§13.8).
    const detected = sniff(buffer);
    if (!detected) {
      throw new Error(`${asset.key}: unrecognised file signature`);
    }

    const hash = sha256(buffer);
    const stored = await writeContentAddressed(buffer, detected);

    const provenance = {
      assetKey: asset.key,
      provenanceSourceUrl: asset.url,
      provenanceRetrievedAt: new Date().toISOString(),
      provenanceAuthorisation: PROVENANCE_AUTHORISATION,
      provenanceLicense: PROVENANCE_LICENSE,
      sha256: hash,
      originalFileName: path.basename(new URL(asset.url).pathname),
      contentType: `image/${detected === "jpg" ? "jpeg" : detected}`,
      byteLength: buffer.length,
      detectedType: detected,
      storagePath: path.relative(REPO_ROOT, stored.file).split(path.sep).join("/"),
    };
    await writeProvenance(provenance);

    const target = path.join(PUBLIC_DIR, asset.out);
    await mkdir(path.dirname(target), { recursive: true });
    if (force) await rm(target, { force: true });
    await writeFile(target, buffer);

    let dimensions = null;
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buffer).metadata();
      dimensions = { width: meta.width, height: meta.height, format: meta.format };
    } catch (err) {
      process.stdout.write(`  ! sharp unavailable for dimensions: ${err.message}\n`);
    }

    results.push({
      key: asset.key,
      sha256: hash,
      url: asset.url,
      file: stored.file,
      bytes: buffer.length,
      type: detected,
      dimensions,
      served: path.relative(REPO_ROOT, target).split(path.sep).join("/"),
    });

    // Next.js only injects a `<link rel="icon">` from `app/favicon.ico`, and it
    // must sit beside the root layout (which lives under `[locale]`).
    if (asset.appFavicon) {
      const appIcon = path.join(REPO_ROOT, "frontend", "src", "app", "favicon.ico");
      await mkdir(path.dirname(appIcon), { recursive: true });
      await writeFile(appIcon, buffer);
      process.stdout.write(`  ✓ app favicon → src/app/favicon.ico\n`);
    }

    process.stdout.write(
      `  ✓ ${detected} ${buffer.length} B  sha256:${hash.slice(0, 12)}…` +
        `${dimensions ? `  ${dimensions.width}×${dimensions.height}` : ""}\n`,
    );
  }

  const logoSource = results.find((r) => r.key === "logo");
  if (logoSource) {
    results.push(...(await deriveLogo(logoSource)));
  }

  const manifestPath = path.join(STORAGE, "provenance", "brand-manifest.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), assets: results }, null, 2)}\n`,
  );

  process.stdout.write(
    `\nWrote ${results.length} asset(s). Manifest: ${path.relative(REPO_ROOT, manifestPath)}\n`,
  );
  // Fail loudly if a sidecar went missing — provenance is mandatory (§32).
  for (const r of results) {
    const sidecar = path.join(STORAGE, "provenance", `${r.sha256}.json`);
    await readFile(sidecar, "utf8");
  }
}

main().catch((err) => {
  process.stderr.write(`\nasset ingest failed: ${err.message}\n`);
  process.exitCode = 1;
});
