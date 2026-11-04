// Tests for lib/changelog.mjs: a version's release notes read from its npm tarball.
// Run: node --test packages/editor/lib/changelog.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { gunzip, fileFromTar, sectionsBetween } from './changelog.mjs';

/** One tar entry: a 512-byte header, then the data padded to a multiple of 512. */
function tarEntry(name, text, prefix = '') {
  const data = Buffer.from(text);
  const header = Buffer.alloc(512);
  header.write(name, 0, 'ascii');
  header.write('0000644\0', 100, 'ascii');
  header.write('0000000\0', 108, 'ascii');
  header.write('0000000\0', 116, 'ascii');
  header.write(data.length.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
  header.write('00000000000\0', 136, 'ascii');
  header.write('0', 156, 'ascii');
  header.write('ustar\0', 257, 'ascii');
  header.write('00', 263, 'ascii');
  header.write(prefix, 345, 'ascii');
  header.fill(' ', 148, 156);
  const sum = header.reduce((total, byte) => total + byte, 0);
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');
  return Buffer.concat([header, data, Buffer.alloc(Math.ceil(data.length / 512) * 512 - data.length)]);
}

const tarball = (...entries) => new Uint8Array(Buffer.concat([...entries, Buffer.alloc(1024)]));

const changelogText = '# x\n\n## 0.1.1\n';
const tar = tarball(tarEntry('package/package.json', '{"name":"x"}'), tarEntry('package/CHANGELOG.md', changelogText));

test('fileFromTar finds a file by its name', () => assert.equal(fileFromTar(tar, 'package/CHANGELOG.md'), changelogText));
test('fileFromTar returns null for a missing file', () => assert.equal(fileFromTar(tar, 'package/missing.md'), null));
test('fileFromTar joins the prefix of a long name', () => {
  const prefix = 'package/' + 'a'.repeat(120);
  const long = tarball(tarEntry('CHANGELOG.md', 'long one', prefix));
  assert.equal(fileFromTar(long, prefix + '/CHANGELOG.md'), 'long one');
});

test('gunzip gives the input back', async () => {
  const bytes = await gunzip(new Uint8Array(gzipSync(Buffer.from('hello tar'))));
  assert.equal(new TextDecoder().decode(bytes), 'hello tar');
});

/** A changelog with one `### Patch Changes` line and one bullet under each version. */
const changelogOf = (...versions) =>
  ['# @morphemecms/cms', '', ...versions.flatMap((v) => [`## ${v}`, '', '### Patch Changes', '', `- Change ${v}`, ''])].join('\n');

const full = changelogOf('0.3.0', '0.2.1', '0.2.0', '0.1.1');
const versionsOf = (sections) => sections.map((section) => section.version);

test('sectionsBetween returns the versions after from up to to, newest first', () => {
  const sections = sectionsBetween(full, '0.1.1', '0.3.0');
  assert.deepEqual(versionsOf(sections), ['0.3.0', '0.2.1', '0.2.0']);
  assert.equal(sections[0].text, '### Patch Changes\n\n- Change 0.3.0');
});
test('sectionsBetween is empty when from equals to', () => assert.deepEqual(sectionsBetween(full, '0.2.1', '0.2.1'), []));
test('sectionsBetween includes to but not from', () => assert.deepEqual(versionsOf(sectionsBetween(full, '0.1.0', '0.1.1')), ['0.1.1']));
test('sectionsBetween drops a section with only blank lines', () => {
  const text = '# x\n\n## 0.2.0\n\n\n';
  assert.deepEqual(sectionsBetween(text, '0.1.0', '0.2.0'), []);
});
test('sectionsBetween ignores pre-release headings', () => {
  const text = `## 0.2.0-next-1\n\n- Next\n\n${changelogOf('0.1.1')}`;
  assert.deepEqual(versionsOf(sectionsBetween(text, '0.1.0', '0.2.0')), ['0.1.1']);
});
