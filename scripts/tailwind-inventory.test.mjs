import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, classAttributes, trackedFiles, familyOf, report, scanTree, splitVariants, stringsIn } from './tailwind-inventory.mjs';

test('stringsIn finds strings and template parts, not comments, and each string once', () => {
  const found = stringsIn("a('flex gap-2', `x ${open ? 'rotate-180' : ''} y`) // 'hidden'\n/* 'block' */ b(\"grid\")");
  assert.deepEqual(found.sort(), ['', 'flex gap-2', 'grid', 'rotate-180', 'x ', '  y'].sort());
});

test('classAttributes reads class, className, class:list and code in the braces', () => {
  const { strings } = classAttributes(
    `<a class="a b"/><b className='c'/><c className={cn('d', x && "e")}/><d class:list={['f', { g: ok }]}/><e data-class="no" notclass="no"/>`,
  );
  assert.deepEqual(strings.sort(), ['a b', 'c', 'd', 'e', 'f'].sort());
});

test('splitVariants splits at a colon outside brackets and parentheses', () => {
  assert.deepEqual(splitVariants('medium:hover:mt-8'), { variants: ['medium', 'hover'], utility: 'mt-8' });
  assert.deepEqual(splitVariants('[&:not(.a)]:flex'), { variants: ['[&:not(.a)]'], utility: 'flex' });
  assert.deepEqual(splitVariants('bg-[url(http://x)]'), { variants: [], utility: 'bg-[url(http://x)]' });
});

test('familyOf puts a utility in its family', () => {
  assert.equal(familyOf('flex'), 'display, flex, grid, alignment');
  assert.equal(familyOf('-mt-2'), 'spacing');
  assert.equal(familyOf('text-sm'), 'typography');
  assert.equal(familyOf('rounded-full'), 'colour, background, border');
});

test('scanTree counts utilities in class attributes, strings of .ts and .mjs, theme(), at-rules and --tw-, but not words in comments', async () => {
  const root = mkdtempSync(join(tmpdir(), 'tw-inventory-'));
  const files = {
    'src/A.tsx': `// flex in a comment\nexport const A = () => <div className={\`flex \${on ? 'gap-2' : ''}\`} class="hidden nothing-here"/>;\nconst c = 'border-[3px] mt-4';\nconst w = 'flex';`,
    'site/s.ts': `export const s = 'mt-10 medium:mt-14';`,
    'lib/m.mjs': `export const p = ['block', 'items-center justify-between'];`,
    'theme/x.css': `/* theme(--breakpoint-medium) */\n@theme inline { --a: 1; }\n@media (width >= theme(--breakpoint-medium)) { .a { --tw-x: 1; } }\n@plugin 'p';`,
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  const list = trackedFiles(root);
  assert.ok(list.includes('src/A.tsx'));
  const { files: found } = await scanTree(ROOT, list, root);
  assert.equal(found['src/A.tsx'].utilities, 3, 'flex, gap-2 and hidden (nothing-here is not a utility)');
  assert.equal(found['src/A.tsx'].constants, 2, '"border-[3px] mt-4"; a lone word like "flex" is not a class string');
  assert.equal(found['site/s.ts'].constants, 2);
  assert.equal(found['lib/m.mjs'].constants, 2, 'items-center justify-between (a lone "block" is a word)');
  assert.deepEqual(
    {
      theme: found['theme/x.css'].theme,
      themeAt: found['theme/x.css'].themeAt,
      plugin: found['theme/x.css'].plugin,
      tw: found['theme/x.css'].tw,
    },
    { theme: 1, themeAt: 1, plugin: 1, tw: 1 },
    'a comment is not counted',
  );
});

test('report adds up the folders and the families', () => {
  const r = report({
    files: { 'src/a.tsx': { utilities: 2 }, 'theme/b.css': { theme: 3 } },
    uses: [
      { file: 'src/a.tsx', name: 'flex', where: 'attribute' },
      { file: 'src/a.tsx', name: 'medium:mt-2', where: 'attribute' },
    ],
  });
  assert.equal(r.totals.utilityUses, 2);
  assert.equal(r.totals.themeFunction, 3);
  assert.equal(r.folders.src.utilities, 2);
  assert.equal(r.variants.medium.uses, 1);
  assert.equal(r.families['spacing'].uses, 1);
});
