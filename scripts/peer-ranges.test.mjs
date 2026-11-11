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

test('postcss-selector-parser: a peer range that the old starter pins, with its override, still fits', () => {
  const range = pkg.peerDependencies['postcss-selector-parser'];
  const pinned = old.dependencies['postcss-selector-parser'];
  const override = old.overrides['@tailwindcss/typography']['postcss-selector-parser'];
  assert.equal(pinned, override);
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
