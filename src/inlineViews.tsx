// What draws a block typed in place, by its type (`inline` in blocks.ts says how it is typed; this is its markup, from the theme, on the
// parts of InlineItems.tsx). A block that is typed in place is added here.
import type { ComponentType } from 'react';
import InlineList from './InlineList';
import type { BlockData, BlockProps } from './blocks';
import InlineCards from './InlineCards';
import InlineSegmented from './InlineSegmented';
import InlineButtons from './InlineButtons';
import InlineFaq from './InlineFaq';
import type { Change, Focus, Item } from './InlineItems';

export type InlineViewProps = {
  items: Item[];
  /** The block's own props (a card's type and colour) and the site's data, for what is drawn as the site draws it. */
  props: BlockProps;
  data: BlockData;
  /** The item being edited; null while the block is not. */
  active: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  onChange: (change: Change) => void;
  /** The link slot of an item is tapped: its settings. */
  onSettings: (item: number) => void;
  /** The icon (or image) slot of an item is tapped: its picker. */
  onIcon: (item: number) => void;
};

export const inlineViews: Record<string, ComponentType<InlineViewProps>> = {
  list: InlineList as ComponentType<InlineViewProps>,
  cards: InlineCards,
  segmented: InlineSegmented,
  buttons: InlineButtons,
  faq: InlineFaq,
};
