/*
 * Boots the production artifact — the `output: standalone` server.js — the
 * same run mode the deployment (stockpile.runasp.net) uses.
 *
 * Why not `next start`? The build is `output: "standalone"` (next.config.ts)
 * and Next explicitly does not support `next start` for such a build (it
 * prints the warning itself and can abort in-flight RSC streams). The
 * standalone server is the supported run mode and the one CI/e2e should
 * exercise.
 *
 * server.js does not self-provision `public`/`.next/static` (the standalone
 * trace keeps them out), so this launcher stages `.next/static` into the
 * standalone tree first — the documented manual copy step — then hands over
 * to server.js. `API_ORIGIN` must be present in the environment: the
 * standalone server does not load .env files (development / `next dev` do;
 * this run mode does not). Defaults to the local Kestrel origin for e2e.
 */
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const standalone = path.join(frontendRoot, ".next", "standalone");
const staticSrc = path.join(frontendRoot, ".next", "static");
const staticDst = path.join(standalone, ".next", "static");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("standalone-serve: no .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDst, { recursive: true, force: true });
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    API_ORIGIN: process.env.API_ORIGIN ?? "http://localhost:5080",
  },
});

child.on("error", (err) => {
  console.error(`standalone-serve: failed to start server.js — ${err.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));