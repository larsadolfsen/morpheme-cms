// Tests for lib/appPlaces.mjs: each place of an app (build, editor, worker, pages) gets the access level its files
// call for, for contract 4 apps with app.json and for old apps without one (index.ts), and hasFullPlace reads them.
// The manifests are plain objects shaped as readManifest returns them; the files are relative paths with `/`.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placesOf, hasFullPlace } from './appPlaces.mjs';

/** @typedef {import('./appManifest.mjs').AppManifest} AppManifest */

/** A valid manifest with the given keys added. @param {Record<string, unknown>} [extra] @returns {AppManifest} */
const valid = (extra = {}) =>
  /** @type {AppManifest} */ ({
    api: 4,
    label: 'Test',
    publisher: 'Test',
    license: 'MIT',
    icon: 'star',
    hint: 'A test app',
    version: '1.0.0',
    ...extra,
  });

describe('placesOf', () => {
  it('gives build sandboxed for hooks only', () => {
    const places = placesOf(['app.json', 'hooks/page-colors.ts'], valid({ hooks: ['page-colors'] }));
    assert.deepEqual(places, { build: 'sandboxed', editor: 'none', worker: 'none', pages: 'none' });
  });

  it('gives build sandboxed for after-build only', () => {
    const places = placesOf(['app.json', 'after-build.ts'], valid({ afterBuild: true }));
    assert.equal(places.build, 'sandboxed');
    assert.equal(places.editor, 'none');
    assert.equal(places.worker, 'none');
    assert.equal(places.pages, 'none');
  });

  it('gives build and pages full for a slot', () => {
    const places = placesOf(['app.json', 'slots/head.astro'], valid());
    assert.equal(places.build, 'full');
    assert.equal(places.pages, 'full');
  });

  it('gives build full for a block', () => {
    const places = placesOf(['app.json', 'blocks/x/View.tsx'], valid());
    assert.equal(places.build, 'full');
  });

  it('gives pages full for a block script', () => {
    const places = placesOf(['app.json', 'blocks/x/script.ts'], valid());
    assert.equal(places.pages, 'full');
  });

  it('gives build full for a folder named by a kinds key', () => {
    const places = placesOf(['app.json', 'popups/load.ts'], valid({ kinds: { popups: {} } }));
    assert.equal(places.build, 'full');
  });

  it('does not give build full for a folder that is not a kinds key', () => {
    const places = placesOf(['app.json', 'popups/load.ts'], valid({ kinds: { other: {} } }));
    assert.equal(places.build, 'none');
  });

  it('gives editor full for editor.ts', () => {
    const places = placesOf(['app.json', 'editor.ts'], valid());
    assert.equal(places.editor, 'full');
  });

  it('gives worker full for worker.js', () => {
    const places = placesOf(['app.json', 'worker.js'], valid());
    assert.equal(places.worker, 'full');
  });

  it('gives every place full for an old app with index.ts and a hook file', () => {
    const places = placesOf(['index.ts', 'hooks/page-colors.ts'], null);
    assert.equal(places.build, 'full');
    assert.equal(places.editor, 'full');
    assert.equal(places.worker, 'none');
    assert.equal(places.pages, 'none');
  });

  it('gives pages full for an old app with a script.ts', () => {
    const places = placesOf(['index.ts', 'blocks/x/script.ts'], null);
    assert.equal(places.pages, 'full');
  });

  it('gives worker full for an old app with worker.js', () => {
    const places = placesOf(['index.ts', 'worker.js'], null);
    assert.equal(places.worker, 'full');
  });

  it('gives all none for an app with only app.json', () => {
    const places = placesOf(['app.json'], valid());
    assert.deepEqual(places, { build: 'none', editor: 'none', worker: 'none', pages: 'none' });
  });
});

describe('hasFullPlace', () => {
  it('is true when one place is full', () => {
    assert.equal(hasFullPlace({ build: 'sandboxed', editor: 'full', worker: 'none', pages: 'none' }), true);
  });

  it('is false when no place is full', () => {
    assert.equal(hasFullPlace({ build: 'sandboxed', editor: 'none', worker: 'none', pages: 'none' }), false);
    assert.equal(hasFullPlace({ build: 'none', editor: 'none', worker: 'none', pages: 'none' }), false);
  });
});
