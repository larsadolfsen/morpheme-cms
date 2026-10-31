// A thin Worker in front of the static site (dist/), the same for every site: what it has of the site comes from
// `@site/config` and `@site/worker` (the aliases in the site's wrangler.jsonc; this site's are src/site/config.ts and
// src/site/worker.js). Everything is served from the assets, including the rules in public/_redirects. The Worker
// only adds what static files cannot:
// - noindex on the staging hostname (*.workers.dev). NEVER on the site's own domain.
// - the site's redirects from its old addresses (`oldAddresses`, `{ ids, paths }`), e.g. from WordPress: files in
//   all sizes, attachment pages and ?attachment_id= / ?p= / ?page_id= (query strings, which _redirects cannot match).
// - redirects for pages and posts that got a new address in the editor (src/data/redirects.json,
//   packages/editor/src/addresses.ts), followed to where they end, also after one of the redirects above or
//   in public/_redirects, so a visitor is sent on once.
// - the own addresses of the pages that are the front page and the blog page (src/data/standard-pages.json) to / and
//   /blog/, where they are shown, also at the end of a redirect.
// - GitHub sign-in for the editor at /editor/ (/oauth/*, packages/editor/worker/oauth.js), kept in a cookie only the Worker reads
//   (packages/editor/worker/session.js), and what the editor asks of GitHub with it (/api/github/*, packages/editor/worker/editor-github.js), the site's
//   files through the cache in R2 (packages/editor/worker/files.js).
// - the addresses visitors came to that do not exist, for the editor (/api/not-found, packages/editor/worker/not-found.js).
// - the visitors' answers in the cookie banner, the consent log (/api/consent, packages/editor/worker/consent.js, in D1), and each hour
//   those older than two years deleted.
// - whether R2 caching can be turned on in the editor: whether Cloudflare has its bucket (/api/r2, packages/editor/worker/r2-status.js).
// - the editor on its own address when EDITOR_HOST is set (packages/editor/worker/editor-host.js); noindex there too.
// - each hour, the pages and posts that are Planlagt published once their time has come (scheduled, packages/editor/worker/publish.js).
// - the editor's notifications on the phone, also when the editor is closed (/api/push, packages/editor/worker/push.js): each minute,
//   whether the site has been built with a save, and an app's notifications (`notify` in its tools).
// - the apps' own parts (src/apps/<app>/worker.js, worker/apps.js), while they are installed: their addresses under
//   /api/<app>/ and what they do each hour (scheduled), e.g. Cookiescanner's scan of the site's cookies, and their texts
//   for their notifications. What the apps
//   put in the build (dist/_apps/<app>/, packages/editor/lib/apps.mjs) is served to no one; the apps read it.
import { apps, appTexts, appWorkers, moved, oldAddresses as map, standard } from '@site/worker';
import { handleOAuth } from './oauth.js';
import { editorHost } from './editor-host.js';
import { handleNotFound, isVisit, json, recordNotFound } from './not-found.js';
import { forgetOldConsents, handleConsent } from './consent.js';
import { access, mayEdit } from './session.js';
import { handleGitHub } from './editor-github.js';
import { handleR2 } from './r2-status.js';
import { publishScheduled, SCHEDULED_LIST } from './publish.js';
import { commitFiles, readFiles } from './github.js';
import { handlePush, notifyAll, waitForBuilds } from './push.js';

const STAGING = /\.workers\.dev$/i;
// The cron in wrangler.jsonc that runs each minute.
const EACH_MINUTE = '* * * * *';

// The parts of the Worker of the apps installed (src/data/apps.json), by the app's id.
const installed = Object.fromEntries(Object.entries(appWorkers).filter(([id]) => apps.installed?.includes(id)));
// What an app is given, besides the request: whether its sender can save the site (signed in with GitHub), an answer
// in JSON, the Worker's own saves to the repository (`github`, packages/editor/worker/github.js: `read` and `commit`, with the request's
// `ctx`, so the cache in R2 is written after the answer has gone; given a request as the last argument, with its sender's
// sign-in instead, in their name, when they can save the site: a save they asked for in the editor) and its notifications on the phone
// (`notify(env, { type, id, text, error, to })`, packages/editor/worker/push.js: `type` one of the types in `notifications` in its
// index.ts, `text` as written in the site's language, `to` the editor's screen it opens).
const tools = (app, ctx) => ({
  mayEdit,
  json,
  github: {
    read: async (env, paths, as) => readFiles(env, paths, ctx, as && (await signedIn(as))),
    commit: async (env, head, headline, files, as) => commitFiles(env, head, headline, files, ctx, as && (await signedIn(as))),
  },
  notify: (env, n) => notifyAll(env, { ...n, type: `${app}/${n.type}` }, appTexts[app]),
});

/** The sign-in of a request from someone who can save the site, for a save they asked for; else it fails. */
async function signedIn(request) {
  const signIn = await access(request);
  if (!signIn?.push) throw new Error('Kun en, der kan gemme hjemmesiden, kan gemme.');
  return signIn.token;
}

/** The answer of an installed app's part of the Worker at its address (/api/<app>/…), or undefined for another one. */
function appAnswer(request, url, env, ctx) {
  const id = /^\/api\/([\w-]+)(?:\/|$)/.exec(url.pathname)?.[1];
  if (!id || !(id in appWorkers)) return undefined;
  const app = installed[id];
  return app?.fetch ? app.fetch(request, env, ctx, tools(id, ctx)) : json({ error: 'not installed' }, 404);
}

