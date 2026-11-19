// Tests for lib/eyebrow.mjs: a label's line of HTML, written and read back as it was. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EYEBROW_CLASS, eyebrowHtml, eyebrowText, splitTrailingEyebrow } from './eyebrow.mjs';

test('the class is a block label', () => assert.equal(EYEBROW_CLASS, 'mo-type-label-medium'));
test('writes the line', () => assert.equal(eyebrowHtml('How it works'), '<p class="mo-type-label-medium">How it works</p>'));
test('escapes &, < and >', () => assert.equal(eyebrowHtml('A & <B>'), '<p class="mo-type-label-medium">A &amp; &lt;B&gt;</p>'));
test('reads the line', () => assert.equal(eyebrowText('<p class="mo-type-label-medium">How it works</p>'), 'How it works'));
test('reads it with space around', () => assert.equal(eyebrowText('<p class="mo-type-label-medium">Hi</p>\n'), 'Hi'));
test('reads escaped text', () => assert.equal(eyebrowText('<p class="mo-type-label-medium">A &amp; &lt;B&gt;</p>'), 'A & <B>'));
test('round trip', () =>
  assert.equal(
    eyebrowHtml(eyebrowText('<p class="mo-type-label-medium">Fast &amp; safe</p>')),
    '<p class="mo-type-label-medium">Fast &amp; safe</p>',
  ));
test('an empty label', () => assert.equal(eyebrowText('<p class="mo-type-label-medium"></p>'), ''));
test('the former class is not read any more', () => assert.equal(eyebrowText('<p class="block-eyebrow">Hi</p>'), null));
test('not another class', () => assert.equal(eyebrowText('<p class="intro">Hi</p>'), null));
test('not HTML inside it', () => assert.equal(eyebrowText('<p class="mo-type-label-medium">a <b>b</b></p>'), null));
test('not HTML it would write back otherwise', () => {
  assert.equal(eyebrowText('<p class="mo-type-label-medium">AT&T</p>'), null);
  assert.equal(eyebrowText('<p class="mo-type-label-medium">&quot;Hi&quot;</p>'), null);
});
test('splits a label at the end of a text', () => {
  assert.deepEqual(splitTrailingEyebrow('<p class="mo-type-label-medium">Get started</p>\n'), { body: '', label: 'Get started' });
  assert.deepEqual(splitTrailingEyebrow('Some text.\n\n<p class="mo-type-label-medium">Get started</p>'), {
    body: 'Some text.',
    label: 'Get started',
  });
});
test('no label at the end of a text', () => {
  assert.deepEqual(splitTrailingEyebrow('Some text.'), { body: 'Some text.', label: null });
  assert.deepEqual(splitTrailingEyebrow('<p class="mo-type-label-medium">A</p>\n\nText.'), {
    body: '<p class="mo-type-label-medium">A</p>\n\nText.',
    label: null,
  });
});
