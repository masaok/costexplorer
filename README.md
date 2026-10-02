# costexplorer

The open-source engine behind Cost Explorer. It reads a cloud cost export and reports what is being wasted, with the saving and the fix for each finding.

The repository is a pnpm workspace. The engine is built as packages under `packages/`, and a Next.js 16 app at the root will host the docs and the rule catalog. The app still serves the create-next-app starting page.

| Package         | Holds                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `packages/core` | The cost record schema, aligned to the FinOps FOCUS columns, money math and the `Finding` contract. |

The engine packages are framework-free TypeScript. They import neither React nor Next.js, so a command-line tool and a worker can run them.

## Run it

You need Node 24 and pnpm. The versions are pinned in `.nvmrc` and in `packageManager` in `package.json`, and the install refuses any other Node major or package manager.

```bash
nvm use
pnpm install
pnpm dev
```

Open http://localhost:3000. The homepage is `src/features/home/home-page.tsx`.

## Check a change

```bash
pnpm verify
```

This runs typecheck, lint, format check, repository checks, tests, the production build and a smoke test of every URL. The tests include the package tests, which must cover 90% of the package code. CI runs the same commands as separate jobs in `.github/workflows/ci.yml`.

## Documentation

- [Feature map](docs/feature-map.md). Every URL, its files and how to reach it.
- [Guardrails](docs/guardrails.md). Every rule and what enforces it.
- [Engineering practices audit](docs/engineering-practices.md). What is in place, what was declined and what is left.
- [Agent evals](docs/agent-evals.md). Scenarios that test the agent instructions.
- [Contributing](CONTRIBUTING.md). The process for a change.
- `AGENTS.md`. The rules for coding agents.
