import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { NOT_RENAMED, buildMap, mapClass, mapProp, readTree, scan, scanCss, scanMarkup } from './mo-names.mjs';
import { problems, problemsOf } from './check-mo-names.mjs';

test('scanCss finds unprefixed class definitions, declared and read properties; mo- names, keyframes and escaped Tailwind selectors are not counted', () => {
  const s = scanCss(`
    .card-body, .mo-card .card-check:hover { --card-sample: 1px; padding: var(--card-pad, var(--mo-sys-x)); }
    .mo-ok { --mo-comp-card-sample: 1px; }
    .medium\\:flex { color: red; }
    @keyframes spin { from { opacity: 0 } }
    .ProseMirror p { margin: 0 }
    .task-list-item { color: red }
  `);
  assert.deepEqual([...s.classDefs.keys()].sort(), ['card-body', 'card-check']);
  assert.deepEqual([...s.declared.keys()], ['--card-sample']);
  assert.deepEqual([...s.read.keys()], ['--card-pad']);
});

test('scanMarkup counts only names a stylesheet defines, in class attributes, classList, selectors and strings', () => {
  const known = new Set(['card-body', 'button']);
  const code = `
    <div class="card-body flex p-4" /> <Foo className={cn('button', open && 'p-2')} />
    el.classList.add('card-body'); document.querySelector('.card-body > .button');
    const label = 'button'; // not a class context
    <style>.card-body { color: red }</style>
  `;
  const found = scanMarkup('a.tsx', code, known);
  assert.equal(found.get('card-body'), 3);
  assert.equal(found.get('button'), 2);
  assert.equal(scanMarkup('a.tsx', '<p class="mo-card flex">', known).size, 0);
});

test('mapClass follows the pattern: root, part, state, holds, block, editor, type', () => {
  const to = (n) => mapClass(n).new;
  assert.equal(to('card'), 'mo-card');
  assert.equal(to('card-body'), 'mo-card__body');
  assert.equal(to('text-field-helper'), 'mo-text-field__helper');
  assert.equal(to('card-selected'), 'mo-is-selected');
  assert.equal(mapClass('card-selected').on, 'mo-card');
  assert.equal(to('button-filled'), 'mo-is-filled');
  assert.equal(to('card-with-media'), 'mo-has-media');
  assert.equal(to('block-accordion-answer'), 'mo-block-accordion__answer');
  assert.equal(to('block-accordion'), 'mo-block-accordion');
  assert.equal(to('editor-fab'), 'mo-editor-fab');
  assert.equal(to('body-small'), 'mo-type-body-small');
  assert.equal(to('color-accent'), 'mo-has-accent-color');
});

test('a name the pattern does not settle is a question, never a guess', () => {
  for (const n of ['block-price', 'choice-group', 'theme-action-bar']) {
    const m = mapClass(n);
    assert.equal(m.status, 'question', n);
    assert.equal(m.new, undefined, n);
    assert.ok(m.question.includes(n), n);
  }
  assert.equal(mapProp('--choice-group-gap').status, 'question');
});

test('mapProp: a component hook or runtime value becomes --mo-comp-<component>-*', () => {
  assert.equal(mapProp('--card-selected-surface').new, '--mo-comp-card-selected-surface');
  assert.equal(mapProp('--slider-start', { declaredOnly: true }).new, '--mo-comp-slider-start');
  assert.equal(mapProp('--time-picker-angle').new, '--mo-comp-time-picker-angle');
});

test('buildMap: two names with one target both become questions, and questions come grouped by family', () => {
  const { names } = scan({
    'a.css': '.card-with-media {} .card-has-media {} .block-price-a {} .block-price-b {} .card-body {}',
  });
  const map = buildMap(names);
  assert.equal(map.classes['card-body'].new, 'mo-card__body');
  assert.deepEqual(map.questions.classes.find((g) => g.family === 'block-price').names, ['block-price-a', 'block-price-b']);
});

