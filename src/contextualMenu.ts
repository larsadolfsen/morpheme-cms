// The block bar's actions and icons (blockBar.ts, MarkdownEditor.tsx): a block in the text of a page has no floating bar; its tools are in the text's one bar, which takes the
import arrowDownIcon from '@material-symbols/svg-400/outlined/arrow_downward.svg?raw';
import arrowUpIcon from '@material-symbols/svg-400/outlined/arrow_upward.svg?raw';
import { blockSettingsHereIcon } from './meaningIcons';
import linkIcon from '@material-symbols/svg-400/outlined/link.svg?raw';
import dynamicIcon from '@material-symbols/svg-400/outlined/dynamic_feed.svg?raw';
import rowAboveIcon from '@material-symbols/svg-400/outlined/add_row_above.svg?raw';
import rowBelowIcon from '@material-symbols/svg-400/outlined/add_row_below.svg?raw';
import columnBeforeIcon from '@material-symbols/svg-400/outlined/add_column_left.svg?raw';
import columnAfterIcon from '@material-symbols/svg-400/outlined/add_column_right.svg?raw';
import alignLeftIcon from '@material-symbols/svg-400/outlined/format_align_left.svg?raw';
import alignCenterIcon from '@material-symbols/svg-400/outlined/format_align_center.svg?raw';
import alignRightIcon from '@material-symbols/svg-400/outlined/format_align_right.svg?raw';
import alignAutoIcon from '@material-symbols/svg-400/outlined/autorenew.svg?raw';
import rowDeleteIcon from '@material-symbols/svg-400/outlined/playlist_remove.svg?raw';
import columnDeleteIcon from '@material-symbols/svg-400/outlined/variable_remove.svg?raw';
import deleteIcon from '@material-symbols/svg-400/outlined/delete.svg?raw';
import replaceImageIcon from '@material-symbols/svg-400/outlined/replace_image.svg?raw';
import cropIcon from '@material-symbols/svg-400/outlined/crop.svg?raw';

export type BarAction = {
  label: string;
  kind:
    | 'above'
    | 'below'
    | 'up'
    | 'down'
    | 'link'
    | 'column-before'
    | 'column-after'
    | 'delete-row'
    | 'delete-column'
    | 'delete'
    | 'align-left'
    | 'align-center'
    | 'align-right'
    | 'align-auto'
    // A selected image's tools (image tools spec, section 4): Change image, Crop, Alt text, Remove.
    | 'change-image'
    | 'crop'
    | 'alt-text'
    | 'remove'
    // A selected video's tool (image tools spec, section 8): Change link.
    | 'change-link';
  /** Drawn as a labelled text button with no icon (Alt text: no Material Symbol is named or tagged for it, image tools spec 1b.6). */
  text?: boolean;
  /** A choice among others (a column's alignment): shown pressed when it is the current one. */
  pressed?: boolean;
  /** It does not apply now (Move up for blocks that are not next to each other), with `reason` for screen readers and the mouse's hover. */
  disabled?: boolean;
  reason?: string;
  action: () => void;
};

/** The icon (raw SVG) of each bar action, and of the settings button (`gear`, drawn as tune: one icon per meaning) and the dynamic button. */
export const barIcons = {
  gear: blockSettingsHereIcon,
  dynamic: dynamicIcon,
  above: rowAboveIcon,
  below: rowBelowIcon,
  up: arrowUpIcon,
  down: arrowDownIcon,
  link: linkIcon,
  'column-before': columnBeforeIcon,
  'column-after': columnAfterIcon,
  'delete-row': rowDeleteIcon,
  'delete-column': columnDeleteIcon,
  delete: deleteIcon,
  'align-left': alignLeftIcon,
  'align-center': alignCenterIcon,
  'align-right': alignRightIcon,
  'align-auto': alignAutoIcon,
  'change-image': replaceImageIcon,
  crop: cropIcon,
  // A text button: no icon (BarAction.text).
  'alt-text': '',
  remove: deleteIcon,
  'change-link': linkIcon,
};
