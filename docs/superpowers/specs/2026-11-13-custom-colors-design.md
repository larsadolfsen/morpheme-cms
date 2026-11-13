# Custom colors: set Primary, Secondary and Tertiary freely (design)

Status: ready for the owner's read. Design only, no code. Open questions are in section 10, each with a recommendation.
Built **in 0.17** (owner decision of 2026-11-13). Written 2026-11-13.

Owner's ask: "Add custom setting that lets set all three colors freely."

Words: **generator** is the first tab of Business › Colors. A **harmony** is one of its five palette choices (Analogous …
Triadic). A **base color** is Primary, Secondary or Tertiary. A **role** is one of the site's 45 colors (`colorFields`).
**Custom** is the new choice, a sixth chip after the harmonies.

## 1. Today (read in the code)

- `src/Colors.tsx` `generator()`: three base colors as tiles (`ColorTiles`, `src/ui.tsx`), each with a pen that opens the
  colour sheet (`ColorSheet`: shade area, hue bar, before/after, hex field, swatches; **Cancel**, **Use color** and, on the
  source tile only, **Use and lock**). Then the harmony chips, the colour wheel, the contrast control.
- The saved choice is `dynamic: { source, harmony | variant, contrast, sourceLocked? }` in `src/data/colors.json`
  (`lib/colors.ts`, `lib/dynamic-colors.ts` `Dynamic`). The file also holds every role in both modes (`light`, `dark`); the site
  reads only those (`colorsCss` → `--mo-*`). `dynamic` is the editor's memory of how they were made.
