// The Material Symbols (Outlined) files as the module `virtual:material-symbols-ssr`, answered by themePlugin (theme.mjs):
// all of them as text on the server render (so a backup icon, icon.tsx, is in the built page's HTML at once), nothing in the browser
// (where src/materialIcons.ts is the one lazy chunk). Exposes MATERIAL_SSR and materialSsrModule(). Reads @material-symbols/svg-400.
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The virtual module's id as imported (packages/editor/src/icon.tsx). */
export const MATERIAL_SSR = 'virtual:material-symbols-ssr';

/** The module's source: `{ '/node_modules/@material-symbols/svg-400/outlined/<name>.svg': '<svg …>' }`, the keys as
 * import.meta.glob names them (src/materialIcons.ts). With `ssr` false: an empty object. */
export function materialSsrModule(ssr) {
  if (!ssr) return 'export default {};';
  const dir = new URL('node_modules/@material-symbols/svg-400/outlined/', pathToFileURL(`${process.cwd()}/`));
  const files = {};
  for (const name of readdirSync(dir))
    if (name.endsWith('.svg')) files[`/node_modules/@material-symbols/svg-400/outlined/${name}`] = readFileSync(new URL(name, dir), 'utf8');
  return `export default ${JSON.stringify(files)};`;
}
