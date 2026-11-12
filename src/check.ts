// The rules a value must keep to before it is saved, from its fields (collections.ts): what must be
// filled in, the form of a text (a pattern, an address, a number in pairs), the kind of each value
// and that a choice is one of the options. The editor checks with them before it saves (fields.tsx
// and the forms), and the site before it is built (packages/editor/scripts/check-content.mjs), so what the editor
// would not save does not reach the site either. Also how a value is saved (clean) and a new one
// (newValue). No React here, so the build can use it.
import type { Field, Only, Template } from './schema';
import { addressOf } from './addresses';
import { codeAt, regionOf } from './countries';
import { blocksIn } from '../lib/blocks.mjs';
import { t } from './i18n';

type Item = Record<string, unknown>;

/** The fields and value an object's fields are in: an item of a list is in the object with the list
 * (a block's cards in the block), which may be in another. */
export type Around = { fields: Field[]; value: Record<string, unknown> | undefined; around?: Around };

/** Whether a field is in use: always, or (Field.only) while the field it depends on has one of the
 * values (its default when it has none yet) and is in use itself (a pop-up's delay, by when it opens,
 * which a kind without it does not have). That field is next to it or, for a field of an item in a
 * list, next to the list (`around`): a card's icon by the block's design. */
export function inUse(
  field: Field,
  fields: Field[],
  value: Record<string, unknown> | undefined,
  around?: Around,
  /** The fields being asked about already: two that hide each other (a card's link and its buttons) do not ask for ever. */
  asked: Field[] = [],
): boolean {
  if (!field.only) return true;
  const here = [...asked, field];
  for (let only: Only | undefined = field.only; only; only = only.and) {
    const name = only.field;
    let at: Around = { fields, value, around };
    while (at.around && !at.fields.some((f) => f.name === name)) at = at.around;
    const by = at.fields.find((f) => f.name === name);
    const holds =
      only.is.includes(String(at.value?.[name] ?? by?.default ?? '')) !== !!only.not &&
      (!by || by === field || only.loose || here.includes(by) || inUse(by, at.fields, at.value, at.around, here));
    if (!holds) return false;
  }
  return true;
}

// The block an item of a list of blocks is (undefined for a type the editor does not know).
const blockOf = (field: Field, item: unknown) => field.blocks!.find((b) => b.type === (item as Item)?.type);

// The kind of value a field holds, and what is said when it holds another (a file edited by hand).
const kindOf = (f: Field) =>
  f.type === 'list' || f.type === 'blocks' || f.multiple
    ? 'list'
    : f.type === 'object'
      ? 'object'
      : f.type === 'number'
        ? 'number'
        : f.type === 'boolean'
          ? 'boolean'
          : 'text';
function ofItsKind(f: Field, v: unknown): boolean {
  // Only shown, never edited here: whatever the file has.
  if (f.type === 'readonly') return true;
  switch (kindOf(f)) {
    case 'list':
      return Array.isArray(v);
    case 'object':
      return typeof v === 'object' && v !== null && !Array.isArray(v);
    case 'number':
      return typeof v === 'number' && Number.isFinite(v);
    case 'boolean':
      return typeof v === 'boolean';
    default:
      return typeof v === 'string';
  }
}

// A new, empty item of a list.
export const newItem = (field: Field) => (field.field ? '' : newValue(field.fields!));

/** A saved value with the defaults of the fields it has no value for (a field added after it was
 * saved, the pop-up's "Scrolled down"), after its own values. */
export const withDefaults = (fields: Field[], value: Record<string, unknown>): Record<string, unknown> => ({
  ...value,
  ...Object.fromEntries(fields.filter((f) => f.default !== undefined && value?.[f.name] === undefined).map((f) => [f.name, f.default])),
});

/** A saved entry in a form: its own values, and for a field it has none for, what that means (Field.missing), else
 * its value in a new entry (newValue). */
export const savedValue = (fields: Field[], value: Record<string, unknown>): Record<string, unknown> => ({
  ...newValue(fields),
  ...Object.fromEntries(fields.filter((f) => f.missing !== undefined).map((f) => [f.name, f.missing])),
  ...value,
});

// An empty entry for a list of objects or a new file: the fields' defaults, lists empty.
export function newValue(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.default ??
        (f.type === 'list' || f.type === 'blocks' || f.multiple
          ? []
          : f.type === 'object'
            ? newValue(f.fields!)
            : f.type === 'boolean'
              ? false
              : ''),
    ]),
  );
}

