// What draws a block typed in place, by its type (`inline` in blocks.ts says how it is typed; this is its markup, from the theme, on the
// parts of InlineItems.tsx). A block that is typed in place is added here.
import type { ComponentType } from 'react';
import InlineList from './InlineList';
import type { BlockData, BlockProps } from './blocks';
import type { Field } from './schema';
import type { RowSpec } from './BlockDialog';
import InlineCards from './InlineCards';
import InlineTable from './InlineTable';
import InlineNotice from './InlineNotice';
import InlineVideo from './InlineVideo';
import InlineSteps from './InlineSteps';
import InlineExpand from './InlineExpand';
import InlineButtons from './InlineButtons';
import InlinePriceCards from './InlinePriceCards';
import InlineTestimonials from './InlineTestimonials';
import InlinePosts from './InlinePosts';
import InlineImageGrid from './InlineImageGrid';
import type { Change, Focus, Item } from './InlineItems';

export type InlineViewProps = {
  items: Item[];
  /** The block's own props (a card's type and colour) and the site's data, for what is drawn as the site draws it. */
  props: BlockProps;
  data: BlockData;
  /** The item being edited; null while the block is not. */
  active: number | null;
  /** A grid's active column (the Table); null while no cell is. */
  col: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  onChange: (change: Change) => void;
  /** A folding block: the rows the owner opened (true) or closed (false) with the chevron, by row; a row not here is open while it is the active one. */
  folds?: Record<number, boolean>;
  /** Opens or closes a row (view state only); null gives the row back to the active-row rule. */
  onFold?: (row: number, open: boolean | null) => void;
  /** The link slot of an item is tapped: its settings. */
  onSettings: (item: number) => void;
  /** The icon (or image) slot of an item is tapped: its picker. */
  onIcon: (item: number, kindChosen?: boolean) => void;
  /** Changes the block's own props (a card's media kind). */
  onProps: (patch: BlockProps) => void;
  /** Opens the page sheet for a relation field (a button's page, or what its target opens): the value picked, or null when the sheet was closed. */
  onPick?: (field: Field, value: string, title: string) => Promise<string | null>;
  /** Opens the block's Edit sheet (a block with a setting that is not typed in place, like the FAQ's button page). */
  onEdit?: () => void;
  /** Opens a sheet of settings for something in the block that is not an item (the Image grid's image: its text), or closes it with null. */
  onRow?: (spec: RowSpec | null) => void;
};

export const inlineViews: Record<string, ComponentType<InlineViewProps>> = {
  list: InlineList as ComponentType<InlineViewProps>,
  cards: InlineCards,
  table: InlineTable,
  notice: InlineNotice,
  video: InlineVideo,
  steps: InlineSteps,
  expand: InlineExpand,
  buttons: InlineButtons,
  pricecards: InlinePriceCards,
  testimonials: InlineTestimonials,
  posts: InlinePosts,
  imagegrid: InlineImageGrid,
};
