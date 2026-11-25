import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bannedImports } from './check-phosphor.mjs';

test('an import of Phosphor or Lucide is found, whatever its form', () => {
  assert.deepEqual(bannedImports("import { Eye } from '@phosphor-icons/react';"), ['@phosphor-icons/react']);
  assert.deepEqual(bannedImports("import eye from '@phosphor-icons/core/assets/regular/eye.svg?raw';"), [
    '@phosphor-icons/core/assets/regular/eye.svg?raw',
  ]);
  assert.deepEqual(bannedImports("import 'lucide-react';"), ['lucide-react']);
  assert.deepEqual(bannedImports("const x = await import('lucide-static/icons/a.svg');"), ['lucide-static/icons/a.svg']);
  assert.deepEqual(bannedImports("const x = require('lucide');"), ['lucide']);
});

test('other imports are not', () => {
  assert.deepEqual(
    bannedImports("import a from 'react'; import b from './lucidity.mjs'; import c from '@material-symbols/svg-400/outlined/a.svg?raw';"),
    [],
  );
});
