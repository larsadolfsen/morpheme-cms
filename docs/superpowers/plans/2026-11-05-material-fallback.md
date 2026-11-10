# Material as every theme's fallback (plan)

Status: done. Checked against the code on 2026-11-10.

Design: [2026-11-05-material-fallback-design.md](../specs/2026-11-05-material-fallback-design.md).
Session branch: `feat/material-fallback`. Each task works on its own branch and merges into the session branch.

## Tasks

| # | Task | Worker | Branch | Files |
|---|---|---|---|---|
| 1 | Theme check: import Material's `global.css` | Ollama runner | `task/material-fallback-check` | `site/theme.mjs`, `site/themeImport.test.mjs` |
| 2 | Material's rules in the `fallback` layer | Sonnet agent | `task/material-fallback-layer` | `theme/styles/*.css`, `theme/styles/fallback.test.mjs`, `.changeset/` |

Task 2 goes to a Sonnet agent: it needs judgement on the cascade order and a pixel comparison of Material.

## Task 1

Spec: `orchestrator/specs/material-fallback-check.md`.

## Task 2

1. Capture screenshots of Material before the change: demo home, a page, a blog post, the blog, 404; phone and desktop.
2. Declare the layer order `@layer theme, base, components, utilities, fallback;` after `@import 'tailwindcss'` in `base.css`.
3. Move every top-level rule that sets more than custom properties into `@layer fallback`. Keep the order.
4. Split a rule that sets custom properties and other properties into two rules.
5. Update the header comment of each changed CSS file.
6. Add `theme/styles/fallback.test.mjs`. Use `postcss`. Fail on:
   - a top-level rule outside a layer that sets more than custom properties;
   - a layer order that does not end in `fallback`;
   - any `!important`.
7. Add a changeset: `@morphemecms/cms` minor, one English line for a site's owner.
8. Capture the same screenshots after the change. Compare them pixel by pixel. Expect zero differences.

## Acceptance

- `node --test` over every `*.test.mjs` passes.
- `npx prettier --check .` passes.
- `npm run build` passes.
- The Material screenshots before and after are identical.
- Then: PR, merge, Release PR, `/release`, the owner approves on npmjs. Venus follows in `morpheme-apps`.
