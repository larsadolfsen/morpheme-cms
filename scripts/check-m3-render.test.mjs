// Tests of the logic behind check:m3-render (scripts/m3-render.mjs): token reading, what a sample is, the comparison, the allowlist and printed.json.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allow } from './m3-render.allow.mjs';
import { BATCHES, batchOf, compare, find, judge, keyOf, loadSet, num, printed, resolve, role, shape, tally, type } from './m3-render.mjs';

const button = (extra = {}) => ({
  root: 'mo-button',
  classes: ['mo-button', 'mo-is-filled'],
  disabled: false,
  box: { w: 100, h: 40 },
  pad: { l: 16, r: 16 },
  gap: 8,
  radius: { px: 20, full: true },
  border: { w: 0 },
  bgRoles: ['primary'],
  label: { fontSize: 14, lineHeight: 20, fontWeight: 500, tracking: 0.1, roles: ['on-primary'] },
  icon: undefined,
  ...extra,
});

test('the token copy is read: a length, a shape, a type and a colour role', () => {
  const set = 'md.comp.button.small';
  assert.equal(num(loadSet(set).get('container.height')), 40);
  assert.equal(shape(loadSet(set).get('container.shape.round')), 'full');
  assert.equal(shape(loadSet(set).get('container.shape.square')), 12);
  assert.deepEqual(type(loadSet(set).get('label-text')), { fontSize: 14, lineHeight: 20, fontWeight: 500, tracking: 0.1 });
  assert.equal(role(loadSet('md.comp.button.filled').get('container.color')), 'primary');
  assert.equal(find([set, 'md.comp.button'], 'nothing.here'), undefined);
});

test('a sample is resolved from its classes: our default button is Material 3 small, the others are the same', () => {
  const r = resolve(button());
  assert.equal(r.family, 'button');
  assert.equal(r.size, 'small');
  assert.equal(r.kind, 'filled');
  assert.equal(resolve(button({ classes: ['mo-button', 'mo-is-text'] })).kind, 'text');
  assert.equal(resolve(button({ classes: ['mo-button', 'mo-is-tonal', 'mo-is-xlarge'] })).size, 'xlarge');
  assert.equal(resolve(button({ classes: ['mo-button', 'mo-is-medium'] })).size, 'medium');
  assert.equal(resolve({ root: 'mo-list', classes: [] }), undefined);
});

test('a sample that equals Material 3 differs in nothing, in light and dark', () => {
  const m = button();
  assert.deepEqual(compare(m, resolve(m), 'light'), []);
  assert.deepEqual(compare({ ...m, bgRoles: ['primary'], label: { ...m.label, roles: ['on-primary'] } }, resolve(m), 'dark'), []);
});

test('a size is compared within 1 px, a colour must be the role', () => {
  const m = button({ box: { w: 100, h: 41 } });
  assert.deepEqual(compare(m, resolve(m), 'light'), []);
  const tall = button({ box: { w: 100, h: 44 }, pad: { l: 24, r: 24 }, bgRoles: ['secondary'] });
  const found = compare(tall, resolve(tall), 'light').map((f) => `${f.attr} ${f.got}->${f.want}`);
  assert.deepEqual(found.sort(), [
    'container.color secondary->primary',
    'container.height 44->40',
    'leading-space 24->16',
    'trailing-space 24->16',
  ]);
});

test('a disabled sample is not compared on colour', () => {
  const m = button({ disabled: true, bgRoles: [], label: { fontSize: 14, lineHeight: 20, fontWeight: 500, tracking: 0.1, roles: [] } });
  assert.deepEqual(compare(m, resolve(m), 'light'), []);
});

test('the allowlist: a difference not listed fails, a listed one that no longer differs fails', () => {
  const m = button({ box: { w: 100, h: 56 } });
  const found = tally(compare(m, resolve(m), 'light'), '');
  const entry = { set: 'md.comp.button.small', attr: 'container.height', got: 56, want: 40, class: 'fix', batch: 'buttons' };
  assert.deepEqual(judge(found, [entry]), { unlisted: [], stale: [], bad: [] });
  assert.equal(judge(found, []).unlisted.length, 1);
  assert.deepEqual(judge(new Map(), [entry]).stale, [keyOf(entry)]);
  assert.deepEqual(judge(found, [{ ...entry, batch: undefined }]).bad, [keyOf(entry)]);
  assert.deepEqual(judge(found, [{ ...entry, class: 'owner' }]).bad, [keyOf(entry)]);
});

test('every entry of the allowlist names a class and a batch or a reason, and a real set', () => {
  for (const a of allow) {
    assert.ok(['fix', 'owner', 'wcag'].includes(a.class), keyOf(a));
    if (a.class === 'fix') assert.ok(BATCHES.includes(a.batch), `${keyOf(a)} names the batch "${a.batch}"`);
    else assert.ok(a.why, keyOf(a));
    assert.ok(loadSet(a.set).size || printed().some((p) => p.family === a.set), `${a.set} is no token set`);
  }
  assert.equal(new Set(allow.map(keyOf)).size, allow.length, 'an entry is listed twice');
});

test('batches follow the plan', () => {
  assert.equal(batchOf('md.comp.button.small'), 'buttons');
  assert.equal(batchOf('md.comp.filter-chip'), 'chips');
  assert.equal(batchOf('md.comp.outlined-text-field'), 'text fields');
  assert.equal(batchOf('md.comp.sheet.bottom'), 'dialogs and sheets');
  assert.equal(batchOf('md.comp.badge'), 'the rest');
});

test('every value of printed.json has its page, its quoted sentence and a way to measure it', () => {
  const list = printed();
  assert.ok(list.length > 0);
  for (const p of list) {
    assert.match(p.url, /^https:\/\/m3\.material\.io\//, p.id);
    assert.ok(p.quote?.length > 8, `${p.id} has no quoted sentence`);
    assert.ok(
      typeof p.value === 'number' &&
        p.unit &&
        p.selector &&
        ['min-width', 'max-width', 'height'].includes(p.measure) &&
        ['eq', 'min'].includes(p.op),
      p.id,
    );
  }
  assert.equal(new Set(list.map((p) => p.id)).size, list.length);
});
