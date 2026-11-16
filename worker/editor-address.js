// The editor's address is /edit/. It was /editor/: that address and everything under it goes on to the same address under /edit/,
// with the query (the browser keeps what is after "#"), so bookmarks, the editor installed on a phone, a theme's icon path
// (/editor/icon-192.png) and an old sign-in return all keep working. 308, not 301: a POST stays a POST.
// Three things under /editor/ are answered here instead, because a redirect does not do:
//   /editor/sw.js        a service worker script cannot be behind a redirect: this one removes the old worker (and its scope) itself.
//   /editor/version.json the version of the build, also asked for at the old address while sites move (live-diff, an older editor).
//   /editor/<icon>.png   a site's own icons were saved there (public/editor/): served when they are there, else sent on to /edit/.
// And the other way round: a site's own icons saved at the old place answer at /edit/ too, until they are saved again.

const OLD = /^\/editor(\/.*)?$/;
const ICON = /^\/(editor|edit)\/(icon-192|icon-512|icon-maskable-512|apple-touch-icon)\.png$/;

// The old worker: removes itself on its next update check (a browser asks for the script again within a day), and takes its scope with it.
const OLD_WORKER = `// The editor's service worker was at /editor/; it is at /edit/ now. This removes the old one.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.registration.unregister()));
`;

/** Where an address under /editor/ goes: the same under /edit/, with the query. @param {URL} url */
export const editAddress = (url) => `/edit${url.pathname.slice('/editor'.length) || '/'}${url.search}`;

/**
 * The answer for an address under /editor/, or undefined for any other. `assets` is env.ASSETS.
 * @param {URL} url @param {Request} request @param {{ fetch: (r: Request) => Promise<Response> }} assets
 */
export async function oldEditorAddress(url, request, assets) {
  if (!OLD.test(url.pathname)) return undefined;
  const get = request.method === 'GET' || request.method === 'HEAD';
  if (get && url.pathname === '/editor/sw.js')
    return new Response(OLD_WORKER, { headers: { 'content-type': 'text/javascript', 'cache-control': 'no-cache' } });
  if (get && url.pathname === '/editor/version.json') return assets.fetch(new Request(new URL('/edit/version.json', url.origin), request));
  if (get && ICON.test(url.pathname)) {
    const own = await assets.fetch(request);
    if (own.status !== 404) return own;
  }
  return new Response(null, {
    status: 308,
    headers: { location: new URL(editAddress(url), url.origin).href, 'cache-control': 'public, max-age=3600' },
  });
}

/** The answer for an icon at /edit/ that the site has only at the old place (public/editor/), else `response`. @param {URL} url */
export async function withOldIcon(url, request, assets, response) {
  if (response.status !== 404 || !ICON.test(url.pathname) || url.pathname.startsWith('/editor/')) return response;
  const old = await assets.fetch(new Request(new URL(url.pathname.replace('/edit/', '/editor/'), url.origin), request));
  return old.status === 404 ? response : old;
}
