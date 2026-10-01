import { readdirSync } from "node:fs";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const parentImport = {
  regex: "^\\.\\./",
  message: "Import through the @/ alias so the layer rules can see the target.",
};

const noProcessEnv = {
  object: "process",
  property: "env",
  message:
    'Read configuration in one module that starts with `import "server-only"`, then exempt only that file from this rule.',
};

const features = readdirSync("src/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [parentImport] }],
      "no-restricted-properties": ["error", noProcessEnv],
    },
  },
  {
    files: ["src/lib/**", "src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            parentImport,
            {
              regex: "^@/(features|app)(/|$)",
              message: "Shared code in lib and components must not depend on a feature or a route.",
            },
          ],
        },
      ],
    },
  },
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            parentImport,
            {
              regex: `^@/(app(/|$)|features/(?!${feature}(/|$)))`,
              message:
                "A feature must not import a route or another feature. Move shared code to src/lib or src/components.",
            },
          ],
        },
      ],
    },
  })),
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
