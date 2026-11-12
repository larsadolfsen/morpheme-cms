// The parts an app's block is typed in place with (its Inline.tsx, `inline` in blocks.ts), for apps to import as
// `@morphemecms/cms/src/inline`: the shared parts of InlineItems.tsx, the type of what the editor gives the view, and the helpers for
// the items. This is the path an app imports; the files behind it may move. A block is a `full` place (docs/app-contract.md,
// "Blocks typed in place"), so this opens nothing to the sandbox that runs an app's hooks.
export { default as InlineItems, InlineAdd, InlineField, InlineSlot } from './InlineItems';
export type { Change, Focus, Item, ItemContext } from './InlineItems';
export type { InlineViewProps } from './inlineViews';
