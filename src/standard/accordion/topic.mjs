// The placeholder of the shared text of "Expandable list" ("Read more about {topic}"). Exposes filledLink, upgradeMore (pure).
// It had a Danish name before, a site that saved its own text still has it in src/data/blocks.json. Both are READ (filledLink
// fills either, so the site renders as before), one is WRITTEN (upgradeMore shows the old one as {topic} when the editor opens
// the form, and the next save writes {topic}). No migration command, and no build stop for the old placeholder.
// Drop the alias at 1.0, not before: the owner decides.

const OLD = '{emne}'; // language-ok: the old placeholder, Danish for topic

// One pass, so a name that holds a placeholder is not filled again.
const PLACEHOLDER = new RegExp(`\\{(?:topic|${OLD.slice(1, -1)})\\}`, 'g');

/** The link under a row, with its name in place of {topic} or the old placeholder. A text with neither stays as it is. */
export const filledLink = (/** @type {string} */ link, /** @type {string} */ topic) => link.replace(PLACEHOLDER, () => topic);

/** The shared text's values as the form has them: the old placeholder in a text is {topic}. Idempotent, and a new object only when it changes. */
export const upgradeMore = (/** @type {Record<string, unknown>} */ values) => {
  if (typeof values.more !== 'string' || !values.more.includes(OLD)) return values;
  return { ...values, more: values.more.replaceAll(OLD, '{topic}') };
};
