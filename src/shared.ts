// A block's shared texts: the ones every copy of it has ("Read more"), in shared.ts in its folder
// (src/apps/<app>/blocks/<type>/shared.ts), written in the site's language like the rest of the block. They come
// with the block: its screen under "Blocks" is made of them (site.ts), and until the owner saves their own
// (in config.blockTexts, under the block's type) the site uses those written here. Their names in the
// editor's other languages are in the block's texts.ts, like its other texts. The site's build reads
// them (packages/editor/site/site.ts), so they import nothing that needs a browser.
// A standard block can have them too (standard/<type>/shared.ts, found by standard/sharedTexts.ts): its
// fields named in the editor's language (t), its values in the site's (siteT).
import type { Field, PreviewVariant } from './schema';

export type SharedTexts = {
  /** The fields of its screen under "Blocks". */
  fields: Field[];
  /** The texts before any are saved. */
  values: Record<string, unknown>;
  /** Its screen draws the block under the fields (Part.preview), with these props when no page has it. */
  preview?: { props?: Record<string, unknown>; shared?: boolean; variants?: PreviewVariant[] };
};
export const defineShared = (texts: SharedTexts) => texts;

/** The type of a block from the path of a file in its folder (".../blocks/offer/shared.ts": "offer"). */
export const blockTypeOf = (path: string) => path.split('/').at(-2)!;

/** The shared texts of the blocks as the site shows them, by type: those written in their shared.ts,
 * with the saved ones over them. `declared`: the shared.ts files by their path. */
export function sharedTexts(
  declared: Record<string, SharedTexts>,
  saved: Record<string, Record<string, unknown> | undefined>,
): Record<string, Record<string, any>> {
  return Object.fromEntries(
    Object.entries(declared).map(([path, texts]) => [blockTypeOf(path), { ...texts.values, ...saved[blockTypeOf(path)] }]),
  );
}

/** A block's shared texts in the editor's drawing of it: the site's as the files are now (`blocks` of
 * the site's data, BlockData.site), else `values` (those in its shared.ts). */
export const sharedIn = (site: unknown, type: string, values: Record<string, unknown>): Record<string, any> => ({
  ...values,
  ...(site as { blocks?: Record<string, Record<string, unknown>> }).blocks?.[type],
});

/** A shared text with each {name} filled in ("Read more about {topic}"); a name without a value stays. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (all, name: string) => (name in values ? String(values[name]) : all));
