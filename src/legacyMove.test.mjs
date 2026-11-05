// Tests for src/legacyMove.ts: when a legacy store copy counts as installed, and the one list of changes that moves it
// to its permanent folder. Run: node --test src/legacyMove.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appliedTo, legacyOf, mergeChanges, moveChanges } from './legacyMove.ts';

const PATHS = {
  appsFolder: 'src/apps',
  themesFolder: 'src/themes',
  installed: 'src/data/apps.json',
  settings: 'src/data/apps',
  theme: 'src/data/theme.json',
  icons: 'src/data/icons.json',
  blockSettings: 'src/data/block-settings.json',
  popups: 'src/data/popups',
  cookieList: 'src/data/cookie-list',
};
const VENUS = { id: 'theme_fa395ad84690acbd', legacy: 'venus' };
const MOBILEPAY = { id: 'app_ae0b5e17636668bc', legacy: 'mobilepay' };
const file = (path, text, oid = `oid-${path}`) => ({ path, oid, text });
const json = (x) => `${JSON.stringify(x, null, 2)}\n`;
const next = { files: [{ path: 'theme.json', content: '{}' }], record: { version: '2.0.0', ref: '2.0.0', files: [] } };
const find = (changes, path) => changes.find((c) => c.path === path);

test('a legacy folder with a store.json is installed', () => {
  assert.equal(legacyOf(VENUS, [{ id: 'venus', store: { version: '1.2.0' } }]), 'venus');
});

test('a legacy folder without a store.json is the site own', () => {
  assert.equal(legacyOf(VENUS, [{ id: 'venus' }]), null);
  assert.equal(legacyOf(VENUS, []), null);
  assert.equal(legacyOf({ id: VENUS.id }, [{ id: 'venus', store: { version: '1.2.0' } }]), null);
});

test('moving a theme writes the new folder, deletes the old files and rewrites theme.json and icons.json', () => {
  const old = [file('src/themes/venus/theme.json', '{"a":1}'), file('src/themes/venus/store.json', '{}')];
  const site = [file(PATHS.theme, json({ theme: 'venus' })), file(PATHS.icons, json({ pack: 'venus/x' }))];
  const changes = moveChanges(VENUS, 'venus', next, old, site, PATHS);
  assert.equal(find(changes, `src/themes/${VENUS.id}/theme.json`).content, '{}');
  assert.ok(find(changes, `src/themes/${VENUS.id}/store.json`));
  for (const f of old) assert.deepEqual(find(changes, f.path), { path: f.path, content: null, oid: f.oid });
  assert.deepEqual(JSON.parse(find(changes, PATHS.theme).content), { theme: VENUS.id });
  assert.deepEqual(JSON.parse(find(changes, PATHS.icons).content), { pack: `${VENUS.id}/x` });
});

test('a system icon pack and another theme stay as they are', () => {
  const site = [file(PATHS.theme, json({ theme: 'saturn' })), file(PATHS.icons, json({ pack: 'phosphor' }))];
  const changes = moveChanges(VENUS, 'venus', next, [], site, PATHS);
  assert.equal(find(changes, PATHS.theme), undefined);
  assert.equal(find(changes, PATHS.icons), undefined);
});

test('moving an app renames its settings file and keeps the sorted list', () => {
  const settings = '{ "key":  "kept as it is" }\n';
  const site = [
    file(PATHS.installed, json({ installed: ['calendly', 'mobilepay', 'zeta'] })),
    file('src/data/apps/mobilepay.json', settings),
  ];
  const changes = moveChanges(MOBILEPAY, 'mobilepay', { files: [], record: next.record }, [], site, PATHS);
  assert.deepEqual(find(changes, 'src/data/apps/mobilepay.json'), {
    path: 'src/data/apps/mobilepay.json',
    content: null,
    oid: 'oid-src/data/apps/mobilepay.json',
  });
  assert.deepEqual(find(changes, `src/data/apps/${MOBILEPAY.id}.json`), {
    path: `src/data/apps/${MOBILEPAY.id}.json`,
    content: settings,
    oid: null,
  });
  assert.deepEqual(JSON.parse(find(changes, PATHS.installed).content).installed, ['calendly', MOBILEPAY.id, 'zeta'].sort());
});

