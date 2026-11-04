# Tonal elevation (Material 3) — design

Date: 2026-11-04. Status: designed. Plan: `docs/superpowers/plans/2026-11-04-tonal-elevation.md`.

## Goal

Each elevation level gives a part a colour and a shadow. The base follows Material 3. The Material theme shows
elevation by colour and keeps shadows only where the M3 guide asks for them.

## Background (m3.material.io/styles/elevation)

- Overview: the level tokens carry no colour and no shadow. Each platform decides the colour and shadow per level.
- Overview, differences from M2: M3 uses shadows only for protection against a background or to encourage
  interaction. The product applies colour to represent elevation.
- Overview: a part rises one level when pointed at (a FAB from level 3 to 4).
- Applying elevation: by default, surfaces show separation by tonal difference. The FAB is the example of a part
  that a shadow separates from content.

Today the base (`theme/styles/ui.css`, section "Elevation") shows each level only as a shadow, and every part reads
`--elevation-N` at its M3 level. The Material theme (`theme/styles/global.css`) sets the part surfaces one by one and
keeps the shadows, including a level-1 shadow on every block.

## Decisions (agreed with the owner, 2026-11-04)

1. A level is a colour and a shadow. The base defines both.
2. A role colour wins over the level colour. Role parts take only the level's shadow.
3. Pointing at or dragging a part changes only its shadow. The state layer shows the colour change.
4. A level change by a system event (the top app bar when the page scrolls) changes colour and shadow.
5. The theme overrides the base. The base holds M3's structure and defaults; a theme writes only its differences.
6. The Material theme follows the M3 guide: no shadow at rest, except the FAB. The lift on pointing and dragging
   keeps its shadow. This also removes the resting shadow of the elevated button, card and chip, and of the blocks.
7. Venus keeps its look (white surfaces, its own shadows). It overrides the new level colours in its own theme.

## Tokens (base, `ui.css`, section "Elevation", in `:where(:root)`)

| Token | Default | New |
|---|---|---|
| `--elevation-0` … `--elevation-5` | as today (the shadows) | no |
| `--elevation-0-surface` | `var(--bg)` | yes |
| `--elevation-1-surface` | `var(--surface-container-low, var(--block-surface))` | yes |
| `--elevation-2-surface` | `var(--surface-container, var(--block-surface))` | yes |
| `--elevation-3-surface` | `var(--surface-container-high, var(--block-surface))` | yes |
| `--elevation-4-surface`, `--elevation-5-surface` | `var(--surface-container-highest, var(--block-surface))` | yes |
| `--elevation-1-rest-shadow` … `--elevation-5-rest-shadow` | `var(--elevation-N)` (same N) | yes |

- The `--surface-container-*` colours come from the site's `colors.json`. The fallback keeps a site without them
  working.
- `--elevation-N-rest-shadow` is the shadow a part shows at rest on level N. A theme turns resting shadows off in one
  place and keeps the lift, because pointing and dragging read `--elevation-N` directly.

## Rules for the parts (base)

| Rule | Pattern |
|---|---|
| A neutral part's surface | `var(--<part>-surface, var(--elevation-N-surface))`, N = its M3 level at rest |
| A role part's surface | unchanged (its role colour) |
| A part without a container in M3 (outlined, text, standard icon button, flat chip) | unchanged |
| The shadow at rest | `var(--<part>-shadow, var(--elevation-N-rest-shadow))` |
| The shadow when pointed at or dragged | unchanged: `var(--elevation-N)` at the higher level |
| The surface when pointed at or dragged | unchanged: the resting surface plus the state layer |

Every part keeps its own variables (`--dialog-surface`, `--menu-shadow` …). A theme still sets one part differently.

## Parts

Levels are the ones in the `ui.css` header. "Theme line" is the Material theme's line for that variable today.

