import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, mapClass, mapProp, scan, scanCss, scanMarkup } from './mo-names.mjs';
import { compare } from './check-mo-names.mjs';

test('scanCss finds unprefixed class definitions, declared and read properties; mo- names, keyframes and escaped Tailwind selectors are not counted', () => {
  const s = scanCss(`
    .card-body, .mo-card .card-check:hover { --card-sample: 1px; padding: var(--card-pad, var(--mo-sys-x)); }
    .mo-ok { --mo-comp-card-sample: 1px; }
    .medium\\:flex { color: red; }
    @keyframes spin { from { opacity: 0 } }
    .ProseMirror p { margin: 0 }
    .prose { color: red }
    :root { --tw-ring: 1; --color-x: red; }
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

test('the ratchet fails on a rise and on a new file, and says what to lower', () => {
  const allow = { files: { 'a.css': { classDefs: 2, markup: 0, propsDeclared: 0, propsRead: 1 } } };
  assert.deepEqual(compare({ 'a.css': { classDefs: 2, propsRead: 1 } }, allow).problems, []);
  assert.match(
    compare({ 'a.css': { classDefs: 3, propsRead: 1 } }, allow).problems.join('\n'),
    /a\.css: 3 unprefixed class definitions, 2 allowed/,
  );
  assert.match(compare({ 'b.css': { markup: 1 } }, allow).problems.join('\n'), /b\.css: 1 .* in a file the list does not know/);
  const fell = compare({ 'a.css': { classDefs: 1, propsRead: 1 } }, allow);
  assert.deepEqual(fell.problems, []);
  assert.match(fell.lowered.join('\n'), /classDefs is 1 of 2 allowed: lower it in scripts\/mo-names-allowlist\.json/);
});
