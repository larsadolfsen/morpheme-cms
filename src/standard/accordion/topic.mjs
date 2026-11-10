// The placeholder of the shared text of "Expandable list" ("Read more about {topic}"). Exposes filledLink, upgradeMore (pure).
// It was {emne} (Danish for topic) before: a site that saved its own text still has {emne} in src/data/blocks.json. Both are
// READ (filledLink fills either, so the site renders as before), one is WRITTEN (upgradeMore shows {emne} as {topic} when the
// editor opens the form, and the next save writes {topic}). No migration command, and no build stop for the old placeholder.
// Drop the {emne} alias at 1.0, not before: the owner decides.

/** The link under a row, with its name in place of {topic} or the old {emne}. A text with neither stays as it is. */
export const filledLink = (/** @type {string} */ link, /** @type {string} */ topic) => link.replace(/\{(?:topic|emne)\}/g, () => topic); // language-ok: the old placeholder

/** The shared text's values as the form has them: {emne} in a text is {topic}. Idempotent, and a new object only when it changes. */
export const upgradeMore = (/** @type {Record<string, unknown>} */ values) => {
  if (typeof values.more !== 'string' || !values.more.includes('{emne}')) return values; // language-ok: the old placeholder
  return { ...values, more: values.more.replaceAll('{emne}', '{topic}') }; // language-ok: the old placeholder
};
