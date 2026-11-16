// An app's list blocks (contract 6, `listBlocks` in app.json): a block the app draws with no code of its own, by one of the core's dynamic-capable
// blocks (`draws`), reading one of the app's lists. Pure code. Exposes DRAWS, LIST_BLOCK_TYPE, listBlockType, listBlockProblems, listBlockProps
// and listBlockSettingNames. Spec: docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md, section 3.6.

/** A list block's own type inside its app (the page has `<app id>.<type>`, `listBlockType`). */
export const LIST_BLOCK_TYPE = /^[a-z][a-z0-9-]{0,39}$/;

/** The core blocks a list block can draw, each with the slots it fills and the settings an app may offer the owner. Cards (phase 5) and the Table (phase 9)
 * are added here when they declare slots; until then they are not a `draws`. `tags` and `howMany` are the framework's; `button` is the text and
 * the address of `Show all`. The head (heading, intro) is always offered.
 * @type {Readonly<Record<string, { slots: readonly string[], settings: readonly string[] }>>} */
export const DRAWS = Object.freeze({
  list: { slots: ['title', 'text', 'icon', 'href', 'tags'], settings: ['tags', 'howMany', 'card', 'design'] },
  segmented: { slots: ['title', 'text', 'icon', 'href', 'tags'], settings: ['tags', 'howMany', 'button', 'only', 'show', 'maxRows'] },
  faq: { slots: ['title', 'text', 'icon', 'href', 'tags'], settings: ['tags', 'howMany', 'button', 'only'] },
});

const KEYS = ['type', 'label', 'icon', 'hint', 'draws', 'list', 'map', 'settings'];

const isObject = (/** @type {unknown} */ v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (/** @type {unknown} */ v) => typeof v === 'string' && v.trim() !== '';

/** The type a list block has in a page: `<app id>.<type>`. @param {string} appId @param {string} type */
export const listBlockType = (appId, type) => `${appId}.${type}`;

/** The id a list has on the site: `<app id>.<id>` for an app's own list. A list block reads only its own app's lists (decision 9), so a list the app does not have is a problem, not a site list.
 * @param {string} appId @param {string} list @param {string[]} ownIds the ids of the app's own lists */
export const siteListId = (appId, list, ownIds) => (ownIds.includes(list) ? `${appId}.${list}` : list);

/** The settings names a list block offers: the ones it asks for that the drawn block has. @param {{ draws: string, settings?: string[] }} block */
export const listBlockSettingNames = (block) => (block.settings ?? []).filter((s) => DRAWS[block.draws]?.settings.includes(s));

/** The props a new list block starts with: its list and its default `map`, which the owner can change per place.
 * @param {string} appId @param {{ list: string, map?: Record<string, string> }} block @param {string[]} ownIds */
export const listBlockProps = (appId, block, ownIds) => ({
  from: siteListId(appId, block.list, ownIds),
  ...(block.map && Object.keys(block.map).length ? { map: { ...block.map } } : {}),
});

/** The problems of the `listBlocks` key of a contract 6 manifest, each one English sentence; none when valid.
 * @param {unknown} listBlocks @param {{ lists?: unknown[] }} manifest the manifest the blocks belong to (its `lists` are the ones a block may read)
 * @returns {string[]} */
export function listBlockProblems(listBlocks, manifest) {
  if (!Array.isArray(listBlocks)) return ['The key "listBlocks" must be a list.'];
  /** @type {string[]} */
  const problems = [];
  /** @type {Map<string, Set<string>>} the app's lists by id, with the ids of their fields */
  const lists = new Map();
  for (const list of manifest.lists ?? []) {
    if (!isObject(list) || typeof list.id !== 'string') continue;
    const fields = Array.isArray(list.fields) ? list.fields.flatMap((f) => (isObject(f) && typeof f.id === 'string' ? [f.id] : [])) : [];
    lists.set(list.id, new Set(fields));
  }
  const seen = new Set();
  listBlocks.forEach((block, i) => {
    const at = `The key "listBlocks" entry ${i + 1}`;
    if (!isObject(block)) return problems.push(`${at} must be an object.`);
    for (const key of Object.keys(block)) if (!KEYS.includes(key)) problems.push(`${at} has the unknown key "${key}".`);
    if (typeof block.type !== 'string' || !LIST_BLOCK_TYPE.test(block.type))
      problems.push(`${at} needs a "type" that matches ${LIST_BLOCK_TYPE}.`);
    else if (seen.has(block.type)) problems.push(`The key "listBlocks" has the type "${block.type}" more than once.`);
    else seen.add(block.type);
    for (const key of ['label', 'icon', 'hint']) if (!isText(block[key])) problems.push(`${at} must have a non-empty string "${key}".`);

    const draws = typeof block.draws === 'string' ? DRAWS[block.draws] : undefined;
    if (!draws) problems.push(`${at} needs a "draws" that is one of ${Object.keys(DRAWS).join(', ')}.`);

    const own = typeof block.list === 'string' ? lists.get(block.list) : undefined;
    if (!isText(block.list)) problems.push(`${at} needs a "list".`);
    else if (!own)
      problems.push(
        `${at} reads the list "${block.list}", which the app does not have in "lists". A list block reads only its own app's lists.`,
      );

    if ('map' in block) {
      const map = block.map;
      if (!isObject(map)) problems.push(`${at} "map" must be an object of slot to field.`);
      else
        for (const [slot, field] of Object.entries(map)) {
          if (draws && !draws.slots.includes(slot))
            problems.push(`${at} "map" has the slot "${slot}", which "${block.draws}" does not have.`);
          if (typeof field !== 'string' || (field !== '' && own && !own.has(field)))
            problems.push(`${at} "map" sends "${slot}" to the field "${String(field)}", which the list "${block.list}" does not have.`);
        }
    }

    if ('settings' in block) {
      if (!(Array.isArray(block.settings) && block.settings.every((s) => typeof s === 'string')))
        problems.push(`${at} "settings" must be a list of strings.`);
      else if (draws)
        for (const setting of block.settings)
          if (!draws.settings.includes(setting))
            problems.push(`${at} "settings" has "${setting}", which "${block.draws}" does not have (it has ${draws.settings.join(', ')}).`);
    }
  });
  return problems;
}
