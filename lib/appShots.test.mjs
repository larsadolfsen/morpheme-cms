// Tests for lib/appShots.mjs: the screenshot keywords of an app, old and new, and the picture files.
// Run: node --test lib/appShots.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalShot, shotFile, shotFiles, shotOf } from './appShots.mjs';

const app = {
  kinds: { orders: { variants: [{}, {}] }, plain: {} },
  lists: [{ id: 'bookings' }],
  settings: {},
  page: {},
};
const blocks = ['booking'];
// [old keyword, new keyword, shown by the app, old file, new file]
const pairs = [
  ['blok:booking', 'block:booking', true, '1-blok-booking.jpg', '1-block-booking.jpg'],
  ['slags:orders:1', 'kind:orders:1', true, '1-slags-orders-1.jpg', '1-kind-orders-1.jpg'],
  ['slags:plain:0', 'kind:plain:0', true, '1-slags-plain-0.jpg', '1-kind-plain-0.jpg'],
  ['liste:bookings', 'list:bookings', true, '1-liste-bookings.jpg', '1-list-bookings.jpg'],
  ['indstillinger', 'settings', true, '1-indstillinger.jpg', '1-settings.jpg'],
  ['side', 'page', true, '1-side.jpg', '1-page.jpg'],
];

for (const [old, now, shown, oldFile, newFile] of pairs) {
  test(`${old} and ${now} give the same shot`, () => {
    assert.equal(shotOf(old, app, blocks), shown);
    assert.equal(shotOf(now, app, blocks), shown);
    assert.equal(canonicalShot(old), now);
    assert.equal(canonicalShot(now), now);
  });
  test(`the file of ${now} is ${newFile}; the old name is still found`, () => {
    assert.equal(shotFile(0, now), newFile);
    assert.equal(shotFile(0, old), newFile);
    assert.deepEqual(shotFiles(0, now), [newFile, oldFile]);
    assert.deepEqual(shotFiles(0, old), [newFile, oldFile]);
  });
}

test('a keyword the app does not have is refused, old or new', () => {
  for (const shows of [
    'block:missing',
    'blok:missing',
    'kind:orders:2',
    'slags:orders:2',
    'kind:plain:1',
    'kind:orders:x',
    'kind:nope:0',
    'list:missing',
    'liste:missing',
    'settings:x',
    'page:x',
    'nonsense',
    '',
    'blocks:booking',
  ])
    assert.equal(shotOf(shows, app, blocks), false, shows);
  assert.equal(shotOf('settings', {}, blocks), false);
  assert.equal(shotOf('page', {}, blocks), false);
});

test('the file numbers pictures from 1', () => {
  assert.equal(shotFile(2, 'block:booking'), '3-block-booking.jpg');
});

test('the docs and the messages list the new words', async () => {
  const { readFile } = await import('node:fs/promises');
  const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
  const contract = await read('../docs/app-contract.md');
  for (const word of ['`block:<type>`', '`kind:<list>:<n>`', '`list:<id>`', '`settings`', '`page`', '<n>-block-<type>.jpg', 'one release'])
    assert.ok(contract.includes(word), `docs/app-contract.md names ${word}`);
  for (const path of ['../src/i18n/en-US/apps.ts', '../src/i18n/da-DK/apps.ts']) {
    const line = (await read(path)).split('\n').find((l) => l.includes('block:<type>'));
    assert.ok(line, `${path} names the keywords`);
    for (const word of ['kind:', 'list:<id>', 'settings', 'page']) assert.ok(line.includes(word), `${path}: ${word}`);
    for (const old of ['blok:', 'slags:', 'liste:<id>', 'indstillinger']) assert.ok(!line.includes(old), `${path}: not ${old}`);
  }
});
