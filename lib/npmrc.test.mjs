// Tests for lib/npmrc.mjs. Run: node --test lib/npmrc.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INSTALL_DEFAULTS, withInstallDefaults } from './npmrc.mjs';

test('a site without an .npmrc gets the three lines', () => {
  assert.equal(withInstallDefaults(undefined), 'prefer-offline=true\naudit=false\nfund=false\n');
  assert.equal(withInstallDefaults(null), 'prefer-offline=true\naudit=false\nfund=false\n');
  assert.deepEqual(Object.keys(INSTALL_DEFAULTS), ['prefer-offline', 'audit', 'fund']);
});

test('an existing .npmrc keeps its own lines and gets the missing ones', () => {
  assert.equal(
    withInstallDefaults('registry=https://example.com/\n'),
    'registry=https://example.com/\nprefer-offline=true\naudit=false\nfund=false\n',
  );
  assert.equal(withInstallDefaults('registry=x'), 'registry=x\nprefer-offline=true\naudit=false\nfund=false\n');
});

test('a key the site sets itself keeps its value, with spaces, comments or other case of the value', () => {
  assert.equal(withInstallDefaults('audit = true\n'), 'audit = true\nprefer-offline=true\nfund=false\n');
  assert.equal(withInstallDefaults('# audit=true\n'), '# audit=true\nprefer-offline=true\naudit=false\nfund=false\n');
  assert.equal(withInstallDefaults('fund=true\r\n'), 'fund=true\r\nprefer-offline=true\r\naudit=false\r\n');
});

test('it is idempotent and changes nothing when the lines are there', () => {
  const once = withInstallDefaults('registry=x\n');
  assert.equal(withInstallDefaults(once), once);
  assert.equal(withInstallDefaults(withInstallDefaults(undefined)), withInstallDefaults(undefined));
  assert.equal(withInstallDefaults('prefer-offline=false\naudit=false\nfund=false\n'), 'prefer-offline=false\naudit=false\nfund=false\n');
});

test("the starter's .npmrc has the install lines", async () => {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(new URL('../starter/.npmrc', import.meta.url), 'utf8');
  assert.equal(withInstallDefaults(text), text, 'every line is there');
  for (const [key, value] of Object.entries(INSTALL_DEFAULTS)) assert.match(text, new RegExp(`^${key}=${value}$`, 'm'));
});
