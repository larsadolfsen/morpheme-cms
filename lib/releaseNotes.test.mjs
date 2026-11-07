// Tests for lib/releaseNotes.mjs: checks pending cards and lines, groups them per version, picks a locale's notes, lists
// installed versions and reads notes and screenshots from a tar.
// Run: node --test lib/releaseNotes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_BYTES,
  problemsOf,
  released,
  imagePath,
  notesFor,
  installedVersions,
  notesFromTar,
  imageUrl,
  imageKey,
  parseImagePath,
  withImageUrls,
} from './releaseNotes.mjs';

const card = (id, overrides = {}) => ({ id, kind: 'card', title: `Title ${id}`, text: `Text ${id}`, ...overrides });
const line = (id, overrides = {}) => ({ id, kind: 'line', text: `Text ${id}`, ...overrides });
/** A pending entry: a card has a 1000-byte screenshot by default, a line none. */
const entry = (note, imageBytes = note.kind === 'card' ? 1000 : null) => ({ note, imageBytes });

test('problemsOf is empty when every card and line has its twin, text and screenshot', () => {
  const pending = {
    'en-US': { a: entry(card('a')), b: entry(line('b')) },
    'da-DK': { a: entry(card('a', { title: 'Titel' })), b: entry(line('b')) },
  };
  assert.deepEqual(problemsOf(pending), []);
});
test('problemsOf names a note missing in a locale', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\ba\b/);
  assert.match(problems[0], /da-DK/);
});
test('problemsOf names a kind that differs between locales', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a')) }, 'da-DK': { a: entry(line('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /kind/);
});
test('problemsOf names a note whose id differs from its file name', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('b')) }, 'da-DK': { a: entry(card('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\ba\b/);
  assert.match(problems[0], /en-US/);
});
test('problemsOf names a note without a kind, such as the old shape', () => {
  const old = { id: 'a', title: 'Title', why: 'Why', how: 'How', what: 'What' };
  const problems = problemsOf({ 'en-US': { a: entry(old, null) }, 'da-DK': { a: entry(old, null) } });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /kind/);
});
test('problemsOf names a card without a title', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a', { title: ' ' })) }, 'da-DK': { a: entry(card('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /title/);
});
test('problemsOf names a card or a line without text', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a', { text: '' })) }, 'da-DK': { a: entry(card('a')) } });
  assert.match(problems[0], /text/);
  const lineProblems = problemsOf({ 'en-US': { b: entry(line('b', { text: '' })) }, 'da-DK': { b: entry(line('b')) } });
  assert.match(lineProblems[0], /text/);
});
test('problemsOf names a card without a screenshot', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a'), null) }, 'da-DK': { a: entry(card('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /screenshot/);
});
test('problemsOf names a screenshot above 200 KB and accepts one of exactly 200 KB', () => {
  const big = problemsOf({ 'en-US': { a: entry(card('a'), MAX_IMAGE_BYTES + 1) }, 'da-DK': { a: entry(card('a')) } });
  assert.equal(big.length, 1);
  assert.match(big[0], /limit/);
  assert.deepEqual(problemsOf({ 'en-US': { a: entry(card('a'), MAX_IMAGE_BYTES) }, 'da-DK': { a: entry(card('a')) } }), []);
});
test('problemsOf names a line with a screenshot', () => {
  const problems = problemsOf({ 'en-US': { b: entry(line('b'), 500) }, 'da-DK': { b: entry(line('b')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no screenshot/);
});

test('released keeps each note as it is, sorted by id, with the ids of its cards', () => {
  const pending = { 'en-US': { b: entry(card('b')), a: entry(line('a')) } };
  assert.deepEqual(released(pending, '0.14.0'), {
    'en-US': { file: { version: '0.14.0', notes: [line('a'), card('b')] }, images: ['b'] },
  });
});
test('released leaves out a locale without notes', () => assert.deepEqual(released({ 'da-DK': {} }, '0.14.0'), {}));
test('released gives nothing without notes', () => assert.deepEqual(released({}, '0.14.0'), {}));
test('imagePath gives the released screenshot path of a card', () => {
  assert.equal(imagePath('0.14.0', 'da-DK', 'brave-cats-run'), 'release-notes/i18n/da-DK/0.14.0/brave-cats-run.webp');
});

test('notesFor gives the locale notes when there are some', () => {
  const x = line('x');
  const y = line('y');
  assert.deepEqual(notesFor({ 'en-US': [x], 'da-DK': [y] }, 'da-DK'), [y]);
});
test('notesFor falls back to the en-US notes', () => {
  const x = line('x');
  assert.deepEqual(notesFor({ 'en-US': [x] }, 'da-DK'), [x]);
});
test('notesFor gives undefined without notes', () => assert.equal(notesFor(undefined, 'da-DK'), undefined));

test('installedVersions gives the finished update range, newest first', () => {
  const update = { from: '0.13.0', to: '0.14.1', state: 'done' };
  assert.deepEqual(installedVersions(update, '0.14.1', ['0.14.0', '0.14.1', '0.15.0']), ['0.14.1', '0.14.0']);
});
test('installedVersions gives only the running version when the update went to another version', () => {
  assert.deepEqual(installedVersions({ to: '0.14.0', state: 'done' }, '0.14.1', ['0.14.1']), ['0.14.1']);
});
test('installedVersions gives only the running version, and only when it is kept', () => {
  assert.deepEqual(installedVersions(null, '0.14.1', ['0.14.0']), []);
});

/** One tar entry: a 512-byte header, then the data padded to a multiple of 512. */
function tarEntry(name, content) {
  const data = Buffer.from(content);
  const header = Buffer.alloc(512);
  header.write(name, 0, 'ascii');
  header.write('0000644\0', 100, 'ascii');
  header.write(data.length.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
  header.write('0', 156, 'ascii');
  return Buffer.concat([header, data, Buffer.alloc(Math.ceil(data.length / 512) * 512 - data.length)]);
}
const tarball = (...entries) => new Uint8Array(Buffer.concat([...entries, Buffer.alloc(1024)]));
const notesFile = (locale, version, notes) =>
  tarEntry(`package/release-notes/i18n/${locale}/${version}.json`, JSON.stringify({ version, notes }));
const imageFile = (locale, version, id, bytes) => tarEntry(`package/release-notes/i18n/${locale}/${version}/${id}.webp`, bytes);

test('notesFromTar reads the notes and screenshot bytes of each locale', () => {
  const da = card('a', { title: 'Titel' });
  const tar = tarball(
    notesFile('en-US', '0.14.0', [card('a')]),
    notesFile('da-DK', '0.14.0', [da]),
    imageFile('en-US', '0.14.0', 'a', [1, 2, 3]),
    imageFile('da-DK', '0.14.0', 'a', [4, 5]),
  );
  const result = notesFromTar(tar, '0.14.0');
  assert.deepEqual(result.notes, { 'en-US': [card('a')], 'da-DK': [da] });
  assert.deepEqual(
    result.images.map(({ locale, id, bytes }) => ({ locale, id, bytes: [...bytes] })),
    [
      { locale: 'en-US', id: 'a', bytes: [1, 2, 3] },
      { locale: 'da-DK', id: 'a', bytes: [4, 5] },
    ],
  );
});
test('notesFromTar leaves out a locale without a file, and a line has no screenshot', () => {
  const tar = tarball(notesFile('en-US', '0.14.0', [line('a')]));
  assert.deepEqual(notesFromTar(tar, '0.14.0'), { notes: { 'en-US': [line('a')] }, images: [] });
});
test('notesFromTar leaves out a card whose screenshot is missing from the tar', () => {
  const tar = tarball(notesFile('en-US', '0.14.0', [card('a')]));
  assert.deepEqual(notesFromTar(tar, '0.14.0'), { notes: { 'en-US': [card('a')] }, images: [] });
});
test('notesFromTar gives undefined without any notes file', () => {
  assert.equal(notesFromTar(tarball(tarEntry('package/x', 'y')), '0.14.0'), undefined);
});
test('notesFromTar skips a locale with bad JSON', () => {
  const tar = tarball(tarEntry('package/release-notes/i18n/en-US/0.14.0.json', '{bad'), notesFile('da-DK', '0.14.0', [line('a')]));
  assert.deepEqual(notesFromTar(tar, '0.14.0'), { notes: { 'da-DK': [line('a')] }, images: [] });
});

test('imageUrl and imageKey name a screenshot by version, locale and id', () => {
  assert.equal(imageUrl('0.14.0', 'da-DK', 'quiet-lamps'), '/api/cms/note-image/0.14.0/da-DK/quiet-lamps');
  assert.equal(imageKey('0.14.0', 'da-DK', 'quiet-lamps'), 'cms:note-image:0.14.0:da-DK:quiet-lamps');
});

test('parseImagePath reads a screenshot address', () => {
  assert.deepEqual(parseImagePath('/api/cms/note-image/0.14.0/en-US/quiet-lamps-2'), {
    version: '0.14.0',
    locale: 'en-US',
    id: 'quiet-lamps-2',
  });
});

test('parseImagePath rejects a bad version, locale, id or shape', () => {
  for (const path of [
    '/api/cms/note-image/0.14/en-US/a',
    '/api/cms/note-image/0.14.0-beta/en-US/a',
    '/api/cms/note-image/0.14.0/fr-FR/a',
    '/api/cms/note-image/0.14.0/en-US/A',
    '/api/cms/note-image/0.14.0/en-US/a:b',
    '/api/cms/note-image/0.14.0/en-US/a/b',
    '/api/cms/note-image/0.14.0/en-US/',
    '/api/cms/note-image/0.14.0/en-US/..%2Fx',
    '/api/cms',
  ])
    assert.equal(parseImagePath(path), null, path);
});

test('withImageUrls sets the address on cards only and leaves the input alone', () => {
  const notes = {
    'en-US': [
      { id: 'a', kind: 'card', title: 'T', text: 'x' },
      { id: 'b', kind: 'line', text: 'y' },
    ],
  };
  const out = withImageUrls('0.14.0', notes);
  assert.equal(out['en-US'][0].image, '/api/cms/note-image/0.14.0/en-US/a');
  assert.deepEqual(out['en-US'][1], { id: 'b', kind: 'line', text: 'y' });
  assert.equal(notes['en-US'][0].image, undefined);
});

test('withImageUrls gives undefined without notes', () => assert.equal(withImageUrls('0.14.0', undefined), undefined));