test('PM defaults (18 Nov): utilities are removed, progress, tabs, inline, site, drawer and a state with a part', () => {
  assert.equal(mapClass('mb-8').status, 'removed');
  assert.equal(mapClass('space-y-4').new, undefined);
  assert.deepEqual(
    [mapClass('circular-progress-indicator').new, mapClass('circular-progress-indicator').kind],
    ['mo-progress-indicator', 'mo-is-circular'],
  );
  assert.equal(mapClass('linear-progress-indicator-track').new, 'mo-progress-indicator__track');
  assert.equal(mapClass('tab-label').new, 'mo-tabs__tab-label');
  assert.equal(mapClass('inline-faq').new, 'mo-editor-inline-faq');
  assert.equal(mapClass('site-block-card').new, 'mo-site-block-card');
  assert.equal(mapClass('md-drawer-head').new, 'mo-navigation-drawer__head');
  assert.equal(mapClass('card-selected-hover').new, 'mo-is-selected');
  assert.match(mapClass('card-selected-hover').note, /:hover/);
  assert.deepEqual([mapClass('card-selected-title').new, mapClass('card-selected-title').also], ['mo-card__title', 'mo-is-selected']);
  assert.equal(mapClass('card-selected-title').settledBy, 'PM');
  assert.equal(mapProp('--tab-gap').new, '--mo-comp-tabs-gap');
});

test('a block part whose type is no folder name follows the block that draws it, only when one folder draws it', () => {
  const { names } = scan({
    'theme/blocks/pricecards/a.css': '.block-plan-amount { color: red }',
    'theme/blocks/pricecards/View.tsx': '<p class="block-plan-amount block-shared">',
    'theme/blocks/cards/b.css': '.block-shared { color: red }',
  });
  const map = buildMap(names);
  assert.equal(map.classes['block-plan-amount'].new, 'mo-block-pricecards__plan-amount');
  assert.equal(map.classes['block-plan-amount'].settledBy, 'PM');
  assert.equal(map.classes['block-shared'].status, 'question');
  assert.deepEqual(map.questions.classes[0].owners, ['M4']);
});

test('the check has no allowlist: any unprefixed name fails, naming the file and what to do', () => {
  const found = problemsOf({ 'a.css': { classDefs: 2 }, 'b.tsx': { markup: 1 }, 'c.css': { propsRead: 1, propsDeclared: 1 }, 'd.css': {} });
  assert.equal(found.length, 4);
  assert.match(found[0], /^a\.css: 2 unprefixed class definitions\..*mo-/);
  assert.match(found[1], /^b\.tsx: 1 unprefixed class names in markup or code/);
  assert.ok(!existsSync(new URL('mo-names-allowlist.json', import.meta.url)));
});

const fails = (files, pattern) => {
  const found = problems(files);
  assert.ok(found.length, `should fail: ${JSON.stringify(files)}`);
  assert.match(found.join('\n'), pattern);
};

test('a class or a property that does not start with mo- fails in a stylesheet, markup, a selector string and classList', () => {
  fails({ 'a.css': '.card-new { color: red }' }, /a\.css: 1 unprefixed class definitions/);
  fails({ 'a.css': '.mo-card { color: var(--card-pad, red) }' }, /1 unprefixed custom properties read/);
  fails({ 'a.css': '.mo-card { --pad: 1px }' }, /1 unprefixed custom properties declared/);
  fails({ 'a.css': '.card-new {}', 'a.tsx': '<div className="card-new" />' }, /a\.tsx: 1 unprefixed class names in markup/);
  fails(
    { 'a.css': '.card-new {}', 'a.mjs': "el.classList.add('card-new'); el.querySelector('.card-new'); el.matches('.card-new > p');" },
    /a\.mjs: 3 unprefixed class names/,
  );
  // An old name of the rename (renamed-classes.json) fails even when no stylesheet defines it any more: the rename missed a string.
  fails({ 'a.mjs': "document.querySelector('.card-body')" }, /a\.mjs: 1 unprefixed class names/);
  fails({ 'a.mjs': "el.classList.contains('block-accordion-answer')" }, /a\.mjs: 1 unprefixed class names/);
});

