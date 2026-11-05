// The Vite plugin behind `import self from '@app/self'` (app contract 3): the id of the app whose folder the importing
// file is in. Exposes appSelf. Depends on appIdOf (lib/appId.mjs).
import { appIdOf } from '../lib/appId.mjs';

const SELF = '@app/self';
const PREFIX = '\0app-self:';

/** @returns {import('vite').Plugin} */
export function appSelf() {
  return {
    name: 'app-self',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source !== SELF) return null;
      const path = (importer ?? '').split('?')[0].replaceAll('\\', '/');
      if (!/\/src\/apps\/[^/]+\//.test(path)) throw new Error(`${SELF} is only for app files: ${path}`);
      return PREFIX + appIdOf(path);
    },
    load(id) {
      return id.startsWith(PREFIX) ? `export default { id: ${JSON.stringify(id.slice(PREFIX.length)).replaceAll('"', "'")} };` : null;
    },
  };
}
