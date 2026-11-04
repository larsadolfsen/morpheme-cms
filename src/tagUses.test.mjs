// Tests for src/tagUses.mjs. Run: node --test packages/editor/src/*.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml } from '../lib/blocks.mjs';
import { promotionTags, recordUse, tagUses, taggedWith } from './tagUses.mjs';

const folders = {
  blog: 'src/content/blog',
  pages: 'src/content/pages',
  testimonials: 'src/data/testimonials',
  popups: 'src/data/popups',
  fileRecords: 'src/data/files',
};

const andromeda = {
  path: 'src/data/files/k3j9x2ab.json',
  text: '{"src":"/images/uploads/2026/10/andromeda.webp","categories":["design"],"removed":["seo"]}',
};

/** A Markdown file with front matter categories. @param {string[]} categories */
const md = (categories) => `---\ntitle: "T"\ncategories: ${JSON.stringify(categories)}\n---\nBody\n`;

/** The paths of the files using a tag. @param {{ path: string; text: string }[]} files @param {string} slug */
const pathsOf = (files, slug) => [...(tagUses(files, folders).get(slug)?.keys() ?? [])];

test('a post counts for the tags in its front matter', () => {
  const files = [{ path: 'src/content/blog/a.md', text: md(['seo']) }];
  assert.deepEqual(pathsOf(files, 'seo'), ['src/content/blog/a.md']);
});

test('a page counts for the tags in its front matter', () => {
  const files = [{ path: 'src/content/pages/about.md', text: md(['design']) }];
  assert.deepEqual(pathsOf(files, 'design'), ['src/content/pages/about.md']);
});

test('a page with a posts block counts for the tags the block picks', () => {
  const page = { path: 'src/content/pages/home.md', text: `Intro\n${blockHtml('posts', { categories: ['apps'] })}\n` };
  assert.deepEqual(pathsOf([page], 'apps'), ['src/content/pages/home.md']);
});

test('a page with a testimonials block counts for the tag in its link', () => {
  const page = { path: 'src/content/pages/home.md', text: `${blockHtml('testimonials', { link: 'seo' })}\n` };
  assert.deepEqual(pathsOf([page], 'seo'), ['src/content/pages/home.md']);
});

test('a page that has a tag in its front matter and in a block is counted once', () => {
  const page = {
    path: 'src/content/pages/home.md',
    text: `---\ncategories: ["seo"]\n---\n${blockHtml('posts', { categories: ['seo'] })}\n`,
  };
  assert.equal(tagUses([page], folders).get('seo')?.size, 1);
});

test('a testimonial counts for the tags in its categories', () => {
  const file = { path: 'src/data/testimonials/x.json', text: '{"categories":["editing"]}' };
  assert.deepEqual(pathsOf([file], 'editing'), ['src/data/testimonials/x.json']);
});

test('a promotion counts for the tags when it is shown on tagged posts', () => {
  const tagged = { path: 'src/data/popups/p.json', text: '{"where":"tags","tags":["seo"]}' };
  assert.deepEqual(pathsOf([tagged], 'seo'), ['src/data/popups/p.json']);
});

test('a promotion shown on all posts does not count for a tag', () => {
  const all = { path: 'src/data/popups/p.json', text: '{"where":"all","tags":["seo"]}' };
  assert.deepEqual(pathsOf([all], 'seo'), []);
});

test('a tag file is not a use', () => {
  const file = { path: 'src/data/categories/seo.json', text: '{"categories":["seo"]}' };
  assert.equal(tagUses([file], folders).size, 0);
});

test('a JSON file in the blog folder is ignored', () => {
  const file = { path: 'src/content/blog/notes.json', text: '{"categories":["seo"]}' };
  assert.equal(tagUses([file], folders).size, 0);
});

test('a testimonial with broken JSON is skipped without an error', () => {
  const file = { path: 'src/data/testimonials/bad.json', text: '{' };
  assert.equal(tagUses([file], folders).size, 0);
});

test('promotionTags gives the tags of a promotion shown on tagged posts', () => {
  assert.deepEqual(promotionTags({ where: 'tags', tags: ['a', 2] }), ['a', '2']);
});

test('promotionTags gives no tags for a promotion shown elsewhere', () => {
  assert.deepEqual(promotionTags({ where: 'pages', tags: ['a'] }), []);
});

test('promotionTags gives no tags without a tag list', () => {
  assert.deepEqual(promotionTags({ where: 'tags' }), []);
});

test('taggedWith lists the pages and testimonials with a tag, not blocks', () => {
  const about = { path: 'src/content/pages/about.md', text: md(['design']) };
  const post = { path: 'src/content/blog/a.md', text: blockHtml('posts', { categories: ['design'] }) };
  const testimonial = { path: 'src/data/testimonials/x.json', text: '{"categories":["design"]}' };
  assert.deepEqual(taggedWith([about, post, testimonial], 'design', folders), {
    posts: [],
    pages: [about],
    testimonials: [testimonial],
    records: [],
  });
});

test('a file record counts for the tags in its categories, not its removed tags', () => {
  assert.deepEqual(pathsOf([andromeda], 'design'), ['src/data/files/k3j9x2ab.json']);
  assert.deepEqual(pathsOf([andromeda], 'seo'), []);
});

test('a file record is not counted when the folders have no file records folder', () => {
  const { fileRecords: _omitted, ...withoutRecords } = folders;
  assert.equal(tagUses([andromeda], withoutRecords).size, 0);
});

test('a file record in a subfolder of the records folder is not counted', () => {
  const nested = { path: 'src/data/files/sub/x.json', text: andromeda.text };
  assert.equal(tagUses([nested], folders).size, 0);
});

test('taggedWith lists the file records with a tag in their categories', () => {
  assert.deepEqual(taggedWith([andromeda], 'design', folders).records, [andromeda]);
  assert.deepEqual(taggedWith([andromeda], 'seo', folders).records, []);
});

test('recordUse gives the Filer path and the file name of a file record', () => {
  assert.deepEqual(recordUse(andromeda, 'src/data/files'), {
    path: 'filer/images/uploads/2026/10/andromeda.webp',
    name: 'andromeda.webp',
  });
});

test('recordUse gives null for a file that is not a file record', () => {
  assert.equal(recordUse({ path: 'src/content/pages/about.md', text: '' }, 'src/data/files'), null);
});

test('recordUse gives null for a file record with broken JSON', () => {
  assert.equal(recordUse({ path: 'src/data/files/x.json', text: '{' }, 'src/data/files'), null);
});
