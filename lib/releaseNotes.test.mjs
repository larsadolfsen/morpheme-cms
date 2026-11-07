// Tests for lib/releaseNotes.mjs: checks pending cards and lines, groups them per version, picks a locale's notes, builds
// the running version's notes from the package files and reads notes and screenshots from a tar.
// Run: node --test lib/releaseNotes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_HEIGHT,
  webpSize,
  problemsOf,
  released,
  imagePath,
  notesFor,
  notesSince,
  bundledNotes,
  staleImageDirs,
  notesFromTar,
  imageUrl,
  imageKey,
  parseImagePath,
  withImageUrls,
  editionOf,
  testVersionDate,
  changelogSections,
  minorOf,
  versionLines,
} from './releaseNotes.mjs';

const card = (id, overrides = {}) => ({ id, kind: 'card', title: `Title ${id}`, text: `Text ${id}`, ...overrides });
const line = (id, overrides = {}) => ({ id, kind: 'line', text: `Text ${id}`, ...overrides });
/** A pending entry: a card has a 1000-byte screenshot of 750×800 px by default, a line none. */
const entry = (
  note,
  imageBytes = note.kind === 'card' ? 1000 : null,
  imageSize = imageBytes === null ? null : { width: 750, height: 800 },
) => ({
  note,
  imageBytes,
  imageSize,
});