// A number typed with or without spaces (or dots, dashes, the site's own country code before a phone
// number) as its digits in pairs, "30 64 16 12"; a text that is not only digits as it was typed.
// abroad: a phone number with another country code, which is not counted or taken off.
function digitsOf(field: Field, text: string, abroad = false) {
  let digits = text.replace(/[\s.\-()]/g, '').replace(/^\+/, '');
  const own = !abroad && field.phone?.slice(1);
  if (own && typeof field.digitsInPairs === 'number' && digits.length === field.digitsInPairs + own.length && digits.startsWith(own))
    digits = digits.slice(own.length);
  return digits;
}
function pairsOf(field: Field, text: string) {
  const digits = digitsOf(field, text);
  return /^\d+$/.test(digits) ? digits.match(/\d{1,2}/g)!.join(' ') : text;
}

/** A phone number's country code and the number after it (Field.phone): one without a code, or with
 * the site's own, is in the site's own country; one typed with another (+46 or 0046, with a space
 * after it or not) has it taken off. */
export function phoneParts(field: Field, text: string): [code: string, number: string] {
  const typed = text.trim();
  const m = typed.match(/^(?:\+|00)(\d*)(.*)$/s);
  if (!m) return [field.phone!, typed];
  // Written "+46 70 12 34 56", the code is the digits before the space; together, the longest that is one.
  const whole = regionOf(`+${m[1]}`) ? `+${m[1]}` : undefined;
  const code = (m[2] && whole) || codeAt(m[1]) || whole;
  if (!code) return [field.phone!, typed];
  return [code, `${m[1].slice(code.length - 1)}${m[2]}`.trim()];
}

/** A phone number as it is saved: with the site's own country code, the number alone; with another,
 * the code before it. A number typed with a code keeps that one. */
export function phoneText(field: Field, code: string, number: string) {
  const typed = number.trim();
  return !typed || /^(\+|00)/.test(typed) || code === field.phone ? number : `${code} ${number}`;
}

// A phone number in another country is written as it was typed (its groups differ from country to
// country), only with one space between them.
export function inPairs(field: Field, text: string) {
  if (!field.phone) return pairsOf(field, text);
  const [code, number] = phoneParts(field, text);
  return phoneText(field, code, code === field.phone ? pairsOf(field, number) : number.replace(/\s+/g, ' '));
}

// What is wrong with a text that must have a form (a pattern, a number in pairs), or null.
export function problemOf(field: Field, typed: string): string | null {
  const text = typed.trim();
  if (!text) return null;
  if (field.pattern && !new RegExp(field.pattern[0]).test(text)) return field.pattern[1];
  if (field.address && !addressOf(text, field.address)) return t.check.address;
  if (field.digitsInPairs) {
    // A phone number in another country: only digits, however many it has there.
    const [code, number] = field.phone ? phoneParts(field, text) : [field.phone, text];
    const abroad = code !== field.phone;
    const digits = digitsOf(field, number, abroad);
    if (!/^\d+$/.test(digits)) return t.check.onlyDigits;
    if (typeof field.digitsInPairs === 'number' && !abroad && digits.length !== field.digitsInPairs)
      return t.check.digits(field.digitsInPairs);
  }
  return null;
}

/** The first problem with a value: the message for the person editing, and the field it is about, as
 * the names and item numbers to it joined with dots ("items.0.title"), so it can be shown there. */
export type Problem = { text: string; path: string };

// The first problem with a value, as a message for the person editing, or null.
export function check(fields: Field[], value: Record<string, unknown>, where = '', around?: Around): string | null {
  return problemAt(fields, value, where, around)?.text ?? null;
}

/** As check, with the field the problem is about (Problem). */
export function problemAt(fields: Field[], value: Record<string, unknown>, where = '', around?: Around, at = ''): Problem | null {
  const here: Around = { fields, value, around };
  for (const f of fields) {
    if (!inUse(f, fields, value, around)) continue;
    const v = value?.[f.name];
    const label = where ? `${where} › ${f.label}` : f.label;
    const path = at ? `${at}.${f.name}` : f.name;
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    const wrong = (text: string) => ({ text, path });
    if (f.required && empty) return wrong(t.check.fillIn(label));
    if (!empty && !ofItsKind(f, v)) return wrong(t.check.wrong(label, t.check.kinds[kindOf(f)]));
    // An icon field also takes the name of any icon the site draws (Material Symbols', Phosphor's: the icon picker's search); that the
    // site has it is found where the icon is drawn (data-icon-missing, check:screens).
    const anyIcon = f.icons && typeof v === 'string' && /^[a-z0-9_-]+$/.test(v);
    if (f.type === 'select' && f.options && !empty && !anyIcon && !f.options.some((o) => o.value === v))
      return wrong(t.check.notAnOption(label, String(v)));
    const form = typeof v === 'string' && problemOf(f, v);
    if (form) return wrong(t.check.wrong(label, form));
    if (f.type === 'markdown' && f.template && typeof v === 'string') {
      const [rule] = textProblems(f.template, v);
      if (rule) return wrong(t.check.inField(label, rule));
    }
    if (f.type === 'object') {
      const problem = problemAt(f.fields!, v as Record<string, unknown>, label, here, path);
      if (problem) return problem;
    }
    if (f.type === 'blocks' && Array.isArray(v) && f.template) {
      const name = (type: string) => f.blocks!.find((b) => b.type === type)?.label ?? type;
      const [rule] = templateProblems(f.template, v as Item[], name);
      if (rule) return wrong(t.check.inField(label, rule));
    }
    if (f.type === 'blocks' && Array.isArray(v)) {
      // Hidden blocks are not on the site, so they may be unfinished.
      for (const [i, item] of (v as Item[]).entries()) {
        const block = blockOf(f, item);
        if (item.hidden || !block) continue;
        const problem = problemAt(block.fields, item, `${label} › ${block.label}`, undefined, `${path}.${i}`);
        if (problem) return problem;
      }
    }
    if (f.type === 'list' && Array.isArray(v)) {
      if (f.maxItems !== undefined && v.length > f.maxItems) return wrong(t.check.atMostItems(label, f.maxItems));
      for (const [i, item] of v.entries()) {
        const named = `${label} ${i + 1}`;
        const problem = f.field
          ? problemAt([f.field], { [f.field.name]: item }, named, here, `${path}.${i}`)
          : problemAt(f.fields!, item as Record<string, unknown>, named, here, `${path}.${i}`);
        if (problem) return problem;
      }
    }
  }
  return null;
}

