// Works out the access level of each place of an app (build, editor, worker, pages) from the app's files and app.json.
// Exposes placesOf and hasFullPlace, and the types Access and AppPlaces. Depends on the AppManifest type from appManifest.mjs.
// Paths are relative to the app folder, with `/`. Pure: reads no files.

/** @typedef {import('./appManifest.mjs').AppManifest} AppManifest
 * @typedef {'sandboxed' | 'full' | 'none'} Access
 * @typedef {{ build: Access, editor: Access, worker: Access, pages: Access }} AppPlaces */

/** The name of a file in a folder path, the part after the last `/`. @param {string} file @returns {string} */
const baseName = (file) => file.slice(file.lastIndexOf('/') + 1);

/** The access level of each place of an app.
 * @param {string[]} files The paths of the files in the app's folder, relative, with `/`.
 * @param {AppManifest | null} manifest The app's app.json, or null for an old app (contract 2 or 3) without one.
 * @returns {AppPlaces} */
export function placesOf(files, manifest) {
  const has = (/** @type {string} */ name) => files.includes(name);
  const under = (/** @type {string} */ folder) => files.some((f) => f.startsWith(folder));
  const slotScript = under('slots/');

  if (manifest === null) {
    // An old app has no kinds, hooks or app.json: its index.ts runs in the build and in the editor, and any other
    // script or template file counts as build code. Only editor.ts is editor-only, and it is not in the build.
    const buildCode =
      under('hooks/') ||
      under('slots/') ||
      under('blocks/') ||
      has('build.mjs') ||
      has('after-build.ts') ||
      has('index.ts') ||
      files.some((f) => /\.(ts|tsx|astro)$/.test(f) && f !== 'editor.ts');
    return {
      build: buildCode ? 'full' : 'none',
      editor: has('index.ts') || has('editor.ts') ? 'full' : 'none',
      worker: has('worker.js') ? 'full' : 'none',
      pages: slotScript || files.some((f) => baseName(f) === 'script.ts') ? 'full' : 'none',
    };
  }

  const kinds = Object.keys(manifest.kinds ?? {});
  const inKindFolder = files.some((f) => {
    const slash = f.indexOf('/');
    return slash > 0 && kinds.includes(f.slice(0, slash));
  });
  const buildFull = under('slots/') || under('blocks/') || has('build.mjs') || inKindFolder;
  const buildSandboxed = under('hooks/') || has('after-build.ts');

  return {
    build: buildFull ? 'full' : buildSandboxed ? 'sandboxed' : 'none',
    editor: has('editor.ts') ? 'full' : 'none',
    worker: has('worker.js') ? 'full' : 'none',
    pages: slotScript || files.some((f) => baseName(f) === 'script.ts') ? 'full' : 'none',
  };
}

/** True when any place of the app has full access.
 * @param {AppPlaces} places @returns {boolean} */
export function hasFullPlace(places) {
  return Object.values(places).includes('full');
}
