// What a button can open of a promotion of an app's kind: the lookup behind defaults/opens.ts, on the apps' files as the globs of
// src/appFiles.ts give them. Exposes appOpens. Depends on appId.mjs only, so a test can load it.
import { appIdOf } from './appId.mjs';

/** What a button opens of a promotion of this kind: the list's own kinds first (`ownOpens`), then the app whose id is the kind.
 * An app's index.ts (`indexes`, by path: `{ default: AppDefinition }`) wins over its app.json (`manifests`, by path: the
 * manifest), which is how contract 4 apps (no index.ts) say it in `kinds.popups.opens`. Undefined for nothing.
 * @param {Record<string, any>} ownOpens @param {Record<string, any>} indexes @param {Record<string, any>} manifests
 * @param {string | undefined} kind */
export function appOpens(ownOpens, indexes, manifests, kind) {
  const own = ownOpens[kind || 'standard'];
  if (own) return own;
  const find = (/** @type {Record<string, any>} */ files, /** @type {(file: any) => any} */ read) => {
    const entry = Object.entries(files).find(([path]) => appIdOf(path) === kind);
    return entry ? read(entry[1]) : undefined;
  };
  return find(indexes, (module) => module.default?.kinds?.popups?.opens) ?? find(manifests, (manifest) => manifest?.kinds?.popups?.opens);
}
