import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { walk } from "./walk.mjs";

const major = (range) => range?.match(/\d+/)?.[0];

// .nvmrc is the one home of the Node version. Everything else must agree with it or read it.
export function checkVersions(root, running = process.versions.node) {
  const problems = [];
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const nvmrc = existsSync(join(root, ".nvmrc")) && readFileSync(join(root, ".nvmrc"), "utf8");
  const node = major(nvmrc || "");
  if (!node) problems.push(".nvmrc: file is missing or names no Node major");

  const facts = [
    ["the running Node", running],
    ["package.json engines.node", pkg.engines?.node],
    ["package.json @types/node", deps["@types/node"]],
  ];
  for (const [name, value] of facts) {
    if (node && major(value) !== node) {
      problems.push(`${name} is \`${value}\`, but .nvmrc pins Node ${node}`);
    }
  }

  if (!/^pnpm@\d+\.\d+\.\d+$/.test(pkg.packageManager ?? "")) {
    problems.push(`package.json packageManager is \`${pkg.packageManager}\`, expected pnpm@x.y.z`);
  }
  if (deps["eslint-config-next"] !== deps.next) {
    problems.push(
      `package.json eslint-config-next is \`${deps["eslint-config-next"]}\`, but next is \`${deps.next}\``,
    );
  }

  const workflows = walk(root).filter((file) =>
    /^\.github\/(workflows|actions)\/.*\.ya?ml$/.test(file),
  );
  for (const file of workflows) {
    readFileSync(join(root, file), "utf8")
      .split("\n")
      .forEach((text, index) => {
        if (/^\s*(node-version|version):/.test(text)) {
          problems.push(
            `${file}:${index + 1}: restates a version, read it from .nvmrc or package.json`,
          );
        }
      });
  }

  return { problems, summary: `Node ${node}, ${workflows.length} workflow files` };
}
