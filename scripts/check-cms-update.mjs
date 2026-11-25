// Checks the Worker's own update of the CMS (packages/editor/worker/cms-update.js): the hourly check of npm, the update's commit, the
// minute watch of its check run with the undo, the 20 minutes' fallback, and /api/cms. GitHub, npm, KV and the notifications are
// played here (a fake KV, an in-memory package.json and lock, a fake fetch); nothing goes to GitHub, npm or Cloudflare.
// Run: npm run check:worker
import { gzipSync } from 'node:zlib';
import { config } from '../site/siteConfig.mjs';
import { workerModules } from './worker-modules.mjs';

const [{ RUNNING, checkForUpdate, cmsStatus, dailyCheck, handleCms, startUpdate, watchUpdate }, { GitHubError }, { releaseFor }] =
  await workerModules('cms-update.js', 'files.js', 'store.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

const T0 = Date.parse('2026-11-04T10:00:00Z');
const MINUTE = 60 * 1000;
const PACKAGE = '@morphemecms/cms';
const danish = String(config.locale).startsWith('da');
const commitUpdate = (v) => (danish ? `Opdater Morpheme til ${v}` : `Update Morpheme to ${v}`);
const commitUndo = (v) => (danish ? `Fortryd opdateringen af Morpheme til ${v}` : `Undo the update of Morpheme to ${v}`);

/** Workers KV, as much of it as the Worker uses; `reads` and `writes` count the calls. */
function kvStore() {
  const map = new Map();
  const kv = {
    reads: 0,
    writes: 0,
    map,
    get: async (key, type) => {
      kv.reads++;
      const value = map.get(key);
      return value === undefined ? null : type === 'json' ? JSON.parse(value) : value;
    },
    put: async (key, value) => {
      kv.writes++;
      map.set(key, String(value));
    },
    delete: async (key) => {
      kv.writes++;
      map.delete(key);
    },
    list: async ({ prefix = '' } = {}) => ({ keys: [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }),
  };
  return kv;
}
const stored = (kv, key) => (kv.map.has(key) ? JSON.parse(kv.map.get(key)) : null);

/** A gzipped tar with the files (`{ path: text }`), as npm packs a package. */
function tarball(files) {
  const blocks = [];
  for (const [path, text] of Object.entries(files)) {
    const data = new TextEncoder().encode(text);
    const header = new Uint8Array(512);
    header.set(new TextEncoder().encode(path), 0);
    header.set(new TextEncoder().encode(data.length.toString(8).padStart(11, '0')), 124);
    blocks.push(header, data, new Uint8Array(Math.ceil(data.length / 512) * 512 - data.length));
  }
  blocks.push(new Uint8Array(1024));
  return gzipSync(Buffer.concat(blocks));
}

const CHANGELOG = '# Changelog\n\n## 0.1.1\n\n- Fixed a thing.\n\n## 0.1.0\n\n- The first version.\n';
const manifestOf = (version, extra = {}) => ({
  name: PACKAGE,
  version,
  license: 'MIT',
  dist: { tarball: `https://registry.npmjs.org/@morphemecms/cms/-/cms-${version}.tgz`, integrity: `sha512-${version}` },
  ...extra,
});

/**
 * The site and the world around it: package.json and the lock in memory, npm, the check runs, and the recorded commits and
 * notifications. `checks`: a commit's check run by its id ('success' | 'failure'; none: no run yet), `forbidden`: GitHub answers
 * the check runs with 403, `commitFails`: from which commit on `commitFiles` throws.
 */
function world({
  range = '0.1.0',
  latest = '0.1.1',
  manifestExtra = {},
  lock = true,
  content = {},
  contracts = 6,
  items = [],
  releases = {},
} = {}) {
  const files = {
    'wrangler.jsonc': '{\n  "build": {\n    "command": "npm run check && npm run build",\n  },\n}\n',
    'package.json': JSON.stringify({ name: 'site', dependencies: { [PACKAGE]: range } }, null, 2) + '\n',
    'package-lock.json':
      JSON.stringify(
        {
          name: 'site',
          lockfileVersion: 3,
          packages: {
            '': { name: 'site', dependencies: { [PACKAGE]: range } },
            [`node_modules/${PACKAGE}`]: { version: range, resolved: manifestOf(range).dist.tarball, integrity: `sha512-${range}` },
          },
        },
        null,
        2,
      ) + '\n',
  };
  Object.assign(files, content);
  if (!lock) delete files['package-lock.json'];
  const w = {
    kv: kvStore(),
    files,
    commits: [],
    notices: [],
    urls: [],
    checks: {},
    forbidden: false,
    commitFails: null,
    may: true,
    latest,
    readCount: 0,
    items,
    releases,
  };
  w.env = { GITHUB_PUBLISH_TOKEN: 'token', PUSH: w.kv };
  w.deps = {
    readFiles: async (env, paths) => {
      w.readCount++;
      return { head: `head${w.commits.length}`, texts: paths.map((p) => files[p]) };
    },
    readFolder: async (env, folder) => ({
      head: `head${w.commits.length}`,
      files: Object.entries(files)
        .filter(([path]) => path.startsWith(`${folder}/`))
        .map(([path, text]) => ({ path, text })),
    }),
    readStoreItems: async () => w.items,
    storeRelease: async (env, id, version) => w.releases[`${id}@${version}`] ?? null,
    commitFiles: async (env, head, headline, changes) => {
      if (w.failure && w.commits.length >= (w.commitFails ?? 0)) throw w.failure;
      for (const { path, text } of changes) files[path] = text;
      w.commits.push({ headline, changes, head });
      return `c${w.commits.length}`;
    },
    fetch: async (url) => {
      url = String(url);
      w.urls.push(url);
      const check = /api\.github\.com\/repos\/[^/]+\/[^/]+\/commits\/(\w+)\/check-runs$/.exec(url);
      if (check) {
        if (w.forbidden) return new Response('{}', { status: 403 });
        const conclusion = w.checks[check[1]];
        const runs = [{ app: { slug: 'some-other-app' }, conclusion: 'failure', started_at: '2026-11-04T10:00:00Z' }];
        if (conclusion) runs.push({ app: { slug: 'cloudflare-workers-and-pages' }, conclusion, started_at: '2026-11-04T10:01:00Z' });
        return Response.json({ check_runs: runs });
      }
      if (url === 'https://registry.npmjs.org/-/package/@morphemecms%2fcms/dist-tags') return Response.json({ latest: w.latest });
      const manifest = /^https:\/\/registry\.npmjs\.org\/@morphemecms%2fcms\/(\d+\.\d+\.\d+)$/.exec(url);
      if (manifest) return Response.json(manifestOf(manifest[1], manifest[1] === w.latest ? manifestExtra : {}));
      if (url.endsWith('.tgz'))
        return new Response(
          tarball({
            'package/CHANGELOG.md': CHANGELOG,
            'package/lib/contracts.mjs': `export const APP_API = ${contracts};\nexport const APP_APIS = Object.freeze([${contracts}]);\nexport const THEME_API = ${contracts};\n`,
          }),
        );
      return new Response('{}', { status: 404 });
    },
    notify: async (env, notice, texts) => void w.notices.push({ notice, texts }),
    mayEdit: async () => w.may,
  };
  return w;
}

const request = (path, init) => new Request(`https://site.example${path}`, init);
const post = (version) =>
  request('/api/cms/update', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version }) });