// Where the front page and the blog page are shown, by their own addresses.
const shownAt = (pages) => ({ [pages.front]: '/', [pages.blog]: '/blog/' });

// Where an address ends after the editor's redirects (at most ten, against a loop; the editor checks
// for them before it saves), and the front page's and the blog page's own addresses at / and /blog/.
export function onward(target, redirects = moved, pages = standard) {
  let to = target;
  for (let i = 0; i < 10 && redirects[to.split('#')[0]]; i++) to = redirects[to.split('#')[0]];
  const [path, hash] = to.split('#');
  const at = shownAt(pages)[path];
  return at ? `${at}${hash === undefined ? '' : `#${hash}`}` : to;
}

export function redirectFor(url) {
  // WordPress answered these on the front page only: /?attachment_id=123, /?p=123, /?page_id=123.
  const id =
    url.pathname === '/' && (url.searchParams.get('attachment_id') ?? url.searchParams.get('p') ?? url.searchParams.get('page_id'));
  if (id && map.ids[id]) return onward(map.ids[id]);
  const path = decoded(url.pathname);
  const at = shownAt(standard)[path];
  if (at) return at;
  const target = moved[path] ?? map.paths[path];
  return target && onward(target);
}

// An address with a broken %-sign (/%E0%A4%A/) cannot be decoded; it is looked up as it is (and ends
// on the 404 page) rather than making the Worker fail.
function decoded(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

// Old links without the trailing slash (/kontakt instead of /kontakt/): the assets only redirect those
// for pages that exist, and _redirects rules only match the exact address. Look up the address with
// the slash and send straight to where that ends, so there is one redirect and no 404.
async function withSlash(url, request, env) {
  if (url.pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(url.pathname)) return undefined;
  const slashed = new URL(url);
  slashed.pathname += '/';
  const mapped = redirectFor(slashed);
  if (mapped) return mapped;
  const res = await env.ASSETS.fetch(new Request(slashed, { method: 'HEAD', headers: request.headers, redirect: 'manual' }));
  if (res.status >= 300 && res.status < 400) return onwardOf(res.headers.get('location'), url) ?? undefined;
  return res.ok ? slashed.pathname + slashed.search : undefined;
}

// A redirect from the assets (public/_redirects) to an address the editor has sent on: straight on.
function onwardOf(location, url) {
  if (!location) return location;
  const to = new URL(location, url.origin);
  const end = to.origin === url.origin ? onward(to.pathname + to.hash) : to.pathname + to.hash;
  return end === to.pathname + to.hash ? location : end;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // The editor on its own address: what belongs on the other one is sent there.
    const elsewhere = editorHost(url, env, request);
    if (elsewhere) return elsewhere;
    // Sign-in for /editor/ first: /oauth/auth has no trailing slash and must not be redirected.
    const oauth = url.pathname.startsWith('/oauth/') ? await handleOAuth(request, env) : null;
    if (url.pathname === '/api/not-found') return handleNotFound(request, env);
    if (url.pathname === '/api/consent') return handleConsent(request, env);
    if (url.pathname === '/api/r2') return handleR2(request, env);
    if (url.pathname.startsWith('/api/github/')) return handleGitHub(request, env, ctx);
    if (/^\/api\/push(\/wait)?\/?$/.test(url.pathname)) return handlePush(request, env);
    const answer = appAnswer(request, url, env, ctx);
    if (answer) return answer;
    // The build's lists (what is Planlagt) and the apps' files (what the cookie scan visits) are the Worker's own.
    if (url.pathname === SCHEDULED_LIST || url.pathname.startsWith('/_apps/')) return new Response('Not found', { status: 404 });
    const target = oauth ? undefined : (redirectFor(url) ?? (await withSlash(url, request, env)));
    let response = target
      ? new Response(null, { status: 301, headers: { location: new URL(target, url.origin).href } })
      : (oauth ?? (await env.ASSETS.fetch(request)));
    const location = !target && !oauth && response.status >= 300 && response.status < 400 && response.headers.get('location');
    const end = location && onwardOf(location, url);
    if (end && end !== location)
      response = new Response(null, { status: response.status, headers: { location: new URL(end, url.origin).href } });

    const editor = url.hostname === env.EDITOR_HOST?.trim().toLowerCase();
    const staging = STAGING.test(url.hostname) || editor;
    // A visitor on the site's 404 page: the address is kept for the editor, after the answer has gone.
    // Also on *.workers.dev, the site's address until its own domain points here; the previews of
    // branches have no storage and keep nothing.
    if (!editor && response.status === 404 && isVisit(request, url)) ctx.waitUntil(recordNotFound(request, url, env));
    if (!staging) return response;
    const staged = new Response(response.body, response);
    staged.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return staged;
  },

  // The crons in wrangler.jsonc: each minute, whether the site has been built with a save (packages/editor/worker/push.js); each hour,
  // the rest (also the answers in the consent log older than two years deleted).
  async scheduled(controller, env, ctx) {
    if (controller.cron === EACH_MINUTE) return ctx.waitUntil(waitForBuilds(env));
    ctx.waitUntil(
      Promise.all([
        publishScheduled(env),
        forgetOldConsents(env),
        ...Object.entries(installed).map(([id, app]) => app.scheduled?.(env, ctx, tools(id, ctx))),
      ]),
    );
  },
};
