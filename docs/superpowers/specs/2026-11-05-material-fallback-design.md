# Material as every theme's fallback (design)

> **Status:** approved by the owner on 5 November 2026. Release as a minor version first; Venus (`morpheme-apps`)
> follows on the released version.

## Problem

A theme imports `@morphemecms/cms/theme/styles/base.css` and overrides variables. Venus does this. But the styles of
the parts every theme inherits live only in Material's `theme/styles/global.css`: the top app bar's menu items
(`.md-nav-item`, `.md-nav-toggle`), the menu's focus, the extended FAB (`[data-fab]`), the navigation drawer
(`.md-drawer-*`, `.navigation-drawer-*`), the footer (`.md-footer*`), the testimonial mark and the corners of pictures
in long text. A theme without its own `Header.astro` and `Footer.astro` gets Material's components without their
styles. Venus is broken that way today.

## Decisions (owner, 5 November 2026)

- The fallback is a safety net. When a theme developer forgets a style, the theme does not break.
- A theme decides how everything looks. Nothing is predefined that a theme cannot change.
- The fallback is the complete standard theme, Material (id `saturn`), not the bare `base.css`.
- There are no live sites and only two themes (Material and Venus), so a stricter theme check breaks nothing.

## Design

1. **Every theme imports Material.** The `styles/global.css` of a theme other than the standard theme imports
   `@morphemecms/cms/theme/styles/global.css` and writes its own variables and rules after it. Anything the theme
   does not write is Material's.
2. **The theme always wins.** Material's rules sit in a cascade layer named `fallback`, declared last in the layer
   order: `@layer theme, base, components, utilities, fallback;`. A theme's unlayered rule beats every rule in
   `fallback`, whatever the specificity.
   - Every top-level rule in Material's CSS chain (`theme/styles/base.css`, `ui.css`, `blocks.css`, `components.css`,
     `global.css`) that sets anything other than custom properties moves into `@layer fallback`, in the same order.
     This includes such rules inside top-level `@media` and `@supports` blocks.
   - `fallback` is above `utilities`, as unlayered rules are today. Material's own rendering therefore does not change.
   - Rules that set only custom properties stay unlayered. A theme's `:root` comes later, so it wins by order. Rules
     such as `.text-section-accent > *` keep their inverted colours inside an accent section.
   - Rules already in `@layer base` or `@layer components` stay there; they are below a theme's unlayered rules already.
   - `@font-face`, `@keyframes`, `@property`, `@theme`, `@utility`, `@custom-variant`, `@plugin`, `@source` and
     `@import` stay at the top level.
   - Material's CSS has no `!important` today; the fallback keeps none (a layered `!important` beats an unlayered one).
3. **The theme check enforces it.** In `site/theme.mjs` `themeProblems`: the standard theme's `global.css` imports
   `./base.css`; every other theme's `global.css` imports `@morphemecms/cms/theme/styles/global.css`. An import of only
   `base.css` or `ui.css` is a problem, with a message that names the import to write.
4. **Docs.** The header of `site/theme.mjs` and the headers of the changed CSS files say that Material is the
   fallback and the theme wins.

## Not in scope

- Venus's own look for the parts Material now draws under it: next step, in `morpheme-apps`, on the released version.
- Sara's `sara` theme in `saravafaiblom/Sarashjemmesidedata` (imports `ui.css`): it changes when her site moves to
  Venus (`morpheme-website/docs/superpowers/specs/2026-11-04-sara-site-onto-cms-package-design.md`).

## Checks

- A Node test reads Material's CSS chain with `postcss` and fails when a top-level rule outside a layer sets anything
  but custom properties, when the layer order does not end in `fallback`, or when the chain has `!important`.
- `site/theme.test.mjs` covers the new import rule: Material's import passes; `base.css` or `ui.css` alone fails.
- Material looks the same: screenshots of the demo (home, a page, a blog post, the blog, 404; phone and desktop) and
  of the editor screens, before and after, are pixel-identical.
- `npx prettier --check .`, `node --test` over the `*.test.mjs` files and `npm run build` pass.
