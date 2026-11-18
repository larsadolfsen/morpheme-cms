// The CSS files of theme/styles that base.css imports, told apart by what they hold. A reader of the CSS as text (the theme coverage, the
// density and elevation checks, their tests) takes the list from here and names no file itself, so moving a part out of ui.css into a file
// of its own (docs/superpowers/plans/2026-11-16-css-split.md) is one line here and one line in base.css. files.test.mjs fails when base.css
// imports a file this module does not list, or lists one it does not import, so no reader can miss a file.

/** The files that hold what ui.css held: one UI part each (the Divider, the Badge …), in the order base.css imports them. */
export const UI_PART_FILES = [
  'divider.css',
  'badge.css',
  'loading-indicator.css',
  'progress-indicators.css',
  'snackbar.css',
  'tooltip.css',
  'checkbox.css', // before ui.css in base.css: the list's selection box is a .checkbox, and the list's rules (in ui.css) must win over it
  'chips.css', // before ui.css in base.css, like the Checkbox: a chip set is also .search-view-filters, whose rules (in ui.css) must win over it
  'dialog.css', // before ui.css in base.css: the pickers' dialogs are .dialog-modal too, and the picker rules (in ui.css) must win over it
  'lightbox.css', // made of the dialog's classes, right after dialog.css
  'switch.css',
  'radio-button.css',
  'slider.css',
  'bottom-sheet.css',
  'side-sheet.css',
  'tabs.css',
  'top-app-bar.css',
  'menus.css',
];

/** The other CSS files base.css imports, which are not parts of ui.css. */
export const OTHER_BASE_FILES = ['ui.css', 'cards.css', 'type.css', 'blocks.css', 'lists.css', 'components.css'];
