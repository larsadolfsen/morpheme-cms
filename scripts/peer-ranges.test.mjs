// Tests that the package's peer ranges accept what a site made from the previous release's starter already has
// (scripts/fixtures/starter-0.14.2.package.json): a range the old site's direct dependency or override does not satisfy
// stops `npm install @morphemecms/cms@<new>` with ERESOLVE and the Update button with "Updating needs npm".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satisfies } from '../lib/range.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const pkg = read('../package.json');
const old = read('./fixtures/starter-0.14.2.package.json');

test('postcss-selector-parser: a peer range that the old starter pins still fits', () => {
  const range = pkg.peerDependencies['postcss-selector-parser'];
  const pinned = old.dependencies['postcss-selector-parser'];
  assert.ok(satisfies(pinned.replace(/^\^/, ''), range), `${range} does not accept ${pinned}`);
});

test('every other peer with a hard pin or major bump still accepts the old starter', () => {
  for (const [peer, range] of Object.entries(pkg.peerDependencies)) {
    const have = old.dependencies[peer];
    if (!have || peer === 'postcss-selector-parser') continue;
    // The old starter's range may allow the new range's version (same major for a caret): npm can move within it.
    const major = (v) => v.replace(/^[\^~]/, '').split('.')[0];
    assert.ok(
      range.split('||').some((r) => major(r.trim()) === major(have)),
      `${peer}: ${range} vs the old starter's ${have}`,
    );
  }
});

// The real update (lib/lockfile.mjs addToLock, which the site's nightly check and the Update button run) on lockfiles cut to versions only
// (scripts/lock-versions.mjs; nothing of a site's content, nothing of a customer): it throws NeedsNpm on any peer a site's lockfile does not
// satisfy, and the site then never updates by itself. The lockfiles in scripts/fixtures/locks/ are the real ones `npm install` makes from the
// starter of 0.14.2 (with the CMS at 0.16.0) and of 0.17.0, and the state the CTO found in Sara's site and in morpheme-website on 18 Nov 2026
// (the 0.17.0 starter's lockfile with postcss-selector-parser at 7.1.6). A real site's lockfile, cut with scripts/lock-versions.mjs, is added by
// putting the file in that folder: this test reads every file in it.
import { readdirSync } from 'node:fs';
import { addToLock, NeedsNpm } from '../lib/lockfile.mjs';

const locks = readdirSync(new URL('./fixtures/locks/', import.meta.url)).filter((f) => f.endsWith('.json'));
const lockOf = (name) => read(`./fixtures/locks/${name}`);
const siteOf = (lock) => ({ name: 'site', dependencies: { '@morphemecms/cms': lock.packages['node_modules/@morphemecms/cms'].version } });
/** This checkout's package as the registry would describe it: the peers and the checksum that addToLock wants. */
const current = () => ({
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  peerDependencies: pkg.peerDependencies,
  peerDependenciesMeta: pkg.peerDependenciesMeta,
  dist: { tarball: `https://registry.npmjs.org/${pkg.name}/-/cms-${pkg.version}.tgz`, integrity: 'sha512-fixture' },
});

test('the fixture lockfiles are there, with the case that stopped the sites', () => {
  assert.ok(locks.length >= 3, `only ${locks.length} lockfiles in scripts/fixtures/locks/`);
  assert.equal(lockOf('starter-0.17.0-parser-7.1.6.json').packages['node_modules/postcss-selector-parser'].version, '7.1.6');
});

for (const name of locks) {
  test(`addToLock takes this package into ${name} without npm`, () => {
    const lock = lockOf(name);
    try {
      const out = addToLock(siteOf(lock), lock, current());
      assert.equal(out.packageJson.dependencies['@morphemecms/cms'], pkg.version);
    } catch (e) {
      if (e instanceof NeedsNpm) assert.fail(`${name}: ${e.message}`);
      throw e;
    }
  });
}

test('the test can fail: 0.16.0 to 0.18.0 as released need npm on a site with postcss-selector-parser 7.1.6 (the cause)', () => {
  const lock = lockOf('starter-0.17.0-parser-7.1.6.json');
  for (const v of ['0.16.0', '0.17.0', '0.18.0']) {
    const manifest = read(`./fixtures/manifests/cms-${v}.json`);
    assert.throws(
      () => addToLock(siteOf(lock), lock, manifest),
      (e) => e instanceof NeedsNpm && /postcss-selector-parser/.test(e.message),
      v,
    );
  }
});

test('every peer floor is one a site can still have: no range asks for more than the lowest version the tests run on', () => {
  // Run on 6.1.5, 7.1.0 and 7.1.6 on 18 Nov 2026 (site/ tests, the whole unit suite on 7.1.6 and the demo's build). The floor does not go up without a reason that a lockfile can name.
  assert.equal(pkg.peerDependencies['postcss-selector-parser'], '^6.1.5 || ^7.1.0');
});
