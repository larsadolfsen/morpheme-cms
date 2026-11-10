// Determines the side block type to draw beside a page's text, and what the editor offers about it.
// Exposes sideBlockOf (the site), besideInSource and sideChoices (the editor: Sidekolonne).
// Depends on hasSidebar in lib/page-template.mjs.
import { hasSidebar } from './page-template.mjs';

/**
 * The block type to draw beside a page's text, or null.
 * @param {string} template  the page's template (templateOf in lib/page-template.mjs)
 * @param {{ block: string | null } | null} setting  the contents of src/data/side.json, or null when the file is missing
 * @param {(type: string) => boolean} beside  whether that type's load.ts has beside: true
 * @returns {string | null}
 */
export function sideBlockOf(template, setting, beside) {
  // Only the sidebar templates have a column
  if (!hasSidebar(template)) {
    return null;
  }

  // When setting is null or undefined, return null
  if (setting === null || setting === undefined) {
    return null;
  }

  // When setting.block is not a non-empty string, return null
  if (typeof setting.block !== 'string' || setting.block.length === 0) {
    return null;
  }

  // When beside(setting.block) is not true, return null
  if (beside(setting.block) !== true) {
    return null;
  }

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
 * The installed block types that can be drawn beside a page's text, for the choice under "Appearance" › "Side column".
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
