# costexplorer

A Next.js 16 app. It currently serves only the create-next-app starting page, and the tooling around it is in place for the first real feature.

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

This runs typecheck, lint, format check, repository checks, tests, the production build and a smoke test of every URL. CI runs the same commands as separate jobs in `.github/workflows/ci.yml`.

## Documentation

- [Feature map](docs/feature-map.md). Every URL, its files and how to reach it.
- [Guardrails](docs/guardrails.md). Every rule and what enforces it.
- [Engineering practices audit](docs/engineering-practices.md). What is in place, what was declined and what is left.
- [Agent evals](docs/agent-evals.md). Scenarios that test the agent instructions.
- [Contributing](CONTRIBUTING.md). The process for a change.
- `AGENTS.md`. The rules for coding agents.
