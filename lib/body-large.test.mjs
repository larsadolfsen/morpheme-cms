import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyLargeHtml, bodyLargeText } from './body-large.mjs';

test('an intro paragraph round-trips', () => {
  const html = bodyLargeHtml('Fish & <chips>');
  assert.equal(html, '<p class="body-large">Fish &amp; &lt;chips&gt;</p>');
  assert.equal(bodyLargeText(html), 'Fish & <chips>');
});

test('other HTML is not an intro paragraph', () => {
  assert.equal(bodyLargeText('<p class="block-eyebrow">Hi</p>'), null);
  assert.equal(bodyLargeText('<p class="body-large">a <b>b</b></p>'), null);
});
