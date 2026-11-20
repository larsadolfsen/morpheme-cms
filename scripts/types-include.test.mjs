// Tests that every .mjs module imported by TypeScript or Astro files in the package is included in tsconfig.types.json.
// This is required because TypeScript reads no types from JavaScript in node_modules, so a site's tsc fails without a .d.mts.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const PACKAGE = fileURLToPath(new URL('..', import.meta.url));

const tsconfigRaw = fs.readFileSync(path.join(PACKAGE, 'tsconfig.types.json'), 'utf-8');
const tsconfigJson = JSON.parse(
  tsconfigRaw
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n'),
);
const include = tsconfigJson.include;

function matches(filePath, pattern) {
  if (pattern.includes('**')) {
    const dir = pattern.replace('/**/*.mjs', '');
    return filePath.startsWith(`${dir}/`) && filePath.endsWith('.mjs');
  }
  return filePath === pattern;
}

function sources(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...sources(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.astro')) {
      if (!entry.name.endsWith('.d.ts')) {
        results.push(path.relative(PACKAGE, fullPath).replace(/\\/g, '/'));
      }
    }
  }
  return results;
}

function mjsImports(text) {
  const regex = /(?:from\s+|import\s*\()\s*(['"])([^'"]+\.mjs)\1/g;
  const specs = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    specs.push(match[2]);
  }
  return specs;
}

function resolve(file, spec) {
  if (spec.startsWith('@theme/')) {
    return `theme/${spec.slice('@theme/'.length)}`;
  }
  if (spec.startsWith('.')) {
    const dir = path.dirname(file);
    return path.relative(PACKAGE, path.join(dir, spec)).replace(/\\/g, '/');
  }
  return null;
}

test('each .mjs a .ts, .tsx or .astro file imports is in tsconfig.types.json include', () => {
  const missing = [];
  const files = sources(PACKAGE);
  for (const file of files) {
    const content = fs.readFileSync(path.join(PACKAGE, file), 'utf-8');
    const imports = mjsImports(content);
    for (const spec of imports) {
      const resolvedPath = resolve(file, spec);
      if (resolvedPath !== null) {
        const isMatched = include.some((pattern) => matches(resolvedPath, pattern));
        if (!isMatched) {
          missing.push({ file, spec, path: resolvedPath });
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('matches', () => {
  assert.equal(matches('theme/editor/looks.mjs', 'theme/**/*.mjs'), true);
  assert.equal(matches('theme/editor/looks.mjs', 'lib/**/*.mjs'), false);
  assert.equal(matches('scripts/releases.mjs', 'scripts/releases.mjs'), true);
  assert.equal(matches('scripts/other.mjs', 'scripts/releases.mjs'), false);
});
