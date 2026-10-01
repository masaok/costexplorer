# Feature map

One row per URL this app serves. A bug report names a surface, and the row says which files to open and how to reach it.

`pnpm check` fails when a file under `src/app` creates a URL that has no row here, and when a row names a file that does not exist. `pnpm smoke` requests every row against the production build and asserts the Proof column.

Start the app with `pnpm dev` before running a Reproduce command.

| Surface        | Entry point           | Renders                           | Data | Reproduce                             | Proof                                        |
| -------------- | --------------------- | --------------------------------- | ---- | ------------------------------------- | -------------------------------------------- |
| `/`            | `src/app/page.tsx`    | `src/features/home/home-page.tsx` | none | `curl -s localhost:3000/`             | `GET /` 200, text `To get started, edit the` |
| `/favicon.ico` | `src/app/favicon.ico` | static file                       | none | `curl -sI localhost:3000/favicon.ico` | `GET /favicon.ico` 200, type `image/x-icon`  |

## Proof format

`GET <path>` then the exact status, then one assertion. `text` means the response body contains the literal. `type` means the `content-type` header contains the literal. For a dynamic route, the path is a concrete example such as `/reports/123`.

## The homepage is a placeholder

`src/features/home/home-page.tsx` is still the create-next-app starting page. Replace it and its Proof literal when the first real page lands.
