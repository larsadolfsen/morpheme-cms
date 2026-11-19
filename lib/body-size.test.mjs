import test from 'node:test';
import assert from 'node:assert/strict';
import { bodySizeClass, bodySizeHtml, bodySizeText } from './body-size.mjs';

test('a body medium and a body small paragraph round-trip', () => {
  for (const size of ['medium', 'small']) {
    const html = bodySizeHtml(size, 'Fish & <chips>');
    assert.equal(html, `<p class="mo-type-body-${size}">Fish &amp; &lt;chips&gt;</p>`);
    assert.deepEqual(bodySizeText(html), { size, text: 'Fish & <chips>' });
  }
});

test('other HTML is not a body size', () => {
  assert.equal(bodySizeText('<p class="mo-type-body-large">Hi</p>'), null);
  assert.equal(bodySizeText('<p class="mo-type-body-small">a <b>b</b></p>'), null);
  assert.equal(bodySizeText('<p class="mo-type-label-medium">Hi</p>'), null);
});

test('only a size of the list becomes a class', () => {
  assert.equal(bodySizeClass('medium'), 'mo-type-body-medium');
  assert.equal(bodySizeClass('small'), 'mo-type-body-small');
  for (const size of ['x" onclick="y', 'large', '', '__proto__', 'constructor']) assert.equal(bodySizeClass(size), '');
  assert.equal(bodySizeHtml('x" onclick="y', 'Hi'), '<p>Hi</p>');
});

test('quotes in the text never break out, and come back', () => {
  const text = `He said "hi" & it's <b>`;
  const html = bodySizeHtml('small', text);
  assert.equal(html, '<p class="mo-type-body-small">He said &quot;hi&quot; &amp; it&#39;s &lt;b&gt;</p>');
  assert.ok(
    !html
      .slice(0, -4)
      .slice('<p class="mo-type-body-small">'.length)
      .match(/["'<>]/),
  );
  assert.deepEqual(bodySizeText(html), { size: 'small', text });
});
