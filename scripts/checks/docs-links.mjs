import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { walk } from "./walk.mjs";

const FENCE = /^\s*(```|~~~)/;

// GitHub's heading anchor: lowercase, punctuation dropped, spaces become hyphens.
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

function proseLines(markdown) {
  let fenced = false;
  return markdown.split("\n").map((text) => {
    if (FENCE.test(text)) {
      fenced = !fenced;
      return "";
    }
    return fenced ? "" : text;
  });
}

function anchors(markdown) {
  return new Set(
    proseLines(markdown)
      .map((text) => text.match(/^#{1,6}\s+(.*)$/)?.[1])
      .filter(Boolean)
      .map(slug),
  );
}

export function checkDocsLinks(root) {
  const files = walk(root).filter((file) => file.endsWith(".md"));
  const problems = [];
  let links = 0;

  for (const file of files) {
    const markdown = readFileSync(join(root, file), "utf8");
    proseLines(markdown).forEach((text, index) => {
      const withoutCode = text.replace(/`[^`]*`/g, "");
      for (const [, target] of withoutCode.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
        links += 1;
        const [path, anchor] = target.split("#");
        const linked = path ? posix.normalize(posix.join(dirname(file), path)) : file;
        const at = `${file}:${index + 1}`;
        if (linked.startsWith("..") || !existsSync(join(root, linked))) {
          problems.push(`${at}: link target \`${target}\` does not exist`);
        } else if (anchor && linked.endsWith(".md")) {
          const source = linked === file ? markdown : readFileSync(join(root, linked), "utf8");
          if (!anchors(source).has(anchor)) {
            problems.push(`${at}: \`${linked}\` has no heading for \`#${anchor}\``);
          }
        }
      }
    });
  }

  return { problems, summary: `${links} relative links in ${files.length} markdown files` };
}
