// Front matter in the .md files: the YAML block between the "---" lines, and the Markdown after it.
// Only changed fields are written, in the style of the existing files: text in double quotes, lists
// inline (["a", "b"]), dates and true/false without quotes. Long lines are never folded, and a line
// break in a text stays \n on the same line (doubleQuotedAsJSON), as the files write it.
import { parseDocument } from 'yaml';

const FENCE = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?\n?/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// The fields that are dates (src/content.config.ts). Any other text is quoted, also one that looks
// like a date: unquoted, YAML reads it as a date, and the schema (a text) fails the build.
const DATE_FIELDS = new Set(['date', 'updated']);
const STRINGIFY = { lineWidth: 0, flowCollectionPadding: false, doubleQuotedAsJSON: true };

export function splitFrontmatter(text) {
  const match = text.match(FENCE);
  return match ? { yaml: match[1] ?? '', body: text.slice(match[0].length) } : { yaml: '', body: text };
}

export function readFields(yaml) {
  return parseDocument(yaml).toJS() ?? {};
}

// changes: { field: value }. An empty text removes the field (the content schemas treat a missing
// field as empty); new fields are added at the end, in the order given.
export function writeFields(yaml, changes) {
  const doc = parseDocument(yaml);
  for (const [key, value] of Object.entries(changes)) {
    if (value !== '' && value != null) doc.set(key, toNode(doc, key, value));
    else if (doc.has(key)) doc.delete(key);
  }
  return doc.contents?.items?.length ? doc.toString(STRINGIFY).replace(/\n$/, '') : '';
}

function toNode(doc, key, value) {
  const node = doc.createNode(value);
  if (typeof value === 'string') node.type = DATE_FIELDS.has(key) && DATE.test(value) ? 'PLAIN' : 'QUOTE_DOUBLE';
  if (Array.isArray(value)) {
    node.flow = true;
    for (const item of node.items) item.type = 'QUOTE_DOUBLE';
  }
  return node;
}