test('moving an app rewrites block-settings, popups and the cookie list, and only the legacy values', () => {
  const site = [
    file(PATHS.blockSettings, json({ off: ['popups/mobilepay', 'popups/other', 'text', 'x/mobilepay-2'] })),
    file('src/data/popups/a.json', json({ type: 'mobilepay', title: 'A' })),
    file('src/data/popups/b.json', json({ type: 'other' })),
    file('src/data/cookie-list/c.json', json({ name: 'mobilepay', app: 'mobilepay' })),
    file('src/data/cookie-list/d.json', json({ app: 'other' })),
  ];
  const changes = moveChanges(MOBILEPAY, 'mobilepay', { files: [], record: next.record }, [], site, PATHS);
  assert.deepEqual(JSON.parse(find(changes, PATHS.blockSettings).content).off, [
    `popups/${MOBILEPAY.id}`,
    'popups/other',
    'text',
    'x/mobilepay-2',
  ]);
  assert.equal(JSON.parse(find(changes, 'src/data/popups/a.json').content).type, MOBILEPAY.id);
  assert.equal(JSON.parse(find(changes, 'src/data/popups/a.json').content).title, 'A');
  assert.equal(find(changes, 'src/data/popups/b.json'), undefined);
  const cookie = JSON.parse(find(changes, 'src/data/cookie-list/c.json').content);
  assert.deepEqual(cookie, { name: 'mobilepay', app: MOBILEPAY.id });
  assert.equal(find(changes, 'src/data/cookie-list/d.json'), undefined);
  assert.equal(find(changes, PATHS.theme), undefined);
});

test('an item without a legacy gets the normal update and no delete', () => {
  const old = [file(`src/themes/${VENUS.id}/old.json`, '{}'), file(`src/themes/${VENUS.id}/theme.json`, '{}')];
  const changes = moveChanges({ id: VENUS.id }, null, next, old, [file(PATHS.theme, json({ theme: 'venus' }))], PATHS);
  assert.deepEqual(find(changes, `src/themes/${VENUS.id}/old.json`), {
    path: `src/themes/${VENUS.id}/old.json`,
    content: null,
    oid: 'oid-src/themes/theme_fa395ad84690acbd/old.json',
  });
  assert.equal(find(changes, PATHS.theme), undefined);
  assert.equal(changes.filter((c) => c.content === null).length, 1);
});

test('a move with a release that adds a cookie changes each cookie-list file once', () => {
  const old = file('src/data/cookie-list/a.json', json({ name: 'a', app: 'mobilepay' }), 'oid-a');
  const site = [old];
  const moved = moveChanges(MOBILEPAY, 'mobilepay', { files: [], record: next.record }, [], site, PATHS);
  // What the editor's cookieChanges does for the new release on the site after the move: the new cookie is a new file.
  const after = appliedTo(site, moved);
  assert.equal(JSON.parse(after[0].text).app, MOBILEPAY.id);
  const cookies = [
    { path: 'src/data/cookie-list/b.json', content: json({ name: 'b', app: MOBILEPAY.id }), oid: null },
    { path: 'src/data/cookie-list/a.json', content: null, oid: after[0].oid },
  ];
  const all = mergeChanges(moved, cookies);
  assert.equal(new Set(all.map((c) => c.path)).size, all.length);
  assert.deepEqual(find(all, 'src/data/cookie-list/a.json'), { path: 'src/data/cookie-list/a.json', content: null, oid: 'oid-a' });
  assert.equal(JSON.parse(find(all, 'src/data/cookie-list/b.json').content).app, MOBILEPAY.id);
  // A cookie that stays: only the rewrite, once, under the new id.
  const kept = mergeChanges(moved, []);
  assert.equal(kept.filter((c) => c.path === old.path).length, 1);
  assert.equal(JSON.parse(find(kept, old.path).content).app, MOBILEPAY.id);
});
