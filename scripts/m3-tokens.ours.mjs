// The `--mo-comp-*` tokens of the Material theme that map to no Material 3 token, neither by name nor by scripts/m3-tokens.renames.mjs, and so are ours (batch A of
// plans/2026-11-21-0-19-5-measured-m3-check.md). `npm run check:m3-tokens` fails on a new token of that kind that is not listed here, and on an entry here that now maps to an M3
// token or is no longer declared, so the list only shrinks: a rename-map entry or a deleted token removes its line. Each line says why M3 has no token for it;
// the generic reasons ("review in the component batch") are looked at again when the component's batch fixes its tokens. 0.20.0's scripts/m3-names.ours.mjs takes this list over.
export const ours = [
  {
    token: '--mo-comp-avatar-size',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-badge-major',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-badge-minor',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-badge-ok',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-badge-surface',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-badge-text',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-badge-unknown',
    reason: "The status badge of the editor's lists (ok, minor, major); not M3's badge, which is a count or dot.",
  },
  {
    token: '--mo-comp-bottom-sheet-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-bottom-sheet-scrim',
    reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
  },
  {
    token: '--mo-comp-button-filled-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-button-font-size',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-button-group-connected-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-button-group-inner-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-button-group-large-inner-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-button-group-selected-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-button-group-xlarge-inner-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-button-group-xsmall-inner-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-button-letter-spacing',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-button-outlined-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-button-text-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-button-text-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-button-toggle-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-button-toggle-selected-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-button-tonal-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-button-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-card-action-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-card-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-card-media-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-card-subhead-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-card-text-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  { token: '--mo-comp-carousel-bleed', reason: 'How far a part reaches past the page margin; M3 prints no token for it.' },
  {
    token: '--mo-comp-carousel-dot-colour',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-carousel-dot-selected-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-carousel-full-screen-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-carousel-large-item-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-carousel-small-item-max-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-carousel-small-item-min-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  { token: '--mo-comp-center-measure', reason: 'A layout part of the CMS (docs/theme-grid.md); M3 has no component for it.' },
  {
    token: '--mo-comp-checkbox-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-chip-hover-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-chip-hover-text',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-chip-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-chip-padding-block',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-chip-selected-check',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-chip-selected-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  { token: '--mo-comp-chip-set-bleed', reason: 'How far a part reaches past the page margin; M3 prints no token for it.' },
  {
    token: '--mo-comp-chip-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-circular-progress-indicator-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-date-picker-day-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-date-picker-menu-button-text',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-date-picker-range-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-date-picker-supporting-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-dialog-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-dialog-scrim',
    reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
  },
  {
    token: '--mo-comp-fab-hover-shadow',
    reason: 'An elevation shadow; M3 has only the level in dp (the elevation tokens, specs/2026-11-20-elevation-design.md).',
  },
  {
    token: '--mo-comp-fab-menu-close-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-fab-primary-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-fab-secondary-container-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-fab-secondary-container-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-fab-secondary-container-text',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-fab-shadow',
    reason: 'An elevation shadow; M3 has only the level in dp (the elevation tokens, specs/2026-11-20-elevation-design.md).',
  },
  { token: '--mo-comp-grid-gap', reason: 'A layout part of the CMS (docs/theme-grid.md); M3 has no component for it.' },
  {
    token: '--mo-comp-icon-button-outlined-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-list-expand-divider-default-color',
    reason:
      'The divider of an expandable list, in our own words (a colour per list kind); M3 has one md.comp.list.divider.color and the mapping is not read yet; to review in the lists batch.',
  },
  {
    token: '--mo-comp-list-divider-default-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-list-item-columns-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-list-item-disabled-opacity',
    reason: "The part's disabled opacity as one token; M3 prints it per element and state.",
  },
  {
    token: '--mo-comp-list-item-focus-indicator-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-list-item-focus-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-item-hover-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-item-icon-size',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-list-item-leading-icon-selected-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-list-item-pressed-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-segmented-disabled-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-segmented-hover-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-list-segmented-hover-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-segmented-inner-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-list-segmented-padding-inline',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-list-segmented-pressed-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-list-segmented-pressed-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-list-segmented-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-list-segmented-selected-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-menu-item-hover-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-menu-item-hover-text',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-menu-item-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-menu-item-selected-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-menu-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-menu-max-height',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-menu-max-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-menu-min-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-menu-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-menu-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-navigation-bar-indicator-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-navigation-bar-indicator-text',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-navigation-bar-label-selected-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-navigation-bar-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  { token: '--mo-comp-navigation-drawer-bleed-default', reason: 'How far a part reaches past the page margin; M3 prints no token for it.' },
  { token: '--mo-comp-navigation-drawer-inset-default', reason: 'How far a part reaches past the page margin; M3 prints no token for it.' },
  {
    token: '--mo-comp-navigation-drawer-row-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-navigation-drawer-toggle-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-navigation-drawer-toggle-size',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-navigation-drawer-width-min-default',
    reason: 'How far a part reaches past the page margin; M3 prints no token for it.',
  },
  {
    token: '--mo-comp-navigation-rail-active-indicator-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-navigation-rail-active-indicator-shape',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-navigation-rail-active-label-text-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-navigation-rail-expanded-width',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-navigation-rail-inactive-label-text-color',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-navigation-rail-indicator-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-navigation-rail-indicator-text',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-navigation-rail-label-selected-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-navigation-rail-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-navigation-rail-modal-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-navigation-rail-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-radio-button-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-radio-group-label-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  { token: '--mo-comp-row-gap', reason: 'A layout part of the CMS (docs/theme-grid.md); M3 has no component for it.' },
  {
    token: '--mo-comp-search-bar-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-search-bar-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-search-view-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-search-view-option-surface',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-search-view-results-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-search-view-scrim',
    reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
  },
  {
    token: '--mo-comp-segmented-button-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-segmented-button-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-segmented-button-selected-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  {
    token: '--mo-comp-segmented-button-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-setting-row-label-weight',
    reason:
      "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
  },
  {
    token: '--mo-comp-side-sheet-scrim',
    reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
  },
  {
    token: '--mo-comp-slider-active-track',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-slider-handle-inset',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-slider-handle-line-width',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-slider-height',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-slider-inactive-track',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-slider-large-track-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-slider-medium-track-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-slider-track-gap',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-slider-value-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-slider-value-room',
    reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
  },
  {
    token: '--mo-comp-slider-xlarge-track-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-snackbar-action-hover',
    reason:
      'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
  },
  { token: '--mo-comp-snackbar-backdrop', reason: "The part's backdrop blur or filter; M3 prints none." },
  {
    token: '--mo-comp-snackbar-padding-block',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  { token: '--mo-comp-stack-gap', reason: 'A layout part of the CMS (docs/theme-grid.md); M3 has no component for it.' },
  { token: '--mo-comp-switch-disabled-opacity', reason: "The part's disabled opacity as one token; M3 prints it per element and state." },
  {
    token: '--mo-comp-text-field-disabled-opacity',
    reason: "The part's disabled opacity as one token; M3 prints it per element and state.",
  },
  {
    token: '--mo-comp-text-field-error',
    reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
  },
  {
    token: '--mo-comp-text-field-filled-focus-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-text-field-filled-hover-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-text-field-filled-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-text-field-label-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-text-field-outlined-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-text-field-padding',
    reason:
      'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
  },
  {
    token: '--mo-comp-text-field-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-theme-blog-first-space',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-blog-first-space-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-home-first-space',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-home-first-space-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-mark',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-mark-scale',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-name-size',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-name-weight',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-role-display',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-role-display-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-tile',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-tile-padding',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-logo-tile-radius',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-on-scrim-colour',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-page-fade',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-page-gutter',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-page-gutter-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-picture-radius',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-post-picture-radius',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-scrim-colour',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-section-space',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-section-space-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-side-gap',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-side-width',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-title-leading',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-title-size',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-theme-title-size-large',
    reason: "The site theme's own page, logo and layout values (page gutter, section space, title size); a page is not an M3 component.",
  },
  {
    token: '--mo-comp-time-picker-box-radius',
    reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
  },
  {
    token: '--mo-comp-time-picker-box-selected-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-time-picker-box-selected-text',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-time-picker-box-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  {
    token: '--mo-comp-time-picker-dial-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
  { token: '--mo-comp-toolbar-docked-backdrop', reason: "The part's backdrop blur or filter; M3 prints none." },
  {
    token: '--mo-comp-toolbar-docked-line-width',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-toolbar-floating-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-tooltip-rich-line',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  { token: '--mo-comp-top-app-bar-backdrop', reason: "The part's backdrop blur or filter; M3 prints none." },
  {
    token: '--mo-comp-top-app-bar-line-width',
    reason:
      "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
  },
  {
    token: '--mo-comp-top-app-bar-surface',
    reason:
      'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
  },
];
