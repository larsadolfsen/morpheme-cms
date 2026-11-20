// All of Material Symbols (Outlined, regular and filled) as text, by their file, for the icons icon.tsx draws that are not on
// its list: one lazy chunk, loaded in the browser the first time one is drawn. The set comes from virtual:material-symbols
// (packages/editor/site/materialSymbols.mjs), one module read file by file. Imported by icon.tsx only dynamically.
import all from 'virtual:material-symbols';

export const materialIcons: Record<string, string> = all;
