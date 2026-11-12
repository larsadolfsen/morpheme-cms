import test from 'node:test';
import assert from 'node:assert/strict';
import { bodySizeHtml, bodySizeText } from './body-size.mjs';

test('a body medium and a body small paragraph round-trip', () => {
  for (const size of ['medium', 'small']) {
    const html = bodySizeHtml(size, 'Fish & <chips>');
    assert.equal(html, `<p class="body-${size}">Fish &amp; &lt;chips&gt;</p>`);
    assert.deepEqual(bodySizeText(html), { size, text: 'Fish & <chips>' });
  }
});

test('other HTML is not a body size', () => {
  assert.equal(bodySizeText('<p class="body-large">Hi</p>'), null);
  assert.equal(bodySizeText('<p class="body-small">a <b>b</b></p>'), null);
  assert.equal(bodySizeText('<p class="block-eyebrow">Hi</p>'), null);
});
