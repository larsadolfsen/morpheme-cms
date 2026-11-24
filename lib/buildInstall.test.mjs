import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptsContract, parseInstalls, planInstall } from './buildInstall.mjs';

const NEXT = { theme: 8, apps: [8] }; // a fake higher contract: the numbers of this package are not raised here
const record = (version) => JSON.stringify({ version, ref: version, files: [] });
const item = (kind, id, version = '1.0.0', changed = []) => ({ kind, id, record: version ? record(version) : null, changed });
const file = [{ path: 'index.ts', oid: 'a'.repeat(40) }];
const themeEntry = (id, version, api = 8) => ({
  id,
  handle: 'p/venus',
  version,
  api,
  name: 'Venus',
  author: 'A',
  icon: 'palette',
  files: file,
});
const appEntry = (id, version, api = 8) => ({
  id,
  handle: 'p/mail',
  version,
  api,
  label: 'Mail',
  publisher: 'P',
  icon: 'mail',
  hint: 'h',
  adds: { blocks: [], lists: [], kinds: [] },
  files: file,
});
const T = 'theme_fa395ad84690acbd';
const A = 'app_0123456789abcdef';
const answers = (o) => new Map(Object.entries(o));

test('acceptsContract: a theme reads its one contract, an app any of the list', () => {
  assert.equal(acceptsContract('theme', 8, NEXT), true);
  assert.equal(acceptsContract('theme', 7, NEXT), false);
  assert.equal(acceptsContract('app', 8, { theme: 8, apps: [7, 8] }), true);
  assert.equal(acceptsContract('app', undefined, NEXT), false);
});

test('an item written to a contract the target reads is left alone', () => {
  const plan = planInstall({
    items: [item('theme', T), item('app', A)],
    answers: answers({ [`theme:${T}`]: { api: 8 }, [`app:${A}`]: { api: 8 } }),
    catalog: { themes: [themeEntry(T, '2.0.0')], apps: [appEntry(A, '3.0.0')] },
    next: NEXT,
  });
  assert.deepEqual(plan, { install: [], problems: [] });
});

test('an item written to an older contract is upgraded to the store version for the target', () => {
  const { install, problems } = planInstall({
    items: [item('theme', T, '1.3.0'), item('app', A, '2.0.0')],
    answers: answers({ [`theme:${T}`]: { api: 7 }, [`app:${A}`]: { api: 7 } }),
    catalog: { themes: [themeEntry(T, '2.0.0')], apps: [appEntry(A, '3.1.0')] },
    next: NEXT,
  });
  assert.deepEqual(problems, []);
  assert.deepEqual(
    install.map(({ kind, id, label, from, version }) => [kind, id, label, from, version]),
    [
      ['theme', T, 'Venus', '1.3.0', '2.0.0'],
      ['app', A, 'Mail', '2.0.0', '3.1.0'],
    ],
  );
  assert.deepEqual(install[0].files, file);
});

test('an item the store gave no answer for is upgraded when the catalog has another version, left when it has the same', () => {
  const catalog = { themes: [themeEntry(T, '2.0.0')] };
  const a = answers({ [`theme:${T}`]: null });
  assert.equal(planInstall({ items: [item('theme', T, '1.3.0')], answers: a, catalog, next: NEXT }).install.length, 1);
  assert.deepEqual(planInstall({ items: [item('theme', T, '2.0.0')], answers: a, catalog, next: NEXT }), { install: [], problems: [] });
});

test('an item with no version the target accepts is named', () => {
  const { install, problems } = planInstall({
    items: [item('theme', T, '1.3.0'), item('app', A, '2.0.0')],
    answers: answers({ [`theme:${T}`]: { api: 7 }, [`app:${A}`]: { missing: true } }),
    // the theme's only entry is written to 7, the catalog has no app at all
    catalog: { themes: [themeEntry(T, '1.6.0', 7)], apps: [] },
    next: NEXT,
  });
  assert.deepEqual(install, []);
  assert.deepEqual(problems, [
    { kind: 'theme', id: T, why: 'no-accepted-version', version: '1.3.0' },
    { kind: 'app', id: A, why: 'no-accepted-version', version: '2.0.0' },
  ]);
});

test('a site copy (no store.json) is named', () => {
  const { install, problems } = planInstall({ items: [item('theme', T, null)], answers: new Map(), catalog: {}, next: NEXT });
  assert.deepEqual(install, []);
  assert.deepEqual(problems, [{ kind: 'theme', id: T, why: 'site-copy' }]);
  assert.equal(
    planInstall({ items: [{ kind: 'app', id: A, record: '{ not json', changed: [] }], answers: new Map(), catalog: {}, next: NEXT })
      .problems[0].why,
    'site-copy',
  );
});

