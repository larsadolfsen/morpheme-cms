// Checks the Worker's own update of the CMS (packages/editor/worker/cms-update.js): the hourly check of npm, the update's commit, the
// minute watch of its check run with the undo, the 20 minutes' fallback, and /api/cms. GitHub, npm, KV and the notifications are
// played here (a fake KV, an in-memory package.json and lock, a fake fetch); nothing goes to GitHub, npm or Cloudflare.
// Run: npm run check:worker
import { gzipSync } from 'node:zlib';
import { config } from '../site/siteConfig.mjs';
import { workerModules } from './worker-modules.mjs';

const [{ RUNNING, checkForUpdate, cmsStatus, handleCms, startUpdate, watchUpdate }, { GitHubError }] = await workerModules(
  'cms-update.js',
  'files.js',
);

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
function world({ range = '0.1.0', latest = '0.1.1', manifestExtra = {}, lock = true } = {}) {
  const files = {
    'package.json': JSON.stringify({ name: 'site', dependencies: { [PACKAGE]: range } }, null, 2) + '\n',
    'package-lock.json':
      JSON.stringify(
        {
          name: 'site',
          lockfileVersion: 3,
          packages: {
            '': { name: 'site', dependencies: { [PACKAGE]: range } },
            [`node_modules/${PACKAGE}`]: { version: '0.1.0', resolved: manifestOf('0.1.0').dist.tarball, integrity: 'sha512-0.1.0' },
          },
        },
        null,
        2,
      ) + '\n',
  };
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
  };
  w.env = { GITHUB_PUBLISH_TOKEN: 'token', PUSH: w.kv };
  w.deps = {
    readFiles: async (env, paths) => {
      w.readCount++;
      return { head: `head${w.commits.length}`, texts: paths.map((p) => files[p]) };
    },
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
      if (url.endsWith('.tgz')) return new Response(tarball({ 'package/CHANGELOG.md': CHANGELOG }));
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
    'låsen fik ikke 0.1.1s resolved og integrity',
  );
  expect(w.files['package.json'].endsWith('}\n') && w.files['package-lock.json'].endsWith('}\n'), 'filerne endte ikke på en linjeskift');
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
  expect(JSON.parse(w.files['package.json']).dependencies[PACKAGE] === '0.1.0', 'fortrydelsen skrev ikke 0.1.0 tilbage');
  expect(
    JSON.parse(w.files['package-lock.json']).packages[`node_modules/${PACKAGE}`].integrity === 'sha512-0.1.0',
    'fortrydelsen skrev ikke 0.1.0 tilbage i låsen',
  );
  expect(stored(w.kv, 'cms:skip:0.1.1')?.commit === 'c1', 'den fortrudte version blev ikke sprunget over');
  const undoing = stored(w.kv, 'cms:update');
  expect(undoing?.state === 'undoing' && undoing.undoCommit === 'c2', `cms:update var ${JSON.stringify(undoing)}`);
  expect(w.notices.length === 0, 'der blev sendt en besked, før fortrydelsen var bygget');
  await watchUpdate(w.env, w.deps, T0 + 3 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undoing', 'fortrydelsen blev regnet for færdig uden et resultat');
  w.checks.c2 = 'success';
  await watchUpdate(w.env, w.deps, T0 + 4 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undone', 'fortrydelsen blev ikke til undone');
  expect(w.notices.length === 1 && w.notices[0].notice.error === true, 'undone gav ikke én besked med error');
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

// 4. The site runs the new version: done, one notification.
{
  const w = world();
  w.files['package.json'] = JSON.stringify({ dependencies: { [PACKAGE]: RUNNING } });
  await w.kv.put(
    'cms:update',
    JSON.stringify({ commit: 'c1', from: '0.0.0', to: RUNNING, at: new Date(T0).toISOString(), state: 'waiting' }),
  );
  await watchUpdate(w.env, w.deps, T0 + 5 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'done', 'en opdatering, der kører, blev ikke done');
  expect(w.notices.length === 1 && !w.notices[0].notice.error, 'done gav ikke én besked uden error');
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
    `en nøgle uden skriverettighed gav ikke cannot-write (${error.status})`,
  );
}

// 8. Without the token (or KV) nothing is asked and nothing is kept.
for (const [what, patch] of [
  ['uden nøgle', { GITHUB_PUBLISH_TOKEN: undefined }],
  ['uden KV', { PUSH: undefined }],
]) {
  const w = world();
  const env = { ...w.env, ...patch };
  await checkForUpdate(env, w.deps, T0);
  await watchUpdate(env, w.deps, T0);
  expect(w.urls.length === 0 && w.readCount === 0 && w.kv.writes === 0 && w.commits.length === 0, `tjekket gjorde noget ${what}`);
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
  expect(stored(w.kv, 'cms:update')?.state === 'undoing', 'fortrydelsen blev regnet for færdig efter 9 minutter');
  await watchUpdate(w.env, w.deps, T0 + 42 * MINUTE);
  expect(stored(w.kv, 'cms:update')?.state === 'undone' && w.notices.length === 1, 'fortrydelsen blev ikke undone efter 20 minutter');
  expect(stored(w.kv, 'cms:checked')?.noChecks === true, 'noChecks blev væk');
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
  expect(w.notices.length === 1 && w.notices[0].notice.error === true, 'stuck gav ikke én besked med error');
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
    `minuttet uden en opdatering læste ${w.kv.reads} gange og gjorde ${w.urls.length} kald`,
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
  expect(again.status === 200 && (await again.json()).update?.state === 'waiting', 'Prøv igen gav ikke en ventende opdatering');
  expect(stored(s.kv, 'cms:skip:0.1.1') === null && s.commits.length === 1, 'Prøv igen fjernede ikke spring-over-nøglen og committede');

  // A package that wants npm: 422.
  const n = world({ manifestExtra: { dependencies: { left: '1.0.0' } } });
  await checkForUpdate(n.env, n.deps, T0);
  expect(n.commits.length === 0 && stored(n.kv, 'cms:checked')?.problem?.kind === 'needs-npm', 'needs-npm blev ikke meldt af timetjekket');
  const npm = await handleCms(post('0.1.1'), n.env, undefined, n.deps);
  expect(npm.status === 422 && (await npm.json()).error === 'needs-npm', 'en pakke, der kræver npm, gav ikke 422');

  // A token that cannot write: 502; no token: 503.
  const c = world();
  await checkForUpdate({ ...c.env, GITHUB_PUBLISH_TOKEN: undefined }, c.deps, T0);
  c.kv.map.set('cms:checked', JSON.stringify({ at: new Date(T0).toISOString(), latest: '0.1.1' }));
  c.failure = new GitHubError('Forbidden', 403);
  expect((await handleCms(post('0.1.1'), c.env, undefined, c.deps)).status === 502, 'en nøgle, der ikke kan gemme, gav ikke 502');
  expect(
    (await handleCms(post('0.1.1'), { ...c.env, GITHUB_PUBLISH_TOKEN: undefined }, undefined, c.deps)).status === 503,
    'uden nøgle gav ikke 503',
  );
  const direct = await startUpdate(world().env, '0.1.1', world().deps, T0).catch((e) => e);
  expect(direct?.to === '0.1.1' && direct.state === 'waiting', 'startUpdate gav ikke opdateringen');
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

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('Workerens opdatering af CMS’et er i orden.');
