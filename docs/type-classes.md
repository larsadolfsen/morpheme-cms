# Type classes

The theme's 16 type styles (Material 3's 15 type roles and the lead) are plain classes in `theme/styles/type.css`: `mo-type-display-large` to
`mo-type-label-small`, and `mo-type-lead`. Each sets size, line height, weight and tracking from the role's four tokens (`--type-<role>-size`,
`-line-height`, `-weight`, `-tracking`), which the theme sets in `theme/styles/tokens/ui/ref.css`. The classes sit in `@layer utilities`, in
alphabetical order, where Tailwind's `@utility` rules were.

`mo-type-lead` also sets `--mo-sys-prose-space: 1.5rem`. Two spellings Tailwind wrote are kept for the markup that still uses them, and go with it:
`[&>p:first-child]:mo-type-lead` and `medium:mo-type-…` (`type.css`, last rules).

The demo's page `/typography/` shows every style with its class name and the size, line height, tracking and weight read from the computed style
(`demo/src/content/pages/typography.md`, `demo/public/demo-type.js`). `theme/styles/typescale.test.mjs` checks the tokens against Material 3's table
and `type.css` against the tokens; `scripts/screens/type.mjs` checks the page at 375 and 1280.

Text lists (bullet, numbered, check list) are not classes: they are `prose` rules (the Tailwind typography plugin for `ul`/`ol`, and
`.prose ul.contains-task-list` in `theme/styles/blocks.css` for the check list). They stay there until `prose` moves into our own CSS (step 7
of the plan). The Typography page shows each of them with the values the browser gives their first item.
