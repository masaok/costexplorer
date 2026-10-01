<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

A Next.js 16 App Router app with React 19, Tailwind CSS 4, TypeScript, pnpm and Node 24. It currently serves only the create-next-app starting page. The app reads no environment variables and has no database.

## How to work

- Follow the agentic engineering manual at https://expeditionlabs.co/resources/agentic-manual/llms.txt for any task with more than one step. An explicit instruction from the user wins, then this file, then the manual.
- Trust rung 2. Work on a branch, open one pull request per issue, and leave review and merge to a human. Never push to `main` and never merge your own pull request.
- Done means the `verify` skill ran and its real output is in your reply. `pnpm verify` is the single gate and runs the same commands as CI. Run `nvm use` first.
- Never weaken a check, disable a lint rule or edit a test to get a pass. Fix the cause or report the failure.
- A new URL goes through the `add-surface` skill and gets its row in `docs/feature-map.md` in the same change.
- When behavior changes, update the doc that describes it in the same change. `pnpm check` validates the feature map and every relative markdown link.
- Change this file and `.claude/skills/` only in a pull request of their own, with an eval run from `docs/agent-evals.md`.

## Where things live

| Path                            | Holds                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/app`                       | Route files only. Each one is thin and hands off to a feature.                                 |
| `src/features/<name>`           | Everything one feature owns. A feature never imports another feature or a route.               |
| `src/components`                | Rendering shared by more than one feature or route. Create it with the first shared component. |
| `src/lib`                       | Shared data and logic with no I/O. Create it with the first shared module.                     |
| `scripts/checks`                | Repository checks run by `pnpm check`, each with a test that proves it can fail.               |
| `scripts/smoke.mjs`             | Requests every surface in the feature map against the production build.                        |
| `docs/feature-map.md`           | Every URL, its files, how to reach it and what proves it works.                                |
| `docs/guardrails.md`            | Every rule and the mechanism that enforces it.                                                 |
| `docs/engineering-practices.md` | The audit against the engineering practices, with what was declined and why.                   |

## Commands

| Command             | Does                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm dev`          | Development server on port 3000.                                 |
| `pnpm verify`       | The whole gate. Stops at the first failure.                      |
| `pnpm typecheck`    | Generates route types, then runs the compiler.                   |
| `pnpm lint`         | Read-only lint. `pnpm lint:fix` is for humans, never for a gate. |
| `pnpm format:check` | Read-only format check. `pnpm format` rewrites files.            |
| `pnpm check`        | Feature map, markdown links and version agreement.               |
| `pnpm test`         | Tests for the repository checks and the lint boundaries.         |
| `pnpm build`        | Production build.                                                |
| `pnpm smoke`        | Serves the build and requests every surface. Needs `pnpm build`. |
