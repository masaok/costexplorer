import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
      reporter: ["text"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
