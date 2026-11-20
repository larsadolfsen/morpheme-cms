// The address of the new versions of pages: /new/<the current page's address>, overview /new/. They were /ny/ until 0.15.0, and a
// page file a site has not moved yet (src/content/pages/ny/, or a `path: /ny/…`) is still read, at its new address, for one release.
// Exposes PREVIEW, OLD_PREVIEW, renamedPreview, inPreview and oldPreviewWarnings. Pure: no site config, so lib/ and the build can import it.

export const PREVIEW = '/new/';
/** The old address (the Worker sends it on to PREVIEW, worker/movedAddresses.js). */
export const OLD_PREVIEW = '/ny/'; // language-ok: an old public address
/** The old folder of the new versions, under src/content/pages/. */
const OLD_FOLDER = 'ny/'; // language-ok: an old folder name

/** The address with the old prefix swapped for the new: /ny/vrede/ -> /new/vrede/. Any other address as it is. @param {string} address */
export const renamedPreview = (address) => (address.startsWith(OLD_PREVIEW) ? PREVIEW + address.slice(OLD_PREVIEW.length) : address);

/** Whether the address is a new version of a page (under the old prefix too); the overview itself is none. @param {string} address */
export const inPreview = (address) => {
  const now = renamedPreview(address);
  return now.startsWith(PREVIEW) && now !== PREVIEW;
};

/**
 * What to tell the owner about pages still at the old place, one line for each: a page file under `ny/` or with a `path` under
 * /ny/. They still work (read at /new/…), so it is a warning, never a stop.
 * @param {{ file: string, path?: string }[]} pages `file`: relative to the pages folder, with `/`; `path`: the page's own front matter path
 * @returns {string[]}
 */
export function oldPreviewWarnings(pages) {
  return pages.flatMap(({ file, path }) => {
    const inFolder = file.startsWith(OLD_FOLDER);
    const own = typeof path === 'string' && path.startsWith(OLD_PREVIEW);
    if (!inFolder && !own) return [];
    const fromFile = PREVIEW + file.slice(OLD_FOLDER.length).replace(/(^|\/)index\.md$|\.md$/, '') + '/';
    const now = typeof path === 'string' && path ? renamedPreview(path) : fromFile;
    const what = inFolder
      ? `the page file src/content/pages/${file} is still in the folder ${OLD_FOLDER}`
      : `the page src/content/pages/${file} still has the path ${path}`;
    return [
      `${what}. It is read and shown at ${now} for now (a temporary alias). Move it to src/content/pages/${PREVIEW.slice(1)} and write its path as ${now}.`,
    ];
  });
}
