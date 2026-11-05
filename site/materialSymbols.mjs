// The Material Symbols (Outlined) files as two modules answered by themePlugin (theme.mjs): `virtual:material-symbols` (all of them
// as text, for the one lazy chunk of src/materialIcons.ts) and `virtual:material-symbols-ssr` (all of them on the server render, so
// a backup icon, icon.tsx, is in the built page's HTML at once; `{}` in the browser). Files are read one at a time, never globbed
// (7,874 open files at once stops Cloudflare's build with EMFILE). Exposes MATERIAL_ALL, MATERIAL_SSR, materialFiles, materialModule,
// materialSsrModule. Reads @material-symbols/svg-400.
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The virtual module's id as imported (src/materialIcons.ts). */
export const MATERIAL_ALL = 'virtual:material-symbols';
/** The virtual module's id as imported (packages/editor/src/icon.tsx). */
export const MATERIAL_SSR = 'virtual:material-symbols-ssr';

const PREFIX = '/node_modules/@material-symbols/svg-400/outlined/';

/** All Outlined files as text, read one at a time: `{ '/node_modules/@material-symbols/svg-400/outlined/<name>.svg': '<svg …>' }`,
 * the keys as import.meta.glob named them. `dir` is the URL or the path of the outlined/ folder. */
export function materialFiles(dir) {
  const base = dir instanceof URL ? dir : pathToFileURL(`${String(dir).replace(/[\/]+$/, '')}/`);
  const files = {};
  for (const name of readdirSync(base).sort()) if (name.endsWith('.svg')) files[PREFIX + name] = readFileSync(new URL(name, base), 'utf8');
  return files;
}

const outlined = () => new URL(`node_modules/@material-symbols/svg-400/outlined/`, pathToFileURL(`${process.cwd()}/`));

/** The module's source: `export default` of all the files (materialFiles). */
export function materialModule() {
  return `export default ${JSON.stringify(materialFiles(outlined()))};`;
}

/** The SSR module's source: the same as materialModule. With `ssr` false: an empty object. */
export function materialSsrModule(ssr) {
  return ssr ? materialModule() : 'export default {};';
}
