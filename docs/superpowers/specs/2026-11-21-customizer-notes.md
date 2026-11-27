# The customizer (notes)

Status: **notes, 21 November 2026.** No version, plan or design yet. This file is where the owner's decisions about a customizer are kept
until a design is written. Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, *3.1 The customizer*, major 4 (owner, 27 Nov 2026).

The customizer is where a site owner changes the theme's steps without code. It works for every theme, not only Material.

## Tokens, not code

Owner, 27 Nov 2026: "The customizer will not change code, but change tokens". The customizer writes token values only, in the `custom`
layer below: never a theme's or a block's code, CSS rules or markup. What it can change is what a theme exposes as a token; a look
that has no token gets one in the theme first. Example (owner, 27 Nov 2026: "Eg. Increase elevation of an element"): a card's
elevation goes from level 1 to level 3 by setting its component token (`--mo-comp-card-…-elevation`) to another of M3's levels, in
the `custom` layer; the card's code is untouched. And for the whole site (owner, 27 Nov 2026: "Or the border radius of the site"): the corners of
every part change by setting the shape scale's tokens (`--mo-sys-shape-corner-*`) to other steps. So the customizer works at two
levels: the system's tokens for the whole site, and a component's tokens for one kind of part. It is a major release, 4.0, built in line 3.1 (owner, 27 Nov 2026: "It is a major
release").

## The customizer is the Style screen

Owner, 27 Nov 2026, with screenshots of the editor: "We already have it in motion and color. These are the customizer sections". The
customizer is the editor's *Style* screen and its sections: Color, Elevation, Icons, Motion, Shape, Spacing and Typography. Color and
Motion already let the owner choose (Motion: *Expressive*, *Standard* and *Calm*, with the theme's choice marked; `MotionSchemes` in
`src/Library.tsx`, `lib/motion.ts`); the others show the theme's tokens. Line 3.1 makes every section choosable the same way: named
choices the CMS defines on the shared `--mo-` tokens, each a set of token steps, with the theme's choice as the default. Because the
choices are the CMS's and set tokens every theme already reads, they need no contract change.

*Icons* is the icon set the site draws with (owner, 27 Nov 2026: "Icons is the icon set that is active eg. Lucide or material"):
Material Symbols, or a pack installed from the store, such as Phosphor, or Lucide once it is back (0.32.0). It picks a pack, not a
token; a pack is files keyed by Material Symbols' names (`CLAUDE.md`, *Icons are Material Symbols*), so no code changes either.

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
- **The menu's edge** (owner, 21 November 2026: "I agree with them, but this is customization"). M3 puts the navigation drawer on the
  start edge, and so does the standard; a site owner may put the menu and its button on the end edge. It is already a setting
  (`menuSide`, *Globals › Header*) and moves into the customizer when there is one.
- **Component levels: dropped** (owner, 27 Nov 2026: "It shouldn't change the contract because I already told you to implement elevation
  as a state"). Elevation is already tokens per state (`--mo-sys-elevation-levelN-rest-shadow` and the level's shadow,
  `specs/2026-11-20-elevation-design.md`), so the customizer sets those tokens and no part needs a level that themes would have to
  define. The customizer changes no contract.