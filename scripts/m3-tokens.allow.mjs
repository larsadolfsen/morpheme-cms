// What `npm run check:m3-tokens` lets differ from Material 3, and why: the baseline found on 21 Nov 2026 (batch 1 of plans/2026-11-20-0-19-5-material-3-tokens.md).
// Each entry is a token of the theme, the value it has and the value Material 3 has (so a change to either fails the check until the entry is fixed), and one of
// these classes: `deviation` (a recorded deviation, docs/material-deviations.md), `editor` (the editor's own workspace, outside Material 3), `wcag` (a WCAG
// 2.2 AA criterion, which wins over Material 3) or `fix` (to fix in the batch named by `batch`; the batch removes the entry). At release only `editor` and `wcag`
// are left. A new entry is reviewed; it is never added to hide a difference without a reason.
// A `fix` names its component batch (batches C and on of plans/2026-11-21-0-19-5-measured-m3-check.md: buttons, icon buttons, lists, text fields, menus, chips, cards,
// dialogs and sheets, app bars and navigation, search, the rest); it may stand during 0.19.5 and must be gone at release. Since batch A the check also reads our names
// through the rename map (scripts/m3-tokens.renames.mjs), which found these.
export const allow = [
  {
    token: '--mo-comp-button-group-connected-xsmall-inner-corner-corner-size',
    theme: '@shape:extra-small',
    m3: '8',
    class: 'fix',
    batch: 'buttons',
    reason:
      'Our xsmall connected button group has a 4 dp inner corner; M3 prints 8 (md.comp.button-group.connected.xsmall.inner-corner.corner-size).',
  },
  {
    token: '--mo-comp-navigation-rail-active-indicator-color',
    theme: '@role:surface-container-high',
    m3: '@role:secondary-container',
    class: 'fix',
    batch: 'app bars and navigation',
    reason:
      "The active item's indicator is surface-container-high; M3 (md.comp.navigation-rail.active-indicator.color, the baseline rail: the collapsed Expressive rail prints none) says secondary-container.",
  },
  {
    token: '--mo-comp-nav-bar-item-active-indicator-color',
    theme: '@role:surface-container-high',
    m3: '@role:secondary-container',
    class: 'fix',
    batch: 'app bars and navigation',
    reason:
      "The active item's indicator is surface-container-high; M3 (md.comp.nav-bar.item.active.indicator.color) says secondary-container.",
  },
  {
    token: '--mo-comp-nav-bar-item-active-label-text-color',
    theme: '@role:on-surface',
    m3: '@role:secondary',
    class: 'fix',
    batch: 'app bars and navigation',
    reason: "The active item's label is on-surface; M3 (md.comp.nav-bar.item.active.label-text.color) says secondary.",
  },
  {
    token: '--mo-comp-slider-label-label-text-color',
    theme: '@role:on-primary',
    m3: '@role:inverse-on-surface',
    class: 'fix',
    batch: 'the rest',
    reason: "The slider's value label text is on-primary; M3 (md.comp.slider.label.label-text.color) says inverse-on-surface.",
  },
];
