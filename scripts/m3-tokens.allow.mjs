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
    token: '--mo-comp-button-padding',
    theme: '24',
    m3: '16',
    class: 'fix',
    batch: 'buttons',
    reason:
      'Our medium button (M3 Expressive small, 40 dp) has 24 dp leading and trailing space; M3 prints 16 (md.comp.button.small.leading-space). Old source: M3 baseline, before 21 Nov 2026.',
  },
  {
    token: '--mo-comp-button-xsmall-padding',
    theme: '16',
    m3: '12',
    class: 'fix',
    batch: 'buttons',
    reason: 'Our xsmall button (32 dp) has 16 dp leading and trailing space; M3 prints 12 (md.comp.button.xsmall.leading-space).',
  },
  {
    token: '--mo-comp-navigation-bar-active-indicator-color',
    theme: '@role:surface-container-high',
    m3: '@role:secondary-container',
    class: 'fix',
    batch: 'app bars and navigation',
    reason:
      "The active item's indicator is surface-container-high; M3 (md.comp.nav-bar.item.active.indicator.color) says secondary-container.",
  },
  {
    token: '--mo-comp-navigation-bar-active-label-text-color',
    theme: '@role:on-surface',
    m3: '@role:secondary',
    class: 'fix',
    batch: 'app bars and navigation',
    reason: "The active item's label is on-surface; M3 (md.comp.nav-bar.item.active.label-text.color) says secondary.",
  },
];
