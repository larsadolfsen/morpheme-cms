// The CSS files of theme/styles that base.css imports, told apart by what they hold. A reader of the CSS as text (the theme coverage, the
// density and elevation checks, their tests) takes the list from here and names no file itself, so moving a part out of ui.css into a file
// of its own (docs/superpowers/plans/2026-11-16-css-split.md) is one line here and one line in base.css. files.test.mjs fails when base.css
// imports a file this module does not list, or lists one it does not import, so no reader can miss a file.

/** The files that hold what ui.css held: one UI part each (the Divider, the Badge …), in the order base.css imports them. */
export const UI_PART_FILES = [
  'navigation-drawer.css', // right after ui.css in base.css, before divider.css: its section divider is a .divider too
  'text-field.css', // right after ui.css in base.css: the icon buttons in ui.css lose to its rules, and menus.css and pickers.css come after it
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
  'buttons.css', // before ui.css in base.css, after the Lightbox: where the buttons stood, so every part that is also a .button or .icon-button keeps its rank
  'switch.css',
  'radio-button.css',
  'slider.css',
  'bottom-sheet.css',
  'side-sheet.css',
  'tabs.css',
  'top-app-bar.css',
  'menus.css',
  'navigation-bar.css',
  'navigation-rail.css',
  'search.css',
  'toolbar.css',
  'pickers.css',
  'fab.css',
  'button-groups.css',
  'fab-menu.css',
  'ripple.css', // last of the parts: the ripple was last in ui.css
  'reduced-motion.css', // the @layer fallback blocks several parts share, after the ripple
];

/** The site shell's files, what components.css held (the logo and post list, the action bar, the page), in the order base.css imports them. */
export const SITE_SHELL_FILES = ['site-logo-post.css', 'site-action.css', 'site-page.css'];

/** The other CSS files base.css imports, which are not parts of ui.css. */
export const OTHER_BASE_FILES = [
  'ui.css',
  'cards.css',
  'type.css',
  'blocks.css',
  'blocks/person-facts.css',
  'blocks/testimonial.css',
  'lists.css',
  ...SITE_SHELL_FILES,
];
