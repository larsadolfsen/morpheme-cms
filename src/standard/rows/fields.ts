// The fields a list block (List, Segmented list, FAQ list) has to take its rows from an existing list ("Rows from"): the list, the tags to
// show, and how many; the typed rows are in use only while no list is picked (`typed`). The choices of the list are the relation `rowSources`
// (App.tsx, rowSources in view.ts). Which rows it gives: rows.mjs; drawn by the block's own view.
import { t } from '../../i18n';
import type { BlockData, BlockProps } from '../../blocks';
import type { Field } from '../../schema';
import { sourceOf } from './rows.mjs';
import { editorRows } from './view';

/** Shown only while the block reads a list. */
const dynamic: Field['only'] = { field: 'from', is: [''], not: true };

export const rowsFromFields: Field[] = [
  { name: 'from', label: t.blocks.rows.from, type: 'relation', to: 'rowSources', hint: t.blocks.rows.fromHint },
  {
    name: 'tags',
    label: t.blocks.rows.tags,
    type: 'relation',
    to: 'categories',
    multiple: true,
    add: t.blocks.rows.addTag,
    hint: t.blocks.rows.tagsHint,
    only: dynamic,
  },
  { name: 'howMany', label: t.blocks.rows.howMany, type: 'number', hint: t.blocks.rows.howManyHint, only: dynamic },
];

/** The typed rows' field is in use only while the block reads no list. */
export const typed: Field['only'] = { field: 'from', is: [''] };

/** The name of a block that reads a list in the editor ("Dynamic list"); the block's own name for typed rows. */
export const nameWith = (label: string, props: BlockProps) => (sourceOf(props.from) ? t.blocks.rows.named(label) : label);

/** The first line on a dynamic block's card: where its rows come from (the list's name, by the relation `rowSources`). */
export const fromLine = (props: BlockProps, data: BlockData): string[] => {
  const source = sourceOf(props.from);
  if (!source) return [];
  const name = data.relations.rowSources?.find((o) => o.value === source)?.label ?? source;
  return [t.blocks.rows.from_line(name), ...(editorRows(props, data)?.rows.length ? [] : [t.blocks.rows.empty])];
};
