// Starts the production build and requests every surface in the feature map.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { FEATURE_MAP, parseFeatureMap } from "./checks/feature-map.mjs";

const INTERNAL_ROUTES = new Set(["/_not-found", "/_global-error"]);

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitUntilReady(origin, child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`next start exited with ${child.exitCode}`);
    try {
      await fetch(origin, { method: "HEAD" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`next start did not answer on ${origin} within 10s`);
}

if (!existsSync(".next/BUILD_ID")) {
  console.error("FAIL no production build found. Run `pnpm build` first.");
  process.exit(1);
}

const rows = parseFeatureMap(readFileSync(FEATURE_MAP, "utf8"));
const failures = [];

// Next's own route list. A surface the file-name rules in feature-map.mjs miss still fails here.
const built = Object.values(
  JSON.parse(readFileSync(".next/app-path-routes-manifest.json", "utf8")),
);
for (const route of built) {
  if (!INTERNAL_ROUTES.has(route) && !rows.some((row) => row.id === route)) {
    failures.push(`built route ${route} has no row in ${FEATURE_MAP}`);
  }
}

const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  await waitUntilReady(origin, child);
  for (const { id, proof } of rows) {
    if (!proof) {
      failures.push(`${id} has no proof in ${FEATURE_MAP}`);
      continue;
    }
    const response = await fetch(origin + proof.path, { redirect: "manual" });
    const actual =
      proof.kind === "type" ? (response.headers.get("content-type") ?? "") : await response.text();
    const ok = response.status === proof.status && actual.includes(proof.value);
    const label = `GET ${proof.path} ${response.status}, ${proof.kind} "${proof.value}"`;
    console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
    if (!ok) failures.push(`${id}: expected ${proof.status} and ${proof.kind} "${proof.value}"`);
  }
} finally {
  child.kill();
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`${rows.length} surfaces requested, ${failures.length} failures`);
process.exit(failures.length ? 1 : 0);