// The value as it is saved: optional fields left empty (text, number, list) are left out, as in the
// existing files (their readers treat a missing field as empty). Keys keep their order.
export function clean(fields: Field[], value: Record<string, unknown>, around?: Around): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const here: Around = { fields, value, around };
  for (const [key, v] of Object.entries(value)) {
    const f = fields.find((x) => x.name === key);
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (f && ((!f.required && empty) || !inUse(f, fields, value, around))) continue;
    if (f?.digitsInPairs && typeof v === 'string') out[key] = inPairs(f, v);
    else if (f?.pattern && typeof v === 'string') out[key] = v.trim();
    else if (f?.type === 'object') out[key] = clean(f.fields!, v as Record<string, unknown>, here);
    else if (f?.type === 'list' && f.fields) out[key] = (v as Record<string, unknown>[]).map((item) => clean(f.fields!, item, here));
    // A block keeps its type first and `hidden` last, and only when it is hidden.
    else if (f?.type === 'blocks')
      out[key] = (v as Item[]).map(({ type, hidden, ...item }) => ({
        type,
        ...clean(blockOf(f, { type })?.fields ?? [], item),
        ...(hidden ? { hidden: true } : {}),
      }));
    else out[key] = v;
  }
  return out;
}

// A picture in Markdown (MarkdownEditor.tsx puts them in).
const PICTURES = /!\[(?:\\.|[^\]])*\]\([^)\s]+/g;

// A block's name by its type: a standard block's (the editor's texts), a picture's, else its type.
const nameOf = (type: string) =>
  type === 'image' ? t.blocks.picture.label : ((t.blocks as unknown as Record<string, { label?: string }>)[type]?.label ?? type);

/** What is wrong with the blocks and pictures in the text of a markdown field by its template (Field.template): one
 * that cannot be there, and too many of a type ('image': the pictures). */
export function textProblems(template: Template, markdown: string): string[] {
  const types = [...blocksIn(markdown).map((b) => b.type), ...[...markdown.matchAll(PICTURES)].map(() => 'image')];
  const problems: string[] = [];
  for (const type of new Set(types)) {
    if (template.blocks && !template.blocks.includes(type)) problems.push(t.check.cannotBeInText(nameOf(type)));
    const max = template.max?.[type];
    if (max !== undefined && types.filter((x) => x === type).length > max) problems.push(t.check.atMostInText(nameOf(type), max));
  }
  return problems;
}

/** What is wrong with the blocks of a text by its template (collections.ts): one that cannot be there,
 * too many of a type, and one that must be on the page (required, locked) but is not, or is hidden.
 * blocks: all of them in order, hidden ones too ({ type, hidden }); name: a type's name. */
export function templateProblems(template: Template, blocks: Item[], name: (type: string) => string): string[] {
  const problems: string[] = [];
  const count = (type: string, shown = false) => blocks.filter((b) => b.type === type && !(shown && b.hidden)).length;
  for (const type of new Set(blocks.map((b) => String(b.type)))) {
    if (template.blocks && !template.blocks.includes(type)) problems.push(t.check.cannotBeHere(name(type)));
    const max = template.max?.[type];
    if (max !== undefined && count(type) > max) problems.push(t.check.atMost(name(type), max));
  }
  for (const type of [...(template.required ?? []), ...(template.locked ?? [])]) {
    if (!count(type)) problems.push(t.check.mustBeOnPage(name(type)));
    else if (!count(type, true)) problems.push(t.check.mustBeShown(name(type)));
  }
  return [...new Set(problems)];
}