- The secondary and tertiary tiles can already be edited, but only **approximately** (`withBaseColor`: it turns the source
  hue until the harmony's colour is as close as it can get, and `sourceChromaFor` bends chroma). Locking the source disables
  them (`canSetBaseColor`). So today you cannot choose the three colours freely, which is what the owner asks for.
- Every role in a mode comes from one `DynamicScheme` (`schemeOf`); a harmony scheme already builds its own
  `primaryPalette`, `secondaryPalette`, `tertiaryPalette` from a hue and chroma each. Custom reuses that path.
- Readability: `colorPairs` (41 pairs, WCAG AA 4.5:1) is checked in the editor (Save is blocked, `cannotSave`), by
  `checkSite.ts` before the build, and by `check:contrast` on every section color.
- The editor draws itself in the site's colors (`theme.ts` `applyColors`), so a color set here also colors the editor.
- Section colors Primary, Secondary and Tertiary use the role and its on-role as fill and text (`.text-section-*`,
  `--section-fill`/`--section-on-fill`, `theme/styles/blocks.css`); containers use the `*-container` pairs.

## 2. What M3 prints (read 2026-11-13 with Playwright; quotes are verbatim)

- *Color system › How the system works*: "Custom colors – Colors closely match the chosen input colors, such as those
  representing brand or semantic meaning." and "Custom colors, such as brand colors, can individually run through the
  algorithm to create a custom scheme that matches the brand". It also lists "C. Pick it by hand: A hand-picked source color
  is deliberately selected by a designer."
- *Advanced customizations › Adjust existing colors › Define your own baseline scheme*: "By providing your own custom input
  colors for the primary, secondary, tertiary, and neutral colors in the scheme, Material will provide back the scheme's
  regular color roles with values derived from your reference colors." Best practice: "Conventionally, primary and tertiary
  colors are the most visually prominent in the scheme, with tertiary appearing complementary to primary by changing its hue.
  Secondary, neutral variant, and neutral colors match primary in hue but are progressively less chromatic in that order."
  M3's own Theme Builder step reads: "With Custom selected, select Primary" (*Dynamic color schemes › User-generated source*).
  So **Custom** is M3's word.
- Same page, *Use color fidelity*: "Color fidelity is a feature that adjusts tones in these cases to produce the intended visual
  results without harming visual contrast." "By default, fidelity is enabled when you use Theme Builder to create a custom
  baseline scheme or define static colors."
- *Define new colors*: "Define static colors – Formerly known as custom colors": **extra** roles (e.g. Success) beside the
  scheme. That is a different feature (see section 11); we do not build it here.
- *Color roles*: "The color system is built on accessible color pairings. These color pairs provide an accessible minimum 3:1
  contrast." and "apply colors only in the intended pairs … Combining colors improperly may break contrast".
  `customColor()` in Material's library (`@material/material-color-utilities` 0.3.0, `theme_utils.js`) derives four roles from one
  colour at fixed tones: light 40 / 100 / 90 / 10 (color, on, container, on container), dark 80 / 20 / 30 / 90.
- *Color system › How the system works*: three contrast levels, "Standard (default) / Medium / High" (about 3:1 and 7:1 for
  content); tones 50 and 98 give 3:1, 30 and 98 give 7:1.
- *Interaction › State layers*: "The state layer is an overlay with a fixed opacity for each state and uses the same color as
  the content." Nothing is stored for them.
- *Color contrast*: small text 4.5:1, large text and graphics 3:1; "Disabled states do not need to meet contrast requirements."

**M3 is silent on:** how to correct a chosen color that fails (it only offers fidelity on/off), any warning UI, a picker
for custom colors outside Figma, and what the editor itself should look like. Where silent we use the nearest M3 pattern and say so.
Not read: the *Key colors and tones* (palettes) page did not load; the facts above come from the pages listed.

## 3. Decision

A sixth chip **Custom** after the five harmonies. With Custom chosen the three tiles are **Primary**, **Secondary** and
**Tertiary** (the first is no longer called "Source color"), all three pens are on, and nothing is generated between them. M3
conformant: "Define your own baseline scheme", so no entry in `docs/material-deviations.md` for the choice itself.

## 4. The screen

- Tiles as today. Each pen opens the **same `ColorSheet`** (shade area, hue bar, hex field, before/after, swatches). In
  Custom the sheet has **Cancel** and **Use color** only: **Use and lock** and the lock icon are hidden (section 7).
- Starting Custom: the three tiles keep the colors they show now, so nothing jumps. Back to a harmony: the source is Primary
  and Secondary and Tertiary are generated again; the custom pair stays in the screen's state until Save, so the chip can go
  back and forth without loss (no dialog).
- The colour wheel stays and shows the three dots, but is **read-only** in Custom (`ColorWheel` `disabled`, label "Color
  wheel, the colors are set by hand"). The harmony hint is replaced by the Custom hint (section 8).
- Hex typing: `ColorText` already takes `#rrggbb`; `notAColor` explains a bad value.
- **Keyboard-safe:** the hex field sits in a bottom sheet and a phone's keyboard must not cover it or **Use color**. Today
  `pages/editor/index.astro` has `interactive-widget=resizes-content` (Android resizes the page), and `editor.css` sizes
  sheets in `dvh`; nothing handles iOS (no `visualViewport` in `ui.tsx`) and I have not tried a device. Build step C tests
  it (Playwright shrinks the viewport to the keyboard's height) and fixes `BottomSheet` for every sheet if the field or the
  buttons end up behind the keyboard.

## 5. How every role is made

Each base color C (hex, as HCT: hue, chroma, tone) gives a tonal palette `TonalPalette.fromHueAndChroma(h, c)`: Primary,
Secondary, Tertiary. Neutral and neutral variant come from **Primary's hue**, exactly as the harmonies do today (`schemeOf`);
error stays Material's, harmonized to Primary. One `DynamicScheme` then makes all 45 roles in both modes (containers, on-roles,
fixed roles, surfaces, inverse roles, outline), at the chosen contrast level. Custom adds only the step below.

**Contrast by construction.** Material's tones are fixed, so a role's contrast does not depend on the hue or chroma picked.
Computed with the WCAG formula: light Primary 40 on On primary 100 = 6.46:1, container 90 on 10 = 13.27:1, Primary 40 on Surface
98 = 6.15:1 and on Surface container high 92 = 5.27:1; dark Primary 80 on On primary 20 = 7.72:1, container 30 on 90 = 7.24:1,
Primary 80 on Surface 6 = 10.89:1. All above 4.5, for every hue and chroma. A unit test sweeps this (section 9).

**Fidelity (M3's own feature, default on).** The plain M3 tones turn a bright yellow into a dark olive, which is not what an
owner who picks #ffcc00 wants. So, **at Standard contrast only**, a base color's own role (Primary, Secondary, Tertiary) is
the chosen color itself in a mode when it passes. "Passes" = every pair of `colorPairs` it is in (the role on Surface and the
three container surfaces for Primary; On-role on the role), at 4.5:1. The on-color is Material's tone (100 light, 20 dark), or
tone 10 light, 90 dark when that is the one that passes 4.5:1. Containers and fixed roles stay Material's tones (so they
are always readable) and the state layers follow (section 6).

**A choice that fails.** The role takes the **same hue and chroma at the nearest tone that passes**, searched from the chosen
tone towards Material's own tone (40 light, 80 dark) and never past it, which passes by construction. Example: #ffcc00 on
the light Surface is 1.44:1, so in light mode Primary becomes a darker gold, while in dark mode it passes (8:1 or more) and is
**exact**. Saving is never blocked and never silent: under the tiles an **Adjusted for contrast** list says, per base color and
mode, what it became (chosen swatch, used swatch, hex, "darker"/"lighter"). The colors written always pass, so
`cannotSave` cannot fire from Custom. At **Medium and High** contrast no color is kept exact: every role is the scheme's, and
the list says so for each color that changed. M3 is silent on this correction (it only offers fidelity on/off); the rule is the
nearest M3 pattern and is listed in the PR for `material-deviations.md` only if the owner calls it a deviation (section 10).

**Dark mode** is the same rule in the dark column: Material's dark tones, exact when the chosen color passes on the dark
surfaces. **Harmony** of the neutrals: Primary's hue, so grey surfaces tint towards the brand as today.

## 6. State layers, sections, themes, the editor

- **State layers**: not stored. The theme mixes them from the role (`--mo-hover`, `--mo-primary-hover` in `global.css`, 8%
  hover as M3 prints), so they follow any color.
- **Sections** (Surface/Primary/Secondary/Tertiary): the fill is the base color's role, the text its On-role, containers the
  container pairs, all inside `colorPairs`. Surface is unchanged. Nothing in the theme CSS changes. Proof: `check:contrast` once
  by hand on a stress set (section 9).
- **Themes (Material, Venus, others)**: a theme reads `--mo-*` roles only (`global.css` header). The file's `light`/`dark` roles
  are the contract and do not change, so no theme work. Venus and the store's themes live outside this repo and I have not
  opened them; step D runs `check:themes` on the bundled themes and the PM asks `morpheme-appstore` for one Venus screenshot.
- **The editor's own colors follow the site**, as they do today for generated colors (the shared theme principle in
  `CLAUDE.md`). A bad choice cannot hurt the editor, because the pairs the editor uses are the pairs we guarantee. See question 5.

## 7. "Use and lock", saved data, older files

- **Lock** means "the wheel and the harmony must not move the source". In Custom nothing moves a color but the pen, so the lock
  and **Use and lock** are hidden and `sourceLocked` is **not written**. Back to a harmony: the lock is as before Custom
  (it stays in the screen's state).
- **File** (`src/data/colors.json`, `lib/colors.ts`):
  `"dynamic": { "source": "#a3345a", "harmony": "custom", "secondary": "#2f6f5e", "tertiary": "#c47f17", "contrast": "standard" }`.
  `source` is Primary (so the field keeps its meaning), `secondary` and `tertiary` are only in Custom. `light` and `dark` stay the
  truth for the site; they include the corrected colors. `dynamicProblems` accepts `harmony: 'custom'` only with both colors
  and rejects them without it; `checkSite.ts` reports it with the existing `wrongAt` text. `completeColors` makes missing roles
  from the same choice. `fileOf` in `Colors.tsx` writes them.
- **Versions**: the file has no version number; the change is additive, so every older file reads as before. **Risk:** a site that
  goes back to an older CMS reads `harmony: 'custom'` as wrong, shows "The colors couldn't be read" and the default colors
  (a Save there would replace them). Sites only update forward and `next`→`latest` is the owner's call, so we accept it (question 6).
- **App contract** (`docs/app-contract.md`, `lib/sandbox/bundle.mjs`): `lib/dynamic-colors` is exported to apps; the new fields are
  optional and `dynamicColors(dynamic, roles)` keeps its signature. `bundle.test.mjs` must stay green. Content-based colors
  (`ContentBased`, the page-colors hook) are untouched.

## 8. Texts

| Key (`src/i18n/*/colors.ts`, `dynamic.`) | English | Danish |
| :--- | :--- | :--- |
| `custom` (the chip) | Custom | Egen |
| `customHint` | Pick Primary, Secondary and Tertiary yourself. Secondary works best close to Primary in hue and quieter. | Vælg primær, sekundær og tertiær selv. Sekundær passer bedst tæt på primær i farvetone og mere dæmpet. |
| `primary` (tile name) | Primary | Primær |
| `wheelCustom` | Color wheel, the colors are set by hand | Farvehjul, farverne er valgt med hånden |
| `adjustedTitle` | Adjusted for contrast | Justeret for kontrast |
| `adjusted(name, mode, direction, used)` | `{name}` is `{direction}` in `{mode}` so text stays readable: `{used}`. | `{name}` er `{direction}` i `{mode}`, så teksten kan læses: `{used}`. |
| `directions` | darker, lighter | mørkere, lysere |
| `adjustedMedium` | At this contrast level the colors follow Material's scheme. | På dette kontrastniveau følger farverne Materials skema. |

`secondary`/`tertiary` tile names already exist (`preview.secondary`, `preview.tertiary`). Word choice follows the M3 skill
(active, short). `check:language` skips `docs/superpowers/`, so Danish here is allowed.

## 9. Checks

- **Unit test** (`lib/colors.test.mjs` or a new `lib/custom-colors.test.mjs`): sweep 36 hues × 5 chroma × 9 tones for each of the
  three colors, all three contrast levels, both modes: every pair of `colorPairs` ≥ 4.5; exact when it passes, same hue/chroma
  when corrected, `dynamicProblems` accepts and rejects the right files, `completeColors` round-trips a custom file.
- **`check:screens`**: Custom open with a failing color (yellow in light) on a phone and a computer, adjusted list shown,
  keyboard-safe sheet (viewport shrunk).
- **`check:demo`/`npm run check`**: unchanged; the demo's `colors.json` stays a harmony.
- **`check:contrast`** (by hand, not CI): once with a stress fixture (yellow, near-white, near-black, grey, pure blue as
  Primary/Secondary/Tertiary) on every section color, light and dark, phone and computer; `check:themes` for the others.
- `check:editor-colors` should stay green: the new parts take no fixed color (the adjusted list uses the tile's own swatches and the theme's tokens).

## 10. Open questions for the owner (recommendation first)

1. **Name** the choice "Custom" or "Own colors"? *Recommend* **Custom** (M3's word in its Theme Builder and system page).
2. **Exact color where it passes** (M3 fidelity) or always Material's tones 40/80? *Recommend* **exact where it passes**: it is
   what "set them freely" means and M3 itself turns fidelity on for custom baseline schemes.
3. **Neutral colors**: derive from Primary (as now) or add a fourth picker? *Recommend* **derive**; the owner asked for three,
   and M3's neutral input is optional.
4. **The wheel in Custom**: read-only, or each dot draggable? *Recommend* **read-only first**; dragging a dot is a later, small step.
5. **The editor's colors**: follow the site, or keep a fixed M3 look while the site is custom? *Recommend* **follow the site**:
   it already does for generated colors, the pairs guard readability, and a fixed editor would need a second token system.
6. **Downgrade risk** (an older CMS cannot read `harmony: "custom"`). *Recommend* **accept**, as above.
7. **Contrast list for Secondary and Tertiary as text on Surface**: `colorPairs` does not check Secondary or Tertiary on Surface
   today. Add them for every site, or only inside Custom's correction? *Recommend* **only inside Custom** (the correction
   guarantees 4.5:1); adding them to `colorPairs` could stop sites with hand-edited colors from saving.
8. **Branch and version**: build into the `0.17` branch (`minor` allowed there, never `major`, so it stays below `1.0.0`). Not into
   `main`: there only `patch` or empty is allowed until 0.15.1 is released. *Recommend* `0.17`, as decided.

## 11. Not in this spec

Static (extra) colors such as Success, and custom color roles (Material's *Define new colors*), would add roles; the
audit already lists status colors as "a later decision" (`docs/material-deviations.md`, colour sweep 1). Dragging dots on the
wheel, a neutral picker, and per-section custom colors are also left out.

## 12. Build plan (small pull requests into `0.17`, in order)

Step A needs no decision beyond questions 1 to 3 and 7, and can start as soon as the owner has read this spec; each later step
starts when the one before it is merged.

- **A. Engine** (`lib/dynamic-colors.ts`): `harmony: 'custom'`, `schemeOf` branch, fidelity and correction, `customAdjustments()`
  for the UI, `dynamicProblems`, the sweep test. No UI. Empty changeset.
- **B. File and checks**: `Colors.tsx` `fileOf`/`colorsOf`, `checkSite.ts`, `completeColors`, `docs/app-contract.md` note,
  `bundle.test.mjs` green. Empty changeset.
- **C. Screen**: the chip, three tiles with pens, no lock, read-only wheel, adjusted list, texts in English and Danish,
  keyboard-safe sheet (fix if needed), `check:screens` states. Changeset `minor`.
- **D. Proof and notes**: stress `check:contrast`, `check:themes`, the Venus look from the store, `material-deviations.md` if
  the owner asks for it, the release note below.

**Release note** (needed; it changes how a site can look): one **paragraph**, "Set your own colors": "Pick Primary,
Secondary and Tertiary yourself under Business › Colors › Custom. Every other color follows them, in light and dark mode, and
the editor tells you when it adjusts one so text stays readable." English and Danish, written with the `release-notes`
skill (`release-notes/i18n/*/pending/<id>.json`) in step C.
