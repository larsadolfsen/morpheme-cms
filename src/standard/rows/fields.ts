// The fields a list block (List, Segmented list, FAQ list) has to take its rows from an existing list ("Rows from"): the list, the tags to
// show, and how many; the typed rows are in use only while no list is picked (`typed`). The choices of the list are the relation `rowSources`
// (App.tsx, rowSources in view.ts). Which rows it gives: rows.mjs; drawn by the block's own view.
import { t } from '../../i18n';
import type { BlockData, BlockProps } from '../../blocks';
import type { Field } from '../../schema';
import { sourceOf } from './rows.mjs';
import { editorRows } from './view';

/** Shown only while the block reads a list. */
/** A value `from` never has. */
const NEVER = '\u0000';

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
  // Which field of the list shows in which part of a row (`mapOf`, rows.mjs); missing: the list's own (`asRows`). Chosen on the rows in the
  // block (a tap on a part), never in this form, so it is not offered here (`only` that is never met).
  {
    name: 'map',
    label: t.blocks.rows.map,
    type: 'object',
    only: { field: 'from', is: [NEVER] },
    fields: ['title', 'text', 'icon', 'href'].map((name) => ({ name, label: name, type: 'string' as const })),
  },
];

/** The typed rows' field is in use only while the block reads no list. */
export const typed: Field['only'] = { field: 'from', is: [''] };

/** The name of a block that reads a list in the editor ("Dynamic list"); the block's own name for typed rows. */
export const nameWith = (label: string, props: BlockProps) => (sourceOf(props.from) ? t.blocks.rows.named(label) : label);

/** The state line of a dynamic block ("From Services · tag home · 3 items") and, when nothing matches, why nothing shows. */
export const fromLine = (props: BlockProps, data: BlockData): string[] => {
  const source = sourceOf(props.from);
  if (!source) return [];
  const name = data.relations.rowSources?.find((o) => o.value === source)?.label ?? source;
  const wanted: unknown[] = Array.isArray(props.tags) ? props.tags : [];
  const tags = wanted.map((tag) => data.relations.categories?.find((o) => o.value === tag)?.label ?? String(tag));
  const rows = editorRows(props, data)?.rows ?? [];
  return [t.blocks.rows.from_line(name, tags, rows.length), ...(rows.length ? [] : [t.blocks.rows.empty])];
};

/** Where `Edit list` goes: the page of the list the block reads (its entries are edited there only, never in the block). Posts have none here. */
export const listPageOf = (props: BlockProps): string | undefined => {
  const source = sourceOf(props.from);
  return source && source !== 'posts' ? `#list/${source}` : undefined;
};
