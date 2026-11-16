import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FORMATS, formatsOf, validate, inputOf, isFormat } from './fieldFormats.mjs';
import { parseFields } from './fieldFlow.mjs';
import { parseDefinition, entryProblems } from './ownList.mjs';

const title = (extra = {}) => ({ id: 'title', kind: 'title', ...extra });

test('FORMATS are Email, Web address and Number; only Title and Body text have them', () => {
  assert.deepEqual(
    FORMATS.map((f) => [f.id, f.label]),
    [
      ['email', 'Email'],
      ['url', 'Web address'],
      ['number', 'Number'],
    ],
  );
  assert.equal(formatsOf('title'), FORMATS);
  assert.equal(formatsOf('text'), FORMATS);
  for (const k of ['icon', 'image', 'href', 'tags', 'date']) assert.deepEqual(formatsOf(k), []);
});

const cases = {
  email: [
    ['a@b.co', 'a.b+c@sub.example.org'],
    ['a', 'a@b', 'a b@c.de', '@b.co', 'a@@b.co', 'a@b..co', 'a@.co', ' a@b.co'],
  ],
  url: [
    ['https://example.com', 'http://a.dk/x?y=1#z'],
    ['example.com', 'ftp://a.dk', 'https://', 'https:// a.dk', 'javascript:alert(1)', 'https:///x'],
  ],
  number: [
    ['0', '-12', '3.5', '3,5'],
    ['', 'a', '1 2', '1.2.3', '1,', '.5', '--1', '1e3'],
  ],
};
for (const [format, [good, bad]] of Object.entries(cases)) {
  test(`validate: ${format}`, () => {
    for (const v of good) assert.equal(validate(v, title({ format })), null, v);
    for (const v of bad.filter((v) => v !== '')) assert.equal(validate(v, title({ format })), `format.${format}`, v);
  });
}

test('validate: an empty value is valid for every format, and for Any text', () => {
  for (const format of [undefined, 'email', 'url', 'number'])
    for (const v of [undefined, null, '', '   ', []]) assert.equal(validate(v, title({ format })), null);
  assert.equal(validate('anything at all', title()), null);
});

test('validate: required comes first and a format never makes a field required', () => {
  assert.equal(validate('', title({ required: true })), 'required');
  assert.equal(validate('  ', title({ required: true, format: 'email' })), 'required');
  assert.equal(validate(undefined, title({ required: true })), 'required');
  assert.equal(validate([], { kind: 'tags', required: true }), 'required');
  assert.equal(validate(['a'], { kind: 'tags', required: true }), null);
  assert.equal(validate('x', title({ required: true, format: 'email' })), 'format.email');
  assert.equal(validate('', title({ required: false, format: 'email' })), null);
});

test('validate ignores a format it does not enforce yet', () => {
  assert.equal(validate('x', title({ format: 'phone' })), null);
  assert.equal(validate('x', title({ format: 'nonsense' })), null);
});

test('inputOf draws the input of a field', () => {
  assert.deepEqual(inputOf(title()), { element: 'input', type: 'text' });
  assert.deepEqual(inputOf({ id: 't', kind: 'text' }), { element: 'textarea', type: 'text' });
  assert.deepEqual(inputOf(title({ format: 'email' })), { element: 'input', type: 'email', inputmode: 'email', autocomplete: 'email' });
  assert.deepEqual(inputOf(title({ format: 'url' })), { element: 'input', type: 'url', inputmode: 'url', autocomplete: 'url' });
  assert.deepEqual(inputOf(title({ format: 'number' })), { element: 'input', type: 'text', inputmode: 'decimal' });
  assert.equal(inputOf({ id: 'i', kind: 'image' }), null);
});

test('isFormat accepts the four formats and the reserved ones, only on Title and Body text', () => {
  assert.ok(isFormat('title', 'email') && isFormat('text', 'number') && isFormat('title', 'phone'));
  assert.ok(!isFormat('title', 'nonsense') && !isFormat('image', 'email') && !isFormat('title', 5));
});

