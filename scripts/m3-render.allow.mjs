// What `npm run check:m3-render` (scripts/check-m3-render.mjs) finds that differs from Material 3, listed so the check is green while 0.19.5 fixes it one component
// at a time. An entry is `{ set, attr, mode?, got, want, class, batch | why }`, matched on set, attribute, mode (colours only), what the sample has and what Material 3 has.
// The check fails on a difference that is not here and on an entry that no longer differs, so a fix removes its line in the same pull request.
// Classes: 'fix' (to fix in the named batch of 0.19.5: buttons, icon buttons, lists, text fields, menus, chips, cards, dialogs and sheets, app bars and
// navigation, search, the rest), 'owner' (kept by the owner, 21 Nov 2026 or later: CS2, CS3; `why` names the decision) and 'wcag' (a criterion named in
// theme/accessibility.json; `why` names it). The list is empty at release.
// First run, 21 Nov 2026 (batch B of 0.19.5).
export const allow = [
  // ---- to fix in batch: buttons
  {
    set: 'md.comp.button',
    attr: 'container.color',
    mode: 'light',
    got: 'no role',
    want: 'surface-container',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  {
    set: 'md.comp.button',
    attr: 'container.color',
    mode: 'dark',
    got: 'no role',
    want: 'surface-container',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  { set: 'md.comp.button.large', attr: 'container.height', got: 88, want: 96, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.large', attr: 'label-text.size', got: 32, want: 24, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.large', attr: 'label-text.weight', got: 500, want: 400, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.medium', attr: 'container.height', got: 64, want: 56, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.medium', attr: 'container.shape', got: 28, want: 16, class: 'fix', batch: 'buttons' }, // 2x
  { set: 'md.comp.button.medium', attr: 'label-text.size', got: 24, want: 16, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.medium', attr: 'leading-space', got: 36, want: 24, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.medium', attr: 'trailing-space', got: 36, want: 24, class: 'fix', batch: 'buttons' }, // 4x
  {
    set: 'md.comp.button.outlined',
    attr: 'container.color',
    mode: 'light',
    got: 'on-surface|surface-variant|surface-tint|surface-tint-color|background|on-background',
    want: 'inverse-surface',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  {
    set: 'md.comp.button.outlined',
    attr: 'icon.color',
    mode: 'light',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  {
    set: 'md.comp.button.outlined',
    attr: 'icon.color',
    mode: 'dark',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  {
    set: 'md.comp.button.outlined',
    attr: 'label-text.color',
    mode: 'light',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  {
    set: 'md.comp.button.outlined',
    attr: 'label-text.color',
    mode: 'dark',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'buttons',
  }, // 2x
  { set: 'md.comp.button.small', attr: 'icon.size', got: 18, want: 20, class: 'fix', batch: 'buttons' }, // 6x
  { set: 'md.comp.button.small', attr: 'label-text.line-height', got: 14, want: 20, class: 'fix', batch: 'buttons' }, // 124x
  { set: 'md.comp.button.small', attr: 'leading-space', got: 24, want: 16, class: 'fix', batch: 'buttons' }, // 108x
  { set: 'md.comp.button.small', attr: 'trailing-space', got: 24, want: 16, class: 'fix', batch: 'buttons' }, // 108x
  { set: 'md.comp.button.xsmall', attr: 'label-text.line-height', got: 14, want: 20, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.xsmall', attr: 'leading-space', got: 16, want: 12, class: 'fix', batch: 'buttons' }, // 4x
  { set: 'md.comp.button.xsmall', attr: 'trailing-space', got: 16, want: 12, class: 'fix', batch: 'buttons' }, // 4x
  // ---- to fix in batch: cards
  {
    set: 'md.comp.outlined-card',
    attr: 'container.color',
    mode: 'light',
    got: 'secondary-container|secondary-fixed',
    want: 'surface',
    class: 'fix',
    batch: 'cards',
  }, // 1x
  {
    set: 'md.comp.outlined-card',
    attr: 'container.color',
    mode: 'dark',
    got: 'secondary-container|on-secondary-fixed-variant',
    want: 'surface',
    class: 'fix',
    batch: 'cards',
  }, // 1x
  // ---- to fix in batch: chips
  { set: 'md.comp.input-chip', attr: 'container.height', got: 36, want: 32, class: 'fix', batch: 'chips' }, // 4x
  // ---- to fix in batch: dialogs and sheets
  { set: 'md.comp.dialog', attr: 'max-width', got: 360, want: 560, class: 'fix', batch: 'dialogs and sheets' }, // 1x
  { set: 'md.comp.dialog', attr: 'max-width', got: 328, want: 560, class: 'fix', batch: 'dialogs and sheets' }, // 1x
  { set: 'md.comp.dialog', attr: 'min-width', got: 0, want: 280, class: 'fix', batch: 'dialogs and sheets' }, // 1x
  // ---- to fix in batch: icon buttons
  { set: 'md.comp.icon-button.medium', attr: 'container.height', got: 60, want: 56, class: 'fix', batch: 'icon buttons' }, // 10x
  { set: 'md.comp.icon-button.medium', attr: 'leading-space', got: 18, want: 16, class: 'fix', batch: 'icon buttons' }, // 6x
  { set: 'md.comp.icon-button.medium', attr: 'leading-space', got: 27, want: 24, class: 'fix', batch: 'icon buttons' }, // 2x
  { set: 'md.comp.icon-button.medium', attr: 'trailing-space', got: 18, want: 16, class: 'fix', batch: 'icon buttons' }, // 6x
  { set: 'md.comp.icon-button.medium', attr: 'trailing-space', got: 27, want: 24, class: 'fix', batch: 'icon buttons' }, // 2x
  {
    set: 'md.comp.icon-button.outlined',
    attr: 'icon.color',
    mode: 'light',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  {
    set: 'md.comp.icon-button.outlined',
    attr: 'icon.color',
    mode: 'dark',
    got: 'surface-container-low',
    want: 'inverse-on-surface',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  {
    set: 'md.comp.icon-button.tonal',
    attr: 'icon.color',
    mode: 'light',
    got: 'on-surface-variant',
    want: 'on-secondary-container',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  {
    set: 'md.comp.icon-button.tonal',
    attr: 'icon.color',
    mode: 'light',
    got: 'on-secondary-container|on-secondary-fixed-variant',
    want: 'on-secondary',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  {
    set: 'md.comp.icon-button.tonal',
    attr: 'icon.color',
    mode: 'dark',
    got: 'on-surface-variant',
    want: 'on-secondary-container',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  {
    set: 'md.comp.icon-button.tonal',
    attr: 'icon.color',
    mode: 'dark',
    got: 'on-secondary-container|secondary-fixed',
    want: 'on-secondary',
    class: 'fix',
    batch: 'icon buttons',
  }, // 2x
  { set: 'md.comp.icon-button.xsmall', attr: 'container.height', got: 36, want: 32, class: 'fix', batch: 'icon buttons' }, // 4x
  { set: 'md.comp.icon-button.xsmall', attr: 'leading-space', got: 8, want: 6, class: 'fix', batch: 'icon buttons' }, // 4x
  { set: 'md.comp.icon-button.xsmall', attr: 'trailing-space', got: 8, want: 6, class: 'fix', batch: 'icon buttons' }, // 4x
  // ---- to fix in batch: search
  { set: 'md.comp.search', attr: 'max-width', got: 'none', want: 720, class: 'fix', batch: 'search' }, // 1x
  { set: 'md.comp.search', attr: 'min-width', got: 0, want: 360, class: 'fix', batch: 'search' }, // 1x
  // ---- to fix in batch: text fields
  { set: 'md.comp.filled-text-field', attr: 'leading-icon.size', got: 20, want: 24, class: 'fix', batch: 'text fields' }, // 6x
  { set: 'md.comp.outlined-text-field', attr: 'leading-icon.size', got: 20, want: 24, class: 'fix', batch: 'text fields' }, // 6x
  // ---- to fix in batch: the rest
  { set: 'md.comp.extended-fab', attr: 'label-text.line-height', got: 24, want: 20, class: 'fix', batch: 'the rest' }, // 16x
  { set: 'md.comp.extended-fab', attr: 'label-text.size', got: 16, want: 14, class: 'fix', batch: 'the rest' }, // 16x
  { set: 'md.comp.extended-fab', attr: 'label-text.weight', got: 400, want: 500, class: 'fix', batch: 'the rest' }, // 16x
  { set: 'md.comp.extended-fab.large', attr: 'label-text.line-height', got: 24, want: 32, class: 'fix', batch: 'the rest' }, // 4x
  { set: 'md.comp.extended-fab.large', attr: 'label-text.size', got: 16, want: 24, class: 'fix', batch: 'the rest' }, // 4x
  { set: 'md.comp.extended-fab.medium', attr: 'label-text.line-height', got: 24, want: 28, class: 'fix', batch: 'the rest' }, // 4x
  { set: 'md.comp.extended-fab.medium', attr: 'label-text.size', got: 16, want: 22, class: 'fix', batch: 'the rest' }, // 4x
  {
    set: 'md.comp.extended-fab.secondary-container',
    attr: 'container.color',
    mode: 'light',
    got: 'surface-container-high',
    want: 'secondary-container',
    class: 'fix',
    batch: 'the rest',
  }, // 1x
  {
    set: 'md.comp.extended-fab.secondary-container',
    attr: 'container.color',
    mode: 'dark',
    got: 'surface-container-high',
    want: 'secondary-container',
    class: 'fix',
    batch: 'the rest',
  }, // 1x
  {
    set: 'md.comp.fab.secondary-container',
    attr: 'container.color',
    mode: 'light',
    got: 'surface-container-high',
    want: 'secondary-container',
    class: 'fix',
    batch: 'the rest',
  }, // 1x
  {
    set: 'md.comp.fab.secondary-container',
    attr: 'container.color',
    mode: 'dark',
    got: 'surface-container-high',
    want: 'secondary-container',
    class: 'fix',
    batch: 'the rest',
  }, // 1x
];
