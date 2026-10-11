import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // security-test-matrix I8/X11: HTML injection may only ever be rendered
    // through the sanitized renderer (none exists in Phase 1 — the guard
    // ships ahead of it, like the design-qa source rules). `dangerouslySetInnerHTML`
    // is a hard lint failure in CI, so a raw-HTML render cannot land quietly;
    // the sanctioned path replaces this rule's scope when the sanitized
    // renderer arrives.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is forbidden (security-test-matrix I8/X11); render through the sanitized renderer instead.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
