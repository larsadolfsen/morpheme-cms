// Tests for lib/locale.mjs. Run: node --test lib/locale.test.mjs
// Depends on: node:test, node:assert/strict.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { layerPlan } from './locale.mjs';

describe('layerPlan', () => {
  it('copies a layer file over the file at the same path', () => {
    assert.deepEqual(layerPlan(['i18n/da-DK/README.md'], 'da-DK'), {
      copy: [['i18n/da-DK/README.md', 'README.md']],
      remove: [],
    });
  });

  it('removes the file named by a .remove layer file, without copying it', () => {
    assert.deepEqual(layerPlan(['i18n/da-DK/src/content/pages/home.md.remove'], 'da-DK'), {
      copy: [],
      remove: ['src/content/pages/home.md'],
    });
  });

  it('ignores files of other codes', () => {
    assert.deepEqual(layerPlan(['i18n/da-DK/README.md'], 'sv-SE'), { copy: [], remove: [] });
  });

  it('keeps nested paths', () => {
    assert.deepEqual(layerPlan(['i18n/da-DK/src/data/cookies.json'], 'da-DK'), {
      copy: [['i18n/da-DK/src/data/cookies.json', 'src/data/cookies.json']],
      remove: [],
    });
  });

  it('handles a mixed list and ignores files outside i18n/', () => {
    const files = [
      'README.md',
      'i18n/da-DK/README.md',
      'i18n/sv-SE/README.md',
      'i18n/da-DK/src/content/pages/home.md.remove',
      'i18n/da-DK/src/content/pages/forside.md',
    ];
    assert.deepEqual(layerPlan(files, 'da-DK'), {
      copy: [
        ['i18n/da-DK/README.md', 'README.md'],
        ['i18n/da-DK/src/content/pages/forside.md', 'src/content/pages/forside.md'],
      ],
      remove: ['src/content/pages/home.md'],
    });
  });
});
