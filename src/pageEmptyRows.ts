// The block facts emptyRows.mjs needs, from the registry: which blocks typed in place have rows, and their names.
import { inUse } from './check';
import { t } from './i18n';
import { siteBlocks } from './registry';
import { typedInPlace } from './typedInPlace.mjs';
import { firstEmptyRow as first, leaveOut as leave, withoutEmptyRows as without, type EmptyRow } from './emptyRows.mjs';

export type { EmptyRow };

const describe = (type: string, props: Record<string, any>) => {
  const block = siteBlocks.find((b) => b.type === type);
  const spec = block?.inline;
  if (!block || !spec || !typedInPlace(block) || spec.single || spec.grid || !spec.item) return null;
  const field = block.fields.find((f) => f.name === spec.item);
  if (!field || !inUse(field, block.fields, props)) return null;
  const texts = (t.blocks as unknown as Record<string, { item?: string; items?: string }>)[type];
  return {
    key: spec.item,
    required: !!field.required,
    name: block.label,
    word: texts?.item ?? spec.texts.row.toLowerCase(),
    items: (texts?.items ?? spec.texts.row).toLowerCase(),
  };
};

export const firstEmptyRow = (text: string) => first(describe, text);
export const withoutEmptyRows = (text: string) => without(describe, text);
/** An editor block's props without its empty rows; null: the block goes; undefined: nothing to leave out. */
export const leaveOut = (type: string, props: Record<string, any>) => leave(describe, type, props);
