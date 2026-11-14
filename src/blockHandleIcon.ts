// The icons the page editor's blocks draw themselves (the drag handle's, the selection's mark and rows), as SVG markup: a card is not React. It is Material
// Symbols' drag_indicator, the editor's standard icon set, 24 px, in the colour of the text around it. Exposes blockHandleIcon.
import dragIcon from '@material-symbols/svg-400/outlined/drag_indicator.svg?raw';

export const blockHandleIcon = dragIcon.replace('<svg', '<svg width="24" height="24" fill="currentColor" aria-hidden="true"');

// The mark on a block that is selected, and the selection's own rows (Duplicate, Select all), Material Symbols as raw SVG for the bar's menu.
import checkIcon from '@material-symbols/svg-400/outlined/check.svg?raw';
import copyIcon from '@material-symbols/svg-400/outlined/content_copy.svg?raw';
import selectAllIcon from '@material-symbols/svg-400/outlined/select_all.svg?raw';

const sized = (svg: string, size: number) =>
  svg.replace('<svg', `<svg width="${size}" height="${size}" fill="currentColor" aria-hidden="true"`);
export const blockMarkIcon = sized(checkIcon, 18);
export const duplicateIcon = sized(copyIcon, 20);
export const selectAllBlocksIcon = sized(selectAllIcon, 20);

// The Settings button of a block's action row: tune, the one icon for the settings of the thing you are on (meaningIcons.ts).
import { settingsHereIcon } from './meaningIcons';
export const blockSettingsIcon = sized(settingsHereIcon, 24);

// The block's Change to (its ⋮ menu): Material Symbols' swap_horiz; the back row of its submenu: arrow_back.
import swapHorizIcon from '@material-symbols/svg-400/outlined/swap_horiz.svg?raw';
import arrowBackIcon from '@material-symbols/svg-400/outlined/arrow_back.svg?raw';
export const changeToIcon = sized(swapHorizIcon, 20);
export const submenuBackIcon = sized(arrowBackIcon, 20);

// The Table's Column type (its ⋮ menu) and the rows of its submenu: Automatic, Text, Number (Material Symbols view_column, autorenew, text_fields, 123).
import viewColumnIcon from '@material-symbols/svg-400/outlined/view_column.svg?raw';
import autorenewIcon from '@material-symbols/svg-400/outlined/autorenew.svg?raw';
import textFieldsIcon from '@material-symbols/svg-400/outlined/text_fields.svg?raw';
import numberIcon from '@material-symbols/svg-400/outlined/123.svg?raw';
export const columnTypeIcon = sized(viewColumnIcon, 20);
export const typeAutoIcon = sized(autorenewIcon, 20);
export const typeTextIcon = sized(textFieldsIcon, 20);
export const typeNumberIcon = sized(numberIcon, 20);
