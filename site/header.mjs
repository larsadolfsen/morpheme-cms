// The header's site setting (src/data/header.json, optional): a button in place of the phone icon, and the side of the
// header the mobile menu button sits on; and the main menu's items as the header draws them. Exposes headerOf (pure;
// missing or wrong data gives the defaults) and sortedNav. Used by site/site.ts and the editor's preview of the header
// (src/headerPreview.mjs); the Button type is src/standard/buttons/fields.ts.

/** @typedef {import('../src/standard/buttons/fields').Button} Button */
/** @typedef {{ button: Button | null, menuSide: 'start' | 'end' }} Header */

/**
 * Reads src/data/header.json's content. Missing or wrong → defaults.
 * @param {unknown} raw
 * @returns {Header}
 */
export function headerOf(raw) {
  const data = raw && typeof raw === 'object' ? /** @type {Record<string, any>} */ (raw) : {};
  const { enabled, ...button } = data.button && typeof data.button === 'object' ? data.button : { enabled: false };
  return {
    button: enabled === true ? button : null,
    menuSide: data.menuSide === 'end' ? 'end' : 'start',
  };
}

/** @typedef {{ label: string, href: string }} NavLink */
/** @typedef {NavLink & { children?: NavLink[] }} NavItem */

/**
 * The main menu's items (menu.json) as the header draws them: the sub-items in alphabetical order (Danish: æ, ø, å last).
 * @template {NavItem} T
 * @param {T[]} items
 * @returns {T[]}
 */
export const sortedNav = (items) =>
  items.map((item) =>
    item.children ? { ...item, children: [...item.children].sort((a, b) => a.label.localeCompare(b.label, 'da')) } : item,
  );
