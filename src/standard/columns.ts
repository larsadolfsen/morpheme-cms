// The setting "Columns" of the blocks that draw rows as a list (List, List - Expand, Questions and answers, Blog posts as a list,
// Testimonials as a list), one definition for all of them. On (the default, and what a saved block without it has): the rows sit in as many
// columns as fit the list's width (theme/styles/blocks.css, --mo-sys-block-list-column-min). Off: always one column, at most 720px wide. The theme draws
// it as data-columns="one" on the list (`oneColumn` of the view), so its CSS keys on the attribute.
import { t } from '../i18n';
import type { Field } from '../schema';

/** The switch "Columns", with `only`: the blocks that have more than one design show it for the list design. */
export const columnsField = (only?: Field['only']): Field => ({
  name: 'columns',
  label: t.blocks.columns.label,
  type: 'boolean',
  toggle: t.blocks.columns.toggle,
  hint: t.blocks.columns.about,
  default: true,
  // A saved block from before the setting has it on, as it was drawn.
  missing: true,
  ...(only ? { only } : {}),
});

/** What a block's view says about its columns: `oneColumn` when the setting is off, else nothing (as many columns as fit). */
export type ColumnsView = { oneColumn?: boolean };

/** A block's columns setting, from its fields: spread next to the head (`...columnsOf(props)`). */
export const columnsOf = (props: Record<string, any>): ColumnsView => (props.columns === false ? { oneColumn: true } : {});

/** The attribute the theme's CSS keys on (`data-columns`), for the lists the editor draws itself while they are typed in place. */
export const columnsAttr = (props: Record<string, any> | undefined): 'one' | undefined => (props?.columns === false ? 'one' : undefined);