// 1. An exact version, a newer one on npm: one commit, the files written, the update kept, the notes kept.
{
  const w = world();
  await checkForUpdate(w.env, w.deps, T0);
  expect(w.commits.length === 1, `opdateringen lavede ${w.commits.length} commits, ikke 1`);
  expect(w.commits[0]?.headline === commitUpdate('0.1.1'), `commitbeskeden var "${w.commits[0]?.headline}"`);
  expect(JSON.parse(w.files['package.json']).dependencies[PACKAGE] === '0.1.1', 'package.json sagde ikke 0.1.1');
  const entry = JSON.parse(w.files['package-lock.json']).packages[`node_modules/${PACKAGE}`];
  expect(
    entry.version === '0.1.1' && entry.resolved === manifestOf('0.1.1').dist.tarball && entry.integrity === 'sha512-0.1.1',
    'the lock did not get the resolved and integrity of 0.1.1',
  );
  expect(
    w.files['wrangler.jsonc'].includes('"command": "npx morpheme ci-build"') &&
      w.commits[0].changes.some((c) => c.path === 'wrangler.jsonc'),
    'the update did not move the build command to morpheme ci-build',
  );
  expect(w.files['package.json'].endsWith('}\n') && w.files['package-lock.json'].endsWith('}\n'), 'the files did not end with a newline');
  const update = stored(w.kv, 'cms:update');
  expect(
    update?.state === 'waiting' && update.from === '0.1.0' && update.to === '0.1.1' && update.commit === 'c1',
    `cms:update var ${JSON.stringify(update)}`,
  );
  expect(stored(w.kv, 'cms:notes:0.1.1')?.text === '- Fixed a thing.', 'versionens noter blev ikke gemt');
  expect(stored(w.kv, 'cms:notes:0.1.0') === null, 'noter for en version, sitet allerede har, blev gemt');
  expect(stored(w.kv, 'cms:checked')?.latest === '0.1.1', 'cms:checked fik ikke latest');

  // 2. The hourly step while it waits: nothing.
  const before = w.urls.length;
  await checkForUpdate(w.env, w.deps, T0 + 60 * MINUTE);
  expect(w.commits.length === 1 && w.urls.length === before, 'timetjekket gjorde noget, mens en opdatering ventede');

  // 3. The update's check run fails: the undo, the skip, then the undo's build is fine.
  w.checks.c1 = 'failure';
  await watchUpdate(w.env, w.deps, T0 + 2 * MINUTE);
  expect(w.commits.length === 2 && w.commits[1].headline === commitUndo('0.1.1'), 'en fejlet opdatering blev ikke fortrudt med en commit');
  expect(!w.commits[1].changes.some((c) => c.path === 'wrangler.jsonc'), 'the undo wrote wrangler.jsonc again');
  expect(JSON.parse(w.files['package.json']).dependencies[PACKAGE] === '0.1.0', 'fortrydelsen skrev ikke 0.1.0 tilbage');
  expect(
    JSON.parse(w.files['package-lock.json']).packages[`node_modules/${PACKAGE}`].integrity === 'sha512-0.1.0',
    'the undo did not write 0.1.0 back into the lock',
  );
  expect(stored(w.kv, 'cms:skip:0.1.1')?.commit === 'c1', 'den fortrudte version blev ikke sprunget over');
  const undoing = stored(w.kv, 'cms:update');
  expect(undoing?.state === 'undoing' && undoing.undoCommit === 'c2', `cms:update var ${JSON.stringify(undoing)}`);
  expect(w.notices.length === 0, 'a notice was sent before the undo was built');
  await watchUpdate(w.env, w.deps, T0 + 3 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undoing', 'the undo counted as finished without a result');
  w.checks.c2 = 'success';
  await watchUpdate(w.env, w.deps, T0 + 4 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undone', 'fortrydelsen blev ikke til undone');
  expect(w.notices.length === 1 && w.notices[0].notice.error === true, 'undone did not give one notice with error');
  const notice = w.notices[0]?.notice;
  expect(notice?.type === 'updates' && notice.id === 'cms' && notice.text.includes('0.1.1'), 'beskeden havde ikke typen updates');
  expect(
    Object.keys(w.notices[0]?.texts ?? {})
      .sort()
      .join() === 'da-DK,en-US' && w.notices[0].texts['da-DK'][notice.text]?.includes('fortrudt'),
    'beskeden havde ikke den danske tekst',
  );
  // The skipped version is not taken by itself again.
  await checkForUpdate(w.env, w.deps, T0 + 70 * MINUTE);
  expect(w.commits.length === 2 && stored(w.kv, 'cms:checked')?.problem?.kind === 'skipped', 'en fortrudt version blev taget igen');
}

// The hourly cron checks npm once a day, from 03:00 in the site's time zone; else one KV read and nothing more.
{
  const zone = 'Europe/Copenhagen';
  const w = world();
  // Never checked: at once, though it is day.
  await dailyCheck(w.env, w.deps, Date.parse('2026-11-14T12:07:00Z'), zone);
  expect(w.commits.length === 1, 'a site never checked was not checked at once');
  await w.kv.put('cms:update', JSON.stringify({ ...stored(w.kv, 'cms:update'), state: 'done' }));
  w.files['package.json'] = JSON.stringify({ dependencies: { [PACKAGE]: '0.1.0' } });
  const urls = w.urls.length;
  const reads = w.kv.reads;
  await dailyCheck(w.env, w.deps, Date.parse('2026-11-14T13:07:00Z'), zone);
  await dailyCheck(w.env, w.deps, Date.parse('2026-11-15T01:07:00Z'), zone);
  expect(w.urls.length === urls && w.commits.length === 1, 'the hourly cron checked npm again the same day or before 03:00');
  expect(w.kv.reads - reads === 2, `the hourly cron read KV ${w.kv.reads - reads} times, not once an hour`);
  await dailyCheck(w.env, w.deps, Date.parse('2026-11-15T02:07:00Z'), zone);
  expect(w.urls.length > urls, 'the hourly cron did not check npm at 03:00 the next day');
}

// 4. The site runs the new version: done, one notification.
{
  const w = world();
  w.files['package.json'] = JSON.stringify({ dependencies: { [PACKAGE]: RUNNING } });
  await w.kv.put(
    'cms:update',
    JSON.stringify({ commit: 'c1', from: '0.0.0', to: RUNNING, at: new Date(T0).toISOString(), state: 'waiting' }),
  );
  await watchUpdate(w.env, w.deps, T0 + 5 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'done', 'an update that was running did not become done');
  expect(w.notices.length === 1 && !w.notices[0].notice.error, 'done did not give one notice without error');
  await watchUpdate(w.env, w.deps, T0 + 6 * MINUTE);
  expect(w.notices.length === 1, 'done blev meldt to gange');
}

// 5. A version the site does not pin exactly is left alone.
for (const range of ['*', '^0.1.0', 'next']) {
  const w = world({ range });
  await checkForUpdate(w.env, w.deps, T0);
  expect(w.commits.length === 0, `"${range}" blev opdateret`);
  expect(stored(w.kv, 'cms:checked')?.problem?.kind === 'not-managed', `"${range}" gav ikke not-managed`);
}

// 6. A new first number, and a skipped version, are not taken by themselves.
{
  const w = world({ latest: '1.0.0' });
  await checkForUpdate(w.env, w.deps, T0);
  expect(
    w.commits.length === 0 && stored(w.kv, 'cms:checked')?.problem?.kind === 'major',
    'en ny hovedversion blev taget, eller meldt forkert',
  );
  expect(stored(w.kv, 'cms:checked')?.latest === '1.0.0', 'latest blev ikke gemt ved en hovedversion');
  const s = world();
  await s.kv.put('cms:skip:0.1.1', JSON.stringify({ version: '0.1.1', commit: 'x', at: new Date(T0).toISOString() }));
  await checkForUpdate(s.env, s.deps, T0);
  expect(
    s.commits.length === 0 && stored(s.kv, 'cms:checked')?.problem?.kind === 'skipped',
    'en fortrudt version blev taget, eller meldt forkert',
  );
  const n = world({ latest: '0.1.0' });
  await checkForUpdate(n.env, n.deps, T0);
  expect(n.commits.length === 0 && !stored(n.kv, 'cms:checked')?.problem, 'der var et problem, selv om sitet er opdateret');
}

// 7. A token that cannot write: nothing is committed or kept.
for (const error of [new GitHubError('Forbidden', 403), new GitHubError('Resource not accessible by personal access token', 200)]) {
  const w = world();
  w.failure = error;
  await checkForUpdate(w.env, w.deps, T0);
  expect(stored(w.kv, 'cms:update') === null, `cms:update blev gemt, selv om gemningen fejlede (${error.status})`);
  expect(
    stored(w.kv, 'cms:checked')?.problem?.kind === 'cannot-write',
    `a key without write access did not give cannot-write (${error.status})`,
  );
}

// 8. Without the token (or KV) nothing is asked and no commit is made; without the token only the problem is kept (13 and 14).
for (const [what, patch] of [
  ['without a key', { GITHUB_PUBLISH_TOKEN: undefined }],
  ['uden KV', { PUSH: undefined }],
]) {
  const w = world();
  const env = { ...w.env, ...patch };
  await checkForUpdate(env, w.deps, T0);
  await watchUpdate(env, w.deps, T0);
  expect(
    w.urls.length === 0 && w.readCount === 0 && w.kv.writes === (what === 'without a key' ? 1 : 0) && w.commits.length === 0,
    `tjekket gjorde noget ${what}`,
  );
}

// 9. Check runs GitHub does not give: the update is undone after 20 minutes.
{
  const w = world();
  await checkForUpdate(w.env, w.deps, T0);
  w.forbidden = true;
  await watchUpdate(w.env, w.deps, T0 + MINUTE);
  expect(stored(w.kv, 'cms:checked')?.noChecks === true, 'noChecks blev ikke sat, da check runs gav 403');
  await watchUpdate(w.env, w.deps, T0 + 19 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'waiting' && w.commits.length === 1, 'opdateringen blev fortrudt efter 19 minutter');
  await watchUpdate(w.env, w.deps, T0 + 21 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undoing' && w.commits.length === 2, 'opdateringen blev ikke fortrudt efter 21 minutter');
  await watchUpdate(w.env, w.deps, T0 + 30 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undoing', 'the undo counted as finished after 9 minutes');
  await watchUpdate(w.env, w.deps, T0 + 42 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undone' && w.notices.length === 1, 'fortrydelsen blev ikke undone efter 20 minutter');
  expect(stored(w.kv, 'cms:checked')?.noChecks === true, 'noChecks got lost');
}

// 10. The undo cannot be committed: stuck, one notification, then nothing.
{
  const w = world();
  await checkForUpdate(w.env, w.deps, T0);
  w.checks.c1 = 'failure';
  w.failure = new GitHubError('Conflict', 409);
  w.commitFails = 1;
  await watchUpdate(w.env, w.deps, T0 + 2 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'stuck', 'en fortrydelse, der ikke kunne gemmes, gav ikke stuck');
  expect(w.notices.length === 1 && w.notices[0].notice.error === true, 'stuck did not give one notice with error');
  const urls = w.urls.length;
  await watchUpdate(w.env, w.deps, T0 + 3 * MINUTE);
  expect(w.notices.length === 1 && w.urls.length === urls && w.commits.length === 1, 'minuttet efter stuck gjorde noget');
  // Its undo's build failing is stuck as well.
  const u = world();
  await checkForUpdate(u.env, u.deps, T0);
  u.checks.c1 = 'failure';
  await watchUpdate(u.env, u.deps, T0 + 2 * MINUTE);
  u.checks.c2 = 'failure';
  await watchUpdate(u.env, u.deps, T0 + 3 * MINUTE);
  expect(
    stored(u.kv, 'cms:update')?.state === 'stuck' && u.notices.length === 1 && u.notices[0].notice.error,
    'en fortrydelse, der ikke byggede, gav ikke stuck',
  );
}

// 11. Nothing waiting: one KV read, no request.
{
  const w = world();
  await watchUpdate(w.env, w.deps, T0);
  expect(
    w.kv.reads === 1 && w.urls.length === 0 && w.kv.writes === 0,
    `the minute without an update read ${w.kv.reads} times and made ${w.urls.length} calls`,
  );
}

// 12. /api/cms.
{
  const w = world({ latest: '1.0.0' });
  w.may = false;
  expect((await handleCms(request('/api/cms'), w.env, undefined, w.deps))?.status === 403, 'en, der ikke kan gemme, fik status');
  expect((await handleCms(post('1.0.0'), w.env, undefined, w.deps))?.status === 403, 'en, der ikke kan gemme, kunne opdatere');
  expect((await handleCms(request('/api/other'), w.env, undefined, w.deps)) === null, 'en anden adresse blev ikke givet videre');
  w.may = true;
  await checkForUpdate(w.env, w.deps, T0);
  const status = await (await handleCms(request('/api/cms'), w.env, undefined, w.deps)).json();
  expect(
    status.running === RUNNING &&
      status.token === true &&
      status.kv === true &&
      status.checked?.latest === '1.0.0' &&
      status.update === null &&
      Array.isArray(status.skipped) &&
      Array.isArray(status.notes),
    `statussen havde ikke formen: ${JSON.stringify(status)}`,
  );
  expect((await handleCms(post('0.9.9'), w.env, undefined, w.deps)).status === 400, 'en version, der ikke er latest, blev taget imod');

  // A waiting update: 409.
  const k = world();
  await checkForUpdate(k.env, k.deps, T0);
  expect((await handleCms(post('0.1.1'), k.env, undefined, k.deps)).status === 409, 'en opdatering, mens en anden venter, gav ikke 409');

  // A skipped version, tried again: its skip is gone and a commit is made.
  const s = world();
  await s.kv.put('cms:skip:0.1.1', JSON.stringify({ version: '0.1.1', commit: 'x', at: new Date(T0).toISOString() }));
  await checkForUpdate(s.env, s.deps, T0);
  const again = await handleCms(post('0.1.1'), s.env, undefined, s.deps);
  expect(again.status === 200 && (await again.json()).update?.state === 'waiting', 'Try again did not give a waiting update');
  expect(stored(s.kv, 'cms:skip:0.1.1') === null && s.commits.length === 1, 'Try again did not remove the skip key and commit');

  // A package that wants npm: 422.
  const n = world({ manifestExtra: { dependencies: { left: '1.0.0' } } });
  await checkForUpdate(n.env, n.deps, T0);
  expect(n.commits.length === 0 && stored(n.kv, 'cms:checked')?.problem?.kind === 'needs-npm', 'needs-npm blev ikke meldt af timetjekket');
  const npm = await handleCms(post('0.1.1'), n.env, undefined, n.deps);
  expect(npm.status === 422 && (await npm.json()).error === 'needs-npm', 'a package that needs npm did not give 422');

  // A token that cannot write: 502; no token: 503.
  const c = world();
  await checkForUpdate({ ...c.env, GITHUB_PUBLISH_TOKEN: undefined }, c.deps, T0);
  c.kv.map.set('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: '0.1.1' }));
  c.failure = new GitHubError('Forbidden', 403);
  expect((await handleCms(post('0.1.1'), c.env, undefined, c.deps)).status === 502, 'a key that cannot save did not give 502');
  expect(
    (await handleCms(post('0.1.1'), { ...c.env, GITHUB_PUBLISH_TOKEN: undefined }, undefined, c.deps)).status === 503,
    'without a key did not give 503',
  );
  const direct = await startUpdate(world().env, '0.1.1', world().deps, T0).catch((e) => e);
  expect(direct?.to === '0.1.1' && direct.state === 'waiting', 'startUpdate gav ikke opdateringen');
}

// The update's commit adds the install lines to .npmrc once, keeps the site's own lines, and writes nothing when they are there.
{
  const lines = 'prefer-offline=true\naudit=false\nfund=false\n';
  const none = world();
  await startUpdate(none.env, '0.1.1', none.deps, T0);
  expect(none.files['.npmrc'] === lines, `.npmrc was not created: ${JSON.stringify(none.files['.npmrc'])}`);
  expect(
    none.commits[0].changes
      .map((c) => c.path)
      .sort()
      .join() === '.npmrc,package-lock.json,package.json,wrangler.jsonc',
    'the commit did not hold package.json, the lock, wrangler.jsonc and .npmrc',
  );
  // The undo writes neither extra, even when the site lacks both again.
  none.files['.npmrc'] = undefined;
  none.files['wrangler.jsonc'] = '{\n  "build": {\n    "command": "npm run check && npm run build",\n  },\n}\n';
  none.checks.c1 = 'failure';
  await watchUpdate(none.env, none.deps, T0 + 2 * MINUTE);
  expect(
    none.commits.length === 2 &&
      none.commits[1].changes
        .map((c) => c.path)
        .sort()
        .join() === 'package-lock.json,package.json',
    'the undo wrote more than package.json and the lock',
  );
  const own = world();
  own.files['.npmrc'] = 'registry=https://example.com/\naudit=true\n';
  await startUpdate(own.env, '0.1.1', own.deps, T0);
  expect(
    own.files['.npmrc'] === 'registry=https://example.com/\naudit=true\nprefer-offline=true\nfund=false\n',
    `the .npmrc did not keep its own lines: ${JSON.stringify(own.files['.npmrc'])}`,
  );
  const done = world();
  done.files['.npmrc'] = lines;
  await startUpdate(done.env, '0.1.1', done.deps, T0);
  expect(
    done.commits[0].changes.every((c) => c.path !== '.npmrc') && done.files['.npmrc'] === lines,
    'an .npmrc with the lines was written again',
  );
}

// The page's notes: from the running version up to the newest, newest first.
{
  const running = RUNNING.split('-')[0];
  const [major, minor, patch] = running.split('.').map(Number);
  const next1 = `${major}.${minor}.${patch + 1}`;
  const next2 = `${major}.${minor}.${patch + 2}`;
  const w = world();
  for (const v of ['0.0.0', running, next1, next2, '9.9.9'])
    await w.kv.put(`cms:notes:${v}`, JSON.stringify({ version: v, text: `Notes ${v}` }));
  await w.kv.put('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: next2 }));
  const { notes } = await cmsStatus(w.env, running);
  expect(
    notes.map((n) => n.version).join() === `${next2},${next1}`,
    `noterne var ${notes.map((n) => n.version).join()}, ikke ${next2},${next1}`,
  );
}

// A pre-release running: the status answers, with no notes.
{
  const w = world();
  for (const v of ['0.1.0', '0.2.0']) await w.kv.put(`cms:notes:${v}`, JSON.stringify({ version: v, text: `Notes ${v}` }));
  await w.kv.put('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: '0.2.0' }));
  const status = await cmsStatus(w.env, '0.2.0-next-1').catch((e) => e);
  expect(status?.running === '0.2.0-next-1', `en forudgivelse gav ${status?.message ?? status?.running}, ikke status`);
  expect(Array.isArray(status?.notes) && status.notes.length === 0, 'en forudgivelse gav noter');
}

// A version that crosses into 0.19.0 and is newer than the package running these checks: 0.19.0 itself while the package is older, otherwise the next patch
// above RUNNING. The cases below must not depend on which version the package is (a site already running the target counts as updated, not as undone).
const CROSSING = (() => {
  const [major, minor, patch] = RUNNING.split('-')[0].split('.').map(Number);
  return major === 0 && minor < 19 ? '0.19.0' : `${major}.${minor}.${patch + 1}`;
})();

// The update that crosses into 0.19.0 (from any version below it) rewrites the class names of the pages and posts in the same commit as the version, and the undo
// writes both back in one commit (class names saved in content, M6).
{
  const page = (cls) => `---\ntitle: "body-small"\n---\n\n<p class="${cls[0]}">body-small</p>\n\n<span class="${cls[1]}">x</span>\n`;
  const before = {
    'src/content/pages/a.md': page(['label-medium', 'color-accent']),
    'src/content/blog/b.md': page(['body-large', 'color-muted']),
    'src/content/pages/c.md': page(['mo-type-label-medium', 'mo-has-accent-color']),
  };
  const w = world({ range: '0.18.1', latest: CROSSING, content: before });
  await checkForUpdate(w.env, w.deps, T0);
  expect(w.commits.length === 1, `the update made ${w.commits.length} commits, not 1`);
  const paths = w.commits[0]?.changes.map((c) => c.path) ?? [];
  expect(
    paths.includes('package.json') && paths.includes('src/content/pages/a.md') && paths.includes('src/content/blog/b.md'),
    `the commit had ${paths.join()}`,
  );
  expect(!paths.includes('src/content/pages/c.md'), 'a page with the new names was rewritten');
  expect(
    w.files['src/content/pages/a.md'] === page(['mo-type-label-medium', 'mo-has-accent-color']),
    'the class names of the page were not rewritten, or a word of text changed',
  );
  expect(
    w.files['src/content/blog/b.md'] === page(['mo-type-body-large', 'mo-has-muted-color']),
    'the class names of the post were not rewritten',
  );
  expect(stored(w.kv, 'cms:update')?.migrated?.length === 2, `cms:update was ${JSON.stringify(stored(w.kv, 'cms:update'))}`);
  w.checks.c1 = 'failure';
  await watchUpdate(w.env, w.deps, T0 + 2 * MINUTE);
  expect(w.commits.length === 2, 'the failed update was not undone with one commit');
  expect(JSON.parse(w.files['package.json']).dependencies[PACKAGE] === '0.18.1', 'the undo did not write the version back');
  expect(
    w.files['src/content/pages/a.md'] === before['src/content/pages/a.md'] &&
      w.files['src/content/blog/b.md'] === before['src/content/blog/b.md'],
    'the undo did not write the class names back with the version',
  );
  expect(w.files['src/content/pages/c.md'] === before['src/content/pages/c.md'], 'the undo touched a page the update had not');
  // An update that crosses into 0.19.0 from a 0.18.x patch rewrites too (a site already on 0.18.2 gets its content rewritten).
  const patch = world({ range: '0.18.2', latest: CROSSING, content: before });
  await checkForUpdate(patch.env, patch.deps, T0);
  expect(
    patch.commits[0]?.changes.some((c) => c.path === 'src/content/pages/a.md') &&
      patch.files['src/content/pages/a.md'] === page(['mo-type-label-medium', 'mo-has-accent-color']) &&
      stored(patch.kv, 'cms:update')?.migrated?.length === 2,
    'an update from 0.18.2 to 0.19.0 did not rewrite content',
  );
  // An update within 0.18.x, or from 0.19.0 on, leaves the content alone.
  const noRewrite = async (range, latest) => {
    const x = world({ range, latest, content: before });
    await checkForUpdate(x.env, x.deps, T0);
    expect(x.commits.length === 1, `the update ${range} to ${latest} made ${x.commits.length} commits`);
    expect(
      x.commits[0]?.changes.every((c) => !c.path.startsWith('src/content/')) && !('migrated' in (stored(x.kv, 'cms:update') ?? {})),
      `an update from ${range} to ${latest} rewrote content`,
    );
  };
  await noRewrite('0.18.0', '0.18.1');
  await noRewrite('0.18.1', '0.18.2');
  await noRewrite('0.18.2', '0.18.3');
  await noRewrite('0.19.0', '0.19.1');
}

// The same update rewrites every place the editor stores markdown: a list entry (body and front matter), a data file's markdown string,
// a global and a block's props in a page; JSON is written again as the editor writes it, and the undo writes exactly those files back.
{
  const NAMES = [
    ['body-small', 'mo-type-body-small'],
    ['body-medium', 'mo-type-body-medium'],
    ['body-large', 'mo-type-body-large'],
    ['label-medium', 'mo-type-label-medium'],
    ['color-accent', 'mo-has-accent-color'],
    ['color-muted', 'mo-has-muted-color'],
  ];
  const markdown = (pick) => NAMES.map(([old, now]) => `<p class="${pick(old, now)}">${old}</p>`).join('\n\n') + '\n';
  const json = (value) => JSON.stringify(value, null, 2) + '\n';
  const props = (pick) =>
    `<div data-block="text" data-props="${JSON.stringify({ text: markdown(pick) })
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}"></div>\n`;
  const site = (pick) => ({
    'src/content/team/anna.md': `---\ntitle: Anna\nbio: "<span class=\\"${pick('color-accent', 'mo-has-accent-color')}\\">Hi</span>"\n---\n\n${markdown(pick)}`,
    'src/data/notes.json': json({ title: 'body-small', note: markdown(pick), n: 3 }),
    'src/data/footer.json': json({ columns: [{ heading: 'label-medium', text: markdown(pick) }] }),
    'src/content/pages/p.md': `---\ntitle: P\n---\n\n${props(pick)}`,
    'src/data/other.json': json({ a: 'body-small', b: ['x'] }),
  });
  const before = site((old) => old);
  const after = site((old, now) => now);
  const changed = Object.keys(before).filter((p) => before[p] !== after[p]);
  const w = world({ range: '0.18.1', latest: CROSSING, content: before });
  await checkForUpdate(w.env, w.deps, T0);
  const paths = w.commits[0]?.changes.map((c) => c.path) ?? [];
  const notContent = (p) => !/^src\/(content|data)\//.test(p);
  expect(w.commits.length === 1 && paths.includes('package.json'), 'the update did not commit the version once');
  for (const p of changed) expect(w.files[p] === after[p], `${p} was not rewritten as the editor writes it`);
  expect(
    !paths.includes('src/data/other.json') && w.files['src/data/other.json'] === before['src/data/other.json'],
    'a data file without class names changed',
  );
  expect(
    changed.every((p) => paths.includes(p)) && paths.filter((p) => !notContent(p)).length === changed.length,
    `the commit had ${paths.join()}, not the version and ${changed.join()}`,
  );
  expect(
    JSON.stringify(stored(w.kv, 'cms:update')?.migrated?.slice().sort()) === JSON.stringify(changed.slice().sort()),
    'cms:update did not list the rewritten files',
  );
  w.checks.c1 = 'failure';
  await watchUpdate(w.env, w.deps, T0 + 2 * MINUTE);
  expect(w.commits.length === 2, 'the failed update was not undone with one commit');
  expect(
    Object.keys(before).every((p) => w.files[p] === before[p]),
    'the undo did not write exactly the rewritten files back',
  );
  expect(
    w.commits[1]?.changes
      .map((c) => c.path)
      .filter((p) => p !== 'package.json' && p !== 'package-lock.json')
      .sort()
      .join() === changed.slice().sort().join(),
    'the undo touched other files than the update rewrote',
  );
  // A second run changes nothing: the content the update wrote has nothing left to rewrite.
  const again = world({ range: '0.18.1', latest: CROSSING, content: after });
  await checkForUpdate(again.env, again.deps, T0);
  expect(
    again.commits[0]?.changes.every((c) => notContent(c.path)) && !('migrated' in (stored(again.kv, 'cms:update') ?? {})),
    'a second run rewrote content again',
  );
}

// 13. The contract hold: a version is taken only when the store says every installed store theme and app (id@version) is written to its contracts.
{
  const record = (version) => JSON.stringify({ version, ref: version, files: [{ path: 'theme.json', oid: 'abc' }] }, null, 2);
  const venus = { kind: 'theme', id: 'venus', record: record('1.3.0'), manifest: JSON.stringify({ name: 'Venus', version: '1.3.0' }) };
  const mailchimp = { kind: 'app', id: 'mailchimp', record: record('2.0.0'), manifest: JSON.stringify({ api: 5, version: '2.0.0' }) };
  const own = { kind: 'app', id: 'sara', record: null, manifest: JSON.stringify({ api: 5 }) };
  const problemOf = (w) => stored(w.kv, 'cms:checked')?.problem;
  const run = async (opts) => {
    const w = world(opts);
    await checkForUpdate(w.env, w.deps, T0);
    return w;
  };

  const old = await run({ items: [venus, own], releases: { 'venus@1.3.0': { api: 5 } } });
  expect(old.commits.length === 0 && stored(old.kv, 'cms:update') === null, 'a version a store theme is not written to was taken');
  expect(
    problemOf(old)?.kind === 'contract' && problemOf(old).detail === 'theme venus',
    `the hold was recorded as ${JSON.stringify(problemOf(old))}`,
  );
  expect(stored(old.kv, 'cms:checked')?.latest === '0.1.1', 'the held check did not keep latest');

  const app = await run({ items: [mailchimp], releases: { 'mailchimp@2.0.0': { api: 8 } } });
  expect(app.commits.length === 0 && problemOf(app)?.detail === 'app mailchimp', 'a store app written to another contract was taken');

  const behind = await run({ items: [venus, mailchimp, own], releases: { 'venus@1.3.0': { api: 6 }, 'mailchimp@2.0.0': { api: 6 } } });
  expect(
    behind.commits.length === 1 && !problemOf(behind),
    'an installed release written to the contract (one behind the newest) was held',
  );

  const missing = await run({ items: [venus], releases: { 'venus@1.3.0': { missing: true } } });
  expect(
    missing.commits.length === 0 && /not in the store/.test(problemOf(missing)?.detail),
    `a release the store does not know was recorded as ${JSON.stringify(problemOf(missing))}`,
  );

  const silent = await run({ items: [venus], releases: {} });
  expect(
    silent.commits.length === 0 && problemOf(silent)?.kind === 'contract' && /could not confirm/.test(problemOf(silent).detail),
    `a silent store was recorded as ${JSON.stringify(problemOf(silent))}`,
  );

  const ownOnly = world({ items: [own] });
  let asked = false;
  ownOnly.deps.storeRelease = async () => void (asked = true);
  await checkForUpdate(ownOnly.env, ownOnly.deps, T0);
  expect(ownOnly.commits.length === 1 && !asked, 'a site with only its own app was held, or asked the store');

  const unreadable = world({ items: [venus] });
  const fetch = unreadable.deps.fetch;
  unreadable.deps.fetch = async (url, init) =>
    String(url).endsWith('.tgz') ? new Response(tarball({ 'package/CHANGELOG.md': CHANGELOG })) : fetch(url, init);
  await checkForUpdate(unreadable.env, unreadable.deps, T0);
  expect(unreadable.commits.length === 0 && problemOf(unreadable)?.kind === 'unreachable', 'unreadable contracts were taken on a guess');

  const failing = world({ items: [venus] });
  failing.deps.readStoreItems = async () => {
    throw new Error('github');
  };
  await checkForUpdate(failing.env, failing.deps, T0);
  expect(failing.commits.length === 0 && problemOf(failing)?.kind === 'unreachable', 'an unreadable site was taken');

  // The Worker's own call of the store: one release, the site's key.
  const calls = [];
  const storeAnswering = (status, body) => async (url, init) => {
    calls.push({ url: String(url), auth: init?.headers?.authorization });
    if (status === 'throw') throw new Error('offline');
    return new Response(JSON.stringify(body ?? {}), { status });
  };
  const keyed = { MORPHEME_STORE_KEY: 'key', MORPHEME_STORE_URL: 'https://store.example' };
  const got = await releaseFor(keyed, 'theme_abc', '1.3.0', storeAnswering(200, { id: 'theme_abc', version: '1.3.0', api: 6 }));
  expect(got?.api === 6, `a 200 gave ${JSON.stringify(got)}`);
  expect(
    calls[0]?.url === 'https://store.example/store/releases/theme_abc/1.3.0' && calls[0].auth === 'Bearer key',
    `the call was ${JSON.stringify(calls[0])}`,
  );
  expect((await releaseFor(keyed, 'x', '1.0.0', storeAnswering(404)))?.missing === true, 'a 404 did not give missing');
  expect((await releaseFor(keyed, 'x', '1.0.0', storeAnswering(500))) === null, 'a 500 did not give no answer');
  expect((await releaseFor(keyed, 'x', '1.0.0', storeAnswering('throw'))) === null, 'an offline store did not give no answer');
  expect((await releaseFor(keyed, 'x', '1.0.0', storeAnswering(200, { api: 'six' }))) === null, 'a 200 without an api number was taken');
  const before = calls.length;
  expect(
    (await releaseFor({}, 'x', '1.0.0', storeAnswering(200, { api: 6 }))) === null && calls.length === before,
    'a site without a store key asked the store',
  );
}

// 14. No GitHub token: nothing is done, and the check says why (the KV is there to keep it). No KV: nothing, and no error.
{
  const w = world();
  w.env = { PUSH: w.kv };
  await checkForUpdate(w.env, w.deps, T0);
  expect(w.commits.length === 0 && w.urls.length === 0, 'a site without a token went to npm or GitHub');
  expect(
    stored(w.kv, 'cms:checked')?.problem?.kind === 'no-token',
    `no token was recorded as ${JSON.stringify(stored(w.kv, 'cms:checked'))}`,
  );
  const due = world();
  due.env = { PUSH: due.kv };
  await dailyCheck(due.env, due.deps, T0);
  expect(stored(due.kv, 'cms:checked')?.problem?.kind === 'no-token', 'the daily check did not record a missing token');
  const none = world();
  expect((await dailyCheck({}, none.deps, T0)) === undefined && none.urls.length === 0, 'a site without KV did something');
}

// The update that crosses 0.19.6 (from 0.19.5, the fixture's own theme and app, and a store app) rewrites the site's own themes and apps to Material 3's names, and every stored icon name,
// in the same commit as the version; the store app is left alone; the undo writes it all back; a form it cannot rewrite safely stops the update with the list.
{
  const themes = String(config.themes ?? 'src/themes').replace(/\/$/, '');
  const apps = String(config.apps?.folder ?? 'src/apps').replace(/\/$/, '');
  const STORE_CSS = '.mo-button__text { color: red; }\n';
  const own = (pick) => ({
    [`${themes}/mine/theme.json`]: '{ "api": 8 }\n',
    [`${themes}/mine/styles.css`]: pick(
      '.mo-button__text { gap: var(--mo-density-user); }\n',
      ':where(.mo-button).mo-is-text { gap: var(--mo-sys-density-user); }\n',
    ),
    [`${apps}/mine/app.json`]: pick(
      JSON.stringify({ api: 8, icon: 'format_list_numbered' }, null, 2) + '\n',
      JSON.stringify({ api: 8, icon: 'format_list_numbered' }, null, 2) + '\n',
    ),
    // The one item API of ListItem and Card (docs/superpowers/specs/2026-11-24-card-list-item-api.md): `columns` goes; Material's leading and trailing names stay.
    [`${apps}/mine/Rows.tsx`]: pick(
      'import { ListItem } from \'@theme/ui/List\';\nexport const a = (\n  <>\n    <ListItem leadingIcon="check" columns headline="a" />\n    <ListItem leadingAvatar="A" leadingVideo={{ src: s }} headline="b" />\n  </>\n);\n',
      'import { ListItem } from \'@theme/ui/List\';\nexport const a = (\n  <>\n    <ListItem leadingIcon="check" headline="a" />\n    <ListItem leadingAvatar="A" leadingVideo={{ src: s }} headline="b" />\n  </>\n);\n',
    ),
    [`${apps}/app_0123456789abcdef/store.json`]: '{ "version": "1.0.0" }\n',
    [`${apps}/app_0123456789abcdef/styles.css`]: STORE_CSS,
    'src/content/pages/cards.md': pick(
      '---\ntitle: Cards\nicon: map-pin\n---\n\nText with icon: map-pin in it.\n',
      '---\ntitle: Cards\nicon: location_on\n---\n\nText with icon: map-pin in it.\n',
    ),
    'src/data/footer.json': pick(
      JSON.stringify(
        {
          links: [
            { icon: 'github-logo', label: 'GitHub' },
            { icon: 'mail', label: 'Mail' },
          ],
        },
        null,
        2,
      ) + '\n',
      JSON.stringify(
        {
          links: [
            { icon: 'github-logo', label: 'GitHub' },
            { icon: 'mail', label: 'Mail' },
          ],
        },
        null,
        2,
      ) + '\n',
    ),
  });
  const before = own((old) => old);
  const after = own((old, now) => now);
  const w = world({ range: '0.19.5', latest: CROSSING, content: before });
  await checkForUpdate(w.env, w.deps, T0);
  expect(w.commits.length === 1, `the update made ${w.commits.length} commits, not 1`);
  const paths = w.commits[0]?.changes.map((c) => c.path) ?? [];
  for (const p of Object.keys(before)) {
    if (p.includes('app_0123456789abcdef') || before[p] === after[p]) {
      expect(w.files[p] === before[p] && !paths.includes(p), `${p} was changed`);
    } else expect(w.files[p] === after[p] && paths.includes(p), `${p} was not rewritten: ${JSON.stringify(w.files[p])}`);
  }
  expect(/"code"/.test(w.files['.morpheme-migrations.json'] ?? ''), 'the marker file was not written in the same commit');
  expect(paths.includes('.morpheme-migrations.json') && paths.includes('package.json'), `the commit had ${paths.join()}`);
  expect(
    stored(w.kv, 'cms:update')?.code?.includes(`${themes}/mine/styles.css`),
    `cms:update was ${JSON.stringify(stored(w.kv, 'cms:update'))}`,
  );
  // An update that already ran is not run twice: a site with the marker keeps its own files as they are.
  const twice = world({
    range: '0.19.5',
    latest: CROSSING,
    content: { ...after, '.morpheme-migrations.json': w.files['.morpheme-migrations.json'] },
  });
  await checkForUpdate(twice.env, twice.deps, T0);
  expect(
    twice.commits.length === 1 &&
      twice.commits[0].changes.every((c) => !c.path.startsWith('src/') && c.path !== '.morpheme-migrations.json'),
    'an update with the marker rewrote the own files again',
  );
  // The undo writes the version, the own files, the icons and the marker back in one commit.
  w.checks.c1 = 'failure';
  await watchUpdate(w.env, w.deps, T0 + 2 * MINUTE);
  expect(w.commits.length === 2, 'the failed update was not undone with one commit');
  for (const p of Object.keys(before)) expect(w.files[p] === before[p], `the undo did not write ${p} back`);
  expect(w.files['.morpheme-migrations.json'] == null, 'the undo left the marker file');
  expect(!w.kv.map.has('cms:names-backup'), 'the undo left its backup');
  // A site that comes from 0.19.6 on, or from below 0.19.5 into 0.19.5, is left alone.
  const none = world({ range: '0.19.6', latest: '0.19.7', content: before });
  await checkForUpdate(none.env, none.deps, T0);
  expect(
    none.commits[0]?.changes.every((c) => !c.path.startsWith('src/')) && !('code' in (stored(none.kv, 'cms:update') ?? {})),
    'an update from 0.19.6 rewrote',
  );
  // A form that cannot be rewritten safely stops the update with the list (nothing is committed), by hand and by the daily check.
  const unsafe = {
    ...before,
    [`${apps}/mine/View.tsx`]:
      "import { Button } from '@theme/ui/Button';\nexport const a = (b) => <Button size={b ? 'medium' : 'large'} />;\n",
  };
  const stop = world({ range: '0.19.5', latest: CROSSING, content: unsafe });
  await stop.kv.put('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: CROSSING }));
  const res = await handleCms(post(CROSSING), stop.env, undefined, stop.deps);
  const body = await res.json();
  expect(
    res.status === 422 && body.error === 'unsafe-code' && body.detail.some((l) => l.includes('View.tsx:2')),
    `the unsafe update answered ${res.status} ${JSON.stringify(body)}`,
  );
  expect(stop.commits.length === 0, 'an unsafe update committed');
  // A computed `columns` stops the same way and name the file and line.
  const item = world({
    range: '0.19.5',
    latest: CROSSING,
    content: {
      ...before,
      [`${apps}/mine/Rows.tsx`]:
        'import { ListItem } from \'@theme/ui/List\';\nexport const a = (c) => <ListItem leadingVideo={c} columns={c.wide} headline="a" />;\n',
    },
  });
  await item.kv.put('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: CROSSING }));
  const itemRes = await handleCms(post(CROSSING), item.env, undefined, item.deps);
  const itemBody = await itemRes.json();
  expect(
    itemRes.status === 422 && itemBody.detail.some((l) => l.includes('Rows.tsx:2') && l.includes('columns')),
    `a computed columns answered ${itemRes.status} ${JSON.stringify(itemBody)}`,
  );
  expect(item.commits.length === 0, 'an unsafe item update committed');
  const auto = world({ range: '0.19.5', latest: CROSSING, content: unsafe });
  await checkForUpdate(auto.env, auto.deps, T0);
  expect(
    auto.commits.length === 0 && stored(auto.kv, 'cms:checked')?.problem?.kind === 'unsafe-code',
    'the daily check did not record the unsafe code',
  );
  // The Worker stops on the same Tailwind forms as `morpheme migrate` (one implementation, lib/tailwind-rules.mjs): a utility in a class attribute, a string of utilities, an import.
  for (const [name, text] of [
    ['View.tsx', `export const a = <div ${'class' + 'Name'}="flex gap-4 md:px-2" />;\n`],
    ['util.ts', "export const a = 'flex items-center gap-4';\n"],
    ['merge.ts', "import { twMerge } from 'tailwind-merge';\n"],
    ['style.css', '.x { color: theme(--color-red); }\n'],
  ]) {
    const tw = world({ range: '0.19.5', latest: CROSSING, content: { ...before, [`${apps}/mine/${name}`]: text } });
    await tw.kv.put('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: CROSSING }));
    const r = await handleCms(post(CROSSING), tw.env, undefined, tw.deps);
    const b = await r.json();
    expect(
      r.status === 422 && b.error === 'unsafe-code' && b.detail.some((l) => l.includes(`${name}:1`)),
      `the Worker let ${name} pass (${r.status} ${JSON.stringify(b)})`,
    );
    expect(tw.commits.length === 0, `an update with ${name} committed`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('Workerens opdatering af CMS’et er i orden.');
