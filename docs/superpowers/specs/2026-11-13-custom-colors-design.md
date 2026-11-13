# Custom colors: set Primary, Secondary and Tertiary freely (design)

Status: ready for the owner's read. Design only, no code. Revised 2026-11-13 after the owner's answers (section 10); two questions are still open, each with a recommendation.
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

A sixth chip **Custom** (Danish **Tilpasset**) after the five harmonies. With Custom chosen the three tiles are **Primary**,
**Secondary** and **Tertiary** (the first is no longer called "Source color"), all three pens are on, and nothing is generated
between them. M3 conformant: "Define your own baseline scheme", so no entry in `docs/material-deviations.md` for the choice itself.
The owner decided every question of the first draft in chat on 2026-11-13 (section 10); this version follows those decisions.

## 4. The screen

- Tiles as today. Each pen opens the **same `ColorSheet`** (shade area, hue bar, hex field, before/after, swatches). In
  Custom the sheet has **Cancel** and **Use color** only: **Use and lock** and the lock icon are hidden (section 7).
- Starting Custom: the three tiles keep the colors they show now, so nothing jumps. Back to a harmony: the source is Primary
  and Secondary and Tertiary are generated again; the custom pair stays in the screen's state until Save, so the chip can go
  back and forth without loss (no dialog).
- **The colour wheel is live in Custom: all three dots are draggable, and dragging a dot changes only its own color**, never the
  other two (in a harmony it works as today: the big dot drives the others). A dragged dot keeps its tone, so a cream stays
  light (a new `wheelColorAt(x, y, tone)` beside `wheelColor`); only hue and chroma follow the pointer. Each dot is a
  `role="slider"` with arrow-key steps like the sheet's hue bar, and its label names it ("Primary: drag to change this color").
  The Custom hint replaces the harmony hint ("Drag a dot to change only that color.").
