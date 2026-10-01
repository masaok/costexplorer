import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

async function ruleIds(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

test("a feature may import shared code and its own files", async () => {
  const code = 'import "@/lib/site";\nimport "@/components/logo-mark";\nimport "./copy-command";\n';
  assert.deepEqual(await ruleIds("src/features/home/example.ts", code), []);
});

test("a feature may not import another feature or a route", async () => {
  const code = 'import "@/features/pricing/plans";\nimport "@/app/layout";\n';
  assert.deepEqual(await ruleIds("src/features/home/example.ts", code), [
    "no-restricted-imports",
    "no-restricted-imports",
  ]);
});

test("shared code may not import a feature", async () => {
  assert.deepEqual(await ruleIds("src/lib/example.ts", 'import "@/features/home/home-page";\n'), [
    "no-restricted-imports",
  ]);
});

test("parent-relative imports are rejected anywhere in src", async () => {
  assert.deepEqual(await ruleIds("src/app/example.ts", 'import "../lib/site";\n'), [
    "no-restricted-imports",
  ]);
});

test("process.env is rejected anywhere in src", async () => {
  assert.deepEqual(
    await ruleIds("src/lib/example.ts", "export const key = process.env.API_KEY;\n"),
    ["no-restricted-properties"],
  );
});