test('an item whose files were changed in the site is named, never written over', () => {
  const { install, problems } = planInstall({
    items: [item('app', A, '2.0.0', ['index.ts'])],
    answers: answers({ [`app:${A}`]: { api: 7 } }),
    catalog: { apps: [appEntry(A, '3.0.0')] },
    next: NEXT,
  });
  assert.deepEqual(install, []);
  assert.deepEqual(problems, [{ kind: 'app', id: A, why: 'changed', files: ['index.ts'] }]);
});

test('parseInstalls keeps the valid installs only', () => {
  const good = { kind: 'theme', id: T, label: 'Venus', from: '1.3.0', version: '2.0.0', files: file };
  assert.deepEqual(parseInstalls(JSON.stringify({ installs: [good, { ...good, kind: 'x' }, { ...good, files: [] }, null] })), [good]);
  assert.deepEqual(parseInstalls('{ not json'), []);
  assert.deepEqual(parseInstalls(undefined), []);
});

test('the first start commits an install once: not when done, uninstalled or changed in the site', async () => {
  const { firstStart } = await import('./buildInstall.mjs');
  const { folderChanges } = await import('./folderChanges.mjs');
  const newer = (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0;
  const install = { version: '2.0.0' };
  assert.equal(firstStart(install, { version: '1.0.0' }, [], newer), 'commit');
  assert.equal(firstStart(install, { version: '2.0.0' }, [], newer), 'done');
  assert.equal(firstStart(install, { version: '3.0.0' }, [], newer), 'done');
  assert.equal(firstStart(install, undefined, [], newer), 'gone');
  assert.equal(firstStart(install, { version: '1.0.0' }, ['index.ts'], newer), 'changed');
  // The commit's changes make the folder the install's version; a second start then finds nothing to do.
  const record = { version: '2.0.0', ref: '2.0.0', files: [{ path: 'index.ts', oid: 'b'.repeat(40) }] };
  const current = [
    { path: 'src/apps/x/index.ts', oid: 'a'.repeat(40) },
    { path: 'src/apps/x/store.json', oid: 'c'.repeat(40) },
  ];
  const changes = folderChanges('src/apps/x', current, { files: [{ path: 'index.ts', content: 'new' }], record });
  assert.deepEqual(changes.map((c) => c.path).sort(), ['src/apps/x/index.ts', 'src/apps/x/store.json']);
  assert.equal(JSON.parse(changes.find((c) => c.path.endsWith('store.json')).content).version, '2.0.0');
});

test('parseWorkers gives the text of worker/apps.js the build left, or null', async () => {
  const { parseWorkers } = await import('./buildInstall.mjs');
  assert.equal(
    parseWorkers(JSON.stringify({ installs: [], workers: 'export const appWorkers = {};\n' })),
    'export const appWorkers = {};\n',
  );
  assert.equal(parseWorkers(JSON.stringify({ installs: [] })), null);
  assert.equal(parseWorkers('nope'), null);
});

test('the newest of the accepted versions is installed', () => {
  const { install } = planInstall({
    items: [item('app', A, '1.0.0')],
    answers: answers({ [`app:${A}`]: { api: 6 } }),
    catalog: { apps: [appEntry(A, '1.9.0', 8), appEntry(A, '1.10.0', 8)] },
    next: NEXT,
  });
  assert.equal(install[0].version, '1.10.0');
});

test('several installs make one commit: the file of apps changed by each, every path once', async () => {
  const { applyChanges, mergeChanges } = await import('./buildInstall.mjs');
  const { appChanges } = await import('./appChanges.mjs');
  const { readAppsFile } = await import('./appsFile.mjs');
  const A2 = 'app_fedcba9876543210';
  const wanted = (v) => ({
    files: [{ path: 'index.ts', content: 'new' }],
    record: { version: v, ref: v, files: [{ path: 'index.ts', oid: 'b'.repeat(40) }] },
  });
  let state = [{ path: 'src/data/apps.json', text: '{"installed":[]}\n', oid: 'f'.repeat(40) }];
  const all = [];
  for (const id of [A, A2]) {
    const changes = appChanges(`src/apps/${id}`, 'src/data/apps.json', id, [], wanted('2.0.0'), state[0]);
    all.push(...changes);
    state = applyChanges(state, changes);
  }
  const merged = mergeChanges(all);
  assert.equal(new Set(merged.map((c) => c.path)).size, merged.length);
  const list = merged.find((c) => c.path === 'src/data/apps.json');
  assert.equal(list.oid, 'f'.repeat(40)); // the file as the site has it
  assert.deepEqual(readAppsFile(list.content).installed.sort(), [A, A2].sort());
  assert.ok(merged.some((c) => c.path === `src/apps/${A}/index.ts`) && merged.some((c) => c.path === `src/apps/${A2}/index.ts`));
});
