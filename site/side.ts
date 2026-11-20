// The site's choice of the block drawn beside the text of its pages: src/data/side.json, `{ "block": "<type>" | null }`.
// Optional: a site without the file has no column. Exposes sideSetting; read by sideBlock in src/standard/views.ts.
const found = import.meta.glob<{ block?: unknown }>('/src/data/side.json', { eager: true, import: 'default' });

/** The contents of src/data/side.json, or null when the site has none. */
export const sideSetting: { block: string | null } | null = (() => {
  const file = found['/src/data/side.json'];
  if (!file) return null;
  return { block: typeof file.block === 'string' && file.block ? file.block : null };
})();
