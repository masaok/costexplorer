# Contributing

## Set up

```bash
nvm use
pnpm install
```

The install sets up two git hooks. The pre-commit hook formats the files you staged and takes about a second. The pre-push hook runs `pnpm typecheck`. Everything slower runs in CI.

## Make a change

1. Branch from `main`. Nothing is pushed to `main` directly.
2. Keep a feature's files together in `src/features/<name>/`. A new URL also needs a row in the [feature map](docs/feature-map.md).
3. Engine code goes in `packages/<name>/src/` with its test beside it as `<file>.test.ts`. Import a sibling file with its `.ts` extension, and do not import React or Next.js there.
4. Run `pnpm verify` before you push. It runs what CI runs.
5. Open one pull request per issue. Say why the change exists, what is in scope and how you verified it, and paste the `pnpm verify` output.

## Add an analyzer

1. Write the rule as `packages/analyzers/src/<provider>/<rule>.ts`. It exports one `Analyzer`, and `analyze` is a pure function of the scan input. `aws/ebs-unattached.ts` is the model.
2. Put its test beside it. Build the input with the helpers in `packages/analyzers/src/fixtures.ts`, and assert the whole finding at least once, including the saving and the commands.
3. Report the lower figure when unsure, round the saving down with `floorToCents`, and put the numbers the estimate rests on in `evidence`.
4. If the rule reads a resource type that does not exist yet, add it to `packages/core/src/resource.ts`.
5. Add the rule to the `analyzers` list in `packages/analyzers/src/index.ts`.

## Formatting and lint

`pnpm format` rewrites files and `pnpm lint:fix` applies lint fixes. Hooks and CI only run the read-only `pnpm format:check` and `pnpm lint`, so a violation is reported and never silently repaired.

## Rules

The [guardrails](docs/guardrails.md) table lists every rule and the check that enforces it. If you leave the same review comment twice, add a check and a row there.

## Upgrades

Dependabot opens one grouped pull request a week for minor and patch updates and a separate one for each major. `@types/node` is held at the Node major in `.nvmrc`. To move to a new Node major, change `.nvmrc`, `engines.node` and `@types/node` in one pull request. `pnpm check` fails until all three agree.
