import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { walk } from "./walk.mjs";

export const FEATURE_MAP = "docs/feature-map.md";

const APP_DIR = "src/app";
const CODE = "(?:tsx?|jsx?)";
const IMAGE = "(?:ico|jpe?g|png|svg|gif)";

// Next.js file conventions that create a URL. Each maps a file name to the last URL segment.
const SURFACE_FILES = [
  [new RegExp(`^(?:page|route)\\.${CODE}$`), () => ""],
  [new RegExp(`^(icon|apple-icon|opengraph-image|twitter-image)\\d*\\.${CODE}$`), (m) => m[1]],
  [
    new RegExp(`^(?:favicon|icon|apple-icon|opengraph-image|twitter-image)\\d*\\.${IMAGE}$`),
    (m) => m[0],
  ],
  [new RegExp(`^sitemap\\.(?:xml|${CODE})$`), () => "sitemap.xml"],
  [new RegExp(`^robots\\.(?:txt|${CODE})$`), () => "robots.txt"],
  [new RegExp(`^manifest\\.(?:webmanifest|${CODE})$`), () => "manifest.webmanifest"],
  [/^manifest\.json$/, () => "manifest.json"],
];

function surfaceId(file) {
  const segments = file.slice(APP_DIR.length + 1).split("/");
  const name = segments.pop();
  for (const [pattern, lastSegment] of SURFACE_FILES) {
    const match = name.match(pattern);
    if (!match) continue;
    // Route groups "(x)" and parallel slots "@x" organize files without adding a URL segment.
    const dirs = segments.filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@"));
    return "/" + [...dirs, lastSegment(match)].filter(Boolean).join("/");
  }
  return null;
}

export function surfacesInCode(root) {
  return walk(root)
    .filter((file) => file.startsWith(`${APP_DIR}/`))
    .map((file) => ({ id: surfaceId(file), file }))
    .filter((surface) => surface.id !== null);
}

// A row is a table line whose first cell is a backticked surface id, such as | `/pricing` | ... |
export function parseFeatureMap(markdown) {
  const rows = [];
  markdown.split("\n").forEach((text, index) => {
    const cells = text.split("|").map((cell) => cell.trim());
    const id = cells[1]?.match(/^`(\/[^`]*)`$/)?.[1];
    if (!id) return;
    const paths = [...text.matchAll(/`((?:src|public|scripts)\/[^`\s]+)`/g)].map((m) => m[1]);
    const proof = text.match(/`GET (\/[^`\s]*)` (\d{3}), (text|type) `([^`]+)`/);
    rows.push({
      id,
      line: index + 1,
      paths,
      proof: proof && { path: proof[1], status: Number(proof[2]), kind: proof[3], value: proof[4] },
    });
  });
  return rows;
}

export function checkFeatureMap(root) {
  const mapPath = join(root, FEATURE_MAP);
  if (!existsSync(mapPath)) return { problems: [`${FEATURE_MAP}: file is missing`], summary: "" };

  const surfaces = surfacesInCode(root);
  const rows = parseFeatureMap(readFileSync(mapPath, "utf8"));
  const problems = [];

  for (const surface of surfaces) {
    if (!rows.some((row) => row.id === surface.id)) {
      problems.push(`${surface.file}: surface \`${surface.id}\` has no row in ${FEATURE_MAP}`);
    }
  }
  for (const row of rows) {
    const at = `${FEATURE_MAP}:${row.line}`;
    if (rows.find((other) => other.id === row.id) !== row) {
      problems.push(`${at}: surface \`${row.id}\` is listed twice`);
    }
    if (!surfaces.some((surface) => surface.id === row.id)) {
      problems.push(`${at}: surface \`${row.id}\` has no file under ${APP_DIR}`);
    }
    for (const path of row.paths) {
      if (!existsSync(join(root, path))) problems.push(`${at}: \`${path}\` does not exist`);
    }
    if (!row.proof) {
      problems.push(`${at}: surface \`${row.id}\` needs a proof like \`GET /\` 200, text \`...\``);
    }
  }

  return { problems, summary: `${surfaces.length} surfaces in code, ${rows.length} rows` };
}
