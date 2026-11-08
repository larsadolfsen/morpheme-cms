// Tests for lib/releasePost.mjs: reads a release from a tar (the site's language, else English; the edition) and builds its
// blog post: front matter as the editor writes it, cards with their screenshots, the lines, the edition's photo.
// Run: node --test lib/releasePost.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postPath, releaseFromTar, releasePost } from './releasePost.mjs';
import { splitFrontmatter, writeFields } from '../src/frontmatter.mjs';

const card = (id, overrides = {}) => ({ id, kind: 'card', title: `Title ${id}`, text: `Text ${id}.`, ...overrides });
const line = (id, overrides = {}) => ({ id, kind: 'line', text: `Text ${id}`, ...overrides });

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
const EDITION = {
  name: 'Braies',
  place: { 'en-US': 'Lago di Braies, South Tyrol, Italy', 'da-DK': 'Lago di Braies, Sydtyrol, Italien' },
  photo: { by: 'Pietro De Grandi', source: 'https://images.unsplash.com/photo-1', license: 'https://unsplash.com/license' },
};
const editionFiles = (line = '0.14', edition = EDITION) => [
  tarEntry(`package/release-notes/editions/${line}.json`, JSON.stringify(edition)),
  tarEntry(`package/release-notes/editions/${line}.webp`, [9, 9]),
];

const TEXTS = {
  title: 'New in Morpheme Braies 0.14.2',
  also: 'Also in this version',
  photo: (place, by, unsplash) => `Photo of ${place} by ${by} on ${unsplash}`,
};
const FOLDERS = { blog: 'src/content/blog', media: 'public/images/uploads' };

test('releaseFromTar reads the notes, screenshots and edition in the site’s language', () => {
  const da = card('a', { title: 'Titel' });
  const tar = tarball(
    notesFile('en-US', '0.14.2', [card('a'), line('b')]),
    notesFile('da-DK', '0.14.2', [da, line('b', { text: 'Tekst b' })]),
    imageFile('en-US', '0.14.2', 'a', [1, 2]),
    imageFile('da-DK', '0.14.2', 'a', [3, 4]),
    ...editionFiles(),
  );
  const release = releaseFromTar(tar, '0.14.2', 'da-DK');
  assert.deepEqual(release.notes, [da, line('b', { text: 'Tekst b' })]);
  assert.deepEqual([...release.images.a], [3, 4]);
  assert.equal(release.edition.place, 'Lago di Braies, Sydtyrol, Italien');
  assert.equal(release.edition.name, 'Braies');
  assert.equal(release.edition.line, '0.14');
  assert.deepEqual([...release.edition.bytes], [9, 9]);
});

test('releaseFromTar falls back to English notes and screenshots for another language', () => {
  const tar = tarball(notesFile('en-US', '0.14.2', [card('a')]), imageFile('en-US', '0.14.2', 'a', [1]), ...editionFiles());
  const release = releaseFromTar(tar, '0.14.2', 'fr-FR');
  assert.deepEqual(release.notes, [card('a')]);
  assert.deepEqual([...release.images.a], [1]);
  assert.equal(release.edition.place, 'Lago di Braies, South Tyrol, Italy');
});

test('releaseFromTar has nothing for a version without notes, or a test version', () => {
  assert.equal(releaseFromTar(tarball(...editionFiles()), '0.14.2', 'en-US'), undefined);
  assert.equal(releaseFromTar(tarball(notesFile('en-US', '0.14.2', [])), '0.14.2', 'en-US'), undefined);
  const test = '0.14.3-next-20261107145215';
  assert.equal(releaseFromTar(tarball(notesFile('en-US', test, [line('a')])), test, 'en-US'), undefined);
});

test('releaseFromTar leaves out an edition without a photo or a name', () => {
  const noPhoto = tarball(notesFile('en-US', '0.14.2', [line('a')]), editionFiles()[0]);
  assert.equal(releaseFromTar(noPhoto, '0.14.2', 'en-US').edition, undefined);
  const noName = tarball(notesFile('en-US', '0.14.2', [line('a')]), ...editionFiles('0.14', { ...EDITION, name: ' ' }));
  assert.equal(releaseFromTar(noName, '0.14.2', 'en-US').edition, undefined);
});

