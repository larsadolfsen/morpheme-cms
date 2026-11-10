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

it('applyLocale keeps the layer’s own src/site/config.ts and sets its locale', async () => {
  const { applyLocale } = await import('../scripts/locale.mjs');
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = mkdtempSync(join(tmpdir(), 'locale-'));
  try {
    mkdirSync(join(root, 'src/site'), { recursive: true });
    mkdirSync(join(root, 'i18n/da-DK/src/site'), { recursive: true });
    writeFileSync(join(root, 'src/site/config.ts'), "name: 'English',\nlocale: 'en-US',\n");
    writeFileSync(join(root, 'i18n/da-DK/src/site/config.ts'), "name: 'Dansk',\nlocale: 'en-US',\n");
    applyLocale(root, 'da-DK');
    assert.equal(readFileSync(join(root, 'src/site/config.ts'), 'utf8'), "name: 'Dansk',\nlocale: 'da-DK',\n");
    assert.equal(existsSync(join(root, 'i18n')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
