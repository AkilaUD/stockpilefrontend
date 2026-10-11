/*
 * Redirect SWC's native-binding cache before anything can load `@swc/core`.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * `next-intl/plugin` does `require('@swc/core')` at module scope, and loading
 * the SWC addon runs a hardening check in its initializer: the cache directory
 * *and every ancestor up to the volume root* must not grant write access to
 * untrusted principals. If they do, the addon refuses to load and every
 * `next build` / `next dev` dies with ERR_SWC_NATIVE_CACHE.
 *
 * On this machine two legitimate security controls make both default
 * locations unusable:
 *
 *   - `%LOCALAPPDATA%\swc` is rejected because a Codex-sandbox AppContainer
 *     SID (S-1-15-2-...) inherited `FullControl` onto `%LOCALAPPDATA%`.
 *     Fixing that would mean editing the ACL of `%LOCALAPPDATA%` itself, which
 *     is shared by every application on the machine — not ours to touch.
 *   - Anywhere on `D:\` is rejected because `D:\` grants `Authenticated Users`
 *     `Modify`, which is exactly the "someone else can replace the binary"
 *     condition SWC is designed to refuse.
 *
 * `~/.cache/stockpile-swc` sits under the user profile, whose ancestor chain
 * (profile -> Users -> C:\) grants only read/execute to everyone but the owner.
 * Nothing outside this project is modified: the directory is created by SWC
 * itself on first use.
 *
 * WHY IT IS A SIDE-EFFECT IMPORT
 * ------------------------------
 * ESM imports are hoisted, so a plain statement at the top of next.config.ts
 * would *not* reliably run before `import 'next-intl/plugin'`. Import order,
 * however, is always preserved. Putting this import first guarantees it wins
 * the race regardless of whether the config is transpiled or bundled.
 *
 * `??=` keeps an explicitly exported value — CI can still override it.
 */
/* eslint-disable @typescript-eslint/no-require-imports --
   This file is deliberately CommonJS: it is evaluated as a plain script by the
   config loader, before any TypeScript/ESM transform runs. `import` syntax here
   would be a syntax error in that context, so the rule is not applicable. */
const { homedir } = require("node:os");
const { join } = require("node:path");

process.env.SWC_NATIVE_BINDING_CACHE ??= join(homedir(), ".cache", "stockpile-swc");

module.exports = {};
