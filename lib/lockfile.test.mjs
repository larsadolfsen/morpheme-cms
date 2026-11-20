// Tests for lib/lockfile.mjs (moved from morpheme-appstore's test/unit/lockfile.test.mjs). Run: node --test packages/editor/lib/lockfile.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addToLock, NeedsNpm, removeFromLock } from './lockfile.mjs';

const site = () => ({
  packageJson: { name: 'site', dependencies: { astro: '^7.3.7', yaml: '^2.9.1' } },
  lock: {
    name: 'site',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: 'site', dependencies: { astro: '^7.3.7', yaml: '^2.9.1' } },
      'node_modules/astro': { version: '7.3.7' },
      'node_modules/yaml': { version: '2.9.1' },
    },
  },
});

const manifest = (over = {}) => ({
  name: '@morpheme/cms',
  version: '1.0.0',
  license: 'UNLICENSED',
  peerDependencies: { astro: '^7.3.2', yaml: '^2.0.0' },
  bin: { 'site-editor': './bin/cli.mjs' },
  dist: {
    tarball: 'https://morpheme-appstore.larsadolfsen.workers.dev/npm/@morpheme/cms/-/cms-1.0.0.tgz',
    integrity: 'sha512-abc',
    shasum: 'def',
  },
  ...over,
});

test('a new package goes into package.json and the lock where npm puts it', () => {
  const { packageJson, lock } = addToLock(site().packageJson, site().lock, manifest());
  assert.deepEqual(Object.keys(packageJson.dependencies), ['@morpheme/cms', 'astro', 'yaml']);
  assert.equal(packageJson.dependencies['@morpheme/cms'], '1.0.0');
  assert.deepEqual(Object.keys(lock.packages), ['', 'node_modules/@morpheme/cms', 'node_modules/astro', 'node_modules/yaml']);
  assert.equal(lock.packages[''].dependencies['@morpheme/cms'], '1.0.0');
  assert.deepEqual(lock.packages['node_modules/@morpheme/cms'], {
    version: '1.0.0',
    resolved: manifest().dist.tarball,
    integrity: 'sha512-abc',
    license: 'UNLICENSED',
    bin: { 'site-editor': 'bin/cli.mjs' },
    peerDependencies: { astro: '^7.3.2', yaml: '^2.0.0' },
  });
});

test('an update changes only its own entry', () => {
  const first = addToLock(site().packageJson, site().lock, manifest());
  const next = addToLock(first.packageJson, first.lock, manifest({ version: '1.1.0' }));
  assert.equal(next.lock.packages['node_modules/@morpheme/cms'].version, '1.1.0');
  assert.deepEqual(next.lock.packages['node_modules/yaml'], first.lock.packages['node_modules/yaml']);
});

test('peers the site does not have, in those versions, need npm', () => {
  assert.throws(() => addToLock(site().packageJson, site().lock, manifest({ peerDependencies: { yaml: '^3.0.0' } })), NeedsNpm);
  assert.throws(() => addToLock(site().packageJson, site().lock, manifest({ peerDependencies: { react: '^19.0.0' } })), NeedsNpm);
  assert.doesNotThrow(() =>
    addToLock(
      site().packageJson,
      site().lock,
      manifest({ peerDependencies: { react: '^19.0.0' }, peerDependenciesMeta: { react: { optional: true } } }),
    ),
  );
});

test('dependencies of its own and install scripts need npm', () => {
  assert.throws(() => addToLock(site().packageJson, site().lock, manifest({ dependencies: { yaml: '^2.0.0' } })), NeedsNpm);
  assert.throws(() => addToLock(site().packageJson, site().lock, manifest({ scripts: { postinstall: 'node x.js' } })), NeedsNpm);
});

test('removing a package undoes adding it, and leaves the input alone', () => {
  const added = addToLock(site().packageJson, site().lock, manifest());
  const snapshot = structuredClone(added);
  const { packageJson, lock } = removeFromLock(added.packageJson, added.lock, '@morpheme/cms');
  assert.deepEqual(packageJson, site().packageJson);
  assert.deepEqual(lock, site().lock);
  assert.deepEqual(added, snapshot);
});

test('removing a package another one needs, or from an old lock, needs npm', () => {
  const added = addToLock(site().packageJson, site().lock, manifest());
  added.lock.packages['node_modules/@morpheme/theme'] = { version: '1.0.0', peerDependencies: { '@morpheme/cms': '^1.0.0' } };
  assert.throws(() => removeFromLock(added.packageJson, added.lock, '@morpheme/cms'), NeedsNpm);
  assert.throws(() => removeFromLock(site().packageJson, { ...site().lock, lockfileVersion: 2 }, 'yaml'), NeedsNpm);
});
