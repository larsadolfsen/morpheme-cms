# Type classes

The theme's 16 type styles (Material 3's 15 type roles and the lead) are plain classes in `theme/styles/type.css`: `type-display-large` to
`type-label-small`, and `type-lead`. Each sets size, line height, weight and tracking from the role's four tokens (`--type-<role>-size`,
`-line-height`, `-weight`, `-tracking`), which the theme sets in `theme/styles/ui.css`. The classes sit in `@layer utilities`, in
alphabetical order, where Tailwind's `@utility` rules were.

`type-lead` also sets `--prose-space: 1.5rem`. Two spellings Tailwind wrote are kept for the markup that still uses them, and go with it:
`[&>p:first-child]:type-lead` and `medium:type-…` (`type.css`, last rules).

The demo's page `/type/` shows every style with its class name and the size, line height, tracking and weight read from the computed style
(`demo/src/content/pages/type.md`, `demo/public/demo-type.js`). `theme/styles/typescale.test.mjs` checks the tokens against Material 3's table
and `type.css` against the tokens; `scripts/screens/type.mjs` checks the page at 375 and 1280.
