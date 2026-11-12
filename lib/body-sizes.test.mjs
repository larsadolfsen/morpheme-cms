import test from 'node:test';
import assert from 'node:assert/strict';
import { bodySizeHtml, bodySizeText } from './body-sizes.mjs';

test('a body medium and a body small paragraph round-trip', () => {
  assert.equal(bodySizeHtml('body-small', 'Fish & <chips>'), '<p class="body-small">Fish &amp; &lt;chips&gt;</p>');
  assert.deepEqual(bodySizeText(bodySizeHtml('body-small', 'Fish & <chips>')), { node: 'bodySmall', text: 'Fish & <chips>' });
  assert.deepEqual(bodySizeText('<p class="body-medium">Hi</p>'), { node: 'bodyMedium', text: 'Hi' });
});

test('other HTML is not a body style', () => {
  assert.equal(bodySizeText('<p class="body-large">Hi</p>'), null);
  assert.equal(bodySizeText('<p class="body-small">a <b>b</b></p>'), null);
});
