// The editor on its own address (EDITOR_HOST, e.g. editor.example.dk), apart from the public
// site: the editor's GitHub sign-in is a cookie no script can read (packages/editor/worker/session.js), but a script on the
// same address (the site's third-party scripts, Google after consent, Calendly) could ask the Worker in the
// editor's name, and read what the editor keeps in the browser. See docs/editor.md.
// Without EDITOR_HOST (a variable on the Worker) the editor is at /editor/ on every address, as before.
//   On EDITOR_HOST: the editor (/editor/), the sign-in (/oauth/), what the editor asks the Worker
//     (/api/, packages/editor/worker/not-found.js) and files (scripts, styles, images)
//     are served; the address alone opens the editor; any other page goes to the public site
//     (PUBLIC_HOST, else EDITOR_HOST without "editor."), so no page of the site runs there.
//   On any other address: the editor, the sign-in and /api/ go to EDITOR_HOST. The editor's page first
//     removes what the editor kept on that address (the sign-in's cookie above all).
//   A page the editor fetches as text for its preview ("Forhåndsvis", packages/editor/src/pagePreview.tsx,
//     with the header X-Editor-Preview) is served on EDITOR_HOST too; the editor shows it without the
//     site's scripts.

import { noSession } from './session.js';

// The site's pages and feeds: no file ending, or one of these.
const PAGE = /(^|\/)[^./]*$|\.(html?|xml)$/i;

/** A response for a request that belongs on the other address, or undefined to serve it here. */
export function editorHost(url, env, request) {
  const editor = env.EDITOR_HOST?.trim().toLowerCase();
  if (!editor) return undefined;
  const own =
    url.pathname.startsWith('/editor/') ||
    url.pathname === '/editor' ||
    url.pathname.startsWith('/oauth/') ||
    url.pathname.startsWith('/api/');

  if (url.hostname === editor) {
    if (url.pathname === '/' && !url.search) return redirect(`https://${editor}/editor/`, 302);
    if (own || !PAGE.test(url.pathname) || request?.headers.get('x-editor-preview')) return undefined;
    const site = env.PUBLIC_HOST?.trim() || editor.replace(/^editor\./, '');
    return redirect(`https://${site}${url.pathname}${url.search}`, 302);
  }

  if (!own) return undefined;
  const to = `https://${editor}${url.pathname}${url.search}`;
  if (url.pathname === '/editor/' || url.pathname === '/editor') return cleanUp(to);
  return redirect(to, 301);
}

const redirect = (location, status) => new Response(null, { status, headers: { location, 'cache-control': 'no-store' } });

// The editor's page on the old address: removes the sign-in (its cookie), the editor's settings and its copy of the
// files (IndexedDB "editor") and its service worker there, then opens the editor on its own address,
// with what came after "#" (the open screen).
function cleanUp(to) {
  const js = JSON.stringify(to).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Editoren er flyttet</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem"><p>Editoren er flyttet til <a href=${JSON.stringify(to)}>${to.replace(/^https:\/\//, '').replace(/[?#].*$/, '')}</a> …</p><script>
(async () => {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('editor-')) localStorage.removeItem(key);
  } catch {}
  try {
    indexedDB.deleteDatabase('editor');
  } catch {}
  try {
    for (const r of (await navigator.serviceWorker?.getRegistrations()) ?? []) if (new URL(r.scope).pathname.startsWith('/editor/')) await r.unregister();
  } catch {}
  location.replace(${js} + location.hash);
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'set-cookie': noSession(),
    },
  });
}
