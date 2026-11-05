// The header's site setting (src/data/header.json, optional): a button in place of the phone icon, and the side of the
// header the mobile menu button sits on. Exposes headerOf (pure; missing or wrong data gives the defaults).
// Used by site/site.ts; the Button type is src/standard/buttons/fields.ts.

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
