import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIPPED_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", "coverage"]);

// Reads the working tree, not the git index, so files a change just created are checked too.
export function walk(root, dir = root) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) files.push(...walk(root, join(dir, entry.name)));
    } else if (entry.isFile()) {
      files.push(relative(root, join(dir, entry.name)).split(sep).join("/"));
    }
  }
  return files.sort();
}
