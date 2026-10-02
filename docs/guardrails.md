# Guardrails

Each rule this repository holds, and the mechanism that fails when the rule is broken. A rule with no enforcer is listed at the bottom so the gap stays visible.

`pnpm verify` runs every command in this table in the order CI runs them.

| Rule                                                                             | Enforced by                                                                      | Watched it fail                                             |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Types check against freshly generated route types                                | `pnpm typecheck` in CI job `typecheck` and in the pre-push hook                  | compiler                                                    |
| No lint errors or warnings                                                       | `pnpm lint` in CI job `lint`. Read-only, `lint:fix` is for humans                | linter                                                      |
| Files are formatted, imports and Tailwind classes are in canonical order         | `pnpm format:check` in CI job `format`. The pre-commit hook formats staged files | formatter                                                   |
| A feature does not import another feature or a route                             | `no-restricted-imports` in `eslint.config.mjs`                                   | `scripts/checks/lint-boundaries.test.mjs`                   |
| `src/lib` and `src/components` do not import a feature or a route                | `no-restricted-imports` in `eslint.config.mjs`                                   | `scripts/checks/lint-boundaries.test.mjs`                   |
| No parent-relative imports in `src`                                              | `no-restricted-imports` in `eslint.config.mjs`                                   | `scripts/checks/lint-boundaries.test.mjs`                   |
| No `process.env` in `src`, so no credential can reach a client bundle            | `no-restricted-properties` in `eslint.config.mjs`                                | `scripts/checks/lint-boundaries.test.mjs`                   |
| The engine packages do not import React or Next.js                               | `no-restricted-imports` in `eslint.config.mjs`                                   | `scripts/checks/lint-boundaries.test.mjs`                   |
| Package tests pass and cover 90% of `packages/*/src`                             | `pnpm test` in CI job `test`, thresholds in `vitest.config.mts`                  | by hand, see the [audit](engineering-practices.md#evidence) |
| Package code uses only syntax Node can run without a build                       | `erasableSyntaxOnly` in `tsconfig.packages.json`, run by `pnpm typecheck`        | compiler                                                    |
| Every URL has a row in the [feature map](feature-map.md), and every row is real  | `pnpm check` in CI job `check`                                                   | `scripts/checks/checks.test.mjs`                            |
| Relative links and heading anchors in markdown resolve                           | `pnpm check` in CI job `check`                                                   | `scripts/checks/checks.test.mjs`                            |
| Node has one version, in `.nvmrc`. `engines`, `@types/node` and CI agree with it | `pnpm check` in CI job `check`                                                   | `scripts/checks/checks.test.mjs`                            |
| `next` and `eslint-config-next` are the same version                             | `pnpm check` in CI job `check`                                                   | `scripts/checks/checks.test.mjs`                            |
| Installs use pnpm on the pinned Node major                                       | `scripts/preinstall.mjs`, run by the `preinstall` script                         | by hand, see the [audit](engineering-practices.md#evidence) |
| CI installs exactly the lockfile                                                 | `pnpm install --frozen-lockfile` in `.github/actions/setup/action.yml`           | pnpm                                                        |
| The production build succeeds on the pinned Node                                 | `pnpm build` in CI job `build`                                                   | Next.js                                                     |
| Every surface answers with its exact status and its proof                        | `pnpm smoke` in CI job `build`                                                   | by hand, see the [audit](engineering-practices.md#evidence) |
| CI steps run the reviewed code of each action                                    | Actions pinned to a commit hash, moved forward by Dependabot                     | not applicable                                              |

## Adding a credential

The `process.env` ban has no exemption today because the app reads no configuration. The first module that needs a secret does three things in one change. It starts with `import "server-only"`. It adds `server-only` to `dependencies`. It adds an override for that one file in `eslint.config.mjs`. Client code that imports the module then fails the build.

## Rules with no enforcer

| Rule                                                          | Why it has none                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Nothing merges to `main` with a red check                     | Needs required status checks on `main`. That is a repository setting, see the [audit](engineering-practices.md#remaining-work). |
| Pull request descriptions say why and how it was verified     | The template asks. Nothing rejects an empty answer.                                                                             |
| Agent instructions change only through their own pull request | Review convention, see [agent evals](agent-evals.md).                                                                           |
