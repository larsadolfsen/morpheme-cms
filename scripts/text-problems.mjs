// The check of the editor's English texts (packages/editor/src/i18n/en-US/) against Material 3's rules for writing: no
// em dash, no "...", no abbreviations, no politeness, no "we", no "!", no "&", American spelling, no internal
// names (Worker, bucket, jurisdiction, wrangler.jsonc). Exposes RULES, ALLOWED
// (the exceptions, with reasons) and textProblems; used by check-content.mjs. No dependencies.

const word = (pattern, flags = 'i') => new RegExp(`\\b(?:${pattern})\\b`, flags);

/** @type {{ id: string, message: string, test: (text: string) => boolean }[]} */
export const RULES = [
  { id: 'em-dash', message: 'no em dash, use a comma, a colon or a new sentence', test: (s) => /—/.test(s) },
  { id: 'ellipsis', message: 'write the ellipsis as one … with no space before it', test: (s) => /\.\.\.|\s…/.test(s) },
  {
    id: 'abbreviation',
    message: 'no abbreviations (e.g., i.e., etc., vs.), write it out',
    test: (s) => /(?:^|[^\w])(?:e\.g\.|i\.e\.|etc\b|vs\b)/i.test(s),
  },
  { id: 'politeness', message: 'no please, sorry or are you sure', test: (s) => word('please|sorry|are you sure').test(s) },
  {
    // "I" is a word only as a capital, so "i" inside words and "Id" never match.
    id: 'we',
    message: 'no we, our, us or I, the editor does not speak about itself',
    test: (s) => word('we|our|us').test(s) || word('I', '').test(s),
  },
  { id: 'exclamation', message: 'no exclamation marks', test: (s) => /!/.test(s) },
  { id: 'ampersand', message: 'write "and", not &', test: (s) => /&/.test(s) },
  {
    id: 'british',
    message: 'American spelling (color, gray, license, favorite, check, organize, recognize, customize)',
    test: (s) => word('colour\\w*|grey\\w*|licences?|favourite\\w*|tick(?:s|ed|ing)?|organis\\w*|recognis\\w*|customis\\w*').test(s),
  },
  {
    // "Workers Paid" (a Cloudflare plan name) passes: only the singular word Worker is an internal name.
    id: 'internal-name',
    message: 'no internal names (Worker, bucket, jurisdiction, wrangler.jsonc), say what it is for the site owner',
    test: (s) => word('worker|buckets?|jurisdictions?').test(s) || /(?:^|[^a-z0-9_])wrangler[.]jsonc(?![a-z0-9_])/i.test(s),
  },
];

// Exceptions: key path -> the rule ids it may break. Every entry says why.
export const ALLOWED = {
  // Sample card text, written in the site owner's own voice.
  'blocks.cards.example.0.text': ['we'],
  'blocks.cards.example.1.text': ['we'],
  // Sample message a visitor types into a form.
  'parts.screens.fieldMessageValue': ['we'],
};

/**
 * @param {object} messages the English texts (enUS)
 * @param {Record<string, string[]>} [allowed] key path -> rule ids it may break
 * @returns {string[]}
 */
export function textProblems(messages, allowed = ALLOWED) {
  const problems = [];
  const check = (path, text) => {
    for (const rule of RULES) {
      if (rule.test(text) && !allowed[path]?.includes(rule.id)) {
        problems.push(`i18n/en-US › ${path}: ${rule.message} (${JSON.stringify(text)})`);
      }
    }
  };
  const walk = (path, value) => {
    if (typeof value === 'string') return check(path, value);
    if (typeof value === 'function') {
      let result;
      try {
        result = value(...Array.from({ length: value.length }, () => 'x'));
      } catch {
        return;
      }
      if (typeof result === 'string') check(path, result);
      return;
    }
    if (Array.isArray(value)) return value.forEach((item, i) => walk(`${path}.${i}`, item));
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (!key.endsWith('Commit')) walk(path ? `${path}.${key}` : key, item);
      }
    }
  };
  walk('', messages);
  return problems;
}
