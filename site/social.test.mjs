import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { socialOf, shareLinks, sameAsOf } from './social.mjs';

test('no file', () => {
  assert.deepEqual(socialOf(undefined), { profiles: [], share: ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'] });
});

test('empty object', () => {
  assert.deepEqual(socialOf({}), { profiles: [], share: ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'] });
});

test('empty profiles are dropped', () => {
  assert.deepEqual(socialOf({ facebook: '', x: '  ', linkedin: ' https://linkedin.com/in/a ' }).profiles, [
    { id: 'linkedin', url: 'https://linkedin.com/in/a' },
  ]);
});

test('profiles keep a fixed order', () => {
  assert.deepEqual(
    socialOf({ pinterest: 'https://p', facebook: 'https://f' }).profiles.map((p) => p.id),
    ['facebook', 'pinterest'],
  );
});

test('a switch turns a button off', () => {
  assert.deepEqual(socialOf({ shareX: false }).share, ['facebook', 'linkedin', 'pinterest', 'copy-link']);
});

test('all switches off', () => {
  assert.deepEqual(
    socialOf({ shareFacebook: false, shareX: false, shareLinkedin: false, sharePinterest: false, shareCopyLink: false }).share,
    [],
  );
});

test('x encodes the address and title', () => {
  assert.deepEqual(shareLinks({ url: 'https://a.dk/b c/', title: 'Hi & bye' }, ['x']), [
    { id: 'x', href: 'https://x.com/intent/post?url=https%3A%2F%2Fa.dk%2Fb%20c%2F&text=Hi%20%26%20bye' },
  ]);
});

test('facebook', () => {
  assert.deepEqual(shareLinks({ url: 'https://a.dk/p/', title: 'T' }, ['facebook']), [
    { id: 'facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fa.dk%2Fp%2F' },
  ]);
});

test('linkedin', () => {
  assert.deepEqual(shareLinks({ url: 'https://a.dk/p/', title: 'T' }, ['linkedin']), [
    { id: 'linkedin', href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fa.dk%2Fp%2F' },
  ]);
});

test('pinterest with a picture', () => {
  assert.deepEqual(shareLinks({ url: 'https://a.dk/p/', title: 'T', picture: 'https://a.dk/i.webp' }, ['pinterest']), [
    {
      id: 'pinterest',
      href: 'https://pinterest.com/pin/create/button/?url=https%3A%2F%2Fa.dk%2Fp%2F&media=https%3A%2F%2Fa.dk%2Fi.webp&description=T',
    },
  ]);
});

test('pinterest without a picture is left out', () => {
  assert.deepEqual(shareLinks({ url: 'https://a.dk/p/', title: 'T' }, ['pinterest', 'copy-link']), [{ id: 'copy-link' }]);
});

test('sameAs with no profiles', () => {
  assert.deepEqual(sameAsOf([]), []);
});

test('sameAs keeps the order', () => {
  assert.deepEqual(
    sameAsOf([
      { id: 'facebook', url: 'https://f' },
      { id: 'x', url: 'https://x' },
    ]),
    ['https://f', 'https://x'],
  );
});
