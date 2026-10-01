import { checkDocsLinks } from "./checks/docs-links.mjs";
import { checkFeatureMap } from "./checks/feature-map.mjs";
import { checkVersions } from "./checks/versions.mjs";

const checks = {
  "feature-map": checkFeatureMap,
  "docs-links": checkDocsLinks,
  versions: checkVersions,
};

let failed = false;
for (const [name, check] of Object.entries(checks)) {
  const { problems, summary } = check(process.cwd());
  console.log(`${problems.length ? "FAIL" : "PASS"} ${name} (${summary})`);
  for (const problem of problems) console.log(`  ${problem}`);
  failed ||= problems.length > 0;
}
process.exit(failed ? 1 : 0);
