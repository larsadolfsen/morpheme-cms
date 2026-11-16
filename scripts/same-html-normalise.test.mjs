import test from 'node:test';
import assert from 'node:assert/strict';
import { GUARDED_PAGES, withoutAssetHashes } from './same-html-normalise.mjs';

test('the content hash of an asset name is taken out in src, href, component-url and inline imports', () => {
  const html =
    '<script src="/_astro/Base.astro_astro_type_script_index_0_lang.CvZrJqQ7.js"></script>' +
    '<link href="/_astro/index.BzG_a-2k.css" rel="stylesheet">' +
    '<astro-island component-url="/_astro/MobileMenu.CexCd42L.js" renderer-url="/_astro/client.DTYtb0aG.js"></astro-island>' +
    '<img src="/_astro/0.10.DlWPtlDe.webp"><script>import"./view.D0KuD7BP.js"</script>';
  assert.equal(
    withoutAssetHashes(html),
    '<script src="/_astro/Base.astro_astro_type_script_index_0_lang.js"></script>' +
      '<link href="/_astro/index.css" rel="stylesheet">' +
      '<astro-island component-url="/_astro/MobileMenu.js" renderer-url="/_astro/client.js"></astro-island>' +
      '<img src="/_astro/0.10.webp"><script>import"./view.js"</script>',
  );
});

test('two names that differ only in their hash are the same, and a different name or other text is not', () => {
  const page = (hash, text) => `<p>${text}</p><astro-island component-url="/_astro/List.${hash}.js"></astro-island>`;
  assert.equal(withoutAssetHashes(page('aaaaaaaa', 'Hi')), withoutAssetHashes(page('bbbbbbbb', 'Hi')));
  assert.notEqual(withoutAssetHashes(page('aaaaaaaa', 'Hi')), withoutAssetHashes(page('aaaaaaaa', 'Hj')));
  assert.notEqual(withoutAssetHashes('<a href="/_astro/List.aaaaaaaa.js">'), withoutAssetHashes('<a href="/_astro/Lost.aaaaaaaa.js">'));
});

test('the guarded pages are the fixture pages and the Blocks page', () => {
  assert.deepEqual(GUARDED_PAGES, [
    'fixture-lists/index.html',
    'fixture-sources/index.html',
    'fixture-own-blocks/index.html',
    'blocks/index.html',
  ]);
});
