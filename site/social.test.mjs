import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { socialOf, shareLinks, sameAsOf, networkOf, upgradeSocial } from './social.mjs';

test('no file', () => {
  assert.deepEqual(socialOf(undefined), { profiles: [], share: ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'] });
});

test('empty object', () => {
  assert.deepEqual(socialOf({}), { profiles: [], share: ['facebook', 'x', 'linkedin', 'pinterest', 'copy-link'] });
});

test('empty profiles are dropped', () => {
  assert.deepEqual(socialOf({ profiles: [{ url: '' }, { url: '  ' }, { url: ' https://linkedin.com/in/a ' }, {}] }).profiles, [
    { id: 'linkedin', url: 'https://linkedin.com/in/a' },
  ]);
});

test('profiles keep their order, and one not known has no network', () => {
  assert.deepEqual(
    socialOf({ profiles: [{ url: 'https://www.pinterest.dk/a' }, { url: 'https://example.com/a' }, { url: 'https://fb.com/a' }] }).profiles,
    [
      { id: 'pinterest', url: 'https://www.pinterest.dk/a' },
      { id: null, url: 'https://example.com/a' },
      { id: 'facebook', url: 'https://fb.com/a' },
    ],
  );
});

test('a file from before the list: its keys are read as links', () => {
  assert.deepEqual(
    socialOf({ facebook: '', x: '  ', pinterest: 'https://pinterest.com/p', linkedin: ' https://linkedin.com/in/a ' }).profiles,
    [
      { id: 'linkedin', url: 'https://linkedin.com/in/a' },
      { id: 'pinterest', url: 'https://pinterest.com/p' },
    ],
  );
});

test('networkOf knows a network by its host', () => {
  const id = (url) => networkOf(url)?.id ?? null;
  assert.equal(id('https://www.facebook.com/acme'), 'facebook');
  assert.equal(id('https://m.youtube.com/@acme'), 'youtube');
  assert.equal(id('https://youtu.be/x'), 'youtube');
  assert.equal(id('https://twitter.com/acme'), 'x');
  assert.equal(id('https://X.com/acme'), 'x');
  assert.equal(id('https://pinterest.co.uk/acme'), 'pinterest');
  assert.equal(id('https://mastodon.social/@acme'), 'mastodon');
  assert.equal(id('https://bsky.app/profile/acme'), 'bluesky');
  assert.equal(id('https://linktr.ee/acme'), 'linktree');
});

test('networkOf: a host that only looks like one, or no address', () => {
  assert.equal(networkOf('https://notfacebook.com/a'), null);
  assert.equal(networkOf('https://facebook.com.evil.dk/a'), null);
  assert.equal(networkOf('https://example.com'), null);
  assert.equal(networkOf('facebook'), null);
  assert.equal(networkOf(''), null);
});

test('upgradeSocial makes the old keys a list where the first was', () => {
  const old = { facebook: 'https://f', instagram: '', x: 'https://x', shareFacebook: true, shareX: false };
  const now = upgradeSocial(old);
  assert.deepEqual(now, { profiles: [{ url: 'https://f' }, { url: 'https://x' }], shareFacebook: true, shareX: false });
  assert.deepEqual(Object.keys(now), ['profiles', 'shareFacebook', 'shareX']);
});

test('upgradeSocial keeps a list and adds the old keys after it', () => {
  assert.deepEqual(upgradeSocial({ profiles: [{ url: 'https://a' }], tiktok: 'https://t' }), {
    profiles: [{ url: 'https://a' }, { url: 'https://t' }],
  });
});

test('upgradeSocial gives back a file without the old keys as it is', () => {
  const now = { profiles: [{ url: 'https://a' }], shareX: true };
  assert.equal(upgradeSocial(now), now);
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
