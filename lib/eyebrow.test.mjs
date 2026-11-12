// Tests for lib/eyebrow.mjs: a label's line of HTML, written and read back as it was. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EYEBROW_CLASS, EYEBROW_FORMER_CLASS, eyebrowHtml, eyebrowText } from './eyebrow.mjs';

test('the class is a block label', () => assert.equal(EYEBROW_CLASS, 'label-medium'));
test('writes the line', () => assert.equal(eyebrowHtml('How it works'), '<p class="label-medium">How it works</p>'));
test('escapes &, < and >', () => assert.equal(eyebrowHtml('A & <B>'), '<p class="label-medium">A &amp; &lt;B&gt;</p>'));
test('reads the line', () => assert.equal(eyebrowText('<p class="label-medium">How it works</p>'), 'How it works'));
test('reads it with space around', () => assert.equal(eyebrowText('<p class="label-medium">Hi</p>\n'), 'Hi'));
test('reads escaped text', () => assert.equal(eyebrowText('<p class="label-medium">A &amp; &lt;B&gt;</p>'), 'A & <B>'));
test('round trip', () =>
  assert.equal(eyebrowHtml(eyebrowText('<p class="label-medium">Fast &amp; safe</p>')), '<p class="label-medium">Fast &amp; safe</p>'));
test('an empty label', () => assert.equal(eyebrowText('<p class="label-medium"></p>'), ''));
test('reads the former class and writes the new one', () => {
  assert.equal(EYEBROW_FORMER_CLASS, 'block-eyebrow');
  const text = eyebrowText('<p class="block-eyebrow">Fast &amp; safe</p>');
  assert.equal(text, 'Fast & safe');
  assert.equal(eyebrowHtml(text), '<p class="label-medium">Fast &amp; safe</p>');
});
test('not another class', () => assert.equal(eyebrowText('<p class="intro">Hi</p>'), null));
test('not HTML inside it', () => assert.equal(eyebrowText('<p class="label-medium">a <b>b</b></p>'), null));
test('not HTML it would write back otherwise', () => {
  assert.equal(eyebrowText('<p class="label-medium">AT&T</p>'), null);
  assert.equal(eyebrowText('<p class="label-medium">&quot;Hi&quot;</p>'), null);
});
