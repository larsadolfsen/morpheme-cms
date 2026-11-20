// Tests for lib/appsFile.mjs: reading, writing and changing the site's file of apps.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activeOf, appsFileText, readAppsFile, withInstalled, withOff } from './appsFile.mjs';

const second = '{\n  "installed": [\n    "a",\n    "b"\n  ],\n  "off": [\n    "b"\n  ]\n}\n';

describe('readAppsFile', () => {
  it('gives empty lists for undefined', () => assert.deepEqual(readAppsFile(undefined), { installed: [], off: [] }));
  it('gives empty lists for bad JSON', () => assert.deepEqual(readAppsFile('not json'), { installed: [], off: [] }));
  it('sorts and removes duplicates', () =>
    assert.deepEqual(readAppsFile('{"installed":["b","a","a"]}'), { installed: ['a', 'b'], off: [] }));
  it('drops off ids that are not installed', () =>
    assert.deepEqual(readAppsFile('{"installed":["a","b"],"off":["b","x"]}'), { installed: ['a', 'b'], off: ['b'] }));
  it('gives empty lists for wrong types', () => assert.deepEqual(readAppsFile('{"installed":"a","off":3}'), { installed: [], off: [] }));
});

describe('activeOf', () => {
  it('is installed minus off', () => assert.deepEqual(activeOf({ installed: ['a', 'b', 'c'], off: ['b'] }), ['a', 'c']));
});

describe('appsFileText', () => {
  it('writes sorted installed without off', () =>
    assert.equal(appsFileText({ installed: ['b', 'a'], off: [] }), '{\n  "installed": [\n    "a",\n    "b"\n  ]\n}\n'));
  it('writes off when set, keeping only installed ids', () =>
    assert.equal(appsFileText({ installed: ['a', 'b'], off: ['b', 'x'] }), second));
  it('round trips', () => assert.equal(appsFileText(readAppsFile(second)), second));
});

describe('withInstalled', () => {
  it('installs', () => assert.deepEqual(withInstalled({ installed: ['a'], off: [] }, 'b', true), { installed: ['a', 'b'], off: [] }));
  it('uninstall removes the id from off', () =>
    assert.deepEqual(withInstalled({ installed: ['a', 'b'], off: ['b'] }, 'b', false), { installed: ['a'], off: [] }));
});

describe('withOff', () => {
  it('turns an app off', () =>
    assert.deepEqual(withOff({ installed: ['a', 'b'], off: [] }, 'b', true), { installed: ['a', 'b'], off: ['b'] }));
  it('turns an app on', () =>
    assert.deepEqual(withOff({ installed: ['a', 'b'], off: ['b'] }, 'b', false), { installed: ['a', 'b'], off: [] }));
  it('ignores an app that is not installed', () =>
    assert.deepEqual(withOff({ installed: ['a'], off: [] }, 'x', true), { installed: ['a'], off: [] }));
});

describe('no mutation', () => {
  it('does not change a frozen state', () => {
    const state = Object.freeze({ installed: Object.freeze(['a', 'b']), off: Object.freeze([]) });
    assert.doesNotThrow(() => {
      withOff(state, 'b', true);
      withInstalled(state, 'c', true);
    });
  });
});
