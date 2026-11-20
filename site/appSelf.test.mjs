// Tests for the @app/self Vite plugin (site/appSelf.mjs): the id an app file gets, and the error outside apps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { appSelf } from './appSelf.mjs';

/** The module text the plugin makes for `@app/self` imported from `importer`. */
const moduleFor = (importer) => {
  const plugin = appSelf();
  const id = plugin.resolveId('@app/self', importer);
  return plugin.load(id);
};

test('gives a store id', () => {
  assert.equal(moduleFor('/x/src/apps/app_a030dfba69793996/link.ts'), "export default { id: 'app_a030dfba69793996' };");
});

test('gives a plain folder name', () => {
  assert.equal(moduleFor('/x/src/apps/cookiescanner/worker.js'), "export default { id: 'cookiescanner' };");
});

test('gives the app of a nested file', () => {
  assert.equal(moduleFor('/x/src/apps/mobilepay/blocks/mobilepay/load.ts'), "export default { id: 'mobilepay' };");
});

test('throws outside an app, with the path', () => {
  assert.throws(() => moduleFor('/x/src/themes/saturn/a.ts'), /@app\/self is only for app files: \/x\/src\/themes\/saturn\/a\.ts/);
});

test('gives the same id for a Windows path', () => {
  assert.equal(moduleFor(String.raw`C:\x\src\apps\app_a030dfba69793996\link.ts`), moduleFor('/x/src/apps/app_a030dfba69793996/link.ts'));
});

test('ignores other imports', () => {
  assert.equal(appSelf().resolveId('react', '/x/src/apps/a/b.ts'), null);
});
