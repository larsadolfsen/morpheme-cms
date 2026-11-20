// One icon per meaning (owner, 14 Nov; docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md, section 3.1), as Material Symbols'
// raw SVG for the parts drawn outside React (the bar, its ⋮, the block action row). `tune` is the settings of the thing you are on (a block, a section, a
// card, an image, a list's settings); `edit` (the pencil) opens content to edit somewhere else (Edit list, Edit page), never settings. `settings` (the gear)
// is only the editor's Settings and an app's Settings tab, drawn by name through Icon. lib/actionRules.mjs (iconProblems, scanIconProblems) checks it.
// A block's own settings are the exception (owner, 14 Nov): `widgets` with a small cog (src/icons/block-settings.svg, BlockSettingsIcon in icon.tsx).
// Exposes settingsHereIcon, blockSettingsHereIcon, editElsewhereIcon.
import tuneIcon from '@material-symbols/svg-400/outlined/tune.svg?raw';
import blockSettingsFile from './icons/block-settings.svg?raw';
import editIcon from '@material-symbols/svg-400/outlined/edit.svg?raw';

/** The settings of the thing you are on: `tune`. */
export const settingsHereIcon: string = tuneIcon;
/** Content edited somewhere else: `edit`. */
export const editElsewhereIcon: string = editIcon;
/** The settings of a block: `widgets` with a small cog. */
export const blockSettingsHereIcon: string = blockSettingsFile;