test('postPath names the post after the version', () => {
  assert.equal(postPath('0.14.2', 'src/content/blog'), 'src/content/blog/morpheme-0-14-2.md');
});

test('releasePost writes the cards, their screenshots, the lines and the edition’s photo', () => {
  const tar = tarball(
    notesFile('en-US', '0.14.2', [card('a', { title: 'Pick up where you left off' }), line('b'), line('c')]),
    imageFile('en-US', '0.14.2', 'a', [1, 2]),
    ...editionFiles(),
  );
  const release = releaseFromTar(tar, '0.14.2', 'en-US');
  const { path, files } = releasePost({
    version: '0.14.2',
    date: '2026-11-07',
    release,
    texts: TEXTS,
    folders: FOLDERS,
    categories: ['releases'],
  });
  assert.equal(path, 'src/content/blog/morpheme-0-14-2.md');
  assert.deepEqual(
    files.map((f) => f.path),
    [
      'src/content/blog/morpheme-0-14-2.md',
      'public/images/uploads/2026/11/morpheme-0-14-2-a.webp',
      'public/images/uploads/2026/11/morpheme-0-14-braies.webp',
    ],
  );
  assert.deepEqual([...files[1].bytes], [1, 2]);
  assert.deepEqual([...files[2].bytes], [9, 9]);
  assert.equal(
    files[0].text,
    [
      '---',
      'title: "New in Morpheme Braies 0.14.2"',
      'date: 2026-11-07',
      'description: "Pick up where you left off."',
      'categories: ["releases"]',
      'image: "/images/uploads/2026/11/morpheme-0-14-braies.webp"',
      'imageAlt: "Lago di Braies, South Tyrol, Italy"',
      '---',
      '',
      '## Pick up where you left off',
      '',
      'Text a.',
      '',
      '![Pick up where you left off](/images/uploads/2026/11/morpheme-0-14-2-a.webp)',
      '',
      '## Also in this version',
      '',
      '- Text b\n- Text c',
      '',
      'Photo of Lago di Braies, South Tyrol, Italy by Pietro De Grandi on [Unsplash](https://images.unsplash.com/photo-1)',
      '',
    ].join('\n'),
  );
});

test('releasePost writes front matter as the editor does, so a save leaves it as it is', () => {
  const tar = tarball(
    notesFile('en-US', '0.14.2', [card('a', { title: 'What’s new, "right" here' }), card('b', { title: 'Done?' })]),
    ...editionFiles(),
  );
  const release = releaseFromTar(tar, '0.14.2', 'en-US');
  const { files } = releasePost({
    version: '0.14.2',
    date: '2026-11-07',
    release,
    texts: TEXTS,
    folders: FOLDERS,
    categories: ['releases', 'apps'],
  });
  const { yaml } = splitFrontmatter(files[0].text);
  const editor = writeFields('', {
    title: TEXTS.title,
    date: '2026-11-07',
    description: 'What’s new, "right" here. Done?',
    categories: ['releases', 'apps'],
    image: '/images/uploads/2026/11/morpheme-0-14-braies.webp',
    imageAlt: 'Lago di Braies, South Tyrol, Italy',
  });
  assert.equal(yaml, editor);
});

test('releasePost without cards, edition or categories: the first line is the description, no picture', () => {
  const release = releaseFromTar(tarball(notesFile('en-US', '0.14.1', [line('a'), line('b')])), '0.14.1', 'en-US');
  const { files } = releasePost({ version: '0.14.1', date: '2026-11-07', release, texts: TEXTS, folders: FOLDERS });
  assert.equal(files.length, 1);
  assert.equal(
    files[0].text,
    [
      '---',
      'title: "New in Morpheme Braies 0.14.2"',
      'date: 2026-11-07',
      'description: "Text a."',
      '---',
      '',
      '## Also in this version',
      '',
      '- Text a\n- Text b',
      '',
    ].join('\n'),
  );
});

test('releasePost leaves out the screenshot a card has none of', () => {
  const release = releaseFromTar(tarball(notesFile('en-US', '0.14.2', [card('a')])), '0.14.2', 'en-US');
  const { files } = releasePost({ version: '0.14.2', date: '2026-11-07', release, texts: TEXTS, folders: FOLDERS });
  assert.equal(files.length, 1);
  assert.ok(!files[0].text.includes('!['));
});