test('a substring selector that spells an old or non-mo name fails, in CSS and in strings', () => {
  fails({ 'a.css': '[class*="card-"] { color: red }' }, /a\.css:1: \[class\*="card-"\] spells a name that does not start with mo-/);
  fails({ 'a.css': '.mo-a [class^=block-] {}' }, /\[class\^=block-\]/);
  fails({ 'a.mjs': 'document.querySelectorAll(\'[class$="-body"]\')' }, /\[class\$="-body"\]/);
  fails({ 'a.mjs': 'el.matches(\'[class~="lead"]\')' }, /\[class~="lead"\]/);
  fails({ 'a.mjs': 'el.matches(\'[style*="--card-pad"]\')' }, /\[style\*="--card-pad"\]/);
  for (const ok of [
    '[class*="mo-card"]',
    '[class^="mo-"]',
    "[class*=' mo-block']",
    '[class*="ProseMirror"]',
    '[style*="--mo-comp-card-pad"]',
    '[style*="display"]',
    '[class]',
    '[data-class*="x"]',
  ])
    assert.deepEqual(problems({ 'a.mjs': `const s = '${ok}';` }), [], ok);
});

test('a mo- class has the shape of docs/class-names.md; a plain class attribute holds only mo- names', () => {
  for (const bad of ['.mo-cardBody', '.mo-card_body', '.mo-a__b__c', '.mo-Card'])
    fails({ 'a.css': `${bad} { color: red }` }, /starts with mo- but is not of the shape/);
  for (const good of [
    '.mo-card',
    '.mo-card__body',
    '.mo-is-selected',
    '.mo-has-media',
    '.mo-block-cards__plan-name',
    '.mo-staggered-grid__span-full',
  ])
    assert.deepEqual(problems({ 'a.css': `${good} { color: red }` }), [], good);
  fails(
    { 'a.tsx': '<div class="mo-card hook-only" />' },
    /the class "hook-only" is written in a class attribute and does not start with mo-/,
  );
  fails({ 'page.md': '<p class="lead">x</p>' }, /page\.md:1: the class "lead"/);
  assert.deepEqual(problems({ 'a.tsx': '<div class="mo-card mo-prose mo-is-not-prose ProseMirror task-list-item" />' }), []);
  fails({ 'a.tsx': '<div class="mo-card prose" />' }, /the class "prose"/);
  fails({ 'a.tsx': '<div class="not-prose" />' }, /the class "not-prose"/);
});

test('what is not ours stays, with its reason', () => {
  for (const name of [
    'ProseMirror',
    'ProseMirror-focused',
    'cm-editor',
    'calendly-inline-widget',
    'dark',
    'contains-task-list',
    'task-list-item',
  ])
    assert.ok(
      NOT_RENAMED.some(({ pattern }) => pattern === name || (pattern.endsWith('*') && name.startsWith(pattern.slice(0, -1)))),
      name,
    );
  assert.ok(NOT_RENAMED.every(({ why }) => why.length > 10));
});

test('the tree: every name is mo-, and the check is part of npm run check', () => {
  assert.deepEqual(problems(readTree()), []);
  const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;
  assert.match(scripts['check:source'], /check:mo-names/);
});

test("a site's themes and apps are checked with the same rules", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { siteProblems } = await import('./check-mo-names.mjs');
  const root = mkdtempSync(join(tmpdir(), 'mo-'));
  mkdirSync(join(root, 'src/apps/venus'), { recursive: true });
  writeFileSync(join(root, 'src/apps/venus/a.css'), '.venus-card { color: red }');
  assert.match(siteProblems(root).join('\n'), /src\/apps\/venus\/a\.css: 1 unprefixed class definitions/);
  writeFileSync(join(root, 'src/apps/venus/a.css'), '.mo-venus__card { color: red }');
  assert.deepEqual(siteProblems(root), []);
});
