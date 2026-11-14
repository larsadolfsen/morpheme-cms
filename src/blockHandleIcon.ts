// The drag handle's icon on a block in the page editor (blockHandle in MarkdownEditor.tsx), as SVG markup: the card is not React. It is Material
// Symbols' drag_indicator, the editor's standard icon set, 24 px, in the colour of the text around it. Exposes blockHandleIcon.
import dragIcon from '@material-symbols/svg-400/outlined/drag_indicator.svg?raw';

export const blockHandleIcon = dragIcon.replace('<svg', '<svg width="24" height="24" fill="currentColor" aria-hidden="true"');
