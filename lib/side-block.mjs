// Determines the side block type to draw beside a page's text.
// Exposes sideBlockOf function.
// No dependencies.

/**
 * The block type to draw beside a page's text, or null.
 * @param {{ wide?: boolean, side?: boolean }} page  the page's front matter
 * @param {{ block: string | null } | null} setting  the contents of src/data/side.json, or null when the file is missing
 * @param {(type: string) => boolean} beside  whether that type's load.ts has beside: true
 * @returns {string | null}
 */
export function sideBlockOf(page, setting, beside) {
  // Treat null or undefined page as empty object
  const p = page || {};

  // Rule 1: When setting is null or undefined, return null
  if (setting === null || setting === undefined) {
    return null;
  }

  // Rule 2: When setting.block is not a non-empty string, return null
  if (typeof setting.block !== 'string' || setting.block.length === 0) {
    return null;
  }

  // Rule 3: When page.wide === true, return null
  if (p.wide === true) {
    return null;
  }

  // Rule 4: When page.side === false, return null
  if (p.side === false) {
    return null;
  }

  // Rule 5: When beside(setting.block) is not true, return null
  if (beside(setting.block) !== true) {
    return null;
  }

  // Rule 6: Return setting.block
  return setting.block;
}
