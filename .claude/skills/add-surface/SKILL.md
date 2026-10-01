---
name: add-surface
description: Add a new page, route handler or metadata image to this app so it lands in the right directories with its feature-map row. Use whenever a change creates a new URL.
---

Read the relevant guide in `node_modules/next/dist/docs/01-app/` before writing the route file. This Next.js version differs from older ones.

1. Pick the feature name. A new page gets `src/features/<name>/`. A new route inside an existing feature goes in that feature's directory.
2. Put everything the feature owns in `src/features/<name>/`. That means its components, its data and its tests. Import only from the same directory, `@/lib` and `@/components`. Lint rejects an import of another feature.
3. Move code that two features need into `src/lib` when it is logic or data, and into `src/components` when it renders.
4. Add the route file under `src/app`. Keep it thin. `src/app/page.tsx` is the model: it re-exports the component from the feature.
5. Add the row to `docs/feature-map.md` in the same change. Fill every column, and write a Proof that would fail if the surface were broken, such as a literal the page must contain.
6. Run the `verify` skill. `pnpm check` confirms the row exists and `pnpm smoke` requests it.
