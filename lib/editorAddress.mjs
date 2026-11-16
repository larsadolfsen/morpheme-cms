// The editor's address is /edit/ (it was /editor/, which still sends on to /edit/). A page of the site cannot have either address:
// the editor's own page is there. Used by `check:content` and by the build (pages/[...slug].astro).

/** The addresses a page of the site cannot have. */
export const EDITOR_ADDRESSES = ['/edit/', '/editor/'];

/** The words the build and `check:content` give for a page at one of the editor's addresses. */
export const editorAddressMessage = (address, file) => `The address ${address} is the editor's. Move the page ${file} to another address.`;

/** The editor's address a page is at (`path`, or `/<file without .md>/` when it has none), or undefined. @param {string | undefined} path @param {string} file */
export function editorAddressOf(path, file) {
  const address = (path ?? `/${file.replace(/\.md$/, '')}/`).replace(/^\/?/, '/').replace(/\/?$/, '/');
  return EDITOR_ADDRESSES.find((a) => a === address);
}

/** One problem per page at an editor address. @param {{ file: string, path?: string }[]} pages `file` as in src/content/pages/ */
export function editorAddressProblems(pages) {
  const problems = [];
  for (const { file, path } of pages) {
    const address = editorAddressOf(path, file);
    if (address) problems.push(editorAddressMessage(address, `src/content/pages/${file}`));
  }
  return problems;
}
