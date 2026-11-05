// Tests for splitLead: the first text-bearing <p> is the lead; everything else stays in rest.
// Run with: node --test lib/lead.test.mjs
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { splitLead } from './lead.mjs';

test('a text paragraph first is the lead', () => {
  assert.deepEqual(splitLead('<p>Hello <a href="/x">you</a>.</p>\n<h2>Next</h2>'), {
    lead: '<p>Hello <a href="/x">you</a>.</p>',
    rest: '<h2>Next</h2>',
  });
});

test('a heading first gives no lead', () => {
  assert.deepEqual(splitLead('<h2>Title</h2><p>Text</p>'), { lead: '', rest: '<h2>Title</h2><p>Text</p>' });
});

test('a picture-only paragraph is no lead', () => {
  assert.deepEqual(splitLead('<p><img src="/a.webp" alt=""></p><p>Text</p>'), {
    lead: '',
    rest: '<p><img src="/a.webp" alt=""></p><p>Text</p>',
  });
});

test('a picture element alone is no lead', () => {
  assert.deepEqual(splitLead('<p> <picture><img src="/a.webp" alt=""></picture> </p><p>T</p>'), {
    lead: '',
    rest: '<p> <picture><img src="/a.webp" alt=""></picture> </p><p>T</p>',
  });
});

test('a block first gives no lead', () => {
  assert.deepEqual(splitLead('<div data-block="points" data-props="{}"></div><p>Text</p>'), {
    lead: '',
    rest: '<div data-block="points" data-props="{}"></div><p>Text</p>',
  });
});

test('leading whitespace is ignored', () => {
  assert.deepEqual(splitLead('\n  <p>Hi</p><p>More</p>'), { lead: '<p>Hi</p>', rest: '<p>More</p>' });
});

test('a comment first is ignored', () => {
  assert.deepEqual(splitLead('<!-- x --><p>Hi</p>'), { lead: '<p>Hi</p>', rest: '' });
});

test('empty text', () => {
  assert.deepEqual(splitLead(''), { lead: '', rest: '' });
});

test('one paragraph only', () => {
  assert.deepEqual(splitLead('<p>Only</p>'), { lead: '<p>Only</p>', rest: '' });
});

test('a paragraph with attributes', () => {
  assert.deepEqual(splitLead('<p class="x">Hi</p><p>B</p>'), { lead: '<p class="x">Hi</p>', rest: '<p>B</p>' });
});

test('a list first gives no lead', () => {
  assert.deepEqual(splitLead('<ul><li>A</li></ul>'), { lead: '', rest: '<ul><li>A</li></ul>' });
});

test('a pre first gives no lead', () => {
  assert.deepEqual(splitLead('<pre>x</pre><p>A</p>'), { lead: '', rest: '<pre>x</pre><p>A</p>' });
});
