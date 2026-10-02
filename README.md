# costexplorer

Find the cloud spend you forgot you're paying for.

This is the open-source engine behind [Cost Explorer](https://costexplorer.net). It reads a cloud cost export and a resource inventory, and reports what is being wasted. Findings are ranked by dollars saved per month, and each one carries its evidence, a confidence level and the exact fix. The engine only reads. You review and apply every fix yourself.

Cost Explorer is an independent product. It is not affiliated with Amazon Web Services and it is not the AWS billing tool of the same name.

## Status

The engine is early. AWS comes first, and GCP follows once the AWS findings are solid.

- One rule is in the catalog so far: `aws.ebs.unattached`, which finds EBS volumes attached to no instance for 14 days or more.
- There is no command-line tool yet. The packages are libraries, and `runAnalyzers` is the entry point.

To add a rule, follow [Add an analyzer](CONTRIBUTING.md#add-an-analyzer).

## Layout

The repository is a pnpm workspace. The engine is built as packages under `packages/`, and a Next.js 16 app at the root will host the docs and the rule catalog. The app still serves the create-next-app starting page.

| Package              | Holds                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`      | The cost record schema, aligned to the FinOps FOCUS columns, the resource inventory types, money math and the `Finding` contract. |
| `packages/analyzers` | The waste rules, one file per rule under `src/<provider>/`, and `runAnalyzers`, which runs them over one scan.                    |

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

## License

Apache-2.0.
