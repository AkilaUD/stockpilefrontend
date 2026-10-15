import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // security-test-matrix I8/X11: HTML injection may only ever be rendered
    // through the sanitized renderer. `dangerouslySetInnerHTML` is a hard lint
    // failure everywhere else, so a raw-HTML render cannot land quietly — and
    // that is exactly the scope this override hands to the sanctioned path,
    // `src/components/ui/sanitized-html.tsx`. That component is safe because
    // `src/lib/html/sanitize-article-html.ts` renders a body only when every tag
    // is allow-listed, none carries an attribute, and no `<` survives outside
    // those tags (otherwise it escapes the whole body to text); its classifier
    // is proven by `tests/e2e/sanitized-html.spec.ts`.
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
  {
    files: ["src/components/ui/sanitized-html.tsx"],
    rules: {
      "no-restricted-syntax": "off",
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
