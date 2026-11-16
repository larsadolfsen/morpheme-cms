# Theme token files

Owner request, 16 Nov 2026: "convert all tokens to their own css". Every custom-property declaration of the theme lives in
`theme/styles/tokens/`, apart from the rules that use it, so a session that works on one component opens one small file.

This was a move: no token changed name or value, and none was removed. Renames and pruning are separate work.

## Layout

A token file has the same selector, the same `@media` and `@layer` wrappers and the same order as the declaration had in its
stylesheet. Each stylesheet imports its own token files, so a theme that imports `ui.css` or `blocks.css` without `base.css`
(`site/themeImport.test.mjs`) still gets its tokens. The folder is the stylesheet the tokens came from:

| Folder | Imported by | What is in it |
| :--- | :--- | :--- |
| `tokens/ui/` | `ui.css` | the UI components' defaults: type scale, elevation levels, the parts' own variables |
| `tokens/blocks/` | `blocks.css` | the blocks' variables (`--block-*`, `--motion-*`, `--section-*`) |
| `tokens/base/` | `base.css` | what every theme has: spacing, density, the Tailwind `@theme` names, `--panel-*`, `--theme-*` (from `components.css`, then `base.css`) |
| `tokens/material/` | `global.css` | the standard theme's look, Material 3: its colours' swaps, shape steps, elevation values, grid, state layers |

Material's tokens stay out of `base.css`: a theme that imports only `base.css` must not get Material's values.

In each folder:

- `ref.css`: the named scales the rest is built from: the Tailwind `@theme` namespaces, `--mo-space-*`, `--mo-shape-*`,
  `--mo-elevation-*` and the type scale `--type-*`.
- `sys.css`: every other token that is not a part's own: `--mo-*` roles, density, grid, state layers, `--block-*`, `--motion-*`,
  `--section-*`, `--panel-*`, `--theme-*`.
- `comp/<component>.css`: one file per component, for the part's own `--button-*`, `--list-*` and so on. The file is named after the component as Material 3 names it (`button`,
  `icon-button`, `top-app-bar`, `progress-indicator` …), so a later rename of the tokens needs no second move.

## What stayed, and why

- `--tw-*` declarations (Tailwind's own, in `.prose` and in the section rules) and everything inside `@utility`: Tailwind owns them.
- The section-colour swaps in `global.css` are pure token declarations, so they moved with the same selectors
  (`:root, :is(.text-section-…) > *, .editor-text .ProseMirror > …`). Their rules that draw things stayed.
- Rules that set a token and also draw something are split by property: the tokens go to the token file under the same
  selector, the rest stays. A comment goes with the next token it sits above, and the heading comment of a rule that was only
  tokens goes with it.

## Checks that read the files

`check:css-tokens` counts unprefixed names per file (`scripts/css-tokens-allowlist.json`, `files`), now per token file.
`check:colors` and `check:css-values` allow the same lines in the token files as before. `check:density` and the tests of
`theme/styles/` read a stylesheet together with its token files.

## Adding a token

1. Pick the folder by where the value is set: the stylesheet whose rules read it (`ui`, `blocks`, `base`), or `material` when
   it is the standard theme's look (`global.css`).
2. Pick the file: `ref.css` for a scale, `sys.css` for a role or setting, `comp/<component>.css` for one part's variable.
3. Write it on the selector it needs (`:root`, a section, a class), in the same `@layer` and `@media` as a rule would be.
   Nothing unprefixed on `:root` (`docs/css-tokens.md`).
4. A new file is imported by its folder's stylesheet.
