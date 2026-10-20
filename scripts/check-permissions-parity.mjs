#!/usr/bin/env node
/** Parity check: frontend Permissions codes == backend Permissions.cs codes. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backend = resolve(here, "../../backend/src/Stockpile.Contracts/Permissions/Permissions.cs");
const frontend = resolve(here, "../src/lib/auth/permissions.ts");

const backendCodes = new Set(
  [...readFileSync(backend, "utf8").matchAll(/public const string \w+ = "([^"]+)";/g)].map((m) => m[1]),
);
const frontendCodes = new Set(
  [...readFileSync(frontend, "utf8").matchAll(/: "([a-z][a-zA-Z.]+)"/g)].map((m) => m[1]),
);

const missing = [...backendCodes].filter((c) => !frontendCodes.has(c));
const extra = [...frontendCodes].filter((c) => !backendCodes.has(c));
if (missing.length || extra.length) {
  console.error(`Permission parity FAILED. Missing in frontend: ${missing.join(", ") || "-"}; extra: ${extra.join(", ") || "-"}`);
  process.exit(1);
}
console.log(`Permission parity OK (${backendCodes.size} codes).`);