const def = (fields, extra = {}) => JSON.stringify({ version: 2, label: 'L', fields, ...extra });

test('parseDefinition reads and keeps format, required and keys it does not know', () => {
  const fields = [{ id: 'title', kind: 'title', label: 'Email', format: 'email', required: true, minLength: 3, pattern: '^a$' }];
  const { definition, problems } = parseDefinition(def(fields));
  assert.equal(problems, undefined);
  assert.deepEqual(definition.fields, fields);
  assert.deepEqual(Object.keys(definition.fields[0]), ['id', 'kind', 'label', 'format', 'required', 'minLength', 'pattern']);
});

test('parseDefinition: an unknown format is a problem', () => {
  for (const f of [{ format: 'nonsense' }, { format: 5 }]) {
    assert.deepEqual(parseDefinition(def([{ id: 'title', kind: 'title', ...f }])).problems, ['The field "title" has an unknown format.']);
  }
  assert.deepEqual(parseDefinition(def([{ id: 'image', kind: 'image', format: 'email' }])).problems, [
    'The field "image" has an unknown format.',
  ]);
  assert.equal(parseDefinition(def([{ id: 'title', kind: 'title', required: 'yes' }])).problems.length, 1);
});

test('parseDefinition: a list without format, required or notes is unchanged', () => {
  const fields = [
    { id: 'title', kind: 'title', label: 'Name' },
    { id: 'tags', kind: 'tags' },
  ];
  const { definition } = parseDefinition(def(fields));
  assert.deepEqual(definition, { version: 2, label: 'L', fields, dropped: [] });
  assert.ok(!('notes' in definition));
});

test('parseFields reads the notes', () => {
  const raw = {
    fields: [{ id: 'title', kind: 'title' }],
    notes: [
      { style: 'heading', text: '  Hello ', after: null },
      { style: 'body', text: '', after: null },
      { style: 'label', text: 'After', after: 'title' },
    ],
  };
  const read = parseFields(raw, { kinds: ['title'] });
  assert.deepEqual(read.problems, []);
  assert.deepEqual(read.notes, [
    { style: 'heading', text: 'Hello', after: null },
    { style: 'label', text: 'After', after: 'title' },
  ]);
  const bad = parseFields(
    {
      fields: [],
      notes: [
        { style: 'big', text: 'a' },
        { style: 'body', text: 'a', after: 'gone' },
        { style: 'body', text: 'a\nb' },
      ],
    },
    { kinds: [] },
  );
  assert.equal(bad.problems.length, 3);
  assert.equal(bad.notes[0].after, null);
});

test('entryProblems checks required and format with validate', () => {
  const { definition } = parseDefinition(
    def([
      { id: 'title', kind: 'title', required: true },
      { id: 'title-2', kind: 'title', format: 'email' },
      { id: 'title-3', kind: 'title', format: 'url' },
      { id: 'title-4', kind: 'title', format: 'number' },
    ]),
  );
  assert.deepEqual(entryProblems(definition, { title: 'A', 'title-2': 'a@b.co', 'title-3': 'https://a.dk', 'title-4': '3,5' }), []);
  assert.deepEqual(entryProblems(definition, { 'title-2': '', 'title-3': '' }), ['"title" is required.']);
  assert.deepEqual(entryProblems(definition, { title: 'A', 'title-2': 'x', 'title-3': 'x', 'title-4': 'x' }), [
    '"title-2" must be a valid email address.',
    '"title-3" must be a valid web address.',
    '"title-4" must be a number.',
  ]);
});

test('the shared modules import nothing from src, React, Milkdown or the Worker', () => {
  for (const file of ['fieldFormats.mjs', 'fieldFlow.mjs']) {
    const imports = [...readFileSync(new URL(`./${file}`, import.meta.url), 'utf8').matchAll(/^import .*from '(.*)'/gm)].map((m) => m[1]);
    for (const from of imports) assert.match(from, /^\.\/(fieldFormats|fieldFlow)\.mjs$/, `${file} imports ${from}`);
  }
});
