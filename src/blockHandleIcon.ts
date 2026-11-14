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

// The Settings button of a block's action row: Material Symbols' tune (sliders), not the gear of the bar's item settings, so the two do not look alike.
import tuneIcon from '@material-symbols/svg-400/outlined/tune.svg?raw';
export const blockSettingsIcon = sized(tuneIcon, 24);
