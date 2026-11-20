// The made-up status of the screens check must not depend on the installed package: a pre-release (next) build has a
// version compareVersions refuses, which hides the Update button the check clicks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareVersions } from '../lib/cms-version.mjs';
import { CMS_STATUS } from './built-site.mjs';

test('the made-up status compares as a plain older running version', () => {
  assert.equal(compareVersions(CMS_STATUS.checked.latest, CMS_STATUS.running), 1);
});
