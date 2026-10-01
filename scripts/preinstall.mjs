import { readFileSync } from "node:fs";

const problems = [];

const agent = process.env.npm_config_user_agent ?? "";
if (!agent.startsWith("pnpm/")) {
  problems.push(`This project installs with pnpm, not ${agent.split("/")[0] || "this tool"}.`);
}

const pinned = readFileSync(".nvmrc", "utf8").trim();
const running = process.versions.node.split(".")[0];
if (running !== pinned) {
  problems.push(`This project runs on Node ${pinned}, not Node ${running}. Run \`nvm use\`.`);
}

for (const problem of problems) console.error(problem);
process.exit(problems.length ? 1 : 0);
