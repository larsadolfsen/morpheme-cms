// Determines the side block type to draw beside a page's text, and what the editor offers about it.
// Exposes sideBlockOf (the site), besideInSource, sideChoices and sideSwitchShown (the editor: Sidekolonne).
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

/**
 * Whether a block's load.ts source says `export const beside = true` (the editor never imports load.ts, so it reads the text).
 * @param {string} source
 * @returns {boolean}
 */
export function besideInSource(source) {
  return /^export\s+const\s+beside\s*=\s*true\s*;?\s*$/m.test(source);
}

/**
 * The installed block types that can be drawn beside a page's text, for the choice under "Udseende" › "Sidekolonne".
 * @param {{ type: string, label: string, app?: string }[]} blocks  every block the editor knows (siteBlocks)
 * @param {Record<string, string>} sources  the text of each block's load.ts, by type
 * @param {string[]} installed  the ids of the apps installed
 * @returns {{ type: string, label: string }[]}
 */
export function sideChoices(blocks, sources, installed) {
  return blocks
    .filter((b) => (!b.app || installed.includes(b.app)) && besideInSource(sources[b.type] ?? ''))
    .map((b) => ({ type: b.type, label: b.label }));
}

/**
 * Whether the page form shows the switch "Sidekolonne": src/data/side.json chooses a block and the page is not wide.
 * @param {{ block?: unknown } | null | undefined} setting  the contents of src/data/side.json
 * @param {{ wide?: unknown }} page  the page's values
 * @returns {boolean}
 */
export function sideSwitchShown(setting, page) {
  return typeof setting?.block === 'string' && setting.block.length > 0 && page?.wide !== true;
}