/** The first 40 bytes of a WebP: RIFF header, the chunk's name and its start. */
const webp = (chunk, body) => {
  const bytes = new Uint8Array(40);
  bytes.set(Buffer.from('RIFF'), 0);
  bytes.set(Buffer.from('WEBP'), 8);
  bytes.set(Buffer.from(chunk), 12);
  bytes.set(body.bytes, body.at);
  return bytes;
};

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
test('problemsOf names a screenshot that is not 750 px wide or is higher than 800 px, with the file and the size', () => {
  const twin = { 'da-DK': { a: entry(card('a')) } };
  const wide = problemsOf({ 'en-US': { a: entry(card('a'), 1000, { width: 751, height: 800 }) }, ...twin });
  assert.equal(wide.length, 1);
  assert.match(wide[0], /en-US\/pending\/a\.webp/);
  assert.match(wide[0], /751×800/);
  const high = problemsOf({ 'en-US': { a: entry(card('a'), 1000, { width: 750, height: MAX_IMAGE_HEIGHT + 1 }) }, ...twin });
  assert.match(high[0], /750×801/);
  assert.deepEqual(problemsOf({ 'en-US': { a: entry(card('a'), 1000, { width: 750, height: 120 }) }, ...twin }), []);
});
test('problemsOf names a screenshot that is not a WebP', () => {
  const problems = problemsOf({ 'en-US': { a: entry(card('a'), 1000, null) }, 'da-DK': { a: entry(card('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /not a WebP/);
});
test('webpSize reads a lossy VP8 header', () => {
  // frame tag (3 bytes), start code 9d 01 2a, then width 750 and height 800 (14 bits each, little endian)
  const header = webp('VP8 ', { at: 20, bytes: [0, 0, 0, 0x9d, 0x01, 0x2a, 750 & 255, 750 >> 8, 800 & 255, 800 >> 8] });
  assert.deepEqual(webpSize(header), { width: 750, height: 800 });
});
test('webpSize reads a lossless VP8L header', () => {
  // signature 2f, then 14 bits of width-1 and 14 bits of height-1
  const w = 750 - 1;
  const h = 700 - 1;
  const header = webp('VP8L', { at: 20, bytes: [0x2f, w & 255, ((w >> 8) & 0x3f) | ((h & 3) << 6), (h >> 2) & 255, (h >> 10) & 15] });
  assert.deepEqual(webpSize(header), { width: 750, height: 700 });
});
test('webpSize reads an extended VP8X header', () => {
  const w = 750 - 1;
  const h = 640 - 1;
  const header = webp('VP8X', { at: 24, bytes: [w & 255, (w >> 8) & 255, w >> 16, h & 255, (h >> 8) & 255, h >> 16] });
  assert.deepEqual(webpSize(header), { width: 750, height: 640 });
});
test('webpSize gives null for anything that is not a WebP of these kinds', () => {
  assert.equal(webpSize(new Uint8Array(0)), null);
  assert.equal(webpSize(new Uint8Array(40)), null);
  assert.equal(webpSize(Buffer.from('PNG-not-a-webp'.padEnd(40, 'x'))), null);
  assert.equal(webpSize(webp('VP8 ', { at: 20, bytes: [0, 0, 0, 1, 2, 3, 1, 0, 1, 0] })), null);
  assert.equal(webpSize(webp('ABCD', { at: 24, bytes: [1, 2, 3] })), null);
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

const shipped = (version, notes) => ({ version, text: '', notes: { 'en-US': notes } });
const ids = (notes) => notes.map((note) => note.id);

test('notesSince gives the notes of the newer versions, newest first, cards before lines', () => {
  const entries = [shipped('0.14.0', [card('a'), line('b')]), shipped('0.14.2', [line('c'), card('d')]), shipped('0.14.1', [line('e')])];
  assert.deepEqual(ids(notesSince(entries, '0.14.0', 'da-DK')), ['d', 'c', 'e']);
  assert.deepEqual(ids(notesSince(entries, '0.13.4', 'en-US')), ['d', 'a', 'c', 'e', 'b']);
  assert.deepEqual(notesSince(entries, '0.14.2', 'en-US'), []);
});
test('notesSince counts the version of a test version as new', () => {
  assert.deepEqual(ids(notesSince([shipped('0.14.1', [line('a')])], '0.14.1-next.2', 'en-US')), ['a']);
});
test('notesSince gives nothing without a version seen', () => {
  assert.deepEqual(notesSince([shipped('0.14.1', [line('a')])], undefined, 'en-US'), []);
  assert.deepEqual(notesSince([shipped('0.14.1', [line('a')])], 'latest', 'en-US'), []);
});

const file = (version, notes) => ({ version, notes });
const dir = '../release-notes/i18n';

const en = (v, notes) => ({ [`${dir}/en-US/${v}.json`]: file(v, notes) });

test('bundledNotes gives the notes of both locales', () => {
  const files = {
    [`${dir}/en-US/0.14.0.json`]: file('0.14.0', [line('a')]),
    [`${dir}/da-DK/0.14.0.json`]: file('0.14.0', [line('a', { text: 'Tekst' })]),
  };
  assert.deepEqual(bundledNotes(files, {}, '0.14.0'), [
    { version: '0.14.0', text: '', notes: { 'en-US': [line('a')], 'da-DK': [line('a', { text: 'Tekst' })] } },
  ]);
});
test('bundledNotes gives the one locale that has notes', () => {
  assert.deepEqual(bundledNotes(en('0.14.0', [line('a')]), {}, '0.14.0')[0].notes, { 'en-US': [line('a')] });
});
test('bundledNotes gives the whole minor line, newest first', () => {
  const files = { ...en('0.14.0', [line('a')]), ...en('0.14.1', [line('b')]), ...en('0.14.10', [line('c')]) };
  assert.deepEqual(
    bundledNotes(files, {}, '0.14.1').map((e) => e.version),
    ['0.14.1', '0.14.0'],
  );
  assert.deepEqual(
    bundledNotes(files, {}, '0.14.10').map((e) => e.version),
    ['0.14.10', '0.14.1', '0.14.0'],
  );
});
test('bundledNotes keeps the older minors and leaves out newer ones', () => {
  const files = { ...en('0.13.0', [line('a')]), ...en('0.13.5', [line('b')]), ...en('0.15.0', [line('c')]), ...en('0.14.0', [line('d')]) };
  assert.deepEqual(
    bundledNotes(files, {}, '0.14.0').map((e) => e.version),
    ['0.14.0', '0.13.5', '0.13.0'],
  );
});
test('bundledNotes ignores a newer version', () => {
  const files = { ...en('0.14.0', [line('a')]), ...en('0.14.2', [line('b')]) };
  assert.deepEqual(
    bundledNotes(files, {}, '0.14.1').map((e) => e.version),
    ['0.14.0'],
  );
});
test('bundledNotes takes a test version (npm tag next) without throwing: the line before its own version', () => {
  const files = { ...en('0.14.0', [line('a')]), ...en('0.14.1', [line('b')]), ...en('0.14.2', [line('c')]) };
  assert.deepEqual(
    bundledNotes(files, {}, '0.14.2-next.0').map((e) => e.version),
    ['0.14.1', '0.14.0'],
  );
  assert.deepEqual(
    bundledNotes(files, {}, '0.15.0-next.3').map((e) => e.version),
    ['0.14.2', '0.14.1', '0.14.0'],
  );
});
test('bundledNotes gives nothing for something that is not a version', () => {
  assert.deepEqual(bundledNotes(en('0.14.0', [line('a')]), {}, 'latest'), []);
});
test('bundledNotes gives an empty list without notes or a changelog', () => {
  assert.deepEqual(bundledNotes({}, {}, '0.14.0'), []);
});
test('bundledNotes sets the screenshot address of each version on its cards', () => {
  const files = { ...en('0.14.0', [card('a')]), ...en('0.14.1', [card('b')]) };
  const images = {
    [`${dir}/en-US/0.14.0/a.webp`]: '/assets/a-hash.webp',
    [`${dir}/en-US/0.14.1/b.webp`]: '/assets/b-hash.webp',
    [`${dir}/da-DK/0.14.0/a.webp`]: '/assets/other.webp',
  };
  const result = bundledNotes(files, images, '0.14.1');
  assert.deepEqual(result[0].notes['en-US'], [card('b', { image: '/assets/b-hash.webp' })]);
  assert.deepEqual(result[1].notes['en-US'], [card('a', { image: '/assets/a-hash.webp' })]);
});
test('bundledNotes leaves a card without a screenshot file as it is', () => {
  assert.deepEqual(bundledNotes(en('0.14.0', [card('a')]), {}, '0.14.0')[0].notes['en-US'], [card('a')]);
});
test('bundledNotes leaves a line as it is', () => {
  const images = { [`${dir}/en-US/0.14.0/a.webp`]: '/assets/a.webp' };
  assert.deepEqual(bundledNotes(en('0.14.0', [line('a')]), images, '0.14.0')[0].notes['en-US'], [line('a')]);
});

test('staleImageDirs keeps the folders of the same minor', () => {
  assert.deepEqual(staleImageDirs(['0.14.0', '0.14.1'], '0.14.1'), []);
});
test('staleImageDirs gives the older minors and another major', () => {
  assert.deepEqual(staleImageDirs(['0.13.0', '0.14.0', '0.14.1', '1.14.0'], '0.15.0'), ['0.13.0', '0.14.0', '0.14.1', '1.14.0']);
  assert.deepEqual(staleImageDirs(['0.13.2', '0.14.0', '1.14.0'], '0.14.1'), ['0.13.2', '1.14.0']);
});
test('staleImageDirs keeps pending', () => assert.deepEqual(staleImageDirs(['pending', '0.13.0'], '0.14.0'), ['0.13.0']));
test('staleImageDirs keeps a name that is not a version', () => assert.deepEqual(staleImageDirs(['notes', '0.13'], '0.14.0'), []));
test('staleImageDirs gives nothing for an empty list', () => assert.deepEqual(staleImageDirs([], '0.14.0'), []));

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

test("editionOf gives the edition of the version's minor line, with its photo", () => {
  const files = {
    '../release-notes/editions/0.13.json': { name: 'Lofoten' },
    '../release-notes/editions/0.14.json': {
      name: ' Braies ',
      place: { 'en-US': 'Lago di Braies, Italy' },
      photo: { by: 'A Photographer' },
    },
  };
  const images = {
    '../release-notes/editions/0.13.webp': '/a/lofoten.webp',
    '../release-notes/editions/0.14.webp': '/a/braies.webp',
  };
  assert.deepEqual(editionOf(files, images, '0.14.2'), {
    line: '0.14',
    name: 'Braies',
    place: { 'en-US': 'Lago di Braies, Italy' },
    by: 'A Photographer',
    image: '/a/braies.webp',
  });
  assert.equal(editionOf(files, images, '0.14.0').name, 'Braies');
  assert.equal(editionOf(files, images, '0.14.3-next-20261107145215').name, 'Braies');
  assert.equal(editionOf(files, images, '0.13.4').name, 'Lofoten');
  assert.deepEqual(editionOf(files, images, '0.13.4').place, {});
  assert.equal(editionOf(files, images, '0.13.4').by, null);
  assert.equal(editionOf(files, images, '0.15.0'), undefined);
  assert.equal(editionOf(files, images, '0.12.9'), undefined);
  assert.equal(editionOf(files, images, 'not a version'), undefined);
});

test('editionOf skips an edition without a name or a photo', () => {
  const files = { '../release-notes/editions/0.14.json': { name: 'Braies' }, '../release-notes/editions/0.15.json': { name: '' } };
  assert.equal(editionOf(files, {}, '0.14.2'), undefined);
  assert.equal(editionOf(files, { '../release-notes/editions/0.15.webp': '/x.webp' }, '0.15.0'), undefined);
});

test('released dates the version when given a day', () => {
  const pending = { 'en-US': { a: { note: line('a'), imageBytes: null, imageSize: null } } };
  assert.equal(released(pending, '0.14.3', '2026-11-08')['en-US'].file.date, '2026-11-08');
  assert.equal('date' in released(pending, '0.14.3')['en-US'].file, false);
});

test('testVersionDate reads the day from a snapshot id', () => {
  assert.equal(testVersionDate('0.14.3-next-20261107145215'), '2026-11-07');
  assert.equal(testVersionDate('0.14.3'), undefined);
  assert.equal(testVersionDate('0.14.3-next.0'), undefined);
});

test("bundledNotes gives each released version its file's date", () => {
  const files = { '../release-notes/i18n/en-US/0.14.0.json': { version: '0.14.0', date: '2026-11-07', notes: [line('a')] } };
  assert.equal(bundledNotes(files, {}, '0.14.0')[0].date, '2026-11-07');
});

test("bundledNotes puts a test version's merged notes first, under its version and the day it was made", () => {
  const files = { '../release-notes/i18n/en-US/0.14.2.json': { version: '0.14.2', notes: [line('a')] } };
  const pending = {
    '../release-notes/i18n/en-US/pending/z.json': line('z'),
    '../release-notes/i18n/en-US/pending/c.json': card('c'),
    '../release-notes/i18n/da-DK/pending/c.json': card('c', { title: 'Kort' }),
  };
  const images = { '../release-notes/i18n/en-US/pending/c.webp': '/c.webp' };
  const [first, second] = bundledNotes(files, images, '0.14.3-next-20261107145215', pending);
  assert.equal(first.version, '0.14.3-next-20261107145215');
  assert.equal(first.date, '2026-11-07');
  assert.deepEqual(
    first.notes['en-US'].map((n) => n.id),
    ['c', 'z'],
  );
  assert.equal(first.notes['en-US'][0].image, '/c.webp');
  assert.equal(first.notes['da-DK'][0].title, 'Kort');
  assert.equal(second.version, '0.14.2');
});

test('bundledNotes leaves out pending notes on a released version', () => {
  const pending = { '../release-notes/i18n/en-US/pending/z.json': line('z') };
  assert.deepEqual(bundledNotes({}, {}, '0.14.3', pending), []);
});

test("notesSince counts a test version's merged notes as new", () => {
  const entries = [
    { version: '0.14.3-next-20261107145215', notes: { 'en-US': [line('z')] } },
    { version: '0.14.2', notes: { 'en-US': [line('a')] } },
  ];
  assert.deepEqual(
    notesSince(entries, '0.14.2', 'en-US').map((n) => n.id),
    ['z'],
  );
  assert.deepEqual(
    notesSince(entries, '0.14.1', 'en-US').map((n) => n.id),
    ['z', 'a'],
  );
});

const CHANGELOG = `# @morphemecms/cms

## 0.14.0

### Minor Changes

- a70c310: Apps can be turned off.

## 0.13.0

### Minor Changes

- 1193da4: The standard parts are in English.

### Patch Changes

- ccefd29: The licence checks know \`@app/self\`: an app that imports it no longer needs it in \`thirdParty\`, and
  the site's licence list counts it as the site's own.
- 34f69c5: Open website opens in a new window.

## 0.12.0

## 0.11.0

- Plain line without a commit.
`;

test('changelogSections gives each version its changes as lines, newest first', () => {
  const sections = changelogSections(CHANGELOG);
  assert.deepEqual(
    sections.map((s) => s.version),
    ['0.14.0', '0.13.0', '0.12.0', '0.11.0'],
  );
  assert.deepEqual(
    sections[1].lines.map((l) => l.text),
    [
      'The standard parts are in English.',
      "The licence checks know @app/self: an app that imports it no longer needs it in thirdParty, and the site's licence list counts it as the site's own.",
      'Open website opens in a new window.',
    ],
  );
  assert.equal(sections[1].lines[0].id, '0.13.0-1193da4');
  assert.equal(sections[1].lines[0].kind, 'line');
  assert.deepEqual(sections[2].lines, []);
  assert.equal(sections[3].lines[0].text, 'Plain line without a commit.');
});

test('bundledNotes adds the changelog versions that have no notes file, in English', () => {
  const files = en('0.14.0', [line('a')]);
  const entries = bundledNotes(files, {}, '0.14.0', {}, CHANGELOG);
  assert.deepEqual(
    entries.map((e) => e.version),
    ['0.14.0', '0.13.0', '0.11.0'],
  );
  assert.deepEqual(entries[0].notes, { 'en-US': [line('a')] });
  assert.equal(entries[1].notes['en-US'].length, 3);
  assert.equal(entries[1].notes['da-DK'], undefined);
});

test('minorOf gives the minor line', () => {
  assert.equal(minorOf('0.14.3-next-20261107145215'), '0.14');
  assert.equal(minorOf('0.9.1'), '0.9');
});

test('versionLines groups the entries by minor line, newest line first', () => {
  const lines = versionLines([
    { version: '0.14.3-next-1' },
    { version: '0.14.2' },
    { version: '0.10.0' },
    { version: '0.9.1' },
    { version: '0.9.0' },
  ]);
  assert.deepEqual(
    lines.map((l) => [l.line, l.entries.map((e) => e.version)]),
    [
      ['0.14', ['0.14.3-next-1', '0.14.2']],
      ['0.10', ['0.10.0']],
      ['0.9', ['0.9.1', '0.9.0']],
    ],
  );
});
