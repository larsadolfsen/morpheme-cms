// Tests for lib/entryNames.mjs. Run: node --test lib/entryNames.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { candidatePaths, entryName, freeName, untouched } from './entryNames.mjs';

const slugify = (t) =>
  t
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const names = (...list) => ({ taken: (n) => list.includes(n), slugify });

test('freeName numbers a name that is taken', () => {
  assert.equal(
    freeName('new-page', () => false),
    'new-page',
  );
  assert.equal(
    freeName('new-page', (n) => n === 'new-page'),
    'new-page-2',
  );
  assert.equal(
    freeName('new-page', (n) => ['new-page', 'new-page-2', 'new-page-3'].includes(n)),
    'new-page-4',
  );
});

test('a new entry is called New page at once, with a number when taken', () => {
  assert.deepEqual(entryName({ create: 'New page', title: '', ...names() }), { title: 'New page', name: 'new-page', byHand: false });
  assert.deepEqual(entryName({ create: 'New page', title: ' ', ...names('new-page') }), {
    title: 'New page 2',
    name: 'new-page-2',
    byHand: false,
  });
  assert.deepEqual(entryName({ create: 'New blog post', title: '', ...names('new-blog-post', 'new-blog-post-2') }), {
    title: 'New blog post 3',
    name: 'new-blog-post-3',
    byHand: false,
  });
});

test('the name is in the editor’s language', () => {
  assert.deepEqual(entryName({ create: 'Nouvelle page', title: '', ...names() }), {
    title: 'Nouvelle page',
    name: 'nouvelle-page',
    byHand: false,
  });
  assert.equal(entryName({ create: 'Nouvel article de blog écrit', title: '', ...names() }).name, 'nouvel-article-de-blog-ecrit');
});

test('the name follows the title (the H1 of a page) and keeps the words the person wrote', () => {
  assert.deepEqual(entryName({ create: 'New page', title: 'About us', ...names() }), {
    title: 'About us',
    name: 'about-us',
    byHand: false,
  });
  // Taken: the file name gets the number, the title stays as written.
  assert.deepEqual(entryName({ create: 'New page', title: 'About us', ...names('about-us') }), {
    title: 'About us',
    name: 'about-us-2',
    byHand: false,
  });
  // A title with no letters is no name.
  assert.equal(entryName({ create: 'New page', title: '!!!', ...names() }).title, 'New page');
  // Emptied again: back to the default.
  assert.equal(entryName({ create: 'New page', title: '', ...names() }).name, 'new-page');
});

test('an address written by hand no longer follows the title', () => {
  const made = entryName({ create: 'New page', title: 'About us', typed: 'our-team', ...names() });
  assert.deepEqual(made, { title: 'About us', name: 'our-team', byHand: true });
  assert.equal(entryName({ create: 'New page', title: 'Other', typed: 'our-team', ...names('our-team') }).name, 'our-team-2');
});

test('candidatePaths lists the file and its numbered names', () => {
  assert.deepEqual(candidatePaths('src/content/pages/a.md', 3), [
    'src/content/pages/a.md',
    'src/content/pages/a-2.md',
    'src/content/pages/a-3.md',
  ]);
});

test('an entry as the form opened it is untouched', () => {
  const base = { changed: [], bodyChanged: false, bare: true, h1: null, markdown: '', start: '' };
  assert.equal(untouched(base), true);
  // Typed and erased again, as it started.
  assert.equal(untouched({ ...base, bodyChanged: true, markdown: '<hero/>\n', start: '\n<hero/>\n' }), true);
  assert.equal(untouched({ ...base, bodyChanged: true, h1: 'About', markdown: '# About' }), false);
  assert.equal(untouched({ ...base, bodyChanged: true, bare: false, markdown: 'Text' }), false);
  assert.equal(untouched({ ...base, bodyChanged: true, markdown: '<hero/><list/>', start: '<hero/>' }), false);
  assert.equal(untouched({ ...base, changed: ['description'] }), false);
});
