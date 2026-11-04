// Every block on the site drawn from its view (view.tsx): its drawing and its contract's load.ts, by type. A standard
// block's drawing is the theme in use's View.tsx, else the standard theme's; an app's block is its own
// (src/apps/<app>/blocks/), and is used instead of a standard one by its name.
import { appLooks, themeViews } from './siteLooks';
import type { Contract, View } from './view';
import { parseBlock } from '../../lib/blocks.mjs';
import { sideBlockOf } from '../../lib/side-block.mjs';
import { sideSetting } from '../../site/side';

const byType = <T>(found: Record<string, T>) => Object.fromEntries(Object.entries(found).map(([file, m]) => [file.split('/').at(-2)!, m]));
const defaults = <T>(found: Record<string, { default: T }>) =>
  Object.fromEntries(Object.entries(byType(found)).map(([type, m]) => [type, m.default]));

/** The drawing of each block, by its type (BlockSite.astro). */
export const blockViews: Record<string, View<any>> = {
  ...defaults(themeViews.standard),
  ...defaults(themeViews.own),
  ...defaults(appLooks.views),
};

/** Each block's view on the site, by its type: the standard blocks' contracts (load.ts here), and the apps'. */
export const blockLoads: Record<string, Contract<any>> = {
  ...byType(import.meta.glob<Contract<any>>('./*/load.ts', { eager: true })),
  ...byType(appLooks.loads),
};

/** The block type drawn in a column beside the text of a page, or null: the one src/data/side.json chooses, when its
 * load.ts says `beside`, unless the page is `wide` or has `side: false` (lib/side-block.mjs). The theme's page layout
 * (PageLayout.astro) draws it with Block.astro, given the page's text as `html`. */
export const sideBlock = (page: { wide?: boolean; side?: boolean }): string | null =>
  sideBlockOf(page, sideSetting, (type) => blockLoads[type]?.beside === true);

// A block's tag in the text, at its very end (blocks.mjs writes it so).
const END = /<div data-block="([\w-]+)"(?: data-props="[^"]*")?\s*><\/div>\s*$/;

/** The block that ends a page's text, when its type is drawn across the page (`across` in its load.ts, e.g. an app's
 * booking block): its type and props, and the text without it, for the theme's page layout to draw it below the
 * text (EndBlock.astro). Null when the text ends otherwise, or the block is hidden. */
export function endBlock(html: string): { type: string; props: Record<string, unknown>; html: string } | null {
  const end = html.match(END);
  if (!end || !blockLoads[end[1]]?.across) return null;
  const block = parseBlock(end[0]);
  if (!block || block.props.hidden) return null;
  return { type: end[1], props: block.props, html: html.replace(END, '') };
}
