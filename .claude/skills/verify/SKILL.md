---
name: verify
description: Prove a change to this app works. Run the full gate, drive the changed surface in the running app, and paste the real output. Use before saying a task is done and before opening a pull request.
---

A change is done when this skill has run and its output is in the reply. Never weaken a check to make it pass. If a step cannot run, name the step and say the result is inconclusive.

## Gate

Run `nvm use` first. The gate refuses to run on a Node major other than the one in `.nvmrc`.

```bash
pnpm verify
```

It runs, in order, `typecheck`, `lint`, `format:check`, `check`, `test`, `build` and `smoke`, and stops at the first failure. These are the same commands as the CI jobs in `.github/workflows/ci.yml`. Paste the output. For a failure, paste the failing step and fix the cause.

## Launch

`pnpm smoke` launches the production build on a free port, requests every row in `docs/feature-map.md` and stops the server. Use it for any change that a request can prove.

To drive a surface by hand or with a browser, start the production build on a port of your own and keep the process id. Start it with `node`, not `pnpm start`. Killing the pnpm wrapper leaves the server running.

```bash
pnpm build
node node_modules/next/dist/bin/next start -p 3100 & echo $! > .next/verify.pid
```

## Doctor

One read-only check that the instance is worth driving.

```bash
curl -sI localhost:3100/ | head -1
```

It must print `HTTP/1.1 200 OK`. Anything else means the build is stale or the port belongs to another process. Fix that before driving.

## Drive

Find the surface in `docs/feature-map.md`. Its row has the files and a command that reaches it.

- A route or an image. Run the row's Reproduce command against your port and read the status, the header or the body.
- A page in a browser. Open `http://localhost:3100/` and use roles and names, not coordinates. The placeholder homepage has the links named `Deploy Now` and `Documentation`.
- Both color schemes. The styles follow `prefers-color-scheme`, so emulate `dark` and `light` for a visual change.

## Evidence

Paste the command and its output in the reply and in the Verification section of the pull request. For a visual change, attach a screenshot of the changed section before and after. State each result as `VERIFIED`, `NOT VERIFIED` or `INCONCLUSIVE`.

## Cleanup

Stop only the server this run started, by its process id.

```bash
kill "$(cat .next/verify.pid)" && rm .next/verify.pid
```

Never stop a server by name or by port. Another session may own it.
