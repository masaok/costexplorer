import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { checkDocsLinks } from "./docs-links.mjs";
import { checkFeatureMap } from "./feature-map.mjs";
import { checkVersions } from "./versions.mjs";

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "checks-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const row = (id, entry) => `| \`${id}\` | \`${entry}\` | \`GET ${id}\` 200, text \`Hello\` |\n`;

const pkg = (overrides = {}) =>
  JSON.stringify({
    packageManager: "pnpm@12.8.1",
    engines: { node: "24.x" },
    dependencies: { next: "16.3.8" },
    devDependencies: { "@types/node": "^24.19.0", "eslint-config-next": "16.3.8" },
    ...overrides,
  });

test("feature map passes when every surface has a complete row", () => {
  const root = fixture({
    "src/app/page.tsx": "",
    "src/app/(marketing)/pricing/page.tsx": "",
    "src/app/icon.svg": "",
    "docs/feature-map.md":
      row("/", "src/app/page.tsx") +
      row("/pricing", "src/app/(marketing)/pricing/page.tsx") +
      row("/icon.svg", "src/app/icon.svg"),
  });
  assert.deepEqual(checkFeatureMap(root), { problems: [], summary: "3 surfaces in code, 3 rows" });
});

test("feature map fails on a surface with no row", () => {
  const root = fixture({
    "src/app/page.tsx": "",
    "src/app/api/scan/route.ts": "",
    "docs/feature-map.md": row("/", "src/app/page.tsx"),
  });
  assert.deepEqual(checkFeatureMap(root).problems, [
    "src/app/api/scan/route.ts: surface `/api/scan` has no row in docs/feature-map.md",
  ]);
});

test("feature map fails on a stale row, a missing file and a missing proof", () => {
  const root = fixture({
    "src/app/page.tsx": "",
    "docs/feature-map.md":
      "| `/` | `src/app/page.tsx` | `src/features/gone.tsx` | no proof |\n" +
      row("/old", "src/app/page.tsx"),
  });
  assert.deepEqual(checkFeatureMap(root).problems, [
    "docs/feature-map.md:1: `src/features/gone.tsx` does not exist",
    "docs/feature-map.md:1: surface `/` needs a proof like `GET /` 200, text `...`",
    "docs/feature-map.md:2: surface `/old` has no file under src/app",
  ]);
});

test("docs links pass on existing files and headings", () => {
  const root = fixture({
    "README.md":
      "[map](docs/map.md#how-it-works) [top](#readme) [web](https://example.com)\n# Readme\n",
    "docs/map.md": "## How it works\n[up](../README.md)\n",
  });
  assert.deepEqual(checkDocsLinks(root), {
    problems: [],
    summary: "3 relative links in 2 markdown files",
  });
});

test("docs links fail on a missing file and a missing heading", () => {
  const root = fixture({
    "README.md":
      "[gone](docs/gone.md)\n[anchor](docs/map.md#renamed)\n```\n[skipped](nope.md)\n```\n",
    "docs/map.md": "## How it works\n",
  });
  assert.deepEqual(checkDocsLinks(root).problems, [
    "README.md:1: link target `docs/gone.md` does not exist",
    "README.md:2: `docs/map.md` has no heading for `#renamed`",
  ]);
});

test("versions pass when every fact agrees with .nvmrc", () => {
  const root = fixture({
    ".nvmrc": "24\n",
    "package.json": pkg(),
    ".github/workflows/ci.yml": "node-version-file: .nvmrc\n",
  });
  assert.deepEqual(checkVersions(root, "24.21.0"), {
    problems: [],
    summary: "Node 24, 1 workflow files",
  });
});

test("versions fail on drift from .nvmrc and on a restated version", () => {
  const root = fixture({
    ".nvmrc": "24\n",
    "package.json": pkg({
      packageManager: "pnpm",
      engines: { node: ">=20" },
      devDependencies: { "@types/node": "^20", "eslint-config-next": "16.0.0" },
    }),
    ".github/workflows/ci.yml": "steps:\n  node-version: 22\n",
  });
  assert.deepEqual(checkVersions(root, "23.10.0").problems, [
    "the running Node is `23.10.0`, but .nvmrc pins Node 24",
    "package.json engines.node is `>=20`, but .nvmrc pins Node 24",
    "package.json @types/node is `^20`, but .nvmrc pins Node 24",
    "package.json packageManager is `pnpm`, expected pnpm@x.y.z",
    "package.json eslint-config-next is `16.0.0`, but next is `16.3.8`",
    ".github/workflows/ci.yml:2: restates a version, read it from .nvmrc or package.json",
  ]);
});
