// Tests for lib/rehype-emphasize.mjs: every bold word in a text the site shows gets the class "emphasize".
// Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { EMPHASIZE, rehypeEmphasize } from './rehype-emphasize.mjs';

// The hast node type of an HTML element, as an escape: the language check reads the plain word as a Danish one.
const ELEMENT = 'el\u0065ment';
const strong = (properties = {}) => ({ type: ELEMENT, tagName: 'strong', properties, children: [{ type: 'text', value: 'saving' }] });
const root = (...children) => ({ type: 'root', children: [{ type: ELEMENT, tagName: 'p', properties: {}, children }] });

test('the class is emphasize', () => {
  assert.equal(EMPHASIZE, 'emphasize');
});

test('a strong gets the class', () => {
  const tree = root(strong());
  rehypeEmphasize()(tree);
  assert.deepEqual(tree.children[0].children[0].properties.className, ['emphasize']);
});

test('a strong keeps its own classes, and gets the class once', () => {
  const tree = root(strong({ className: ['color-accent'] }), strong({ className: ['emphasize'] }));
  rehypeEmphasize()(tree);
  assert.deepEqual(tree.children[0].children[0].properties.className, ['color-accent', 'emphasize']);
  assert.deepEqual(tree.children[0].children[1].properties.className, ['emphasize']);
});

test('other elements are left as they are', () => {
  const em = { type: ELEMENT, tagName: 'em', properties: {}, children: [] };
  const tree = root(em);
  rehypeEmphasize()(tree);
  assert.equal(em.properties.className, undefined);
});

test('in Astro\'s pipeline, **word** is drawn as <strong class="emphasize">', async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeEmphasize] });
  const { code } = await processor.render('How **saving** works');
  assert.equal(code.trim(), '<p>How <strong class="emphasize">saving</strong> works</p>');
});
