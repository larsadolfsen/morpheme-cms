# The customizer (notes)

Status: **notes, 21 November 2026.** No version, plan or design yet. This file is where the owner's decisions about a customizer are kept
until a design is written. Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, *Ideas without a version*.

The customizer is where a site owner changes the theme's steps without code. It works for every theme, not only Material.

## Customization is not a deviation

Owner, 21 November 2026: "This is not a deviation in the theme. This is customization. Those things needs to be distinguished and md will
not be the only theme."

A theme's own defaults follow its design system: Material follows M3, and its deviations are listed in `docs/material-deviations.md`. What a
site owner sets in the customizer is the site's choice and is never recorded as a deviation.

## Three levels, one name per token

Owner, 21 November 2026: "Yes, but so the first level is the main themes. Up top of this, we build the theme."

1. **The main theme** (Material) comes first.
2. **The site's theme** is built on top of it.
3. **The site owner's customization** goes on top of both.

The three are CSS cascade layers in that order: `@layer base, theme, custom`. Each layer sets the same tokens, so there are no
`--mo-custom-*` names and no `var()` fallback chains. Components read one name. A value falls back from custom to the theme to the main
theme by layer order alone.

A customization can still be told apart from the theme in two ways:
- by its layer, which the browser's developer tools show;
- by its own data file.

A setting with no M3 token gets a `--mo-` name in M3's pattern (0.20.0's rule).

## Steps, not values

Owner, 21 November 2026: "I agree on switching steps rather than complete customization. This is also one of the things we say we want to
keep it simple."

A customization is saved as a step of the theme's scale, never as a value. For example, cards use corner *extra-large* and elevation
level 2, never `24px`. The custom layer points a component token at a system step:
- **System tokens** are the scale (`--mo-sys-shape-corner-medium`, `-large`, `-extra-large`).
- **Component tokens** say which step a part uses (`--mo-comp-card-container-shape`).

The cascade picks the winner of each token on its own. The component token comes from the custom layer. The step's size comes from the theme
if the theme sets it, otherwise from Material. So the same choice is drawn in every theme's own sizes.

### Example: a card's corner radius

Material draws cards at *medium* (12 px). A theme points cards at *large* (16 px). The site owner picks one step rounder, *extra-large*:

```css
@layer base, theme, custom;

@layer base {
  /* Material */
  :root {
    --mo-sys-shape-corner-medium: 12px;
    --mo-sys-shape-corner-large: 16px;
    --mo-sys-shape-corner-extra-large: 28px;
    --mo-comp-card-container-shape: var(--mo-sys-shape-corner-medium); /* 12 */
  }
}
@layer theme {
  /* the theme points cards one step up */
  :root {
    --mo-comp-card-container-shape: var(--mo-sys-shape-corner-large); /* 16 */
  }
}
@layer custom {
  /* the site owner picks "one step rounder" */
  :root {
    --mo-comp-card-container-shape: var(--mo-sys-shape-corner-extra-large);
  }
}
```

The card's step comes from `custom` (extra-large). Its size comes from the theme if the theme sets `--mo-sys-shape-corner-extra-large`,
otherwise from Material (28 px). A site owner never stores `24px`. If a theme wants exactly 24, it sets its extra-large to 24.

### Switching theme

- The choices stay, and the new theme's sizes draw them.
- A choice the new theme has no setting for is kept but not applied. It comes back when the site switches back.
- Each setting has a reset, and one reset clears them all.

## The layers are the build's job

The build puts each part's CSS in its layer (`@import … layer(theme)`):
- Material's CSS in `base`;
- the theme's CSS in `theme`;
- the customizer's CSS in `custom`.

A theme needs no change. CSS outside a layer beats every layer, so nothing is left unlayered.

## Settings saved so far

- **Block looks** (owner, 21 November 2026: "theme customizer so that blocks can be changed eg. Elevation and border radius"). A site
  owner changes a block's look, such as its elevation and its corner radius, within the theme's steps.
- **Shadows at rest (`On`/`Off`)** (owner, 20 November 2026: "No, save the shadow changer in a none planned customizer feature").
  - A site-wide setting that turns the resting shadows off (the `--mo-sys-elevation-levelN-rest-shadow` tokens).
  - The lift when a part is pointed at or dragged stays.
  - M3: "use shadows only when required".
  - Source: `specs/2026-11-20-elevation-design.md`.
- **Component levels** (moved from 0.22.2; owner, 20 November 2026: "Agreed on moving 0.22.2").
  - Each component's level is a number that expands into its `--mo-comp-*` tokens (colour, shape, density), the component-token
    direction of `specs/2026-11-17-list-to-cards-design.md`.
  - It changes the contract (`THEME_API`, `APP_API`; a new contract is never major) and reads the steps table of 0.22.0.
  - Written 20 November as "never elevation", because a component keeps M3's level (M3: "Avoid changing the default elevation of Material
    components"). That applies to a theme's own defaults. *Block looks* lets a site owner change elevation as a customization, not a
    deviation, so the design settles how the two fit.
