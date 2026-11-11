/**
 * Tests for the pages and posts read from their files' front matter.
 * Exposes test cases for `entriesOf`.
 * Depends on `node:test`, `node:assert/strict`, and `./entries.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { entriesOf } from './entries.mjs';

const collections = [
  { id: 'pages', folder: 'src/content/pages' },
  { id: 'blog', folder: 'src/content/blog' },
];
const file = (path, yaml) => ({ path, text: `---\n${yaml}\n---\nBody\n` });

test('entriesOf reads title, status, publishAt and date of each markdown file in a collection folder', () => {
  const entries = entriesOf(
    [
      file('src/content/pages/about.md', 'title: "About"'),
      file('src/content/blog/hello.md', 'title: "Hello"\nstatus: scheduled\npublishAt: "2026-12-01T08:00"\ndate: 2026-11-01'),
    ],
    collections,
  );
  assert.deepEqual(entries, [
    { path: 'src/content/pages/about.md', collection: 'pages', title: 'About', status: 'published', publishAt: undefined, date: undefined },
    {
      path: 'src/content/blog/hello.md',
      collection: 'blog',
      title: 'Hello',
      status: 'scheduled',
      publishAt: '2026-12-01T08:00',
      date: '2026-11-01',
    },
  ]);
});

test('entriesOf uses the path as the title when there is none, gives draft as it is and reads a stored unlisted as published', () => {
  const entries = entriesOf(
    [
      file('src/content/pages/a.md', 'status: draft'),
      file('src/content/pages/b.md', 'status: unlisted'),
      file('src/content/pages/c.md', 'status: other'),
    ],
    collections,
  );
  assert.deepEqual(
    entries.map((e) => [e.title, e.status]),
    [
      ['src/content/pages/a.md', 'draft'],
      ['src/content/pages/b.md', 'published'],
      ['src/content/pages/c.md', 'published'],
    ],
  );
});

test('entriesOf skips files outside the folders and files that are not markdown', () => {
  const entries = entriesOf(
    [
      file('src/content/pages/a.md', 'title: A'),
      { path: 'src/content/pages/a.json', text: '{}' },
      file('src/data/x.md', 'title: X'),
      file('src/content/pagesx/y.md', 'title: Y'),
    ],
    collections,
  );
  assert.deepEqual(
    entries.map((e) => e.path),
    ['src/content/pages/a.md'],
  );
});

test('entriesOf keeps a date written as text', () => {
  const [entry] = entriesOf([file('src/content/blog/p.md', 'title: P\ndate: "2026-05-04"')], collections);
  assert.equal(entry.date, '2026-05-04');
});