| Part | Level | Kind | Surface default after | Rest shadow default after | Material theme line |
|---|---|---|---|---|---|
| Elevated button | 1 | neutral | `--elevation-1-surface` | `--elevation-1-rest-shadow` | `--button-elevated-surface`: remove (same) |
| Elevated card | 1 | neutral | `--elevation-1-surface` | `--elevation-1-rest-shadow` | `--card-elevated-surface`: remove (same) |
| Elevated chip | 1 | neutral | `--elevation-1-surface` | `--elevation-1-rest-shadow` | none |
| Outlined card | 0 | neutral | `--elevation-0-surface` | `--elevation-0` (unchanged) | keep (`var(--surface)` and the block overrides differ) |
| Standard side sheet | 0 | neutral | `--elevation-0-surface` | none (unchanged) | `--side-sheet-surface`: remove (same) |
| Modal side sheet | 1 | neutral | `--elevation-1-surface` | `--elevation-1-rest-shadow` | `--side-sheet-modal-surface`: remove (same) |
| Bottom sheet | 1 (3 as a dialog) | neutral | `--elevation-1-surface` | level 1, and `--elevation-3-rest-shadow` as a dialog | `--bottom-sheet-surface`: remove (same) |
| Dialog, date picker, time picker | 3 | neutral | `--elevation-3-surface` | `--elevation-3-rest-shadow` (also the docked date picker) | `--dialog-surface`: remove (same) |
| Top app bar, at rest | 0 | neutral | unchanged (the translucent page colour) | none | keep |
| Top app bar, scrolled | 2 | neutral | `--elevation-2-surface` | `--elevation-2-rest-shadow` | `--top-app-bar-stuck-surface` and `--top-app-bar-stuck-shadow: none`: remove (same) |
| Standard navigation rail | 0 | neutral | `--elevation-0-surface` | none | `--navigation-rail-surface`: remove (same) |
| Modal navigation rail | 2 | neutral | `--elevation-2-surface` (today: the standard rail's) | `--elevation-2-rest-shadow` | none (visible change: it becomes `surface-container`) |
| Navigation drawer | 1 | neutral | `--elevation-1-surface` (today: `var(--bg)`) | `--elevation-1-rest-shadow` | `--navigation-drawer-surface`: remove (same) |
| Menu, select list | 2 | neutral | `--elevation-2-surface` | `--elevation-2-rest-shadow` | `--menu-surface`: remove (same) |
| Rich tooltip | 2 | neutral | `--elevation-2-surface` | `--elevation-2-rest-shadow` | `--tooltip-rich-surface`: remove (same) |
| Search view | 3 | neutral | `--elevation-3-surface` | `--elevation-3-rest-shadow` | `--search-view-surface`: remove (same) |
| Search bar | 0 | role (`surface-container-high`) | unchanged | unchanged | keep |
| Navigation bar | 0 | role (`surface-container`) | unchanged | unchanged | keep |
| Floating toolbar | 3 | role (`surface-container`) | unchanged | `--elevation-3-rest-shadow` | keep |
| Filled card | 0 | role (`surface-container-highest`) | unchanged | unchanged | keep |
| Filled, tonal, toggle buttons; icon buttons | 0 | role | unchanged | unchanged | keep |
| FAB, FAB menu | 3 | role | unchanged | `--elevation-3-rest-shadow` | add `--fab-shadow: var(--elevation-3)` and `--fab-hover-shadow: var(--elevation-4)` |
| Snackbar, plain tooltip | 3, 0 | role (inverse) | unchanged | snackbar: `--elevation-3-rest-shadow` | keep |
| Switch and slider handles | 1 | role | unchanged | `--elevation-1-rest-shadow` | `--switch-handle-shadow: none`, `--slider-handle-shadow: none`: remove (same) |
| Blocks | — | — | unchanged | — | `--shadow`, `--block-shadow` (also in dark mode): `var(--elevation-1-rest-shadow)` |

The Material theme also gets `--elevation-1-rest-shadow` … `--elevation-5-rest-shadow: var(--elevation-0)`.

Notes:
- The FAB sets `--fab-hover-shadow` too: its hover falls back to `--fab-shadow`, so it would not rise otherwise.
- The extended FAB in the navigation drawer keeps its own lines in the Material theme (`--elevation-1`, hover `--elevation-2`).
- Hard-coded shadows stay as they are (the filled toggle at `--elevation-0`/`-1`, the selected chip when pressed,
  the full-screen dialog on a phone).

## What changes on screen

- Material theme (sites and editor): no shadow at rest on blocks, dialogs, sheets, menus, the drawer, tooltips, the
  search view, the snackbar, the floating toolbar, the elevated button, card and chip. The FAB keeps its shadow.
  Pointing at or dragging a part still lifts it. The modal navigation rail becomes `surface-container`.
- Venus: no visible change after its own task (decision 7).
- Other themes built on the base: they get the tonal colours with their shadows.

## Venus

Venus imports `@morphemecms/cms/theme/styles/base.css`, not the Material theme. Its task sets, in `:root` of its
`styles/global.css`:

| Variable | Value | Why |
|---|---|---|
| `--elevation-0-surface` … `--elevation-5-surface` | `var(--surface)` | its surfaces stay white |
| `--navigation-drawer-surface` | `var(--bg)` | the base default was `var(--bg)` |
| `--top-app-bar-stuck-surface` | `color-mix(in oklab, var(--bg) 85%, transparent)` | the base default was the rest colour |
| `--navigation-rail-modal-surface` | `var(--surface)` | the base default was the standard rail's |

Venus takes the change only with a CMS version that has it. Its task must merge before its sites take that version.
Copies outside `morpheme-apps` (`sara-move`, `sara-cms-0.5.0`) follow the Sara move plan.

## Testing

- A node test reads `ui.css` and `global.css` as text and checks every row of the tables above: the tokens and their
  defaults, each part's surface and rest-shadow fallback, and the Material theme's lines.
- `npm run check:screens` and `npm run check:themes`: the screens still open.
- By hand: a site page and the editor, light and dark mode. Look for tonal dialogs and menus with no shadow, a FAB
  with a shadow, and a lift when you point at an elevated card.

The CSS itself has no unit test beyond the text check; the visual result is checked by hand as above.

## Out of scope

- Role colours that differ from M3 in the base (for example the filled card's `--block-tint`).
- A shadow for parts on a busy background (M3's "protection"). A theme sets `--elevation-N-rest-shadow` back on the
  surface that needs it; no new code.
