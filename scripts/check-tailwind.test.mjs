import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { configProblems, tailwindProblems, utilityProblems, UTILITIES } from '../site/tailwind.mjs';
import { ROOT, treeProblems } from './check-tailwind.mjs';

const fails = (file, source, rule) => {
  const found = utilityProblems(file, source);
  assert.ok(found.length, `${file} should fail: ${source}`);
  assert.match(found[0], new RegExp(`^${file.replace('.', '\\.')}:\\d+: Tailwind is gone`));
  assert.match(found[0], rule);
};

test('a utility in a class attribute fails, naming the file and the rule', () => {
  fails('a.tsx', '<div className="flex gap-2 mo-row">x</div>', /`flex` in a class attribute is a utility of the frozen list/);
  fails('a.astro', '<p class="text-sm">x</p>', /`text-sm`/);
  fails('a.tsx', '<p className={on ? "mb-4" : ""}>x</p>', /`mb-4`/);
  fails('a.tsx', '<p className={cx("mo-card", "space-y-4")}>x</p>', /`space-y-4`/);
});

test('a utility in a Markdown file fails', () => fails('page.md', '<div class="grid grid-cols-3">x</div>', /`grid`/));

test('a variant, an arbitrary value and an arbitrary property fail', () => {
  fails('a.tsx', '<div className="medium:gap-4">x</div>', /the variant `medium:`/);
  fails('a.tsx', '<div className="hover:mo-card">x</div>', /the variant `hover:`/);
  fails('a.tsx', '<div className="group-hover:mo-card">x</div>', /the variant `group-hover:`/);
  fails('a.tsx', '<div className="[&>p]:mo-card">x</div>', /the variant/);
  fails('a.tsx', '<div className="w-[3px]">x</div>', /an arbitrary value/);
  fails('a.tsx', '<div className="[mask-size:contain]">x</div>', /an arbitrary property/);
  fails('a.tsx', '<div className="rounded-(--mo-sys-shape)">x</div>', /an arbitrary value/);
});

test('a family that is not in the frozen list fails', () => {
  fails('a.tsx', '<div className="p-7">x</div>', /utility family/);
  fails('a.tsx', '<div className="bg-red-500">x</div>', /utility family/);
  fails('a.tsx', '<div className="-mt-9">x</div>', /utility family/);
});

test('a string of utilities in code fails, a lone word does not', () => {
  fails('a.ts', "const c = 'flex items-center gap-2';", /string of utilities/);
  fails('a.mjs', 'const c = `hidden medium:flex`;', /string of utilities/);
  assert.deepEqual(utilityProblems('a.ts', "const display = 'flex'; const w = 'hidden'; const e = 'ease-out'; const s = 'block';"), []);
  assert.deepEqual(utilityProblems('a.ts', "const is = x === 'group' || x === 'file:';"), []);
});

test('a stylesheet fails on each Tailwind rule', () => {
  fails('a.css', "@import 'tailwindcss';", /@import of tailwindcss in a stylesheet/);
  for (const rule of [
    '@theme { --x: 1 }',
    '@utility foo { a: b }',
    '@plugin "x";',
    '@apply flex;',
    '@source "x";',
    '@reference "x";',
    '@custom-variant x (a);',
  ])
    fails('a.css', `.a { }\n${rule}`, new RegExp(`${rule.split(/[ {]/)[0]} in a stylesheet`));
  fails('a.css', '.a { margin: theme(--spacing-4); }', /theme\(--…\)/);
  fails('a.css', '.a { --tw-ring-offset: 0; }', /--tw-…/);
  assert.match(utilityProblems('a.css', '.a {}\n\n.b { @apply flex; }')[0], /^a\.css:3:/);
});

test('the package and the Prettier config fail', () => {
  assert.match(configProblems('package.json', '{"devDependencies":{"tailwindcss":"^4"}}')[0], /`tailwindcss` in devDependencies/);
  assert.match(configProblems('package.json', '{"dependencies":{"@tailwindcss/vite":"^4"}}')[0], /`@tailwindcss\/vite`/);
  assert.match(configProblems('package.json', '{"prettier":{"plugins":["prettier-plugin-tailwindcss"]}}')[0], /`prettier` key/);
  assert.match(configProblems('.prettierrc', '{"plugins":["prettier-plugin-tailwindcss"]}')[0], /Prettier's settings/);
  assert.match(utilityProblems('astro.config.mjs', "import tailwindcss from '@tailwindcss/vite';")[0], /imported or named/);
  assert.deepEqual(configProblems('package.json', '{"dependencies":{"astro":"^5"}}'), []);
});

test('mo- names, prose, parts and plain words pass', () => {
  const ok = [
    '<div className="mo-card mo-is-selected mo-has-media mo-row mo-stack mo-type-body-small">x</div>',
    '<div className="mo-prose mo-is-not-prose mo-block-cards__card dark js">x</div>',
    '<div className="mo-row medium:mo-grid">x</div>'.replace('medium:', ''),
    '<div className={`mo-card ${on ? "mo-is-filled" : ""}`}>x</div>',
    '<div className="mo-staggered-grid mo-staggered-grid__span-full calendly-inline-widget ProseMirror">x</div>',
  ];
  for (const source of ok) assert.deepEqual(utilityProblems('a.tsx', source), [], source);
  assert.deepEqual(utilityProblems('a.css', '.mo-card { display: flex; --mo-comp-card-gap: 1rem; } /* @apply is gone */'), []);
  assert.deepEqual(utilityProblems('a.md', '<div class="mo-has-accent-color">x</div>'), []);
});

test('the frozen list holds only plain base names and is not empty', () => {
  assert.ok(UTILITIES.size > 300);
  for (const name of UTILITIES) assert.doesNotMatch(name, /^mo-|[\s:[(]/, name);
});

test("a site's themes, apps, content and config are checked", () => {
  const root = mkdtempSync(join(tmpdir(), 'tw-'));
  for (const dir of ['src/themes/x', 'src/apps/y', 'src/content/pages']) mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, 'src/themes/x/Card.tsx'), '<div className="flex gap-2">x</div>');
  writeFileSync(join(root, 'src/apps/y/a.css'), '.a { @apply flex; }');
  writeFileSync(join(root, 'src/content/pages/p.md'), '<div class="mb-4">x</div>');
  writeFileSync(join(root, 'package.json'), '{"devDependencies":{"tailwindcss":"4"}}');
  const found = tailwindProblems(root);
  assert.equal(found.length, 5, found.join('\n'));
  assert.ok(found.every((p) => p.startsWith('src/') || p.startsWith('package.json')));
  writeFileSync(join(root, 'src/themes/x/Card.tsx'), '<div className="mo-row">x</div>');
  assert.equal(tailwindProblems(root).length, 3);
});

test('the tree has no Tailwind, and the script is part of npm run check', () => {
  assert.deepEqual(treeProblems(), []);
  const scripts = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8')).scripts;
  assert.match(scripts['check:source'], /check:tailwind/);
  assert.equal(scripts['check:tailwind'], 'node scripts/check-tailwind.mjs');
  assert.equal(scripts['tailwind:inventory'], undefined);
  assert.doesNotThrow(() => execFileSync('node', ['scripts/check-tailwind.mjs'], { cwd: ROOT, stdio: 'pipe' }));
});
