# The brand pack

The logos of the brands the CMS draws by name, the same under every icon pack (Material Symbols, a theme's own pack, Phosphor or
Lucide): `facebook`, `x`, `linkedin`, `pinterest`, `github` and `google`. The stored icon names `facebook-logo` … `google-logo` map to
`{ brand: '<name>' }` in `lib/materialIconMap.mjs`; `lib/brandLogos.mjs` finds the brand and `src/icon.tsx` draws it. A brand is never a
Material icon (owner, 24 Nov 2026; `docs/material-deviations.md`, BL1).

Each file is the brand's real mark, single colour (`fill="currentColor"`), in a 24 × 24 viewBox like the Material Symbols.

## Source and terms

All six come from [Simple Icons](https://simpleicons.org) 13.21.0 (`simple-icons` on npm), which publishes each brand's official mark as
one path in a 24 × 24 viewBox. The files are released under CC0 1.0; the marks themselves are trademarks of their owners and are
used here only to point to the brand's own service (a share button, a profile link, a sign-in), as each brand's guidelines allow:

| File | Brand | Mark |
| :--- | :--- | :--- |
| `facebook.svg` | Facebook | the "f" logo in a circle |
| `x.svg` | X | the X mark (not the old Twitter bird) |
| `linkedin.svg` | LinkedIn | the "in" square |
| `pinterest.svg` | Pinterest | the "P" in a circle |
| `github.svg` | GitHub | the Octocat mark |
| `google.svg` | Google | the "G" |

Each file's `<title>` and `role` were removed (the icon is hidden from screen readers or named by its use) and `fill="currentColor"`
added; the path is unchanged. No brand is drawn by us: every brand here has an official mark. Where one has none, draw our own standard
SVG, put it here and say so in this table.

`x-logo.svg` is the older copy of X's mark that the icon packs' own files (`OWN_ICONS` in `site/icons.mjs`) are written from.
