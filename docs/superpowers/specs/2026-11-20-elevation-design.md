# Elevation (spec)

Status: **20 November 2026.** Ships in **0.19.5 UI fixes** (owner: "add it to the 0.19 ui fixes"). One decision is still the
owner's (*Decisions for the owner*, below).

Owner, 20 November 2026: "write the spec now, but only elevation". This spec is the elevation part of *Component steps*
(roadmap `plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.22). It covers elevation only: the colour roles, the type scale, shape, motion,
density and state layers will get their own specs later. The steps table (0.22.0) will produce later what this spec has
written by hand, without changing it.

## What Material 3 says

The CTO read the three elevation pages with Playwright on 20 November 2026 (skill `material-3`):
`m3.material.io/styles/elevation/overview`, `/applying-elevation` and `/tokens`.

- **Levels.** "Material uses six levels of elevation … 0, +1, +2, +3, +4, and +5. An element's resting state can be on levels 0 to
  +3, while levels +4 and +5 are reserved for user-interacted states such as hover and dragged."
- **Values are the platform's.** "Tokens have no shadows or color; each platform determines the specific shadows and values to use at
  each elevation level." Also: "Elevation has no shadow or value of its own by default."
- **Default levels.** "All components have a default resting elevation. Avoid changing the default elevation of Material components."
- **Interaction.** "Components should change elevation in response to system events or user interaction, like hovering. This
  elevation change should be consistent across all similar elements. … All Material buttons increase elevation by 1 level when
  hovered."
- **Few shadows.** "Instead of applying shadows by default to all levels, use shadows only when required to create additional
  protection against a background or to encourage interaction." Also: "When it comes to applying shadows, less is more."
- **Tone.** "By default, Material 3's surfaces use tonal difference to indicate separation." Also: "Any overlapping containment
  areas or components should have different color roles in order to visually communicate separation."
- **Contrast.** "For interactive components, edges must create sufficient contrast between surfaces (by meeting or exceeding
  accessible contrast ratios) for them to be seen as separate from one another."
- **Scrims.** "Scrims use the scrim color role at an opacity of 32%."
- **Component levels.** The tokens page lists each component's resting level, for example level 3 for FAB, dialogs and search, and
  level 1 for the elevated card and the modal bottom sheet.

## What Morpheme has today (0.18, cards and lists)

- **Tokens.** Each level is a token pair, `--mo-sys-elevation-levelN-color` and `-shadow`, from 0 to 5, with dark-mode shadows. There
  is also `-rest-shadow`, the shadow at rest, which a theme can turn off while keeping the lift. They live in
  `theme/styles/tokens/ui/ref.css` and `tokens/material/ref.css`.
- **Parts.** Every M3 part has the level M3 prints, for every state, as its own `--mo-comp-*` token, so a theme can change one part.
  `theme/styles/elevation.test.mjs` checks this.
- **Scrim.** It is `--mo-sys-color-scrim-overlay`, the scrim role at 32%, as M3 says.
- **Tokens screen.** The editor shows the levels on its tokens screen (`src/Tokens.tsx`).

What is missing:

1. **No way for a plain element to take a level.** This covers a block's own box, a theme's layout or an app's panel. Today such an
   element has two options. It can read the tokens in its own rule, as `theme/styles/blocks/person-facts.css` does. Or it can write
   a shadow by hand.
2. **Nothing stops a hand-written shadow.** `check:css-values` checks shape and type values but not shadows. Today there is one such
   shadow: the colour picker's handle (`src/editor-ui.css`), which uses `rgb(0 0 0 / 0.3)` and `0 2px 6px`. Three rules still
   carry Tailwind's empty shadow lists (`0 0 transparent` four times) in front of the token (`src/editor-settings.css` ×2,
   `src/editor-screens.css`).
3. **Deviation 12 is still open.** `docs/material-deviations.md`, item 12, says our shadow values are "not yet compared with the M3
   spec". The tokens page settles it: the values are the platform's to choose.

## The design

### The classes `mo-elevation-0` to `mo-elevation-3`

A plain class for a plain element, like `mo-type-*`. It goes in `@layer utilities`, in `theme/styles/elevation.css`, which is
imported where `type.css` is.

- **At rest:**
  - `background-color: var(--mo-sys-elevation-levelN-color)`;
  - `color: var(--mo-sys-color-on-surface)`;
  - `box-shadow: var(--mo-sys-elevation-levelN-rest-shadow)`.

  Level 0 has no shadow.
- **Only 0 to 3.** M3 says "An element's resting state can be on levels 0 to +3", so there are no classes for 4 and 5.
- **Pointed at.** Only an element that can be clicked moves up, and only when the device can hover: `a`, `button`, `summary`,
  `[role=button]` or `[tabindex]`. Its shadow becomes level N+1's (`-shadow`, so it lifts even when resting shadows are off). M3:
  "increase elevation by 1 level when hovered". The colour stays the same, because the state layer shows the hover, as on the parts.
- **Dragged.** `[data-dragged]` gives level N+3's shadow. That is M3's step for cards: filled 0 → 3, elevated 1 → 4. It is never
  above 5.
- **Focus.** With focus, the element stays as at rest, like the parts (`tokens/ui/ref.css`). The focus ring shows the focus.
- **Motion.** The change of shadow uses the theme's effects spring (`var(--mo-sys-motion-spring-default-effects)`) and no duration of its own.
- **Never on an M3 part.** A part has its own level for every state, and a class would win the cascade and freeze it. To give a part
  another level, a theme sets the part's `--mo-comp-*` token. The check below fails when a `mo-elevation-*` class sits on an
  element that has a part class (the part classes of `theme/styles/files.mjs`).
- **On a section colour.** The level colours are surface containers. The batch checks the classes on every section colour in light
  and dark mode (`check:contrast`), because M3 asks for edges with "sufficient contrast". Where a level doesn't stand out on a
  section colour, the section's swap in `theme/styles/global.css` gives it the matching container role. The class never writes a
  colour of its own.

Who uses it:

- the CMS's own blocks and layouts in place of their own level rules, starting with `person-facts.css`;
- themes in their layouts and templates;
- apps in their blocks' `View.tsx`.

The classes are listed where `mo-type-*` is described, and later in the developer guide (0.22.1).

### The check

`check:css-values` gets shadows. It covers the same files and uses the same allowlist with reasons
(`scripts/check-css-values.allow.mjs`).

- **What fails.** It runs on every `box-shadow` and `filter: drop-shadow()` in the CSS, and on every `boxShadow` in TSX. An entry
  fails if it is not `inset` and has a blur or an offset, unless it is:
  - a level token, `var(--mo-sys-elevation-levelN-shadow)` or `-rest-shadow`;
  - a part's `--mo-comp-*` variable whose fallback is a level token.

  The message names the fix: "Use `var(--mo-sys-elevation-level2-shadow)` or the class `mo-elevation-2`", with the nearest level.
- **What passes.** Lines and rings are not elevation and pass:
  - inset edges;
  - spread-only rings with no offset and no blur, such as focus rings and outlines;
  - the `kbd` key edge, which has an offset and no blur (allowlisted: it draws a key, not a height).
- **The level definitions.** They are the one place values are written (`tokens/ui/ref.css`, `tokens/material/ref.css`), and they
  are exempt.
- **The second rule.** The check also fails on a `mo-elevation-*` class together with a part class (above).

Themes and apps are not checked in this release. Holding them to it would change the theme contract (`themeProblems`), so it waits
for a contract raise and is noted for the steps table.

### The fixes that come with it

- **The colour picker's handle** sits over a busy gradient, which is M3's case for a shadow: "Protect elements". It gets
  `--mo-sys-elevation-level1-shadow` together with its white edge.
- **Tailwind's empty shadow lists** go, leaving just the token.
- **Deviation 12** in `docs/material-deviations.md` is closed with the tokens page's sentence and the date.

## Decisions for the owner

1. **Component levels in the customizer (0.22.2).** The roadmap lets a site owner set each component's level ("Top app bar: level
   2"). M3 says "Avoid changing the default elevation of Material components". A theme can already change one part's level through
   its token.

   **Recommendation:** leave elevation out of 0.22.2's component levels. Give the customizer one M3 setting instead, *Shadows at
   rest* (`On`/`Off`), which sets the `-rest-shadow` tokens. M3 supports that choice ("use shadows only when required").
2. **When.** Decided by the owner on 20 November 2026: "add it to the 0.19 ui fixes". It ships in **0.19.5**, the 0.19 line's fix
   release, as two pull requests into that release's feature branch. It needs no contract change for the CMS's own code.

## Batches (pull requests into the 0.19.5 feature branch)

1. **The classes.** If it is 0.19.5's first pull request, it sets the version (`plans/2026-11-19-version-at-feature-start.md`).
   It adds `theme/styles/elevation.css` with its tests in `elevation.test.mjs`: levels 0 to 3 only, the hover and dragged steps, and no colour of their own. The tokens screen
   shows a sample of each class. `person-facts.css` uses the class. `check:contrast` passes on every section colour.
2. **The check and the fixes.** Adds shadows and the part rule to `check:css-values`, fixes the colour picker's handle, removes
   Tailwind's empty shadow lists and closes deviation 12. Adds a release note line, because a theme or app developer can now use the
   class (skill `release-notes`).

Elevation is done when `check:css-values` fails on a hand-written shadow, the classes are on the demo and on the tokens screen,
the owner has seen them on the demo, and 0.19.5 has run on staging.
