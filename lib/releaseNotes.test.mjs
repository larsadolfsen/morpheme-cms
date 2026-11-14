// Tests for lib/releaseNotes.mjs: checks pending paragraphs and lines, groups them per version, picks a locale's notes, builds
// the running version's notes from the package files and reads notes and screenshots from a tar.
// Run: node --test lib/releaseNotes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  problemsOf,
  markCounts,
  markProblems,
  released,
  sortedNotes,
  compareText,
  orderProblems,
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

const paragraph = (id, overrides = {}) => ({
  id,
  kind: 'paragraph',
  mark: 'feature',
  title: `Title ${id}`,
  text: `Text ${id}`,
  ...overrides,
});
const line = (id, overrides = {}) => ({ id, kind: 'line', mark: 'improvement', text: `Text ${id}`, ...overrides });
/** A pending entry: no screenshot by default. */
const entry = (note, imageBytes = null) => ({ note, imageBytes });

test('problemsOf is empty when every paragraph and line has its twin and its text', () => {
  const pending = {
    'en-US': { a: entry(paragraph('a')), b: entry(line('b')) },
    'da-DK': { a: entry(paragraph('a', { title: 'Title' })), b: entry(line('b')) },
  };
  assert.deepEqual(problemsOf(pending), []);
});
test('problemsOf names a note missing in a locale', () => {
  const problems = problemsOf({ 'en-US': { a: entry(paragraph('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\ba\b/);
  assert.match(problems[0], /da-DK/);
});
test('problemsOf names a kind that differs between locales', () => {
  const problems = problemsOf({ 'en-US': { a: entry(paragraph('a')) }, 'da-DK': { a: entry(line('a', { mark: 'feature' })) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /kind/);
});
test('problemsOf names a note whose id differs from its file name', () => {
  const problems = problemsOf({ 'en-US': { a: entry(paragraph('b')) }, 'da-DK': { a: entry(paragraph('a')) } });
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
test('problemsOf names a paragraph without a title', () => {
  const problems = problemsOf({ 'en-US': { a: entry(paragraph('a', { title: ' ' })) }, 'da-DK': { a: entry(paragraph('a')) } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /title/);
});
test('problemsOf names a paragraph or a line without text', () => {
  const problems = problemsOf({ 'en-US': { a: entry(paragraph('a', { text: '' })) }, 'da-DK': { a: entry(paragraph('a')) } });
  assert.match(problems[0], /text/);
  const lineProblems = problemsOf({ 'en-US': { b: entry(line('b', { text: '' })) }, 'da-DK': { b: entry(line('b')) } });
  assert.match(lineProblems[0], /text/);
});
test('problemsOf accepts a paragraph without a screenshot', () => {
  assert.deepEqual(problemsOf({ 'en-US': { a: entry(paragraph('a')) }, 'da-DK': { a: entry(paragraph('a')) } }), []);
});
test('problemsOf names a leftover screenshot of a paragraph or a line, with its file', () => {
  const paragraph1 = problemsOf({ 'en-US': { a: entry(paragraph('a'), 1000) }, 'da-DK': { a: entry(paragraph('a')) } });
  assert.equal(paragraph1.length, 1);
  assert.match(paragraph1[0], /en-US\/pending\/a\.webp/);
  assert.match(paragraph1[0], /delete/);
  const line1 = problemsOf({ 'en-US': { b: entry(line('b'), 500) }, 'da-DK': { b: entry(line('b')) } });
  assert.equal(line1.length, 1);
  assert.match(line1[0], /b\.webp/);
});

test('released keeps each note as it is, in alphabetical order (paragraphs, then lines), with the ids of paragraphs that have a screenshot file', () => {
  const pending = { 'en-US': { b: entry(paragraph('b')), a: entry(line('a')), c: entry(paragraph('c'), 1000) } };
  assert.deepEqual(released(pending, '0.14.0'), {
    'en-US': { file: { version: '0.14.0', notes: [paragraph('b'), paragraph('c'), line('a')] }, images: ['c'] },
  });
});
test('released leaves out a locale without notes', () => assert.deepEqual(released({ 'da-DK': {} }, '0.14.0'), {}));
test('released gives nothing without notes', () => assert.deepEqual(released({}, '0.14.0'), {}));
test('imagePath gives the released screenshot path of a paragraph', () => {
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

test('notesSince gives the notes of the newer versions, newest first, paragraphs before lines', () => {
  const entries = [
    shipped('0.14.0', [paragraph('a'), line('b')]),
    shipped('0.14.2', [line('c'), paragraph('d')]),
    shipped('0.14.1', [line('e')]),
  ];
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
    [`${dir}/da-DK/0.14.0.json`]: file('0.14.0', [line('a', { text: 'Text' })]),
  };
  assert.deepEqual(bundledNotes(files, {}, '0.14.0'), [
    { version: '0.14.0', text: '', notes: { 'en-US': [line('a')], 'da-DK': [line('a', { text: 'Text' })] } },
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
test('bundledNotes sets the screenshot address of each version on its paragraphs', () => {
  const files = { ...en('0.14.0', [paragraph('a')]), ...en('0.14.1', [paragraph('b')]) };
  const images = {
    [`${dir}/en-US/0.14.0/a.webp`]: '/assets/a-hash.webp',
    [`${dir}/en-US/0.14.1/b.webp`]: '/assets/b-hash.webp',
    [`${dir}/da-DK/0.14.0/a.webp`]: '/assets/other.webp',
  };
  const result = bundledNotes(files, images, '0.14.1');
  assert.deepEqual(result[0].notes['en-US'], [paragraph('b', { image: '/assets/b-hash.webp' })]);
  assert.deepEqual(result[1].notes['en-US'], [paragraph('a', { image: '/assets/a-hash.webp' })]);
});
test('bundledNotes leaves a paragraph without a screenshot file as it is', () => {
  assert.deepEqual(bundledNotes(en('0.14.0', [paragraph('a')]), {}, '0.14.0')[0].notes['en-US'], [paragraph('a')]);
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
  const da = paragraph('a', { title: 'Title' });
  const tar = tarball(
    notesFile('en-US', '0.14.0', [paragraph('a')]),
    notesFile('da-DK', '0.14.0', [da]),
    imageFile('en-US', '0.14.0', 'a', [1, 2, 3]),
    imageFile('da-DK', '0.14.0', 'a', [4, 5]),
  );
  const result = notesFromTar(tar, '0.14.0');
  assert.deepEqual(result.notes, { 'en-US': [paragraph('a')], 'da-DK': [da] });
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
test('notesFromTar leaves out a paragraph whose screenshot is missing from the tar', () => {
  const tar = tarball(notesFile('en-US', '0.14.0', [paragraph('a')]));
  assert.deepEqual(notesFromTar(tar, '0.14.0'), { notes: { 'en-US': [paragraph('a')] }, images: [] });
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

test('withImageUrls sets the address on paragraphs only and leaves the input alone', () => {
  const notes = {
    'en-US': [
      { id: 'a', kind: 'paragraph', mark: 'feature', title: 'T', text: 'x' },
      { id: 'b', kind: 'line', mark: 'improvement', text: 'y' },
    ],
  };
  const out = withImageUrls('0.14.0', notes);
  assert.equal(out['en-US'][0].image, '/api/cms/note-image/0.14.0/en-US/a');
  assert.deepEqual(out['en-US'][1], { id: 'b', kind: 'line', mark: 'improvement', text: 'y' });
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

test('editionOf skips an edition without a photo, and takes one without a name or a photographer', () => {
  const files = { '../release-notes/editions/0.14.json': { name: 'Braies' }, '../release-notes/editions/0.7.json': {} };
  assert.equal(editionOf(files, {}, '0.14.2'), undefined);
  assert.deepEqual(editionOf(files, { '../release-notes/editions/0.7.webp': '/x.webp' }, '0.7.1'), {
    line: '0.7',
    name: '',
    place: {},
    by: null,
    image: '/x.webp',
  });
});

test('released dates the version when given a day', () => {
  const pending = { 'en-US': { a: { note: line('a'), imageBytes: null } } };
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
    '../release-notes/i18n/en-US/pending/c.json': paragraph('c'),
    '../release-notes/i18n/da-DK/pending/c.json': paragraph('c', { title: 'Paragraph' }),
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
  assert.equal(first.notes['da-DK'][0].title, 'Paragraph');
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

test('compareText is case-insensitive and sorts the Danish ae, o-slash, a-ring after z, in that order', () => {
  const words = ['\u00c5ben', 'zebra', '\u00d8rn', '\u00e6ble', 'Apple', 'banan'];
  assert.deepEqual(words.sort(compareText), ['Apple', 'banan', 'zebra', '\u00e6ble', '\u00d8rn', '\u00c5ben']);
});
test('sortedNotes puts paragraphs by title before lines by text, each alphabetical', () => {
  const notes = [
    line('1', { text: 'zoom' }),
    paragraph('2', { title: 'beta' }),
    line('3', { text: 'Apple' }),
    paragraph('4', { title: 'Alpha' }),
  ];
  assert.deepEqual(
    sortedNotes(notes).map((n) => n.id),
    ['4', '2', '3', '1'],
  );
});
test('released orders each locale by its own alphabet, not by id', () => {
  const pending = {
    'en-US': { a: entry(paragraph('a', { title: 'Zebra' })), b: entry(paragraph('b', { title: 'Apple' })) },
    'da-DK': { a: entry(paragraph('a', { title: '\u00c6ble' })), b: entry(paragraph('b', { title: 'Zebra' })) },
  };
  const result = released(pending, '0.17.0');
  assert.deepEqual(
    result['en-US'].file.notes.map((n) => n.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    result['da-DK'].file.notes.map((n) => n.id),
    ['b', 'a'],
  );
});
test('orderProblems reports notes out of order and accepts sorted ones', () => {
  assert.deepEqual(orderProblems('f.json', [paragraph('a', { title: 'A' }), line('b', { text: 'x' })]), []);
  assert.equal(orderProblems('f.json', [line('b', { text: 'x' }), paragraph('a', { title: 'A' })]).length, 1);
});
test('bundledNotes orders the merged notes of a test version alphabetically', () => {
  const pending = {
    '../release-notes/i18n/en-US/pending/a.json': paragraph('a', { title: 'Zebra' }),
    '../release-notes/i18n/en-US/pending/b.json': paragraph('b', { title: 'Apple' }),
  };
  const [first] = bundledNotes({}, {}, '0.14.3-next-20261107145215', pending);
  assert.deepEqual(
    first.notes['en-US'].map((n) => n.id),
    ['b', 'a'],
  );
});

test('problemsOf names a note without a valid mark and a mark that differs between locales', () => {
  const pending = {
    'en-US': { a: entry(line('a', { mark: undefined })), b: entry(line('b', { mark: 'bug' })), c: entry(line('c')) },
    'da-DK': { a: entry(line('a', { mark: undefined })), b: entry(line('b', { mark: 'bug' })), c: entry(line('c', { mark: 'feature' })) },
  };
  const problems = problemsOf(pending);
  assert.ok(problems.some((p) => p.includes('en-US/pending/a.json') && p.includes('add "mark"')));
  assert.ok(problems.some((p) => p.includes('da-DK/pending/b.json') && p.includes('add "mark"')));
  assert.ok(problems.includes('c: mark differs between locales'));
});

test('markProblems names a released note without a valid mark and a mark that differs between locales', () => {
  assert.deepEqual(markProblems({ '0.1.0': { 'en-US': [line('a')], 'da-DK': [line('a')] } }), []);
  const problems = markProblems({
    '0.1.0': {
      'en-US': [line('a', { mark: undefined }), line('b')],
      'da-DK': [line('a', { mark: undefined }), line('b', { mark: 'feature' })],
    },
  });
  assert.equal(problems.filter((p) => p.includes('has no valid mark')).length, 2);
  assert.ok(problems.some((p) => p.includes('"b" has a different mark')));
});

test('markCounts counts features and improvements, and they add up to the notes', () => {
  const notes = [
    paragraph('a'),
    paragraph('b'),
    line('c'),
    line('d'),
    line('e', { mark: 'feature' }),
    { id: 'f', kind: 'line', text: 'no mark' },
  ];
  assert.deepEqual(markCounts(notes), { features: 3, improvements: 3 });
  assert.deepEqual(markCounts([]), { features: 0, improvements: 0 });
});

test('the lines of the changelog count as improvements', () => {
  const [section] = changelogSections('## 0.1.0\n\n- abc1234: Fixed a thing\n');
  assert.equal(section.lines[0].mark, 'improvement');
});
