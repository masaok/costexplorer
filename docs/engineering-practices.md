# Engineering practices audit

This repository is measured against two references.

- The agentic engineering manual, https://expeditionlabs.co/resources/agentic-manual/llms.txt. Section 6 lists five practices a repository needs before an agent's work can be trusted.
- Engineering practices that survive the stack, https://www.expeditionlabs.co/resources/engineering-practices. It lists 31 techniques with a priority from P0 to P2.

Audited on 2026-10-01. Update the Status column in the same change that lands an item.

## The five agentic practices

| Practice                   | Status  | Where                                                                                                       |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Verification loop          | Done    | `pnpm verify`, the skill in `.claude/skills/verify/SKILL.md`, `scripts/smoke.mjs`                           |
| Feature map                | Done    | [Feature map](feature-map.md), checked by `scripts/checks/feature-map.mjs`                                  |
| Hard guardrails            | Partial | [Guardrails](guardrails.md). Required status checks are not set, see [remaining work](#remaining-work).     |
| Colocate by feature        | Done    | `src/features/home`, layer rules in `eslint.config.mjs`, the skill in `.claude/skills/add-surface/SKILL.md` |
| Evals for the instructions | Partial | [Agent evals](agent-evals.md) has the scenarios. No run is logged yet.                                      |

## The 31 techniques

| Id  | Technique                                     | Priority | Status       | Mechanism here                                                                                                                                                               |
| --- | --------------------------------------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Hosted CI pipeline                            | P0       | Done, unrun  | `.github/workflows/ci.yml`. Six named jobs, read-only permissions, one run per pull request, actions pinned to a commit hash, frozen lockfile. It has not run on GitHub yet. |
| 1.2 | Staged-files-only pre-commit hook             | P0       | Done         | `.husky/pre-commit` runs lint-staged with Prettier on staged files. `.husky/pre-push` runs the typecheck.                                                                    |
| 1.3 | Read-only lint in every automated path        | P0       | Done         | `lint` and `format:check` are read-only. `lint:fix` and `format` are wired into no gate. The hook's formatter re-stages what it rewrites.                                    |
| 1.4 | Required status checks on the default branch  | P0       | Needs human  | A repository setting. See [remaining work](#remaining-work).                                                                                                                 |
| 1.5 | Host-faithful production build                | P1       | Partial      | CI job `build` installs from the frozen lockfile and builds on the Node major in `.nvmrc`. The deploy host's Node setting is not recorded in this repository.                |
| 2.1 | Compiler-enforced client/server boundary      | P0       | Done for now | No module reads a credential. Lint bans `process.env` in `src`. [Guardrails](guardrails.md#adding-a-credential) says what the first secret must add.                         |
| 2.2 | Every config has its tool installed           | P0       | Done         | Prettier, both plugins, husky and lint-staged are dependencies and each runs in a hook or a CI job.                                                                          |
| 2.3 | Guides describe the code that exists          | P0       | Done         | `README.md`, `CONTRIBUTING.md` and `AGENTS.md` were rewritten from the code. `pnpm check` validates their links and the feature map.                                         |
| 3.1 | One declared runtime version                  | P1       | Done         | `.nvmrc`. `scripts/checks/versions.mjs` fails when `engines`, `@types/node` or the running Node disagree.                                                                    |
| 3.2 | One shared setup step                         | P1       | Done         | `.github/actions/setup/action.yml` reads Node from `.nvmrc` and pnpm from `packageManager`. Checkout stays in each job because a local action cannot load before checkout.   |
| 3.3 | Derived categorizations from one constant     | P1       | Not needed   | The app has no categorization or constant that appears in two layers yet.                                                                                                    |
| 3.4 | Dependency automation that respects pins      | P1       | Done, unrun  | `.github/dependabot.yml`. Weekly grouped minors and patches, majors apart, `@types/node` major held.                                                                         |
| 4.1 | Code generation inside the typecheck command  | P1       | Done         | `typecheck` is `next typegen && tsc --noEmit`. `src/app/layout.tsx` depends on the generated `LayoutProps`.                                                                  |
| 4.2 | Proof-of-failure test for every custom check  | P0       | Done         | `scripts/checks/checks.test.mjs` and `scripts/checks/lint-boundaries.test.mjs`. The smoke script and the install preflight were failed by hand, see [evidence](#evidence).   |
| 4.3 | Import smoke test over real entry points      | P1       | Not needed   | See [not adopted](#not-adopted).                                                                                                                                             |
| 4.4 | Fail-safe changed-files gate                  | P2       | Declined     | See [not adopted](#not-adopted).                                                                                                                                             |
| 4.5 | Job-level skip conditions, never path filters | P2       | Done         | The workflow has no path filter and no skip condition, so every required check always reports.                                                                               |
| 5.1 | Numbered migration files                      | P1       | Not needed   | No database. See [not adopted](#not-adopted).                                                                                                                                |
| 5.2 | Language-neutral migration format             | P1       | Not needed   | No database.                                                                                                                                                                 |
| 5.3 | Harvest the accidental migration log          | P1       | Not needed   | No database.                                                                                                                                                                 |
| 5.4 | Retire the replaced mechanism                 | P1       | Done         | The homepage moved in one step. No copy stays at the old path.                                                                                                               |
| 5.5 | Advisory lock around the migration runner     | P1       | Not needed   | No database.                                                                                                                                                                 |
| 6.1 | Name the invariant before the vendor          | P2       | Done         | The [guardrails](guardrails.md) table states each rule first and its tool second.                                                                                            |
| 6.2 | Evaluate tools by failure mode                | P2       | Done         | See [tool failure modes](#tool-failure-modes).                                                                                                                               |
| 6.3 | Score bundled benefits one at a time          | P2       | Not needed   | No bundled tool was adopted. Each added tool does one job.                                                                                                                   |
| 6.4 | Rejected-items section inside the audit       | P2       | Done         | [Not adopted](#not-adopted).                                                                                                                                                 |
| 7.1 | Infrastructure-dependent suites off the gate  | P0       | Done         | Every CI job is hermetic. The smoke test serves the build on the runner and calls no outside service.                                                                        |
| 7.2 | Port and resource registry                    | P2       | Done         | No document assigns ports. The smoke test takes a free port from the operating system and Next.js picks the next free port for `pnpm dev`.                                   |
| 7.3 | Shared environment preflight                  | P2       | Done for now | `scripts/preinstall.mjs` names the wrong package manager or Node major. The app reads no environment variables.                                                              |
| 7.4 | One living document per subsystem             | P2       | Done         | The four files in `docs/`, link-checked and anchor-checked by `pnpm check` in CI job `check`.                                                                                |
| 7.5 | Remediation ordered by leverage               | P1       | Done         | [Remaining work](#remaining-work).                                                                                                                                           |

## Remaining work

Ordered by effort. Items marked needs-human require a repository administrator or access this repository does not hold.

| Order | Item                                                                                                                                                                                                                          | Effort     | Owner       | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- | ------ |
| 1     | Commit the formatter run as its own commit and record its hash in a `.git-blame-ignore-revs` file.                                                                                                                            | 5 minutes  | anyone      | Open   |
| 2     | Push the branch and confirm all six CI jobs go green on GitHub. Until then 1.1 and 3.4 are untested.                                                                                                                          | 10 minutes | anyone      | Open   |
| 3     | Make the checks required on `main`. Require `typecheck`, `lint`, `format`, `check`, `test` and `build`, require branches to be up to date, and include administrators. The jobs must have run once before GitHub offers them. | 5 minutes  | needs-human | Open   |
| 4     | Record the deploy host and confirm it builds on Node 24 with `pnpm build`. Then 1.5 is done.                                                                                                                                  | 5 minutes  | needs-human | Open   |
| 5     | Say in `README.md` and `AGENTS.md` what this app is for. Both describe only the scaffold today.                                                                                                                               | 10 minutes | needs-human | Open   |
| 6     | Delete the five unused create-next-app images in `public/` when the placeholder homepage is replaced.                                                                                                                         | 5 minutes  | anyone      | Open   |
| 7     | Run the seven agent eval scenarios in fresh sessions and log the first run.                                                                                                                                                   | 1 hour     | anyone      | Open   |
| 8     | Decide whether agents may move to trust rung 3 and merge their own green pull requests. This needs items 3 and 7 first.                                                                                                       | a decision | needs-human | Open   |

The command for item 3, once the jobs have run.

```bash
gh api -X PUT repos/masaok/costexplorer/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["typecheck", "lint", "format", "check", "test", "build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

## Not adopted

Each item names what would change the answer.

| Id              | Technique                        | Why not here                                                                                                                                                                                     | Adopt it when                                                                                       |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 4.3             | Import smoke test                | The only entry points outside Next.js are `scripts/check.mjs`, `scripts/smoke.mjs` and `scripts/preinstall.mjs`. CI executes all three for real in every run.                                    | The repository gains a command-line script, a daemon or a scheduled job that CI does not run.       |
| 4.4             | Changed-files gate               | The full gate takes about 13 seconds on a laptop. Skip logic is untested code that can skip by accident, and it would save seconds.                                                              | The full CI run takes longer than about ten minutes.                                                |
| 5.1 to 5.3, 5.5 | Migrations and the runner lock   | The app has no database and no other durable state.                                                                                                                                              | The first table, bucket, queue or index is added.                                                   |
| 2.1             | The `server-only` marker package | There is no server-only module to mark. Declaring the dependency with no importer would be configuration without effect.                                                                         | The first module reads a credential. [Guardrails](guardrails.md#adding-a-credential) has the steps. |
| none            | Turborepo                        | The whole gate takes about 15 seconds with one package. A task cache is a second source of truth for what ran.                                                                                   | The gate takes longer than a few minutes, or packages need a build order pnpm cannot infer.         |
| none            | Changesets                       | Every package is private and unpublished. Release tooling with nothing to release is configuration without effect.                                                                               | The first package is published to npm.                                                              |
| none            | Moving the app to `apps/web`     | The app stays at the repository root and the engine lives beside it in `packages/`. The move rewrites every check, the feature map and the agent instructions, and no engine code depends on it. | A second app is added, or the root app's configuration starts leaking into a package.               |
| none            | Browser tests in CI              | They need a browser download on every run, and the app has no interactive component yet.                                                                                                         | The first interactive component ships.                                                              |

## Tool failure modes

What each added tool does when it is wrong, and whether anyone would notice.

| Tool                             | Failure mode                                                              | Noticed by                                                                       |
| -------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Prettier with class sorting      | Reorders Tailwind classes. Order can matter only for conflicting classes. | Build output compared before and after the first run, see [evidence](#evidence). |
| husky and lint-staged            | A contributor bypasses the hook with `--no-verify`.                       | CI job `format` runs the same check and cannot be bypassed once required.        |
| Dependabot                       | Opens a pull request that bumps `next` without `eslint-config-next`.      | They are grouped, and `pnpm check` fails if they disagree.                       |
| `scripts/preinstall.mjs`         | Blocks an install on a host that uses another Node major.                 | The install fails with a message naming the pinned major.                        |
| `scripts/checks/feature-map.mjs` | Its file-name rules miss a new Next.js route convention.                  | `pnpm smoke` compares the map with the route list Next.js writes at build time.  |

## Evidence

Run on 2026-10-01 with Node 24.21.0 and pnpm 12.8.1.

The placeholder homepage moved from `src/app/page.tsx` to `src/features/home/home-page.tsx` and every source file was reformatted. The prerendered homepage HTML was compared with the build from before the change, with script tags and asset links removed and class names sorted. It is identical, and so are the bytes of `/favicon.ico`.

The smoke script and the install preflight are the same files as in the costexplorer-cloud repository, where both were failed by hand. The smoke script was failed again here, with a wrong literal and a deleted row.

```text
FAIL GET / 200, text "Welcome back"
FAIL built route /favicon.ico has no row in docs/feature-map.md
FAIL /: expected 200 and text "Welcome back"
1 surfaces requested, 2 failures
```

The coverage threshold was failed by hand on 2026-10-01 by leaving one branch of the ranking comparator untested.

```text
Branches     : 88.88% ( 8/9 )
ERROR: Coverage for branches (88.88%) does not meet global threshold (90%)
```
