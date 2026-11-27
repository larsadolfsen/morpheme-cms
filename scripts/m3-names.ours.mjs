// The names of the Material theme and the editor that Material 3 has no token or class for, each with the reason (spec 2026-11-20-material-3-names-design.md, rule 4).
// Made in batch 1 of 0.19.6: the entries of scripts/m3-tokens.ours.mjs that are still declared, then patterns (an entry ending with * is a prefix), then the classes.
// check:m3-names reads it; batch 8 of 0.19.6 makes an unlisted name fail and takes scripts/m3-tokens.ours.mjs over.
export const ours = {
  tokens: [
    {
      token: '--mo-comp-list-item-inset-end',
      reason:
        'The divider inset on the right of a list item (M3 Lists > Specs: 24 dp; 16 dp on the left is --mo-comp-divider-inset); M3 prints it on its specs page only, not as a token.',
    },
    {
      token: '--mo-comp-divider-inset',
      reason:
        'The inset divider\'s distance from each edge (M3: "inset dividers, which don\'t run the full width", 16 dp); md.comp.divider holds only thickness and color.',
    },
    {
      token: '--mo-comp-nav-bar-indicator-hover',
      reason:
        'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
    },
    {
      token: '--mo-comp-nav-bar-indicator-text',
      reason:
        'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
    },
    {
      token: '--mo-comp-nav-bar-label-selected-weight',
      reason:
        "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
    },
    {
      token: '--mo-comp-nav-bar-line',
      reason:
        "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
    },
    {
      token: '--mo-comp-nav-rail-expanded-width',
      reason: 'A size or spacing M3 prints only on its specs page, not as a token; it goes to docs/m3-tokens/printed.json in batch B.',
    },
    {
      token: '--mo-comp-nav-rail-indicator-hover',
      reason:
        'A state of the part drawn as one mixed colour; M3 holds states as a state layer colour and opacity token (md.sys.state) per state.',
    },
    {
      token: '--mo-comp-nav-rail-indicator-text',
      reason:
        'A colour of the part by our own name; M3 holds it as a `container.color` or `label-text.color` token of a state the check does not map yet.',
    },
    {
      token: '--mo-comp-nav-rail-label-selected-weight',
      reason:
        "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
    },
    {
      token: '--mo-comp-nav-rail-line',
      reason:
        "The part's outline or divider in our own words; M3 names it per state (outline, active-indicator) and the mapping is not read yet.",
    },
    {
      token: '--mo-comp-nav-rail-modal-radius',
      reason: "A corner of a part state or size; M3 holds it as the part's shape token for that state, which the check does not map yet.",
    },
    {
      token: '--mo-comp-nav-rail-padding',
      reason:
        'A padding as one CSS value (block and inline together); M3 prints its spaces as leading-space, trailing-space, top-space and bottom-space.',
    },
    {
      token: '--mo-comp-sheet-bottom-scrim',
      reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
    },
    {
      token: '--mo-comp-sheet-side-icon-inset',
      reason: 'No M3 token of this name or role found in docs/m3-tokens/; to review in the component batch.',
    },
    {
      token: '--mo-comp-sheet-side-scrim',
      reason: 'The scrim of this part; M3 holds one scrim role (md.sys.color.scrim) and prints no token per part.',
    },
    {
      token: '--mo-sys-state-dragged-state-layer-color',
      reason:
        "The state layer's colour as one of our tokens; M3 holds states as an opacity token (md.sys.state.*.state-layer-opacity) and takes the colour from the part's role.",
    },
    {
      token: '--mo-sys-state-hover-state-layer-color',
      reason:
        "The state layer's colour as one of our tokens; M3 holds states as an opacity token (md.sys.state.*.state-layer-opacity) and takes the colour from the part's role.",
    },
    {
      token: '--mo-sys-state-pressed-state-layer-color',
      reason:
        "The state layer's colour as one of our tokens; M3 holds states as an opacity token (md.sys.state.*.state-layer-opacity) and takes the colour from the part's role.",
    },
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
      token: '--mo-comp-button-group-selected-radius',
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
    {
      token: '--mo-comp-carousel-height',
      reason:
        "How high a contained carousel is; M3 prints no height token for the carousel, only the layouts' item widths on its specs page.",
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
      token: '--mo-comp-navigation-rail-surface',
      reason:
        "The collapsed rail's container: the Navigation rail page prints its Container role as Surface container (Specs, Color) while md.comp.nav-rail.collapsed.container.color is surface; the part reads this token.",
    },
    {
      token: '--mo-comp-navigation-drawer-bleed-default',
      reason: 'How far a part reaches past the page margin; M3 prints no token for it.',
    },
    {
      token: '--mo-comp-navigation-drawer-inset-default',
      reason: 'How far a part reaches past the page margin; M3 prints no token for it.',
    },
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
      token: '--mo-comp-setting-row-label-weight',
      reason:
        "A text value read from the type scale; M3 holds it as the part's composite label-text token, which the check does not compare.",
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
    { token: '--mo-comp-editor-*', reason: 'The page and post editor is outside Material 3 (CLAUDE.md); its parts keep editor tokens.' },
    { token: '--mo-comp-google-*', reason: 'The Google search preview of the SEO panel; not an M3 component.' },
    { token: '--mo-comp-prose-*', reason: "The prose of the site's text (headings, lists, quotes, code); M3 has no prose component." },
    { token: '--mo-comp-block-*', reason: "A block's own token: blocks are not M3 components (spec, rule 4)." },
    { token: '--mo-sys-section-*', reason: "The section colours and panes of the site's text sections; M3 has no sections." },
    {
      token: '--mo-sys-elevation-level*',
      reason: "Elevation shadows: M3's data has only shadow-color (specs/2026-11-20-elevation-design.md).",
    },
    { token: '--mo-sys-density*', reason: 'The density setting; M3 has density as a rule, not as a token.' },
    { token: '--mo-sys-motion-spring-*', reason: 'Spring easing and duration pairs; M3 prints the physics, not tokens named this way.' },
    { token: '--mo-sys-motion-ease*', reason: "Easing curves of the theme; M3's tokens are md.sys.motion.easing.*." },
    { token: '--mo-sys-ease*', reason: 'An easing curve of the theme.' },
    { token: '--mo-sys-default-transition-*', reason: "The theme's default transition." },
    { token: '--mo-sys-grid-*', reason: "The layout grid's margin, gutter and columns: M3 prints them as a table, not tokens." },
    { token: '--mo-sys-column-*', reason: "A column's place in the layout grid." },
    { token: '--mo-sys-target-*', reason: 'The touch target size and gap: M3 prints 48 dp in its accessibility text, not as a token.' },
    { token: '--mo-sys-tile-*', reason: "The image tile's fill and text colours." },
    {
      token: '--mo-sys-state-focus-indicator-color',
      reason: 'The focus indicator colour; M3 prints the width and offset, not a colour token.',
    },
    { token: '--mo-sys-typescale-lead-*', reason: "The lead paragraph's type scale: a step M3 has not got." },
    {
      token: '--mo-sys-typescale-label-large-prominent-weight',
      reason: 'The prominent weight of the large label; M3 prints it on its Expressive type scale page.',
    },
    {
      token: '--mo-sys-typescale-label-medium-prominent-weight',
      reason: 'The prominent weight of the medium label; M3 prints it on its Expressive type scale page.',
    },
    {
      token: '--mo-sys-typescale-label-small-prominent-weight',
      reason: 'The prominent weight of the small label; M3 prints it on its Expressive type scale page.',
    },
    { token: '--mo-sys-shape-corner-extra-extra-large', reason: 'A shape step beyond the steps of M3 shape tokens (extra-extra-large).' },
    { token: '--mo-sys-shape-corner-extra-large-increased', reason: 'An Expressive shape step M3 prints, not as a token in the copy.' },
    { token: '--mo-sys-color-primary-hover', reason: 'A hover colour of the primary role; M3 uses a state layer.' },
    { token: '--mo-sys-color-scrim-overlay', reason: 'The scrim colour with its opacity applied.' },
    { token: '--mo-sys-panel-shadow', reason: "The shadow of the editor's panels." },
    { token: '--mo-sys-prose-space', reason: "The prose's vertical space." },
    { token: '--mo-sys-mark-in', reason: "The editor's mark inset." },
    { token: '--mo-ref-space-*', reason: 'The spacing scale of the theme; M3 prints 4 dp steps, not md.ref tokens.' },
    { token: '--mo-ref-breakpoint-*', reason: "The window size classes' widths; M3 prints them as a table." },
    { token: '--mo-comp-badge-anchor-inset', reason: 'Where the badge sits on its anchor; M3 prints the offsets on its specs page.' },
    { token: '--mo-comp-checkbox-offset', reason: "The checkbox's offset in its target; M3 prints it on the specs page." },
    { token: '--mo-comp-fab-primary-container-hover', reason: 'A hover colour; M3 uses a state layer.' },
    { token: '--mo-comp-fab-room', reason: 'The room a FAB keeps at the screen edge.' },
    { token: '--mo-comp-grid-columns', reason: 'The columns of the staggered grid (docs/theme-grid.md).' },
    { token: '--mo-comp-icon-color', reason: "The colour of an icon in its part's context." },
    { token: '--mo-comp-lightbox-ink', reason: "The lightbox's text colour; M3 has no lightbox." },
    { token: '--mo-comp-loading-indicator-shape-size', reason: "The loading indicator's shape size; M3 prints it on the specs page." },
    {
      token: '--mo-comp-scroll-field-item-selected-label-text-weight',
      reason: 'The weight of the selected value in a scroll field; M3 prints the selected value in a larger size, not a weight.',
    },
    { token: '--mo-comp-radio-button-offset', reason: "The radio button's offset in its target; M3 prints it on the specs page." },
    { token: '--mo-comp-ripple-opacity', reason: "The ripple's opacity; the ripple is a script effect, not an M3 component." },
    { token: '--mo-comp-side-panel-width', reason: "The editor's side panel width; M3's side sheet has its own tokens." },
    {
      token: '--mo-comp-split-button-inner',
      reason:
        "The corner between the split button's two parts at rest: the size's md.comp.split-button.<size>.inner-corner.corner-size, set on the part.",
    },
    {
      token: '--mo-comp-split-button-inner-active',
      reason:
        "The corner between the two parts when one is hovered or pressed: the size's md.comp.split-button.<size>.inner-corner.hovered.corner-size (pressed has the same value), set on the part.",
    },
    {
      token: '--mo-comp-split-button-lead-start',
      reason: "The main action's leading space: the size's md.comp.split-button.<size>.leading-button.leading-space, set on the part.",
    },
    {
      token: '--mo-comp-split-button-lead-end',
      reason: "The main action's trailing space: the size's md.comp.split-button.<size>.leading-button.trailing-space, set on the part.",
    },
    {
      token: '--mo-comp-split-button-arrow',
      reason: "The arrow's size: the size's md.comp.split-button.<size>.trailing-button.icon.size, set on the part.",
    },
    {
      token: '--mo-comp-split-button-arrow-start',
      reason: "The space before the arrow: the size's md.comp.split-button.<size>.trailing-button.leading-space, set on the part.",
    },
    {
      token: '--mo-comp-split-button-arrow-end',
      reason: "The space after the arrow: the size's md.comp.split-button.<size>.trailing-button.trailing-space, set on the part.",
    },
    { token: '--mo-comp-switch-gap', reason: 'The gap of the switch row.' },
    { token: '--mo-comp-time-picker-ring', reason: "The time picker's ring; M3 prints it on the specs page." },
    {
      token: '--mo-comp-button-*',
      reason:
        'A part of the button the theme names by what it does (box, glyph, busy, corners); M3 has no token for it. Looked at again in the button batch.',
    },
    {
      token: '--mo-comp-icon-button-*',
      reason:
        'A part of the icon button the theme names by what it does (box, glyph, corners); M3 has no token for it. Looked at again in the button batch.',
    },
    {
      token: '--mo-comp-list-item-*',
      reason:
        "A part of the list item the theme names by what it does (box, density, lines); M3's list-item tokens name it differently. Looked at again in the list batch.",
    },
    { token: '--mo-comp-list-expand-*', reason: 'The expanding list (an accordion); M3 has no such list.' },
    {
      token: '--mo-comp-card-*',
      reason:
        'A part of the card the theme names by what it does (padding, supporting text); M3 prints it per kind. Looked at again in the card batch.',
    },
    {
      token: '--mo-comp-slider-*',
      reason: 'A part of the slider the theme names by what it does (reach, room, gap); M3 has no token for it.',
    },
    {
      token: '--mo-comp-text-field-*',
      reason: 'A part of the text field the theme names by what it does (box, icon gap); M3 has no token for it.',
    },
    { token: '--mo-comp-menu-*', reason: 'A part of the menu the theme names by what it does; M3 has no token for it.' },
    { token: '--mo-comp-search-view-*', reason: 'A part of the search view the theme names by what it does; M3 has no token for it.' },
    { token: '--mo-comp-navigation-drawer-*', reason: 'A part of the navigation drawer (inset, width); M3 prints them on the specs page.' },
    {
      token: '--mo-comp-circular-progress-indicator-*',
      reason: 'A part of the circular progress indicator the theme names by what it does; M3 has no token for it.',
    },
  ],
  classes: [
    { class: 'mo-action-bar', reason: 'The action bar of the editor; M3 has no component of this name.' },
    { class: 'mo-arrow-link', reason: 'A site link with an arrow; a site part, not an M3 component.' },
    { class: 'mo-avatar', reason: 'M3 prints the avatar on its Lists page, not as a component with tokens.' },
    { class: 'mo-back-link', reason: 'A site link; a site part.' },
    { class: 'mo-blog*', reason: "The blog's pages and lists; a site part, not an M3 component." },
    { class: 'mo-body', reason: 'The body of a page; a layout class.' },
    { class: 'mo-center', reason: 'A layout utility.' },
    { class: 'mo-clamp-2', reason: 'A text utility.' },
    { class: 'mo-container', reason: 'A layout utility.' },
    { class: 'mo-contents', reason: 'A layout utility.' },
    { class: 'mo-cover', reason: 'A layout utility.' },
    { class: 'mo-choice-group', reason: 'The choice group (buttons that fall back to a radio list); M3 has no such component.' },
    { class: 'mo-cookie', reason: 'The cookie notice of the site.' },
    {
      class: 'mo-search',
      reason:
        'The root of the Search component, round its bar and its view (Search `kind` sets the contained or divided style); M3 has the two parts, search-bar and search-view, not their wrapper.',
    },
    { class: 'mo-drawer', reason: 'The site header drawer; its M3 name is navigation-drawer, kept until the layout batch.' },
    { class: 'mo-dropdown-menu', reason: 'The script-driven dropdown of the site; M3 name menu, kept until the menu batch.' },
    { class: 'mo-elevated-*', reason: 'Elevation utility classes.' },
    { class: 'mo-elevation-*', reason: 'Elevation utility classes.' },
    { class: 'mo-end-block', reason: 'A layout utility.' },
    { class: 'mo-fill', reason: 'A layout utility.' },
    { class: 'mo-flush-top', reason: 'A layout utility.' },
    { class: 'mo-footer', reason: 'The site footer; a site part.' },
    { class: 'mo-grid*', reason: 'The layout grid utilities.' },
    { class: 'mo-header', reason: 'The site header; a site part.' },
    { class: 'mo-hidden', reason: 'A utility.' },
    { class: 'mo-home', reason: 'The home page; a site part.' },
    { class: 'mo-js', reason: 'A script flag.' },
    { class: 'mo-keep', reason: 'A utility.' },
    { class: 'mo-lightbox', reason: 'The image lightbox; M3 has no such component.' },
    { class: 'mo-link', reason: 'A link class.' },
    { class: 'mo-logo*', reason: 'The site logo; a site part.' },
    { class: 'mo-main', reason: 'The main landmark; a layout class.' },
    { class: 'mo-markdown', reason: 'The rendered text; a content class.' },
    { class: 'mo-mobile-nav', reason: 'The phone menu of the site header; a site part.' },
    { class: 'mo-new', reason: 'The what-is-new list of the editor.' },
    { class: 'mo-not-found', reason: 'The not-found page.' },
    { class: 'mo-page*', reason: 'The page and its headings; a site part.' },
    { class: 'mo-placed-block', reason: 'The block placement utility.' },
    { class: 'mo-popup*', reason: 'The site popup (an announcement); not an M3 dialog.' },
    { class: 'mo-post*', reason: "The blog post's header, author, list and meta; a site part." },
    { class: 'mo-prose', reason: 'The rendered text; a content class.' },
    { class: 'mo-radio-group', reason: 'The radio group; M3 prints it with the radio button.' },
    { class: 'mo-related', reason: 'The related posts list.' },
    { class: 'mo-ripple', reason: 'The ripple of M3 state layers; a script effect, not a component.' },
    { class: 'mo-row*', reason: 'A layout utility.' },
    { class: 'mo-section*', reason: "A section of the site's text; M3 has no sections." },
    { class: 'mo-setting-list', reason: 'The settings list of the editor.' },
    { class: 'mo-setting-row', reason: 'The settings row of the editor (a list item with a switch).' },
    { class: 'mo-share', reason: 'The share links of a post.' },
    { class: 'mo-site-*', reason: "The editor's drawing of a block and its parts." },
    { class: 'mo-skip-link', reason: 'The skip link of the site.' },
    { class: 'mo-space-*', reason: 'Spacing utilities.' },
    { class: 'mo-stack', reason: 'A layout utility.' },
    { class: 'mo-staggered-grid', reason: 'The staggered grid of cards (docs/theme-grid.md).' },
    { class: 'mo-text-*', reason: "The site's text section and its parts." },
    { class: 'mo-truncate', reason: 'A text utility.' },
    { class: 'mo-ui-components', reason: 'The components gallery of the editor.' },
    { class: 'mo-visually-hidden', reason: 'The accessibility utility.' },
  ],
};
