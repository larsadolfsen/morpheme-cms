# CSS custom properties

Owner rule, 16 Nov 2026. `npm run check:css-tokens` enforces it.

- **A shared value is a `--mo-…` token.** The CMS owns the name. The theme sets its value once at the top (`:root`), and that is the theme's look. A
  block, an app block or a section may override the same `--mo-…` name on its own root element (its first element, also inside a media query for a
  phone), and everything inside it inherits the value. That is why tokens are easy to exchange.
- **Nobody makes a second name for the same thing.** No `--venus-gap`, no `--blog-gap`, no theme or app prefix for a value that has a `--mo-…` name. If
  a block needs a value the CMS has no `--mo-…` name for, the name is added to the CMS's list and documented here; the block does not invent its own.
- **A token only one block uses is declared on that block**, not on `:root`.
- **Nothing unprefixed on `:root`, `html` or `body`.** Generic names such as `--mo-comp-card-gap` are global: an app or theme that declares the same name
  overrides ours without a sound.
- **An app or a theme declares no name the CMS declares** (a collision), and no unprefixed name on `:root`.

- **A theme's private value is `--mo-theme-*`** (spec `2026-11-20-scoped-app-css-design.md`). The CMS never declares the prefix, so a token it adds later cannot collide with it. Only files in the
  theme's own folder (`src/themes/<theme>/`) declare or read one: not an app, not the site's other files, not another theme (`check:content`, so `check:themes`). It is the last resort: a value that has a
  `--mo-` token is set through that token. An app's own private properties are renamed by the build (`--mo-app-<id>-<name>`, `docs/app-contract.md`, "Contract 8").

## What the check allows

- Nothing else: no `--tw-*`, and no Tailwind theme namespace (`--color-*`, `--breakpoint-*` …); Tailwind and its `@theme` are gone (contract 7, `docs/app-contract.md`). The old names it gave are in `scripts/renamed-tokens.json`.
- **Count mode until the rename lands.** The unprefixed names that exist today are counted per file in the same list (`files`): a file may have as many as
  listed, never more, and a new file none. A count can only fall: lower it when it does.

## The report

`node scripts/check-css-tokens.mjs --report` lists the names declared on `:root` that nothing reads, and those only one place reads (a part's class in
a stylesheet, or one source file). Those move into that place's stylesheet, never onto `:root`, when the rename happens. The report never fails the
check; the summary line of `npm run check:css-tokens` shows its two counts.
