// Tests for lib/previewAddress.mjs. Run: node --test lib/previewAddress.test.mjs
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { inPreview, oldPreviewWarnings, PREVIEW, renamedPreview } from './previewAddress.mjs';

describe('renamedPreview', () => {
  test('the old prefix becomes the new one, the rest kept; anything else stays', () => {
    assert.equal(renamedPreview('/ny/about/'), '/new/about/'); // language-ok: an old public address
    assert.equal(renamedPreview('/ny/a/b/'), '/new/a/b/'); // language-ok: an old public address
    assert.equal(renamedPreview('/ny/'), '/new/'); // language-ok: an old public address
    assert.equal(renamedPreview('/new/about/'), '/new/about/');
    assert.equal(renamedPreview('/about/ny/'), '/about/ny/'); // language-ok: an old public address
  });
});

describe('inPreview', () => {
  test('a new version, at the new or the old address; the overview and other pages are none', () => {
    assert.equal(PREVIEW, '/new/');
    assert.equal(inPreview('/new/about/'), true);
    assert.equal(inPreview('/ny/about/'), true); // language-ok: an old public address
    assert.equal(inPreview('/new/'), false);
    assert.equal(inPreview('/ny/'), false); // language-ok: an old public address
    assert.equal(inPreview('/about/'), false);
    assert.equal(inPreview('/newsletter/'), false);
  });
});

describe('oldPreviewWarnings', () => {
  test('a page file under the old folder is said, with where it is shown now and where to move it', () => {
    const [line, ...rest] = oldPreviewWarnings([{ file: 'ny/about.md' }]); // language-ok: an old folder name
    assert.equal(rest.length, 0);
    assert.match(line, /src\/content\/pages\/ny\/about\.md is still in the folder ny\//); // language-ok: an old folder name
    assert.match(line, /shown at \/new\/about\/ /);
    assert.match(line, /Move it to src\/content\/pages\/new\//);
  });
  test('an index file and a nested folder give the address the page gets', () => {
    assert.match(oldPreviewWarnings([{ file: 'ny/company/index.md' }])[0], /shown at \/new\/company\//); // language-ok: an old folder name
  });
  test('a path under the old address is said, in any folder', () => {
    const [line] = oldPreviewWarnings([{ file: 'x.md', path: '/ny/x/' }]); // language-ok: an old public address
    assert.match(line, /still has the path \/ny\/x\//); // language-ok: an old public address
    assert.match(line, /shown at \/new\/x\//);
  });
  test('a page in the old folder with its own live path is shown there', () => {
    assert.match(oldPreviewWarnings([{ file: 'ny/x.md', path: '/x/' }])[0], /shown at \/x\//); // language-ok: an old folder name
  });
  test('pages in the new folder or elsewhere give nothing', () => {
    assert.deepEqual(oldPreviewWarnings([{ file: 'new/about.md' }, { file: 'about.md', path: '/about/' }, { file: 'company/ny.md' }]), []); // language-ok: an old folder name
  });
});
