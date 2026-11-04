// All of Material Symbols (Outlined, regular and filled) as text, by their file, for the icons icon.tsx draws that are not on
// its list: one lazy chunk, loaded in the browser the first time one is drawn (the server render has them from
// virtual:material-symbols-ssr instead, packages/editor/site/materialSymbols.mjs). Imported by icon.tsx only dynamically.
export const materialIcons = import.meta.glob<string>('/node_modules/@material-symbols/svg-400/outlined/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
