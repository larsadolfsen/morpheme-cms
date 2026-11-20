// The screenshot keywords of an app (`AppShot.shows`): which image shows what, and the file each one is saved as.
// Exposes shotOf, shotFile, shotFiles, canonicalShot, DEPRECATED_SHOT_WORDS (pure). Used by src/store.ts, which re-exports them.

/**
 * DEPRECATED aliases: the old Danish keywords, accepted for one release so that `morpheme-apps` can change its apps'
 * `screenshots` lists in its own pull request. Delete this object, `canonicalShot`'s use of it and the old file names
 * in `shotFiles` once every app in `morpheme-apps` writes the new words (the release after the one that adds them).
 */
export const DEPRECATED_SHOT_WORDS = {
  blok: 'block', // language-ok: deprecated alias, delete after the apps are changed
  slags: 'kind', // language-ok: deprecated alias, delete after the apps are changed
  liste: 'list', // language-ok: deprecated alias, delete after the apps are changed
  indstillinger: 'settings', // language-ok: deprecated alias, delete after the apps are changed
  side: 'page', // language-ok: deprecated alias, delete after the apps are changed
};

/** A keyword with its first word in the new form (`blok:x` is `block:x`); a keyword that is already new or unknown stays as it is. @param {string} shows */ // language-ok: deprecated keyword
export function canonicalShot(shows) {
  const [what, ...rest] = shows.split(':');
  const word = Object.hasOwn(DEPRECATED_SHOT_WORDS, what) ? DEPRECATED_SHOT_WORDS[what] : what;
  return [word, ...rest].join(':');
}

/**
 * Whether an image shows something the app has (AppShot.shows): one of its blocks (`block:<type>`, `blocks`: their
 * types), a variant of its kind of a list (`kind:<list>:<n>`), one of its lists (`list:<id>`), its settings
 * (`settings`) or its own page (`page`). The old words (DEPRECATED_SHOT_WORDS) count as the new ones.
 * @param {string} shows
 * @param {{ kinds?: Record<string, { variants?: unknown[] }>, lists?: { id: string }[], settings?: unknown, page?: unknown }} app
 * @param {string[]} blocks
 */
export function shotOf(shows, app, blocks) {
  const [what, key = '', n] = canonicalShot(shows).split(':');
  if (what === 'block') return blocks.includes(key);
  if (what === 'kind') {
    const kind = app.kinds?.[key];
    return !!kind && /^\d+$/.test(n ?? '') && Number(n) < Math.max(1, kind.variants?.length ?? 0);
  }
  if (what === 'list') return !!app.lists?.some((l) => l.id === key);
  if (what === 'settings') return !!app.settings && !key;
  return what === 'page' && !!app.page && !key;
}

/** The file of an app's image in its screenshots/, by its place among them and what it shows: `<n>-block-<type>.jpg`. @param {number} i @param {string} shows */
export const shotFile = (i, shows) => `${i + 1}-${canonicalShot(shows).replace(/:/g, '-')}.jpg`;

/**
 * The files an image may be found under: its new name first, then, while an app's images are not regenerated since
 * the rename, the name the old keyword gave it (`1-blok-<type>.jpg`). Images are looked up by the first one present. // language-ok: deprecated keyword
 * @param {number} i @param {string} shows
 */
export function shotFiles(i, shows) {
  const [what, ...rest] = canonicalShot(shows).split(':');
  const oldWord = Object.keys(DEPRECATED_SHOT_WORDS).find((w) => DEPRECATED_SHOT_WORDS[w] === what) ?? what;
  const file = shotFile(i, shows);
  const stored = `${i + 1}-${[oldWord, ...rest].join('-')}.jpg`;
  return stored === file ? [file] : [file, stored];
}
