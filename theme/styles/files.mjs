// The CSS files of theme/styles that base.css imports, told apart by what they hold. A reader of the CSS as text (the theme coverage, the
// density and elevation checks, their tests) takes the list from here and names no file itself, so a part of its own file (docs/superpowers/plans/2026-11-16-css-split.md)
// is one line here and one line in ui.css (or base.css for the other files). files.test.mjs fails when ui.css or base.css imports a file this
// module does not list, or lists one it does not import, so no reader can miss a file.

/** The files that hold what ui.css held: one UI part each (the Divider, the Badge …), in the order ui.css imports them: the order their rules had in it. */
export const UI_PART_FILES = [
  'ui/target-size.css',
  'ui/buttons.css',
  'ui/text-field.css',
  'ui/checkbox.css',
  'ui/chips.css',
  'ui/dialog.css',
  'ui/lightbox.css',
  'ui/bottom-sheet.css',
  'ui/card.css',
  'ui/list.css',
  'ui/top-app-bar.css',
  'ui/menus.css',
  'ui/navigation-drawer.css',
  'ui/tabs.css',
  'ui/fab.css',
  'ui/button-groups.css',
  'ui/fab-menu.css',
  'ui/switch.css',
  'ui/radio-button.css',
  'ui/slider.css',
  'ui/divider.css',
  'ui/side-sheet.css',
  'ui/avatar.css',
  'ui/badge.css',
  'ui/loading-indicator.css',
  'ui/progress-indicators.css',
  'ui/snackbar.css',
  'ui/tooltip.css',
  'ui/navigation-bar.css',
  'ui/navigation-rail.css',
  'ui/search.css',
  'ui/toolbar.css',
  'ui/pickers.css',
  'ui/ripple.css',
  'ui/reduced-motion.css',
];

/** The site shell's files, what components.css held (the logo and post list, the action bar, the page), in the order base.css imports them. */
export const SITE_SHELL_FILES = [
  'site-logo-post.css',
  'site-action.css',
  'site-page.css',
  'site-header.css',
  'site-footer.css',
  'site-popups.css',
  'site-blog.css',
];

/** The files global.css imports after its own rules' place (what global.css held, the Material theme's look), relative to theme/styles/, in the order it imports them. Never imported by base.css: a theme that imports only base.css must not get Material's values. */
export const MATERIAL_FILES = [
  'material/page.css',
  'material/buttons-chips.css',
  'material/fields.css',
  'material/icon-buttons.css',
  'material/block-looks.css',
  'material/prose-testimonial.css',
  'material/navigation.css',
  'material/footer.css',
  'material/dividers.css',
];

/** The other CSS files base.css imports, which are not parts of ui.css. */
export const OTHER_BASE_FILES = [
  'reset.css',
  'ui.css',
  'cards.css',
  'type.css',
  'elevation.css',
  'prose.css',
  'layout.css',
  'blocks/text-section.css',
  'blocks/steps.css',
  'blocks/expand.css',
  'blocks/buttons-links.css',
  'blocks/testimonial.css',
  'blocks/row.css',
  'blocks/panel.css',
  'blocks/person-facts.css',
  'blocks/link-row.css',
  'blocks/cta-prices.css',
  'blocks/checklist.css',
  'blocks/prose.css',
  'lists.css',
  ...SITE_SHELL_FILES,
];
