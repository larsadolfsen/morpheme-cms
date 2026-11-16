// The formats and checks of a field, shared by the editor's entry form, `check:content` and (later) a form on the public site. Pure: no browser,
// no React, no I/O, and nothing from `src/`, so it runs in the browser, in the Worker and in Node. It knows a field (`{ id, kind, format?, required? }`)
// and a value, nothing about lists, entries or the editor (docs/superpowers/specs/2026-11-15-list-edit-editor-window-design.md, section 12).
//
// `validate` returns a message KEY, never a sentence: the caller turns the key into English or Danish text.

/** The formats of a text field, in the order the settings sheet offers them. `Any text` is no `format` key. `label` is the English UI label. */
export const FORMATS = [
  { id: 'email', label: 'Email', message: 'format.email' },
  { id: 'url', label: 'Web address', message: 'format.url' },
  { id: 'number', label: 'Number', message: 'format.number' },
];

/** The kinds a format applies to: the Title and Body text kinds only. */
const FORMAT_KINDS = ['title', 'text'];

/**
 * Stored keys and message keys reserved for the later validations (spec section 12.5). `parseFields` keeps them and `validate` does not enforce
 * them until their phase, so a definition written now never needs a data change. Nothing here is built.
 */
export const RESERVED_FORMATS = ['choice', 'phone'];
export const RESERVED_KEYS = ['minLength', 'maxLength', 'min', 'max', 'choices', 'pattern', 'patternMessage'];
export const RESERVED_MESSAGES = ['length.min', 'length.max', 'range.min', 'range.max', 'choice', 'format.phone', 'format.date', 'pattern'];

/** The message keys `validate` returns today. */
export const MESSAGES = ['required', ...FORMATS.map((f) => f.message)];

/** The formats a kind may have. @param {string} kind @returns {typeof FORMATS} */
export const formatsOf = (kind) => (FORMAT_KINDS.includes(kind) ? FORMATS : []);

/** Whether `format` is a format the field's kind may store: one of its formats, or one reserved for a later phase. @param {string} kind @param {unknown} format */
export const isFormat = (kind, format) =>
  typeof format === 'string' && FORMAT_KINDS.includes(kind) && (FORMATS.some((f) => f.id === format) || RESERVED_FORMATS.includes(format));

/** A value with nothing in it: missing, null, blank text or an empty list. @param {unknown} value */
const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

const CHECKS = {
  // One `@`, text before it, a dotted domain after it, no spaces.
  email: (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v),
  // An http or https address with a host.
  url: (v) => {
    if (!/^https?:\/\/[^\s/?#]/i.test(v) || /\s/.test(v)) return false;
    try {
      return new URL(v).hostname !== '';
    } catch {
      return false;
    }
  },
  // Digits with an optional minus and one optional decimal separator (`.` or `,`), no spaces.
  number: (v) => /^-?\d+([.,]\d+)?$/.test(v),
};

/**
 * What is wrong with one value of a field: `null` when valid, else one message key. Order: `required`, then `format`. An empty value is valid
 * unless the field is `required`; a format never makes a field required. A format or key this module does not enforce yet is ignored.
 * @param {unknown} value @param {{ kind?: string; format?: string; required?: boolean }} field
 * @returns {string | null}
 */
export function validate(value, field) {
  if (isEmpty(value)) return field.required === true ? 'required' : null;
  const format = FORMATS.find((f) => f.id === field.format);
  if (format && typeof value === 'string' && !CHECKS[format.id](value)) return format.message;
  return null;
}

/**
 * Plain data about the input a field draws, for the entry form and a site form: `{ element, type, inputmode?, autocomplete? }`, or `null` for a
 * kind that is not typed as text (icon, image, tags, date, link). The caller maps it to its own text field or HTML input.
 * @param {{ kind?: string; format?: string }} field
 * @returns {{ element: 'input' | 'textarea'; type: 'text' | 'email' | 'url'; inputmode?: string; autocomplete?: string } | null}
 */
export function inputOf(field) {
  if (!FORMAT_KINDS.includes(field.kind ?? '')) return null;
  const element = field.kind === 'text' ? 'textarea' : 'input';
  if (field.format === 'email') return { element, type: 'email', inputmode: 'email', autocomplete: 'email' };
  if (field.format === 'url') return { element, type: 'url', inputmode: 'url', autocomplete: 'url' };
  if (field.format === 'number') return { element, type: 'text', inputmode: 'decimal' };
  return { element, type: 'text' };
}