- Hex typing: `ColorText` already takes `#rrggbb`; `notAColor` explains a bad value.
- **Keyboard-safe:** the hex field sits in a bottom sheet and a phone's keyboard must not cover it or **Use color**. Today
  `pages/editor/index.astro` has `interactive-widget=resizes-content` (Android resizes the page), and `editor.css` sizes
  sheets in `dvh`; nothing handles iOS (no `visualViewport` in `ui.tsx`) and I have not tried a device. Build step C tests
  it (Playwright shrinks the viewport to the keyboard's height) and fixes `BottomSheet` for every sheet if the field or the
  buttons end up behind the keyboard.

## 5. How every role is made, and when the editor asks

### 5.1 The scheme

Each base color gives a tonal palette `TonalPalette.fromHueAndChroma(h, c)` of its own hue and chroma. Neutral and neutral
variant come from **Primary's hue**, as the harmonies do today (`schemeOf`); no fourth picker. Error stays Material's, harmonized
to Primary. One `DynamicScheme` makes all 45 roles in both modes (containers, on-roles, fixed roles, surfaces, inverse roles,
outline), at the chosen contrast level.

### 5.2 The chosen colors are exact

M3's fixed tones (light Primary 40, dark 80) move a chosen color: a bright yellow becomes a dark olive. The PM measured Google's
key-palette scheme (session `session_01GGzusQRiDBHfSegdaJo8qU`; the table file was not readable from this session, so these are
the PM's numbers): it never fails a pair (0 of 40 across 3 sets × 6 orders), but it moves colors, saturated ones by ΔE 17–27 and
pale ones to a dark taupe or slate by ΔE about 50. So, as M3's fidelity says ("adjusts tones … to produce the intended visual
results"), **the role Primary, Secondary or Tertiary is the color the owner chose, in light and in dark mode**, exactly. Only the
roles made *from* it change with the scheme: containers, on-containers and fixed roles take Material's tones (light 90/10,
dark 30/90), so they are readable by construction (WCAG: container 90 on 10 = 13.27:1, dark 30 on 90 = 7.24:1). The on-color of
a fill is Material's (100 light, 20 dark) when it gives 4.5:1, else white or black, whichever is higher; one of them is always at
least 4.58:1, so **a chosen color is always readable as a fill with its text**. The Contrast control (Standard/Medium/High) only
changes the roles the scheme makes (surfaces, containers, on-containers, outline); it never moves a chosen color.

### 5.3 What each color is used for, and what is checked

M3 does not say how a custom color may be used. Read in the code, the three are used so:

| Color | Used as | Check | Where in the code |
| :--- | :--- | :--- | :--- |
| Primary | fill, with On primary text | 4.5:1 | `on-primary` on `primary` (`colorPairs`) |
| Primary | text, links and icons on Surface | 4.5:1 | `primary` on Surface and containers (`colorPairs`) |
| Secondary, Tertiary | fills and containers, with their text | 4.5:1 | `on-secondary`, `on-tertiary` pairs (`colorPairs`) |
| Secondary, Tertiary | icon color a block's owner picks (`iconColor`) | 3:1 on Surface | `src/iconColor.ts`, `data-icon-color` in `blocks.css` |
| Secondary | the focus ring of list items | 3:1 on Surface | `--list-item-focus-indicator-color` in `global.css` |

Secondary and Tertiary are **never text**, and they are **not checked against the page background otherwise**: a cream Secondary
stays cream. Large text and graphics need 3:1 (M3, *Color contrast*).

Measured with the WCAG formula against the light Surface (tone 98) and the dark Surface (tone 6): fills with text always pass
(5.65:1 or more for the nine colors of section 9); the cases that **fail** are Primary as text on the light Surface (#F34E3D 3.34,
#2589D8 3.53, #FF6574 2.71), a cream Secondary as an icon or focus ring (#F5E8CC 1.15, light), and a dark Tertiary as an icon
in dark mode (#55263D 1.53). Those are the cases the editor asks about.

### 5.4 The question: "Fix this to improve accessibility?"

**No silent correction.** Whenever a chosen color cannot meet its check in a use above, in either mode, the editor asks
(never in a way that blocks the pick itself):

- Where: an inline `Notice` under the tiles, shown after a pen's **Use color** or when a wheel drag ends (never while dragging).
  It names each failing use with its numbers, in both modes, and has two buttons: **Fix** (primary, recommended) and **Keep**.
- **Fix** = the same hue and chroma at the **nearest tone that passes** in that use and mode, searched from the chosen tone
  (never past Material's own tone, which passes by construction). The **Adjusted for contrast** list under the tiles then
  shows, per color, use and mode: chosen swatch, used swatch, hex, "darker" or "lighter".
- **Keep** = the exact color stays, even if hard to read. A warning stays under the tile ("kept as you chose it, it may be hard
  to read"), with the numbers.
- An **unanswered** question is the same state as a hard-to-read color today: **Save is blocked** (`cannotSave`, with "Answer the
  question about {name} first") and the screen scrolls to the question. Nothing is ever saved without an answer.
- **Primary kept as text on Surface** is the one answer that makes a pair of `colorPairs` fail on purpose. It is saved as
  `dynamic.kept: ["primary"]`; `lowContrast` in the editor and in `checkSite.ts` skip the four `primary on surface…` pairs while
  it is there, so neither Save nor the build stops on a choice the owner made. Nothing else can fail a pair (5.2).
- **Icon and focus ring (3:1)** are fixed without touching the fill: M3's own pattern for a use a role does not cover is a
  custom color role (*Define new colors › Define custom color roles*, whose example is a "primary graphic" at tone 50 with 3:1).
  So two roles are added, **Secondary graphic** and **Tertiary graphic** (`secondary-graphic`, `tertiary-graphic`, both modes).
  They equal the chosen color; **Fix** makes them the nearest passing tone; **Keep** leaves them equal. The theme draws icon color
  and the list focus ring from them, with `var(--mo-secondary-graphic, var(--mo-secondary))` so a theme that does not read them
  still works (question 9). A harmony makes them from its scheme (tone 50 of the palette, as M3's example).

## 6. State layers, sections, themes, the editor

- **State layers**: not stored. The theme mixes them from the role (`--mo-hover`, `--mo-primary-hover` in `global.css`, 8%
  hover as M3 prints), so they follow any color.
- **Sections** (Surface/Primary/Secondary/Tertiary): the fill is the exact chosen color and the text its On-color (4.5:1 by 5.2);
  containers use the container pairs. A cream Secondary section is cream with dark text. Surface is unchanged. Proof:
  `check:contrast` once by hand on the three palettes of section 9 (and a stress set).
- **Themes (Material, Venus, others)**: a theme reads `--mo-*` roles only (`global.css` header). The file's `light`/`dark` roles are
  the contract; the two new graphic roles are additive and fall back to Secondary/Tertiary. Venus and the store's themes live
  outside this repo and I have not opened them; step D runs `check:themes` on the bundled themes and the PM asks `morpheme-appstore`
  for one Venus screenshot.
- **The editor's own colors follow the site**, like every other color setting (the shared theme principle in `CLAUDE.md`).

## 7. "Use and lock", saved data

- **Lock** means "the wheel and the harmony must not move the source". In Custom nothing moves a color but the pen or its own
  dot, so the lock and **Use and lock** are hidden and `sourceLocked` is **not written**. Back to a harmony: the lock is as before.
- **File** (`src/data/colors.json`, `lib/colors.ts`):
  `"dynamic": { "source": "#a3345a", "harmony": "custom", "secondary": "#2f6f5e", "tertiary": "#c47f17", "contrast": "standard", "kept": ["primary"] }`.
  `source` is Primary; `secondary` and `tertiary` are only in Custom; `kept` only when the owner kept Primary as hard to read.
  `light` and `dark` stay the truth for the site and hold the exact or fixed colors and the two graphic roles. `dynamicProblems`
  accepts `harmony: 'custom'` only with both colors and rejects them without it; `checkSite.ts` reports it with the existing `wrongAt`
  text. `completeColors` makes missing roles from the same choice (the graphic roles from the color itself). `fileOf` in
  `Colors.tsx` writes them.
- **Older CMS versions** are not supported: the change is additive, a file with Custom is read by this version on, and there is no guard
  and no check for older versions (owner decision).
- **App contract** (`docs/app-contract.md`, `lib/sandbox/bundle.mjs`): `lib/dynamic-colors` is exported to apps; the new fields are
  optional and `dynamicColors(dynamic, roles)` keeps its signature. `bundle.test.mjs` must stay green. Content-based colors
  (`ContentBased`, the page-colors hook) are untouched.

## 8. Texts (`src/i18n/*/colors.ts`, under `dynamic.`)

| Key | English | Danish |
| :--- | :--- | :--- |
| `custom` (the chip) | Custom | Tilpasset |
| `customHint` | Pick Primary, Secondary and Tertiary yourself. The other colors are made from them. | Vælg primær, sekundær og tertiær selv. De andre farver laves ud fra dem. |
| `primary` (tile name) | Primary | Primær |
| `wheelDot(name)` | `{name}`: drag to change this color | `{name}`: træk for at ændre farven |
| `wheelHintCustom` | Drag a dot to change only that color. | Træk i en prik for kun at ændre den farve. |
| `fixTitle` | Fix this to improve accessibility? | Ret det for bedre tilgængelighed? |
| `hardText(name, ratio, min)` | `{name}` is hard to read as text on Surface: `{ratio}`, at least `{min}` needed. | `{name}` er svær at læse som tekst på flade: `{ratio}`, der skal være mindst `{min}`. |
| `hardIcon(name, ratio, min)` | `{name}` is hard to see as an icon color on Surface: `{ratio}`, at least `{min}` needed. | `{name}` er svær at se som ikonfarve på flade: `{ratio}`, der skal være mindst `{min}`. |
| `hardFocus(ratio, min)` | Secondary is hard to see as the focus ring in lists: `{ratio}`, at least `{min}` needed. | Sekundær er svær at se som fokusring i lister: `{ratio}`, der skal være mindst `{min}`. |
| `fix` / `keep` (buttons) | Fix / Keep | Ret / Behold |
| `kept(name)` | `{name}` is kept as you chose it. It may be hard to read. | `{name}` er beholdt, som du valgte den. Den kan være svær at læse. |
| `answerFirst(name)` | Answer the question about `{name}` first. | Svar først på spørgsmålet om `{name}`. |
| `adjustedTitle` | Adjusted for contrast | Justeret for kontrast |
| `adjusted(name, mode, direction, used)` | `{name}` is `{direction}` in `{mode}` so it can be seen: `{used}`. | `{name}` er `{direction}` i `{mode}`, så den kan ses: `{used}`. |
| `directions` | darker, lighter | mørkere, lysere |

The buttons are active verbs (M3 word-choice, `CLAUDE.md`): **Fix** is the owner's "Yes", **Keep** the "No" (question 10). The tile names
for Secondary and Tertiary already exist (`preview.secondary`, `preview.tertiary`). Two roles need labels and hints in
`defaults/colors.ts` and `defaults/i18n/da-DK/` (`colorFields`): Secondary graphic and Tertiary graphic ("Icons and the focus ring in
Secondary" and the Danish line). `check:language` skips `docs/superpowers/`, so Danish here is allowed.

## 9. Checks

- **Unit test** (new `lib/custom-colors.test.mjs`): (a) a sweep of 36 hues × 5 chroma × 9 tones for each base color, both modes,
  all contrast levels: fill + on-color ≥ 4.5; containers and fixed roles pass; the chosen color is exact in `primary`/`secondary`/
  `tertiary` and in the graphic roles unless Fix is chosen; Fix gives the same hue and chroma, the nearest passing tone and never
  passes Material's tone; (b) the question: exactly the failing uses are listed, none when all pass; Keep on Primary writes `kept`
  and `lowContrast` skips only those four pairs; a file without `kept` still fails them; (c) `dynamicProblems` accepts and
  rejects the right files; `completeColors` round-trips a custom file.
- **Three brand palettes as fixed test sets** (Primary, Secondary, Tertiary), each colour a fill with the better of white or
  black text (all nine ≥ 4.5:1, computed 2026-11-13: 5.97, 17.30, 12.13; 5.65, 16.64, 8.01; 7.37, 15.05, 15.43):
  1. `#F34E3D`, `#F5E8CC`, `#55263D`: asks about Primary as text on the light Surface (3.34), the cream Secondary as icon and
     focus ring (1.15), and the dark Tertiary as icon in dark mode (1.53); the cream stays cream as a fill.
  2. `#2589D8`, `#E9E5D6`, `#FF783D`: asks about Primary as text (3.53), Secondary as icon and focus ring (1.20), Tertiary as icon
     on the light Surface (2.49).
  3. `#FF6574`, `#CCDCEF`, `#222526`: asks about Primary as text (2.71), Secondary as icon and focus ring (1.33), and Tertiary as
     icon in dark mode (1.20).
  (Ratios against Surface tones 98 and 6; the test uses the real scheme's Surface.) Each set is run with Fix everywhere and
  Keep everywhere.
- **`check:screens`**: Custom open with set 1 on a phone and a computer: the question, the adjusted list, the kept warning, the
  three draggable dots, and the keyboard-safe sheet (viewport shrunk).
- **`check:demo`/`npm run check`**: unchanged; the demo's `colors.json` stays a harmony.
- **`check:contrast`** (by hand, not CI): once per set on every section color, light and dark, phone and computer; `check:themes`
  for the others.
- `check:editor-colors` should stay green: the new parts take no fixed color (the adjusted list uses the tile's own swatches
  and the theme's tokens).

## 10. Decisions and the open questions

Decided by the owner in chat, 2026-11-13 (all eight questions of the first draft):

1. Name: **Custom** (Danish **Tilpasset**).
2. The chosen color is **exact where it passes** (M3 fidelity), in both modes (5.2).
3. Neutrals derive from Primary; no fourth picker.
4. The wheel in Custom is live: three draggable dots, each changes only its own color (section 4).
5. The editor follows the site's colors, like every other color setting.
6. Older versions are not supported; no guard, no check.
7. **No silent correction**: Secondary and Tertiary are never text and are not adjusted for the page background; where a chosen color
   cannot meet its check (fill + text 4.5:1, Primary as text 4.5:1, icon and focus ring 3:1) the editor **asks** "Fix this to improve
   accessibility?", Fix recommended, Keep leaves the exact color (5.4).
8. Build into the **`0.17`** branch, `minor` allowed, never `major`. Not into `main` (there only `patch` or empty until 0.15.1).

Still open, with a recommendation:

9. **How the icon and focus-ring fix is stored.** The owner asked for 3:1 on icons and the list focus ring without changing a
   cream Secondary fill. Recommend **two added roles** (`secondary-graphic`, `tertiary-graphic`; M3's "custom color role"
   pattern, 5.4). Alternative: Fix changes Secondary itself, which also changes fills, tonal buttons and containers made from it
   (contradicts "a cream Secondary stays cream").
10. **Button words.** The owner wrote "Yes"/"No". M3's word-choice rule (`CLAUDE.md`, section 6) wants active verbs, so the spec uses
   **Fix** and **Keep** and the dialog title keeps the owner's question. Recommend **Fix/Keep**; "Yes/No" is a one-line change.

## 11. Not in this spec

Static (extra) colors such as Success, and other custom color roles (Material's *Define new colors*), would add roles; the audit
already lists status colors as "a later decision" (`docs/material-deviations.md`, colour sweep 1). A neutral picker and per-section
custom colors are also left out.

## 12. Build plan (small pull requests into `0.17`, in order)

Step A needs no decision beyond question 9 and can start as soon as the owner has read this spec; each later step starts when the
one before it is merged.

- **A. Engine** (`lib/dynamic-colors.ts`): `harmony: 'custom'`, `schemeOf` branch, exact colors, the on-color rule, the graphic roles,
  `customProblems()` (the failing uses with numbers) and `fixedTone()` (the nearest passing tone), `dynamicProblems`, the unit tests
  with the three palettes. No UI. Empty changeset.
- **B. File, roles and theme**: `Colors.tsx` `fileOf`/`colorsOf`, `kept`, `lowContrast` skip, `checkSite.ts`, `completeColors`; the two
  graphic roles in `colorFields`/`colorRoles` and their EN/DA labels; the theme reads them for `iconColor` and the list
  focus ring (`blocks.css`, `global.css`), with the fallback; `docs/app-contract.md` note; `bundle.test.mjs` green. Changeset `patch`
  (nothing visible until C).
- **C. Screen**: the chip, three tiles with pens, no lock, three draggable dots (`ColorWheel`, `wheelColorAt`), the question `Notice`
  with Fix/Keep, the adjusted list and kept warning, Save blocked while a question is open, texts in English and Danish,
  keyboard-safe sheet (fix if needed), `check:screens` states. Changeset `minor`.
- **D. Proof and notes**: `check:contrast` per palette, `check:themes`, the Venus look from the store, `material-deviations.md` if the
  owner asks for it, the release note below.

**Release note** (needed; it changes how a site can look): one **paragraph**, "Set your own colors": "Pick Primary, Secondary and
Tertiary yourself under Business › Colors › Custom, and drag each one on the color wheel. Your colors are used exactly as you chose
them, in light and dark mode. If one is hard to read, the editor asks whether to fix it." English and Danish, written with the
`release-notes` skill (`release-notes/i18n/*/pending/<id>.json`) in step C.
