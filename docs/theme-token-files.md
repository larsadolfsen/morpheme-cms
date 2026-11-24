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
| `tokens/ui/` | `ui.css` | the UI components' defaults: type scale, elevation levels, M3's state opacities, the parts' own variables |
| `tokens/blocks/` | `blocks.css` | the blocks' variables (`--block-*`, `--motion-*`, `--section-*`) |
| `tokens/cards/` | `cards.css` | the card tokens of the Cards CSS (`cards.css`) |
| `tokens/lists/` | `lists.css` | the list tokens of the Lists CSS (`lists.css`) |
| `tokens/type/` | `type.css` | the type classes' own tokens (the lead's `--mo-sys-prose-space`) |
| `tokens/base/` | `base.css` | what every theme has: spacing, density, the Tailwind `@theme` names, `--panel-*`, `--theme-*` (from the site shell's files, then `base.css`) |
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

- `--tw-*` declarations (Tailwind's own) and everything inside `@utility`: Tailwind owns them. (The text's colours are not: `--mo-comp-prose-*`, `tokens/base/comp/prose.css`.)
- The section-colour swaps in `global.css` are pure token declarations, so they moved with the same selectors
  (`:root, :is(.mo-text-section.mo-is-…) > *, .mo-editor-text .ProseMirror > …`). Their rules that draw things stayed.
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
5. A `--mo-sys-*` or `--mo-ref-*` token with a plain default (one literal on `:root`: a colour, a length in `px` or `rem`, a number, a
   time) is registered: run `node scripts/gen-token-registry.mjs`, then Prettier (`check:token-registry` fails when the files are out of date).
   A `--mo-comp-*` token that only points at one sys token is read with that token as its fallback, `var(--mo-comp-x, var(--mo-sys-y))`.

## Registered tokens

A theme that writes a faulty value, `--mo-sys-color-primary: banana` or `--mo-sys-shape-corner-large: 3 apples`, must still draw a
valid page. A `var(--x, fallback)` cannot do it: the faulty value is a valid custom property, so its fallback never applies and the
property that reads it becomes invalid (black text, a 0 radius, no background). `@property` can: a token registered with a syntax drops
a value that does not fit and keeps its `initial-value`.

`theme/styles/tokens/<origin>/registry.css` (written by `scripts/gen-token-registry.mjs`, never by hand) registers 153 tokens of
the origins `base`, `ui`, `blocks` and `material`, and the 45 colour roles `colorsCss` writes into the page. Each is `inherits: true`
with its default as `initial-value`:

- The default is the literal in the token's `:root` rule in the first folder that declares it (base, ui, blocks, lists, cards, type,
  material), so a theme that imports only `base.css` never gets Material's value. A colour role's default is the standard colours' light
  value (`defaultColors`).
- A length is written in `px`: `initial-value` cannot hold `rem` or `em` (the whole rule is dropped).
- Not registered: a token whose value is a `var()`, an expression (`calc()`, `clamp()`), a list, a shadow, an easing, a font family, a
  bare `0` (a number or a length), a font-relative or percentage unit (a registered length resolves where it is declared, not where it is
  read), or a token some file writes a value the syntax would reject (`auto`, `none`).
- What the default is for a theme that writes a faulty value: light mode's value for a colour (also in dark mode), and the first value of
  a token that a media query changes (the grid gutter is 16px, not 24px, when a theme's value is faulty on a wide screen). A faulty
  value in a token that is not registered (one that points at another token) is not caught; the token it points at is.
- A registered length reads in `px` (`getPropertyValue` gives `24px`, not `1.5rem`), and a registered colour in `rgb()` or `color()`.

## Renamed tokens

The tokens have Material 3's names, in the pattern Material 3's pattern (`--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`; plan and table in
`docs/superpowers/plans/2026-11-16-token-rename-table.md`), with no alias. `scripts/renamed-tokens.json` lists the old names of every
rename that has landed, and `npm run check:token-names` fails on one that comes back.
