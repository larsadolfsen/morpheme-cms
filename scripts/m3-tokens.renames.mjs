// The theme tokens whose name is not the dotted-to-dashed form of an M3 token's, and the M3 token(s) each one stands for, so `npm run check:m3-tokens` compares
// them (batch A of plans/2026-11-21-0-19-5-measured-m3-check.md). The names of the theme follow M3's in 0.20.0 (specs/2026-11-20-material-3-names-design.md), and
// this list then empties. Where the theme's one token holds both sides of M3's two (`padding` = `leading-space` + `trailing-space`), it lists both.
// Our sizes by M3's heights (that spec, 3): our *medium* button (40 dp) is M3 Expressive's *small*, our *small* (40 dp) the same, our *xsmall* (32 dp) M3's *xsmall*.
// A target must be an M3 token of docs/m3-tokens/ (a test fails on one that is not); a token whose M3 value is a composite or a state mix is not listed here.
const both = (base) => [`${base}.leading-space`, `${base}.trailing-space`];
const LIST = 'md.comp.list.md.comp.list.list-item'; // M3's data repeats the prefix for these three heights
export const RENAMES = {
  // Buttons
  '--mo-comp-button-padding': both('md.comp.button.small'),
  '--mo-comp-button-small-padding': both('md.comp.button.small'),
  '--mo-comp-button-xsmall-padding': both('md.comp.button.xsmall'),
  '--mo-comp-button-small-container-height': ['md.comp.button.small.container.height'],
  '--mo-comp-button-small-container-shape-square': ['md.comp.button.small.container.shape.square'],
  // Cards
  '--mo-comp-card-radius': [
    'md.comp.elevated-card.container.shape',
    'md.comp.filled-card.container.shape',
    'md.comp.outlined-card.container.shape',
  ],
  // Lists
  '--mo-comp-list-item-two-line-min-height': [`${LIST}.two-line.container.height`],
  '--mo-comp-list-item-three-line-min-height': [`${LIST}.three-line.container.height`],
  '--mo-comp-list-item-padding-block': ['md.comp.list.list-item.top-space', 'md.comp.list.list-item.bottom-space'],
  '--mo-comp-list-item-padding-inline': both('md.comp.list.list-item'),
  '--mo-comp-list-item-gap': ['md.comp.list.list-item.between-space'],
  '--mo-comp-list-item-hover-radius': ['md.comp.list.list-item.hovered.container.expressive.shape'],
  '--mo-comp-list-item-pressed-radius': ['md.comp.list.list-item.pressed.container.expressive.shape'],
  '--mo-comp-list-item-dragged-radius': ['md.comp.list.list-item.dragged.container.expressive.shape'],
  '--mo-comp-list-item-selected-radius': ['md.comp.list.list-item.selected.container.expressive.shape'],
  // Menus (Expressive's `menus`)
  '--mo-comp-menu-item-radius': ['md.comp.menus.menu-item.shape'],
  '--mo-comp-menu-item-edge-radius': ['md.comp.menus.menu-item.first-child.shape', 'md.comp.menus.menu-item.last-child.shape'],
  '--mo-comp-menu-item-selected-radius': ['md.comp.menus.menu-item.selected.shape'],
  '--mo-comp-menu-group-inner-radius': ['md.comp.menus.menu-item.first-child.inner-corner.corner-size'],
  '--mo-comp-menu-item-font-size': ['md.comp.menus.menu-item.label-text.size'],
  '--mo-comp-menu-item-letter-spacing': ['md.comp.menus.menu-item.label-text.tracking'],
  '--mo-comp-menu-item-weight': ['md.comp.menus.menu-item.label-text.weight'],
  // Date pickers
  '--mo-comp-date-picker-docked-radius': ['md.comp.date-picker.docked.container.shape'],
  '--mo-comp-date-picker-day-radius': ['md.comp.date-picker.docked.date.container.shape'],
  // Search
  '--mo-comp-search-bar-padding': both('md.comp.search-bar'),
  '--mo-comp-search-bar-gap': ['md.comp.search-bar.leading-icon.leading-icon-label-space'],
  '--mo-comp-search-view-radius': ['md.comp.search-view.docked.container.shape'],
  // Navigation bar (Expressive's flexible `nav-bar`)
  '--mo-comp-navigation-bar-active-indicator-width': ['md.comp.nav-bar.item.vertical.active-indicator.width'],
  '--mo-comp-navigation-bar-active-indicator-shape': ['md.comp.nav-bar.item.active-indicator.shape'],
  '--mo-comp-navigation-bar-active-indicator-color': ['md.comp.nav-bar.item.active.indicator.color'],
  '--mo-comp-navigation-bar-active-label-text-color': ['md.comp.nav-bar.item.active.label-text.color'],
  '--mo-comp-navigation-bar-inactive-label-text-color': ['md.comp.nav-bar.item.inactive.label-text.color'],
  // Progress
  '--mo-comp-linear-progress-indicator-radius': ['md.comp.progress-indicator.track.shape'],
  '--mo-comp-linear-progress-indicator-stop-size': ['md.comp.progress-indicator.linear.stop-indicator.size'],
};
