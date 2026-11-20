// Tests for lib/appChanges.mjs: the site's file of apps changes with an app's install, update and uninstall.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appChanges } from './appChanges.mjs';

const PATH = 'src/data/apps.json';
const file = (text) => ({ text, oid: 'o1' });
const store = { files: [], record: { files: [] } };
const textOf = (changes) => changes.find((c) => c.path === PATH)?.content;

describe('appChanges', () => {
  it('installs an app into the file of apps', () => {
    const changes = appChanges('src/apps/b', PATH, 'b', [], store, file('{\n  "installed": [\n    "a"\n  ]\n}\n'));
    assert.deepEqual(JSON.parse(textOf(changes)), { installed: ['a', 'b'] });
  });
  it('an update keeps the app turned off', () => {
    const before = '{\n  "installed": [\n    "a",\n    "b"\n  ],\n  "off": [\n    "b"\n  ]\n}\n';
    const changes = appChanges('src/apps/b', PATH, 'b', [], store, file(before));
    assert.equal(textOf(changes), undefined);
  });
  it('an uninstall removes the id from installed and off', () => {
    const before = '{\n  "installed": [\n    "a",\n    "b"\n  ],\n  "off": [\n    "b"\n  ]\n}\n';
    const changes = appChanges('src/apps/b', PATH, 'b', [], null, file(before));
    assert.deepEqual(JSON.parse(textOf(changes)), { installed: ['a'] });
  });
  it('writes the file when there is none', () => {
    const changes = appChanges('src/apps/b', PATH, 'b', [], store, undefined);
    assert.equal(changes.find((c) => c.path === PATH)?.oid, null);
  });
});
